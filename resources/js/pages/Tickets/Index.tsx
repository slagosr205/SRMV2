import { Head, router } from '@inertiajs/react';
import { Permisos, Ticket, TicketProps } from '@/types';
import TicketCard from '@/components/TicketCard';
import { useState, useMemo, useEffect, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { useTicketDetalle } from '@/hooks/useTicketDetalle';
import TicketDetailModal from '@/components/TicketDetailModal';
import CrearTicketModal from '@/components/CrearTicketModal';
import axios from 'axios';

type ViewMode = 'comfortable' | 'compact';
type SortBy = 'recent' | 'priority' | 'title';

export default function Index({ procesos, tickets, contadores, puedeCrear }: TicketProps) {
    // Estados
    const [procesoActivo, setProcesoActivo] = useState<number | null>(null);
    const [crearModalOpen, setCrearModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filtrosPanelAbierto, setFiltrosPanelAbierto] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('comfortable');
    const [sortBy, setSortBy] = useState<SortBy>('recent');
    const [filtroPrioridad, setFiltroPrioridad] = useState<string[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<string[]>([]);
    const [mostrarSoloMisTickets, setMostrarSoloMisTickets] = useState(false);
    const [loadingTicketId, setLoadingTicketId] = useState<number | null>(null);
    const [resultadoLoading, setResultadoLoading] = useState(false);
    const {
        ticket,
        bitacora,
        resultados,
        adjuntos,
        valoresCampos,
        permisos,
        isOpen,
        cerrarTicket,
        abrirTicket,
    } = useTicketDetalle()

    const handleOpen = async (ticketId: number) => {
        setLoadingTicketId(ticketId);
        await abrirTicket(ticketId);
        setLoadingTicketId(null);
    };

    const handleResultado = useCallback(async (
        resultadoId: number,
        ticketId: number,
        cobro?: { cobrado: number; moneda: string; monto: number },
        comentario?: string
    ) => {
        setResultadoLoading(true);
        try {
            await axios.post(`/ticket/${ticketId}/resultado`, {
                resultado_id: resultadoId,
                cobro: cobro ?? null,
                comentario: comentario ?? null,
            });
            cerrarTicket();
            router.reload({ onFinish: () => setResultadoLoading(false) });
        } catch (err: any) {
            setResultadoLoading(false);
            const msg = err?.response?.data?.message || 'Error al ejecutar el resultado';
            alert(msg);
        }
    }, [cerrarTicket]);

    const handleComentario = useCallback(async (ticketId: number, comentario: string) => {
        try {
            await axios.post(`/ticket/${ticketId}/comentario`, { comentario });
            // Re-abrir el ticket para refrescar la bitácora
            await abrirTicket(ticketId);
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Error al enviar el comentario';
            alert(msg);
        }
    }, [abrirTicket]);

    const handleAdjunto = useCallback(async (ticketId: number, archivo: File) => {
        try {
            const formData = new FormData();
            formData.append('archivo', archivo);
            await axios.post(`/ticket/${ticketId}/adjunto`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await abrirTicket(ticketId);
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Error al subir el archivo';
            alert(msg);
        }
    }, [abrirTicket]);

    // Agrupar procesos
    const procesosAgrupados = procesos.reduce((acc, item) => {
        if (!acc[item.proceso_id]) {
            acc[item.proceso_id] = {
                proceso_id: item.proceso_id,
                proceso_nombre: item.proceso_nombre,
                tareas: [],
            };
        }

        acc[item.proceso_id].tareas.push({
            tarea_id: item.tarea_id,
            tarea_nombre: item.tarea_nombre,
        });

        return acc;
    }, {} as Record<number, {
        proceso_id: number;
        proceso_nombre: string;
        tareas: { tarea_id: number; tarea_nombre: string }[];
    }>);

    const listaProcesos = Object.values(procesosAgrupados);

    // Inicializar proceso activo
    useEffect(() => {
        if (listaProcesos.length > 0 && procesoActivo === null) {
            setProcesoActivo(listaProcesos[0].proceso_id);
        }
    }, [listaProcesos, procesoActivo]);

    // Función para filtrar y ordenar tickets
    const filtrarYOrdenarTickets = useMemo(() => {
        const ticketsFiltrados: Record<number, Ticket[]> = {};

        Object.keys(tickets).forEach((tareaId) => {
            const tareaTickets = tickets[Number(tareaId)] || [];

            let filtrados = tareaTickets.filter((ticket) => {
                // Filtro de búsqueda
                const matchSearch = searchQuery === '' ||

                    ticket.ticket_descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ticket.ticket_id?.toString().includes(searchQuery);

                // Filtro de prioridad
                const matchPrioridad = filtroPrioridad.length === 0 ||
                    filtroPrioridad.includes(ticket.ticket_prioridad || 'normal');

                // Filtro de estado
                const matchEstado = filtroEstado.length === 0 ||
                    filtroEstado.includes(ticket.ticket_cerrado || 'abierto');
                return matchSearch && matchPrioridad && matchEstado;
            });

            // Ordenamiento
            filtrados.sort((a, b) => {
                switch (sortBy) {
                    case 'priority':
                        const prioridadOrden = { urgente: 1, alta: 2, normal: 3, baja: 4 };
                        return (prioridadOrden[a.ticket_prioridad as keyof typeof prioridadOrden] || 3) -
                            (prioridadOrden[b.ticket_prioridad as keyof typeof prioridadOrden] || 3);
                    case 'title':
                        return (a.ticket_descripcion || '').localeCompare(b.ticket_descripcion || '');
                    case 'recent':
                    default:
                        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
                }
            });

            ticketsFiltrados[Number(tareaId)] = filtrados;
        });

        return ticketsFiltrados;
    }, [tickets, searchQuery, filtroPrioridad, filtroEstado, sortBy]);

    const procesoSeleccionado = listaProcesos.find(p => p.proceso_id === procesoActivo);

    // Calcular estadísticas
    const estadisticas = useMemo(() => {
        if (!procesoSeleccionado) return { total: 0, urgentes: 0, filtrados: 0 };

        let total = 0;
        let urgentes = 0;
        let filtrados = 0;

        procesoSeleccionado.tareas.forEach((tarea) => {
            const tareasTickets = tickets[tarea.tarea_id] || [];
            const tareasTicketsFiltrados = filtrarYOrdenarTickets[tarea.tarea_id] || [];

            total += tareasTickets.length;
            filtrados += tareasTicketsFiltrados.length;
            urgentes += tareasTickets.filter(t => t.ticket_prioridad === 'urgente' || t.ticket_prioridad === 'alta').length;
        });

        return { total, urgentes, filtrados };
    }, [procesoSeleccionado, tickets, filtrarYOrdenarTickets]);

    // Verificar si hay filtros activos
    const hayFiltrosActivos = searchQuery !== '' ||
        filtroPrioridad.length > 0 ||
        filtroEstado.length > 0 ||
        mostrarSoloMisTickets;

    const limpiarFiltros = () => {
        setSearchQuery('');
        setFiltroPrioridad([]);
        setFiltroEstado([]);
        setMostrarSoloMisTickets(false);
    };

    // Calcular total de tickets por proceso
    const getTotalTicketsProceso = (proceso: typeof listaProcesos[0]) => {
        return proceso.tareas.reduce((total, tarea) => {
            return total + (contadores[tarea.tarea_id] ?? 0);
        }, 0);
    };

    // Atajos de teclado
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setFiltrosPanelAbierto(!filtrosPanelAbierto);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [filtrosPanelAbierto]);

    return (
        <AppLayout>
            <Head title="Tickets" />

            <div className="min-h-screen bg-slate-50">
                {/* Header Principal */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                    <div className="w-full px-6 py-4">
                        {/* Primera fila: Título y acciones principales */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Gestión de Tickets
                                    </h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Organiza y gestiona tus tickets de manera eficiente
                                    </p>
                                </div>
                            </div>

                            {/* Acciones rápidas */}
                            <div className="flex items-center gap-3">
                                {/* Botón Crear Ticket */}
                                {puedeCrear && (
                                    <button
                                        onClick={() => setCrearModalOpen(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-[#2b8838] to-[#8dc63f] text-white rounded-lg shadow-md hover:from-[#236e2d] hover:to-[#7ab536] transition-all text-sm font-semibold flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Crear Ticket
                                    </button>
                                )}

                                {/* Estadísticas */}
                                <div className="flex items-center gap-2">
                                    <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-md">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-sm font-semibold">{estadisticas.total}</span>
                                        </div>
                                    </div>

                                    {estadisticas.urgentes > 0 && (
                                        <div className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg shadow-md animate-pulse">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <span className="text-sm font-semibold">{estadisticas.urgentes} urgentes</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Vista mode toggle */}
                                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('comfortable')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'comfortable'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('compact')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'compact'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Segunda fila: Búsqueda y filtros */}
                        <div className="flex items-center gap-3">
                            {/* Barra de búsqueda */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    id="search-input"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar tickets por descripción o ID... (Ctrl+K)"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <svg className="w-4 h-4 text-slate-400 hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Botón filtros */}
                            <button
                                onClick={() => setFiltrosPanelAbierto(!filtrosPanelAbierto)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filtrosPanelAbierto || hayFiltrosActivos
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filtros
                                {hayFiltrosActivos && (
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                )}
                            </button>

                            {/* Ordenar */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortBy)}
                                className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            >
                                <option value="recent">Más recientes</option>
                                <option value="priority">Por prioridad</option>
                                <option value="title">Por descripción</option>
                            </select>
                        </div>

                        {/* Tabs de procesos - SCROLL HORIZONTAL MEJORADO */}
                        <div className="mt-4 -mx-6 px-6">
                            <div className="overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
                                <div className="flex gap-2 min-w-max">
                                    {listaProcesos.map((proceso) => {
                                        const totalTickets = getTotalTicketsProceso(proceso);
                                        const isActive = procesoActivo === proceso.proceso_id;

                                        return (
                                            <button
                                                key={proceso.proceso_id}
                                                onClick={() => setProcesoActivo(proceso.proceso_id)}
                                                className={`
                          relative px-5 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap
                          transition-all duration-200 ease-in-out flex-shrink-0
                          ${isActive
                                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                                        : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/60'
                                                    }
                        `}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{proceso.proceso_nombre}</span>
                                                    <span className={`
                            px-2 py-0.5 rounded-full text-xs font-bold
                            ${isActive
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                        }
                          `}>
                                                        {totalTickets}
                                                    </span>
                                                </div>

                                                {isActive && (
                                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel de filtros lateral */}
                <div
                    className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${filtrosPanelAbierto ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <div className="h-full flex flex-col">
                        {/* Header del panel */}
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-slate-900">Filtros Avanzados</h3>
                                <button
                                    onClick={() => setFiltrosPanelAbierto(false)}
                                    className="p-1 hover:bg-white rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {hayFiltrosActivos && (
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>

                        {/* Contenido del panel */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Filtro de prioridad */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-3">
                                    Prioridad
                                </label>
                                <div className="space-y-2">
                                    {['urgente', 'alta', 'normal', 'baja'].map((prioridad) => (
                                        <label key={prioridad} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filtroPrioridad.includes(prioridad)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFiltroPrioridad([...filtroPrioridad, prioridad]);
                                                    } else {
                                                        setFiltroPrioridad(filtroPrioridad.filter(p => p !== prioridad));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                            <span className="flex-1 text-sm text-slate-700 capitalize">{prioridad}</span>
                                            <span className={`w-2 h-2 rounded-full ${prioridad === 'urgente' ? 'bg-red-500' :
                                                prioridad === 'alta' ? 'bg-orange-500' :
                                                    prioridad === 'normal' ? 'bg-blue-500' :
                                                        'bg-slate-400'
                                                }`} />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filtro de estado */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-3">
                                    Estado
                                </label>
                                <div className="space-y-2">
                                    {['abierto', 'en_progreso', 'pendiente', 'cerrado'].map((estado) => (
                                        <label key={estado} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filtroEstado.includes(estado)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFiltroEstado([...filtroEstado, estado]);
                                                    } else {
                                                        setFiltroEstado(filtroEstado.filter(e => e !== estado));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                            <span className="flex-1 text-sm text-slate-700 capitalize">
                                                {estado.replace('_', ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Mis tickets */}
                            <div className="pt-4 border-t border-slate-200">
                                <label className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={mostrarSoloMisTickets}
                                        onChange={(e) => setMostrarSoloMisTickets(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-slate-900">Solo mis tickets</div>
                                        <div className="text-xs text-slate-600">Mostrar únicamente tickets asignados a mí</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Footer del panel */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50">
                            <div className="text-xs text-slate-600 space-y-1">
                                <div className="flex justify-between">
                                    <span>Tickets totales:</span>
                                    <span className="font-semibold text-slate-900">{estadisticas.total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tickets filtrados:</span>
                                    <span className="font-semibold text-blue-600">{estadisticas.filtrados}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay del panel de filtros */}
                {filtrosPanelAbierto && (
                    <div
                        onClick={() => setFiltrosPanelAbierto(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
                    />
                )}

                {/* Indicador de filtros activos */}
                {hayFiltrosActivos && !filtrosPanelAbierto && (
                    <div className="fixed bottom-6 right-6 z-30">
                        <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                    <span className="text-sm font-semibold text-slate-900">Filtros activos</span>
                                </div>
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Limpiar
                                </button>
                            </div>
                            <div className="space-y-1 text-xs text-slate-600">
                                {searchQuery && <div>• Búsqueda: "{searchQuery}"</div>}
                                {filtroPrioridad.length > 0 && <div>• Prioridad: {filtroPrioridad.length} seleccionadas</div>}
                                {filtroEstado.length > 0 && <div>• Estado: {filtroEstado.length} seleccionados</div>}
                                {mostrarSoloMisTickets && <div>• Solo mis tickets</div>}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="text-xs text-slate-500">
                                    Mostrando <span className="font-semibold text-blue-600">{estadisticas.filtrados}</span> de <span className="font-semibold">{estadisticas.total}</span> tickets
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contenido del proceso activo */}
                {procesoSeleccionado && (
                    <div className="w-full px-6 py-6">
                        {/* Info del proceso */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-10 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {procesoSeleccionado.proceso_nombre}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {procesoSeleccionado.tareas.length} {procesoSeleccionado.tareas.length === 1 ? 'tarea' : 'tareas'}
                                        {hayFiltrosActivos && (
                                            <span className="ml-2 text-blue-600 font-medium">
                                                • {estadisticas.filtrados} tickets filtrados
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Leyenda rápida */}
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-slate-600">Urgente</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span className="text-slate-600">Alta</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-slate-600">Normal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span className="text-slate-600">Baja</span>
                                </div>
                            </div>
                        </div>

                        {/* Kanban Board - SCROLL HORIZONTAL MEJORADO */}
                        <div className="overflow-x-auto overflow-y-visible pb-8 -mx-6 px-6 custom-scrollbar">
                            <div
                                className={`flex gap-4 min-w-max ${viewMode === 'compact' ? 'gap-3' : 'gap-4'}`}
                            >
                                {procesoSeleccionado.tareas.map((tarea) => {
                                    const tareasTickets = filtrarYOrdenarTickets[tarea.tarea_id] || [];
                                    const ticketCount = contadores[tarea.tarea_id] || 0;
                                    const columnWidth = viewMode === 'compact' ? '280px' : '350px';

                                    return (
                                        <div
                                            key={tarea.tarea_id}
                                            className="flex-shrink-0 transition-all duration-200 hover:scale-[1.01]"
                                            style={{ width: columnWidth }}
                                        >
                                            {/* Columna de tarea */}
                                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                                                {/* Header */}
                                                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 py-3 border-b border-slate-200/60">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
                                                            <h3 className="font-semibold text-slate-800 text-sm truncate">
                                                                {tarea.tarea_nombre}
                                                            </h3>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span className={`
                                px-2.5 py-1 rounded-full text-xs font-bold shadow-sm transition-all
                                ${ticketCount > 0
                                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                                                    : 'bg-slate-200 text-slate-600'
                                                                }
                              `}>
                                                                {ticketCount}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Lista de tickets */}
                                                <div className={`flex-1 p-3 space-y-${viewMode === 'compact' ? '2' : '3'} overflow-y-auto min-h-[200px] max-h-[calc(100vh-400px)] bg-gradient-to-b from-white/50 to-slate-50/50 custom-scrollbar`}>
                                                    {tareasTickets.length > 0 ? (
                                                        tareasTickets.map((ticket, index) => (
                                                            <div
                                                                key={ticket.ticket_id}
                                                                className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                                                style={{
                                                                    animationDelay: `${index * 50}ms`,
                                                                    animation: 'fadeInUp 0.3s ease-out forwards',
                                                                }}
                                                            >
                                                                <TicketCard
                                                                    key={ticket.ticket_id}
                                                                    ticket={ticket}
                                                                    onOpen={handleOpen}
                                                                    isLoading={loadingTicketId === ticket.ticket_id}
                                                                />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                                            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                                {hayFiltrosActivos ? (
                                                                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-500 font-medium">
                                                                {hayFiltrosActivos ? 'No hay resultados' : 'No hay tickets'}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                {hayFiltrosActivos ? 'Intenta ajustar los filtros' : 'Los tickets aparecerán aquí'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {listaProcesos.length === 0 && (
                    <div className="w-full px-6 py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                                <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                No hay procesos asignados
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Contacta con tu administrador para obtener acceso a los procesos y comenzar a gestionar tickets
                            </p>
                        </div>
                    </div>
                )}

                {/* Estilos para animaciones y scrollbars */}
                <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
            border-radius: 4px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #94a3b8, #64748b);
            border-radius: 4px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .custom-scrollbar::-webkit-scrollbar-corner {
            background: transparent;
          }

          /* Firefox scrollbar */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
        `}</style>
            </div>

            <TicketDetailModal
                key={ticket?.ticket_id ?? 'closed'}
                isOpen={isOpen}
                onClose={cerrarTicket}
                ticket={ticket}
                bitacora={bitacora}
                resultados={resultados}
                adjuntos={adjuntos}
                valoresCampos={valoresCampos}
                permisos={permisos ?? {} as Permisos}
                onResultado={handleResultado}
                onComentario={handleComentario}
                onAdjunto={handleAdjunto}
                loading={resultadoLoading}
            />

            {puedeCrear && (
                <CrearTicketModal
                    isOpen={crearModalOpen}
                    onClose={() => setCrearModalOpen(false)}
                    onCreated={() => router.reload()}
                />
            )}
        </AppLayout>
    );
}