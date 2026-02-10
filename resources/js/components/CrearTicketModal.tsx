import { CampoDinamico, PisoOption, ProcesoCrear, SubtipoTicketOption, TipoTicket, TorreOption } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import { Fragment, useEffect, useRef, useState } from 'react';
import * as Swal from 'sweetalert2';

interface CrearTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CrearTicketModal({
    isOpen,
    onClose,
    onCreated,
}: CrearTicketModalProps) {
    const [procesos, setProcesos] = useState<ProcesoCrear[]>([]);
    const [tipos, setTipos] = useState<TipoTicket[]>([]);
    const [subtipos, setSubtipos] = useState<SubtipoTicketOption[]>([]);
    const [torres, setTorres] = useState<TorreOption[]>([]);
    const [pisos, setPisos] = useState<PisoOption[]>([]);

    const [procesoId, setProcesoId] = useState<number | ''>('');
    const [tipoId, setTipoId] = useState<number | ''>('');
    const [subtipoId, setSubtipoId] = useState<number | ''>('');
    const [torreId, setTorreId] = useState<number | ''>('');
    const [pisoId, setPisoId] = useState<number | ''>('');
    const [ubicacionDetallada, setUbicacionDetallada] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [archivos, setArchivos] = useState<File[]>([]);
    const [camposDinamicos, setCamposDinamicos] = useState<CampoDinamico[]>([]);
    const [valoresCampos, setValoresCampos] = useState<Record<number, string>>({});
    const [loadingCampos, setLoadingCampos] = useState(false);

    const [loadingProcesos, setLoadingProcesos] = useState(false);
    const [loadingTipos, setLoadingTipos] = useState(false);
    const [loadingSubtipos, setLoadingSubtipos] = useState(false);
    const [loadingTorres, setLoadingTorres] = useState(false);
    const [loadingPisos, setLoadingPisos] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar procesos al abrir
    useEffect(() => {
        if (isOpen) {
            setLoadingProcesos(true);
            axios
                .get('/ticket/crear/datos')
                .then((res) => setProcesos(res.data.procesos))
                .catch(() => setError('Error al cargar procesos'))
                .finally(() => setLoadingProcesos(false));
        } else {
            // Reset al cerrar
            setProcesos([]);
            setTipos([]);
            setSubtipos([]);
            setTorres([]);
            setPisos([]);
            setProcesoId('');
            setTipoId('');
            setSubtipoId('');
            setTorreId('');
            setPisoId('');
            setUbicacionDetallada('');
            setDescripcion('');
            setArchivos([]);
            setCamposDinamicos([]);
            setValoresCampos({});
            setError(null);
        }
    }, [isOpen]);

    // Cargar tipos al seleccionar proceso
    useEffect(() => {
        if (procesoId === '') {
            setTipos([]);
            setTipoId('');
            setSubtipos([]);
            setSubtipoId('');
            setTorres([]);
            setTorreId('');
            setPisos([]);
            setPisoId('');
            return;
        }
        setLoadingTipos(true);
        setLoadingTorres(true);
        setTipoId('');
        setSubtipos([]);
        setSubtipoId('');
        setTorres([]);
        setTorreId('');
        setPisos([]);
        setPisoId('');

        Promise.all([
            axios.get(`/ticket/crear/tipos/${procesoId}`),
            axios.get('/ticket/crear/torres'),
        ])
            .then(([tiposResponse, torresResponse]) => {
                setTipos(tiposResponse.data.tipos);
                setTorres(torresResponse.data.torres);
            })
            .catch(() => setError('Error al cargar datos'))
            .finally(() => {
                setLoadingTipos(false);
                setLoadingTorres(false);
            });
    }, [procesoId]);

    // Cargar subtipos al seleccionar tipo
    useEffect(() => {
        if (tipoId === '') {
            setSubtipos([]);
            setSubtipoId('');
            return;
        }
        setLoadingSubtipos(true);
        setSubtipoId('');
        axios
            .get(`/ticket/crear/subtipos/${tipoId}`)
            .then((res) => setSubtipos(res.data.subtipos))
            .catch(() => setError('Error al cargar subtipos'))
            .finally(() => setLoadingSubtipos(false));
    }, [tipoId]);

    // Cargar campos dinámicos al seleccionar subtipo
    useEffect(() => {
        if (subtipoId === '') {
            setCamposDinamicos([]);
            setValoresCampos({});
            return;
        }
        setLoadingCampos(true);
        axios
            .get(`/ticket/crear/campos/${subtipoId}`)
            .then((res) => {
                const campos: CampoDinamico[] = res.data.campos;
                setCamposDinamicos(campos);
                // Inicializar valores vacíos
                const inicial: Record<number, string> = {};
                campos.forEach((c) => { inicial[c.campo_id] = ''; });
                setValoresCampos(inicial);
            })
            .catch(() => setError('Error al cargar campos dinámicos'))
            .finally(() => setLoadingCampos(false));
    }, [subtipoId]);

    // Cargar pisos al seleccionar torre
    useEffect(() => {
        if (torreId === '') {
            setPisos([]);
            setPisoId('');
            return;
        }
        setLoadingPisos(true);
        setPisoId('');
        axios
            .get(`/ticket/crear/pisos/${torreId}`)
            .then((res) => setPisos(res.data.pisos))
            .catch(() => setError('Error al cargar pisos'))
            .finally(() => setLoadingPisos(false));
    }, [torreId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const nuevos = Array.from(files).filter((f) => {
            // Max 10MB por archivo
            if (f.size > 10 * 1024 * 1024) {
                setError(`El archivo "${f.name}" excede el límite de 10MB`);
                return false;
            }
            return true;
        });
        setArchivos((prev) => [...prev, ...nuevos]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setArchivos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (
            !procesoId ||
            !subtipoId ||
            !torreId ||
            !pisoId ||
            !descripcion.trim()
        )
            return;

        setSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('proceso_id', String(procesoId));
            formData.append('subtipoticket_id', String(subtipoId));
            formData.append('torre_id', String(torreId));
            formData.append('piso_id', String(pisoId));
            formData.append('ubicacion_detallada', ubicacionDetallada.trim());
            formData.append('descripcion', descripcion.trim());
            // Campos dinámicos
            camposDinamicos.forEach((campo, index) => {
                formData.append(`campos_dinamicos[${index}][campo_id]`, String(campo.campo_id));
                formData.append(`campos_dinamicos[${index}][valor]`, valoresCampos[campo.campo_id] || '');
            });
            archivos.forEach((archivo) => {
                formData.append('archivos[]', archivo);
            });

            const response = await axios.post('/ticket/crear', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Mostrar notificación con el número de ticket
            const ticketId = response.data.ticket_id;
            if (ticketId) {
                await Swal.default.fire({
                    icon: 'success',
                    title: '¡Ticket Creado!',
                    text: `El ticket se ha creado exitosamente con el número: ${ticketId}`,
                    confirmButtonColor: '#2b8838',
                    confirmButtonText: 'Aceptar',
                });
            }

            onCreated();
            onClose();
        } catch (err: any) {
            setError(
                err?.response?.data?.message || 'Error al crear el ticket',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const isFormValid =
        procesoId !== '' &&
        subtipoId !== '' &&
        torreId !== '' &&
        pisoId !== '' &&
        descripcion.trim().length > 0;

    const formatFileSize = (bytes: number) => {
        if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    const isImage = (file: File) => file.type.startsWith('image/');

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="flex max-h-[90vh] w-full max-w-lg transform flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                                {/* Header */}
                                <div className="flex-shrink-0 bg-gradient-to-r from-[#002c28] to-[#2b8838] px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                                                <svg
                                                    className="h-5 w-5 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-lg font-bold text-white">
                                                    Crear Ticket
                                                </Dialog.Title>
                                                <p className="text-xs text-white/70">
                                                    Complete los campos para
                                                    crear un nuevo ticket
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg p-2 transition-colors hover:bg-white/10"
                                        >
                                            <svg
                                                className="h-5 w-5 text-white"
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
                                </div>

                                {/* Body - scrollable */}
                                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                                    {error && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {error}
                                        </div>
                                    )}

                                    {/* Proceso */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Proceso
                                        </label>
                                        <select
                                            value={procesoId}
                                            onChange={(e) =>
                                                setProcesoId(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            disabled={loadingProcesos}
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none disabled:bg-gray-50"
                                        >
                                            <option value="">
                                                {loadingProcesos
                                                    ? 'Cargando procesos...'
                                                    : '-- Seleccione un proceso --'}
                                            </option>
                                            {procesos.map((p) => (
                                                <option
                                                    key={p.proceso_id}
                                                    value={p.proceso_id}
                                                >
                                                    {p.proceso_nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tipo de ticket */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Tipo de Ticket
                                        </label>
                                        <select
                                            value={tipoId}
                                            onChange={(e) =>
                                                setTipoId(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            disabled={
                                                procesoId === '' || loadingTipos
                                            }
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {loadingTipos
                                                    ? 'Cargando tipos...'
                                                    : procesoId === ''
                                                      ? '-- Seleccione un proceso primero --'
                                                      : '-- Seleccione un tipo --'}
                                            </option>
                                            {tipos.map((t) => (
                                                <option
                                                    key={t.tipoticket_id}
                                                    value={t.tipoticket_id}
                                                >
                                                    {t.tipoticket_nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Subtipo de ticket */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Subtipo de Ticket
                                        </label>
                                        <select
                                            value={subtipoId}
                                            onChange={(e) =>
                                                setSubtipoId(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            disabled={
                                                tipoId === '' || loadingSubtipos
                                            }
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {loadingSubtipos
                                                    ? 'Cargando subtipos...'
                                                    : tipoId === ''
                                                      ? '-- Seleccione un tipo primero --'
                                                      : '-- Seleccione un subtipo --'}
                                            </option>
                                            {subtipos.map((s) => (
                                                <option
                                                    key={s.subtipoticket_id}
                                                    value={s.subtipoticket_id}
                                                >
                                                    {s.subtipoticket_nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Campos Dinámicos */}
                                    {loadingCampos && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Cargando campos...
                                        </div>
                                    )}
                                    {camposDinamicos.length > 0 && (
                                        <div className="space-y-4 rounded-xl border border-[#d4e8d4] bg-[#f8faf8] p-4">
                                            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#002c28]">
                                                <svg className="h-4 w-4 text-[#8dc63f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                </svg>
                                                Campos Adicionales
                                            </h4>
                                            {camposDinamicos.map((campo) => (
                                                <div key={campo.campo_id}>
                                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                                        {campo.diccionario_etiqueta || campo.diccionario_nombre}
                                                    </label>
                                                    {campo.diccionario_tipo === 3 ? (
                                                        <select
                                                            value={valoresCampos[campo.campo_id] || ''}
                                                            onChange={(e) => setValoresCampos((prev) => ({ ...prev, [campo.campo_id]: e.target.value }))}
                                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                                        >
                                                            <option value="">-- Seleccione --</option>
                                                            {campo.opciones.map((op) => (
                                                                <option key={op.valordiccionario_id} value={op.valordiccionario_valor}>
                                                                    {op.valordiccionario_valor}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={valoresCampos[campo.campo_id] || ''}
                                                            onChange={(e) => setValoresCampos((prev) => ({ ...prev, [campo.campo_id]: e.target.value }))}
                                                            maxLength={255}
                                                            placeholder={campo.diccionario_etiqueta || campo.diccionario_nombre}
                                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Torre */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Torre
                                        </label>
                                        <select
                                            value={torreId}
                                            onChange={(e) =>
                                                setTorreId(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            disabled={
                                                procesoId === '' ||
                                                loadingTorres
                                            }
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {loadingTorres
                                                    ? 'Cargando torres...'
                                                    : procesoId === ''
                                                      ? '-- Seleccione un proceso primero --'
                                                      : '-- Seleccione una torre --'}
                                            </option>
                                            {torres.map((t) => (
                                                <option
                                                    key={t.torre_id}
                                                    value={t.torre_id}
                                                >
                                                    {t.torre_nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Piso */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Piso
                                        </label>
                                        <select
                                            value={pisoId}
                                            onChange={(e) =>
                                                setPisoId(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            disabled={
                                                torreId === '' || loadingPisos
                                            }
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {loadingPisos
                                                    ? 'Cargando pisos...'
                                                    : torreId === ''
                                                      ? '-- Seleccione una torre primero --'
                                                      : '-- Seleccione un piso --'}
                                            </option>
                                            {pisos.map((p) => (
                                                <option
                                                    key={p.piso_id}
                                                    value={p.piso_id}
                                                >
                                                    {p.piso_nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Ubicación Detallada */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Ubicación Detallada
                                            <span className="ml-1 text-xs font-normal text-gray-400">
                                                (opcional)
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={ubicacionDetallada}
                                            onChange={(e) =>
                                                setUbicacionDetallada(
                                                    e.target.value,
                                                )
                                            }
                                            maxLength={200}
                                            placeholder="Ej: Oficina 203, Área de Servicios, Sala de Juntas..."
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        />
                                        <p className="mt-1 text-right text-xs text-gray-400">
                                            {ubicacionDetallada.length}/200
                                        </p>
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Descripción
                                        </label>
                                        <textarea
                                            value={descripcion}
                                            onChange={(e) =>
                                                setDescripcion(e.target.value)
                                            }
                                            rows={4}
                                            maxLength={2000}
                                            placeholder="Describa el problema o solicitud..."
                                            className="w-full resize-none rounded-lg border border-[#d4e8d4] px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        />
                                        <p className="mt-1 text-right text-xs text-gray-400">
                                            {descripcion.length}/2000
                                        </p>
                                    </div>

                                    {/* Adjuntos */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Archivos Adjuntos
                                            <span className="ml-1 text-xs font-normal text-gray-400">
                                                (opcional, máx. 10MB c/u)
                                            </span>
                                        </label>

                                        {/* Zona de drop / botón */}
                                        <div
                                            className="cursor-pointer rounded-lg border-2 border-dashed border-[#d4e8d4] p-4 text-center transition-colors hover:border-[#2b8838]"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <svg
                                                className="mx-auto mb-2 h-8 w-8 text-[#a7dbb0]"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <p className="text-sm text-[#4a6b4a]">
                                                Haga clic para seleccionar
                                                archivos
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Imágenes, PDF, documentos
                                            </p>
                                        </div>

                                        {/* Lista de archivos seleccionados */}
                                        {archivos.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {archivos.map(
                                                    (archivo, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 rounded-lg border border-[#d4e8d4] bg-[#f8faf8] px-3 py-2"
                                                        >
                                                            {/* Preview thumbnail para imágenes */}
                                                            {isImage(
                                                                archivo,
                                                            ) ? (
                                                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-[#d4e8d4]">
                                                                    <img
                                                                        src={URL.createObjectURL(
                                                                            archivo,
                                                                        )}
                                                                        alt={
                                                                            archivo.name
                                                                        }
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                                                                    <svg
                                                                        className="h-5 w-5 text-red-500"
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
                                                                </div>
                                                            )}

                                                            {/* Info */}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium text-[#002c28]">
                                                                    {
                                                                        archivo.name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-[#4a6b4a]">
                                                                    {formatFileSize(
                                                                        archivo.size,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {/* Botón eliminar */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeFile(
                                                                        index,
                                                                    )
                                                                }
                                                                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
                                                                        d="M6 18L18 6M6 6l12 12"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-[#d4e8d4] bg-gray-50 px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={submitting}
                                        className="rounded-lg border border-[#d4e8d4] bg-white px-5 py-2.5 text-sm font-medium text-[#002c28] transition-colors hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!isFormValid || submitting}
                                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2b8838] to-[#8dc63f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-[#236e2d] hover:to-[#7ab536] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <>
                                                <svg
                                                    className="h-4 w-4 animate-spin"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
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
                                                Creando...
                                            </>
                                        ) : (
                                            <>
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
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                                Crear Ticket
                                                {archivos.length > 0 && (
                                                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs">
                                                        +{archivos.length}{' '}
                                                        archivo
                                                        {archivos.length > 1
                                                            ? 's'
                                                            : ''}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
