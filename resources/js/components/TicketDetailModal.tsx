// components/TicketDetailModal.tsx
import { Resultado, TicketDetailModalProps } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, memo, useRef, useState } from 'react';

const IconoTipoBitacora = memo(({ tipo }: { tipo?: number }) => {
    const iconMap: Record<number, { bg: string; color: string; path: string }> =
        {
            1: {
                bg: 'bg-[#a7dbb0]/30',
                color: 'text-[#2b8838]',
                path: 'M12 4v16m8-8H4',
            },
            4: {
                bg: 'bg-[#e6d34a]/20',
                color: 'text-[#8dc63f]',
                path: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
            },
            2: {
                bg: 'bg-amber-100',
                color: 'text-amber-600',
                path: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
            },
            3: {
                bg: 'bg-[#a7dbb0]/20',
                color: 'text-[#002c28]',
                path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
            },
        };

    const icon = iconMap[tipo ?? 0] ?? {
        bg: 'bg-[#002c28]/10',
        color: 'text-[#002c28]/60',
        path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    };

    return (
        <div
            className={`h-8 w-8 rounded-full ${icon.bg} flex items-center justify-center`}
        >
            <svg
                className={`h-4 w-4 ${icon.color}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={icon.path}
                />
            </svg>
        </div>
    );
});

const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
        case 'urgente':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'alta':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'normal':
            return 'bg-[#a7dbb0]/30 text-[#2b8838] border-[#a7dbb0]';
        case 'baja':
            return 'bg-[#002c28]/5 text-[#002c28]/70 border-[#002c28]/10';
        default:
            return 'bg-[#002c28]/5 text-[#002c28]/70 border-[#002c28]/10';
    }
};

const getEstadoColor = (estado: string) => {
    switch (estado) {
        case 'abierto':
            return 'bg-[#a7dbb0]/30 text-[#2b8838] border-[#a7dbb0]';
        case 'en_progreso':
            return 'bg-[#e6d34a]/20 text-[#8dc63f] border-[#e6d34a]/50';
        case 'pendiente':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'cerrado':
            return 'bg-[#002c28]/10 text-[#002c28]/70 border-[#002c28]/20';
        default:
            return 'bg-[#002c28]/5 text-[#002c28]/60 border-[#002c28]/10';
    }
};

/**
 * Calcula el estado disabled de cada resultado replicando el comportamiento
 * exacto del PHP legacy: $disabled y $classDiag persisten entre iteraciones
 * (estado cascading). Un "Resoluc" deshabilita los siguientes hasta que
 * un "Diagn" los rehabilite.
 */
function computeDisabledMap(resultados: Resultado[]): Map<number, boolean> {
    const map = new Map<number, boolean>();
    let disabled = false;

    for (const r of resultados) {
        if (r.tiene_rol <= 0) continue;

        const tarea = r.tarea_nombre ?? '';
        const proceso = r.proceso_nombre ?? '';
        const noEsInternoNiExperience =
            !proceso.includes('Interno') && !proceso.includes('Experience');

        if (tarea.startsWith('Resoluc') && noEsInternoNiExperience) {
            disabled = true;
        } else if (tarea.startsWith('Diagn') && noEsInternoNiExperience) {
            disabled = false;
        }

        map.set(r.resultado_id, disabled);
    }

    return map;
}

export default memo(function TicketDetailModal({
    ticket,
    isOpen,
    onClose,
    bitacora,
    resultados,
    adjuntos,
    valoresCampos,
    permisos,
    onResultado,
    onComentario,
    onAdjunto,
    loading,
}: TicketDetailModalProps) {
    const [cobrado, setCobrado] = useState<number>(ticket?.ticket_cobrado ?? 0);
    const [moneda, setMoneda] = useState<string>(
        ticket?.ticket_moneda ?? 'LPS',
    );
    const [montoStr, setMontoStr] = useState<string>(
        ticket?.ticket_monto ? String(ticket.ticket_monto) : '',
    );
    const [confirmando, setConfirmando] = useState<{
        resultadoId: number;
        nombre: string;
    } | null>(null);
    const [comentario, setComentario] = useState('');
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [adjuntoAbierto, setAdjuntoAbierto] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!ticket) return null;

    const monto = Math.max(0, parseFloat(montoStr) || 0);

    // Filtrar solo resultados donde el usuario tiene rol (replica get_rol() != 0)
    const resultadosVisibles = resultados.filter((r) => r.tiene_rol > 0);
    // Mapa de disabled con estado cascading (replica $disabled del PHP)
    const disabledMap = computeDisabledMap(resultados);

    // Sección de cobro: visible si el usuario tiene roltarea_agregar_cobro y no es proceso interno
    const procesoNombre = resultados[0]?.proceso_nombre ?? '';
    const esProcesoInterno =
        procesoNombre.includes('Interno') || procesoNombre.includes('Customer');
    const esTareaDiagnostico = (ticket.tarea_nombre ?? '').startsWith('Diagn');
    const mostrarCobro =
        permisos.puede_cobrar && !esProcesoInterno && esTareaDiagnostico;
    const ejecutarResultado = (
        resultadoId: number,
        resultadoNombre: string,
    ) => {
        // Caso 1: Tarea con cobro visible, sin cobro marcado → confirmar
        if (mostrarCobro && cobrado === 0) {
            setConfirmando({ resultadoId, nombre: resultadoNombre });
            return;
        }

        // Caso 2: Resultado de aprobación de costo → confirmar
        if (
            resultadoNombre === 'Costo Aprobado' ||
            (resultadoNombre.includes('Aprob') &&
                !resultadoNombre.includes('No'))
        ) {
            setConfirmando({ resultadoId, nombre: resultadoNombre });
            return;
        }

        // Caso normal: ejecutar directamente
        enviarResultado(resultadoId);
    };

    const enviarResultado = (resultadoId: number) => {
        setConfirmando(null);
        // Enviar datos de cobro cuando la sección de cobro es visible
        const cobroData = mostrarCobro ? { cobrado, moneda, monto } : undefined;
        onResultado?.(
            resultadoId,
            ticket.ticket_id,
            cobroData,
            comentario.trim() || undefined,
        );
    };

    const handleEnviarComentario = async () => {
        if (!comentario.trim() || !onComentario) return;
        setEnviandoComentario(true);
        try {
            await onComentario(ticket.ticket_id, comentario.trim());
            setComentario('');
        } finally {
            setEnviandoComentario(false);
        }
    };

    const handleSubirArchivo = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const archivo = e.target.files?.[0];
        if (!archivo || !onAdjunto) return;
        setSubiendoArchivo(true);
        try {
            await onAdjunto(ticket.ticket_id, archivo);
        } finally {
            setSubiendoArchivo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-[#002c28]/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-2xl shadow-[#002c28]/20 transition-all">
                                {/* Header del Modal */}
                                <div className="bg-gradient-to-r from-[#002c28] via-[#003d38] to-[#002c28] px-6 py-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                <Dialog.Title className="text-2xl font-bold text-white">
                                                    Solicitud #
                                                    {ticket.ticket_id}
                                                </Dialog.Title>
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPrioridadColor(ticket.ticket_prioridad || 'normal')}`}
                                                >
                                                    {ticket.ticket_prioridad ||
                                                        'Normal'}
                                                </span>
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoColor(ticket.ticket_cerrado || 'abierto')}`}
                                                >
                                                    {ticket.ticket_cerrado ||
                                                        'Abierto'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#a7dbb0]/80">
                                                {ticket.ticket_descripcion ||
                                                    'Sin título'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="ml-4 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                                        >
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Acciones de resultado (dinámicas según tarea y rol) */}
                                    {resultadosVisibles.length > 0 && (
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            {resultadosVisibles.map(
                                                (resultado) => {
                                                    const isDisabled =
                                                        (disabledMap.get(
                                                            resultado.resultado_id,
                                                        ) ??
                                                            false) ||
                                                        !!loading;
                                                    return (
                                                        <button
                                                            key={
                                                                resultado.resultado_id
                                                            }
                                                            disabled={
                                                                isDisabled
                                                            }
                                                            onClick={() =>
                                                                ejecutarResultado(
                                                                    resultado.resultado_id,
                                                                    resultado.resultado_nombre,
                                                                )
                                                            }
                                                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                                                isDisabled
                                                                    ? 'cursor-not-allowed bg-white/5 text-white/30'
                                                                    : 'bg-[#8dc63f] text-[#002c28] shadow-sm hover:bg-[#a7dbb0] hover:shadow-md'
                                                            }`}
                                                            title={
                                                                isDisabled
                                                                    ? 'Requiere diagnóstico previo'
                                                                    : resultado.resultado_nombre
                                                            }
                                                        >
                                                            {loading ? (
                                                                <svg
                                                                    className="h-4 w-4 animate-spin"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    />
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                                    />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                                    />
                                                                </svg>
                                                            )}
                                                            {
                                                                resultado.resultado_nombre
                                                            }
                                                        </button>
                                                    );
                                                },
                                            )}

                                            <button className="ml-auto flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                                    />
                                                </svg>
                                                Imprimir
                                            </button>
                                        </div>
                                    )}

                                    {/* Diálogo de confirmación */}
                                    {confirmando && (
                                        <div className="mt-3 rounded-lg border border-[#e6d34a]/40 bg-[#e6d34a]/20 p-4">
                                            <p className="mb-3 text-sm font-medium text-white">
                                                {esTareaDiagnostico &&
                                                cobrado === 0
                                                    ? '¿Está seguro que no es un ticket cobrado?'
                                                    : `¿Confirma la acción "${confirmando.nombre}"?`}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={!!loading}
                                                    onClick={() =>
                                                        enviarResultado(
                                                            confirmando.resultadoId,
                                                        )
                                                    }
                                                    className="flex items-center gap-2 rounded-lg bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-[#002c28] transition-all hover:bg-[#a7dbb0]"
                                                >
                                                    {loading ? (
                                                        <svg
                                                            className="h-4 w-4 animate-spin"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                            />
                                                        </svg>
                                                    ) : null}
                                                    Aceptar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setConfirmando(null)
                                                    }
                                                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Contenido del Modal */}
                                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                                    <div className="space-y-6 p-6">
                                        {/* Información General */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Columna Izquierda */}
                                            <div className="space-y-4">
                                                <div className="rounded-xl border border-[#d4e8d4] bg-[#f8faf8] p-4">
                                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                        <svg
                                                            className="h-4 w-4 text-[#2b8838]"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        Información General
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Proceso
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.proceso_nombre || 'Sin proceso'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Tipo Solicitud
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.tipoticket_nombre || 'Sin tipo'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Subtipo
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.subtipoticket_nombre || 'Sin subtipo'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Tarea Actual
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.tarea_nombre || 'Sin tarea'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Usuario Solicitante
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.creador_nombre || ticket.creador_cuenta || `Usuario #${ticket.usuario_creador}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-[#d4e8d4] bg-[#f8faf8] p-4">
                                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                        <svg
                                                            className="h-4 w-4 text-[#8dc63f]"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                                            />
                                                        </svg>
                                                        Campos Personalizados
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Torre
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.torre_nombre || 'No especificada'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Piso
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.piso_nombre || 'No especificado'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Ubicación Detallada
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.ticket_ubicacion_detallada || 'No especificada'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Monto
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">{`${moneda} ${monto.toFixed(2)}`}</p>
                                                        </div>
                                                        {/* Campos dinámicos del ticket */}
                                                        {valoresCampos && valoresCampos.length > 0 && valoresCampos.map((vc) => (
                                                            <div key={vc.valorticket_id}>
                                                                <label className="text-xs font-medium text-[#4a6b4a]">
                                                                    {vc.diccionario_etiqueta || vc.diccionario_nombre}
                                                                </label>
                                                                <p className="text-sm font-medium text-[#002c28]">
                                                                    {vc.valorticket_valor || 'Sin valor'}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Columna Derecha */}
                                            <div className="space-y-4">
                                                <div className="rounded-xl border border-[#d4e8d4] bg-[#f8faf8] p-4">
                                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                        <svg
                                                            className="h-4 w-4 text-[#e6d34a]"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        Fechas
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Fecha de Creación
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.ticket_fecha_creacion || '--'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Estimada Final
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.ticket_fecha_final_estimada || '--'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Finalización
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {ticket.ticket_fecha_final || '--'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-[#d4e8d4] bg-[#f8faf8] p-4">
                                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                        <svg
                                                            className="h-4 w-4 text-[#2b8838]"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        Estado del Ticket
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Ticket Cobrado
                                                            </label>
                                                            <p className="text-sm font-medium text-[#002c28]">
                                                                {Boolean(
                                                                    ticket.ticket_cobrado,
                                                                ) === true
                                                                    ? 'SÍ'
                                                                    : 'NO'}
                                                            </p>
                                                        </div>
                                                        {Boolean(
                                                            ticket.ticket_cobrado,
                                                        ) === true && (
                                                            <div className="flex gap-3">
                                                                <div className="flex-1">
                                                                    <label className="text-xs font-medium text-[#4a6b4a]">
                                                                        Moneda
                                                                    </label>
                                                                    <p className="text-sm font-medium text-[#002c28]">
                                                                        {ticket.ticket_moneda ||
                                                                            '—'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <label className="text-xs font-medium text-[#4a6b4a]">
                                                                        Monto
                                                                    </label>
                                                                    <p className="text-sm font-medium text-[#002c28]">
                                                                        {Number(
                                                                            ticket.ticket_monto ||
                                                                                0,
                                                                        ).toLocaleString(
                                                                            'es-HN',
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="text-xs font-medium text-[#4a6b4a]">
                                                                Calificación
                                                            </label>
                                                            <div className="mt-1 flex items-center gap-1">
                                                                {[
                                                                    1, 2, 3, 4,
                                                                    5,
                                                                ].map(
                                                                    (star) => (
                                                                        <svg
                                                                            key={
                                                                                star
                                                                            }
                                                                            className={`h-5 w-5 ${star <= Number(ticket.ticket_calificacion || 0) ? 'text-[#e6d34a]' : 'text-[#d4e8d4]'}`}
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sección de Cobro — solo en tarea Diagnóstico y para ingeniero/supervisor */}
                                                {mostrarCobro && (
                                                    <div className="rounded-xl border border-[#e6d34a]/30 bg-gradient-to-br from-[#e6d34a]/10 to-[#8dc63f]/10 p-4">
                                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                            <svg
                                                                className="h-4 w-4 text-[#e6d34a]"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            Diagnóstico de
                                                            Costos
                                                        </h3>
                                                        <div className="space-y-3">
                                                            {/* Cobrado Sí/No */}

                                                            <div>
                                                                <label className="mb-1.5 block text-xs font-medium text-[#4a6b4a]">
                                                                    ¿Solicitud
                                                                    cobrada?
                                                                </label>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setCobrado(
                                                                                1,
                                                                            )
                                                                        }
                                                                        className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-all ${
                                                                            cobrado ===
                                                                            1
                                                                                ? 'border-[#2b8838] bg-[#2b8838] text-white shadow-md'
                                                                                : 'border-[#d4e8d4] bg-white text-[#002c28] hover:border-[#2b8838]'
                                                                        }`}
                                                                    >
                                                                        Sí
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCobrado(
                                                                                0,
                                                                            );
                                                                            setMontoStr(
                                                                                '',
                                                                            );
                                                                        }}
                                                                        className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-all ${
                                                                            cobrado ===
                                                                            0
                                                                                ? 'border-[#002c28] bg-[#002c28] text-white shadow-md'
                                                                                : 'border-[#d4e8d4] bg-white text-[#002c28] hover:border-[#002c28]'
                                                                        }`}
                                                                    >
                                                                        No
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Moneda y Monto — solo si cobrado */}
                                                            {cobrado === 1 && (
                                                                <div className="animate-in space-y-3 duration-200 fade-in slide-in-from-top-2">
                                                                    <div>
                                                                        <label className="mb-1.5 block text-xs font-medium text-[#4a6b4a]">
                                                                            Moneda
                                                                        </label>
                                                                        <select
                                                                            value={
                                                                                moneda
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setMoneda(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-3 py-2 text-sm text-[#002c28] focus:border-[#8dc63f] focus:ring-2 focus:ring-[#8dc63f]/30 focus:outline-none"
                                                                        >
                                                                            <option value="LPS">
                                                                                LPS
                                                                                —
                                                                                Lempiras
                                                                            </option>
                                                                            <option value="USD">
                                                                                USD
                                                                                —
                                                                                Dólares
                                                                            </option>
                                                                            <option value="EUR">
                                                                                EUR
                                                                                —
                                                                                Euros
                                                                            </option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1.5 block text-xs font-medium text-[#4a6b4a]">
                                                                            Monto
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            value={
                                                                                montoStr
                                                                            }
                                                                            onFocus={(
                                                                                e,
                                                                            ) => {
                                                                                if (
                                                                                    montoStr ===
                                                                                    '0'
                                                                                )
                                                                                    e.target.select();
                                                                            }}
                                                                            onChange={(
                                                                                e,
                                                                            ) => {
                                                                                const val =
                                                                                    e
                                                                                        .target
                                                                                        .value;
                                                                                // Solo permitir dígitos y un punto decimal, no negativos
                                                                                if (
                                                                                    /^[0-9]*\.?[0-9]*$/.test(
                                                                                        val,
                                                                                    )
                                                                                ) {
                                                                                    setMontoStr(
                                                                                        val,
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-3 py-2 text-sm text-[#002c28] focus:border-[#8dc63f] focus:ring-2 focus:ring-[#8dc63f]/30 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Nota: cobro se guarda al pasar a la siguiente tarea (botones de resultado) */}
                                                            <p className="text-center text-xs text-[#4a6b4a]/70 italic">
                                                                Se guardará al
                                                                pasar a la
                                                                siguiente tarea
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Descripción */}
                                        <div className="rounded-xl border border-[#d4e8d4] bg-[#f8faf8] p-4">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                <svg
                                                    className="h-4 w-4 text-[#2b8838]"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 6h16M4 12h16M4 18h7"
                                                    />
                                                </svg>
                                                Descripción
                                            </h3>
                                            <p className="text-sm leading-relaxed text-[#002c28]/80">
                                                {ticket.ticket_descripcion ||
                                                    'Reparar gotera en baño hombres y pileta Itel viejo'}
                                            </p>
                                        </div>

                                        {/* Adjuntos */}
                                        {adjuntos.length > 0 && (
                                            <div className="rounded-xl border border-[#d4e8d4] bg-[#f8faf8] p-4">
                                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                    <svg
                                                        className="h-4 w-4 text-[#8dc63f]"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                        />
                                                    </svg>
                                                    Archivos Adjuntos (
                                                    {adjuntos.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {adjuntos.map((adj) => {
                                                        const esImagen =
                                                            adj.adjuntos_tipo.startsWith(
                                                                'image/',
                                                            );
                                                        const esPdf =
                                                            adj.adjuntos_tipo ===
                                                            'application/pdf';
                                                        const estaAbierto =
                                                            adjuntoAbierto ===
                                                            adj.adjuntos_id;
                                                        const urlArchivo = `/storage/${adj.adjuntos_contenido}`;

                                                        return (
                                                            <div
                                                                key={
                                                                    adj.adjuntos_id
                                                                }
                                                                className="overflow-hidden rounded-lg border border-[#d4e8d4]"
                                                            >
                                                                {/* Header clickeable */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setAdjuntoAbierto(
                                                                            estaAbierto
                                                                                ? null
                                                                                : adj.adjuntos_id,
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#a7dbb0]/10"
                                                                >
                                                                    {/* Icono según tipo */}
                                                                    <div
                                                                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                                                                            esImagen
                                                                                ? 'bg-blue-100'
                                                                                : esPdf
                                                                                  ? 'bg-red-100'
                                                                                  : 'bg-[#a7dbb0]/30'
                                                                        }`}
                                                                    >
                                                                        {esImagen ? (
                                                                            <svg
                                                                                className="h-4 w-4 text-blue-600"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                />
                                                                            </svg>
                                                                        ) : esPdf ? (
                                                                            <svg
                                                                                className="h-4 w-4 text-red-600"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                                                />
                                                                            </svg>
                                                                        ) : (
                                                                            <svg
                                                                                className="h-4 w-4 text-[#2b8838]"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                    </div>

                                                                    {/* Info del archivo */}
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-sm font-medium text-[#002c28]">
                                                                            {
                                                                                adj.adjuntos_nombre_adjunto
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-[#4a6b4a]">
                                                                            {
                                                                                adj.bitacora_fecha
                                                                            }
                                                                            {adj.adjuntos_tamano >
                                                                                0 && (
                                                                                <span className="ml-2">
                                                                                    {adj.adjuntos_tamano >
                                                                                    1048576
                                                                                        ? `${(adj.adjuntos_tamano / 1048576).toFixed(1)} MB`
                                                                                        : `${(adj.adjuntos_tamano / 1024).toFixed(0)} KB`}
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    {/* Flecha expandir/colapsar */}
                                                                    <svg
                                                                        className={`h-5 w-5 flex-shrink-0 text-[#4a6b4a] transition-transform duration-200 ${estaAbierto ? 'rotate-180' : ''}`}
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M19 9l-7 7-7-7"
                                                                        />
                                                                    </svg>
                                                                </button>

                                                                {/* Contenido expandible — preview del adjunto */}
                                                                {estaAbierto && (
                                                                    <div className="border-t border-[#d4e8d4] bg-white p-4">
                                                                        {esImagen ? (
                                                                            <div className="flex flex-col items-center gap-3">
                                                                                <img
                                                                                    src={
                                                                                        urlArchivo
                                                                                    }
                                                                                    alt={
                                                                                        adj.adjuntos_nombre_adjunto
                                                                                    }
                                                                                    className="max-h-[400px] max-w-full rounded-lg border border-[#d4e8d4] object-contain"
                                                                                />
                                                                                <a
                                                                                    href={
                                                                                        urlArchivo
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1 text-xs font-medium text-[#2b8838] hover:text-[#002c28]"
                                                                                >
                                                                                    <svg
                                                                                        className="h-3.5 w-3.5"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        stroke="currentColor"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                                        />
                                                                                    </svg>
                                                                                    Abrir
                                                                                    en
                                                                                    nueva
                                                                                    pestaña
                                                                                </a>
                                                                            </div>
                                                                        ) : esPdf ? (
                                                                            <div className="flex flex-col items-center gap-3">
                                                                                <iframe
                                                                                    src={
                                                                                        urlArchivo
                                                                                    }
                                                                                    title={
                                                                                        adj.adjuntos_nombre_adjunto
                                                                                    }
                                                                                    className="h-[400px] w-full rounded-lg border border-[#d4e8d4]"
                                                                                />
                                                                                <a
                                                                                    href={
                                                                                        urlArchivo
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1 text-xs font-medium text-[#2b8838] hover:text-[#002c28]"
                                                                                >
                                                                                    <svg
                                                                                        className="h-3.5 w-3.5"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        stroke="currentColor"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                                        />
                                                                                    </svg>
                                                                                    Abrir
                                                                                    PDF
                                                                                    en
                                                                                    nueva
                                                                                    pestaña
                                                                                </a>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center gap-3 py-4">
                                                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a7dbb0]/20">
                                                                                    <svg
                                                                                        className="h-6 w-6 text-[#2b8838]"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        stroke="currentColor"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                        />
                                                                                    </svg>
                                                                                </div>
                                                                                <p className="text-sm text-[#4a6b4a]">
                                                                                    Vista
                                                                                    previa
                                                                                    no
                                                                                    disponible
                                                                                    para
                                                                                    este
                                                                                    tipo
                                                                                    de
                                                                                    archivo
                                                                                </p>
                                                                                <a
                                                                                    href={
                                                                                        urlArchivo
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-2 rounded-lg bg-[#2b8838] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#236e2d]"
                                                                                >
                                                                                    <svg
                                                                                        className="h-4 w-4"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        stroke="currentColor"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                        />
                                                                                    </svg>
                                                                                    Descargar
                                                                                    archivo
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bitácora */}
                                        <div className="rounded-xl border border-[#d4e8d4] bg-gradient-to-br from-[#f8faf8] to-[#a7dbb0]/10 p-4">
                                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                <svg
                                                    className="h-4 w-4 text-[#2b8838]"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                Bitácora ({bitacora.length})
                                            </h3>

                                            <div className="space-y-4">
                                                {bitacora.map(
                                                    (entrada, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative"
                                                        >
                                                            {/* Línea vertical conectora */}
                                                            {index !==
                                                                bitacora.length -
                                                                    1 && (
                                                                <div className="absolute top-10 bottom-0 left-4 w-0.5 bg-gradient-to-b from-[#a7dbb0] to-transparent" />
                                                            )}

                                                            <div className="flex gap-4">
                                                                {/* Icono */}
                                                                <div className="relative z-10 flex-shrink-0">
                                                                    <IconoTipoBitacora
                                                                        tipo={
                                                                            entrada.bitacora_tiporegistro
                                                                        }
                                                                    />
                                                                </div>

                                                                {/* Contenido */}
                                                                <div className="flex-1 rounded-lg border border-[#d4e8d4] bg-white p-4 shadow-sm">
                                                                    <div className="mb-2 flex items-start justify-between">
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-[#002c28]">
                                                                                {entrada.responsable_nombre ||
                                                                                    entrada.responsable_cuenta ||
                                                                                    `Usuario #${entrada.usuario_responsable}`}
                                                                            </p>
                                                                            <p className="mt-1 flex items-center gap-2 text-xs text-[#4a6b4a]">
                                                                                <svg
                                                                                    className="h-3 w-3"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    stroke="currentColor"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                    />
                                                                                </svg>
                                                                                {
                                                                                    entrada.bitacora_fecha_actualizacion
                                                                                }
                                                                                <span className="text-[#a7dbb0]">
                                                                                    •
                                                                                </span>
                                                                                <svg
                                                                                    className="h-3 w-3"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    stroke="currentColor"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                    />
                                                                                </svg>
                                                                                {
                                                                                    entrada.bitacora_fecha_actualizacion
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                        {entrada.bitacora_tiporegistro && (
                                                                            <span className="rounded-md bg-[#002c28]/5 px-2 py-1 text-xs font-medium text-[#002c28]/60 capitalize">
                                                                                {
                                                                                    entrada.bitacora_tiporegistro
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm leading-relaxed text-[#002c28]/80">
                                                                        {
                                                                            entrada.bitacora_descripcion
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>

                                        {/* Sección de Comentarios y Archivos */}
                                        <div className="rounded-xl border-2 border-dashed border-[#a7dbb0] bg-white p-4">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                <svg
                                                    className="h-4 w-4 text-[#2b8838]"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                                    />
                                                </svg>
                                                Añadir Comentario
                                            </h3>
                                            <textarea
                                                rows={4}
                                                value={comentario}
                                                onChange={(e) =>
                                                    setComentario(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Escribe tu comentario aquí..."
                                                className="w-full resize-none rounded-lg border border-[#d4e8d4] px-4 py-3 text-sm focus:border-[#8dc63f] focus:ring-2 focus:ring-[#8dc63f]/30 focus:outline-none"
                                            />
                                            <div className="mt-3 flex items-center justify-between">
                                                {/* Input oculto para archivos */}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    onChange={
                                                        handleSubirArchivo
                                                    }
                                                    accept="*/*"
                                                />
                                                <button
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    disabled={subiendoArchivo}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4a6b4a] hover:text-[#002c28] disabled:opacity-50"
                                                >
                                                    {subiendoArchivo ? (
                                                        <svg
                                                            className="h-4 w-4 animate-spin"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                            />
                                                        </svg>
                                                    )}
                                                    {subiendoArchivo
                                                        ? 'Subiendo...'
                                                        : 'Adjuntar archivo'}
                                                </button>
                                                <button
                                                    onClick={
                                                        handleEnviarComentario
                                                    }
                                                    disabled={
                                                        !comentario.trim() ||
                                                        enviandoComentario
                                                    }
                                                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2b8838] to-[#8dc63f] px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:from-[#236e2d] hover:to-[#7ab535] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {enviandoComentario ? (
                                                        <svg
                                                            className="h-4 w-4 animate-spin"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                            />
                                                        </svg>
                                                    )}
                                                    {enviandoComentario
                                                        ? 'Enviando...'
                                                        : 'Enviar Comentario'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer del Modal */}
                                <div className="border-t border-[#d4e8d4] bg-[#f8faf8] px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-[#4a6b4a]">
                                            Última actualización:{' '}
                                            {new Date().toLocaleString('es-HN')}
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg bg-[#002c28]/10 px-4 py-2 text-sm font-medium text-[#002c28] transition-colors hover:bg-[#002c28]/20"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
});
