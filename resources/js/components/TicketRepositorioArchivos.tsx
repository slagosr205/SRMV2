import axios from 'axios';
import { useEffect, useState } from 'react';

interface Archivo {
    nombre: string;
    ruta: string;
    url: string;
    tamano: number;
    tipo: string;
    fecha_modificacion: number;
}

interface Repositorio {
    imagenes: Archivo[];
    pdfs: Archivo[];
    documentos: Archivo[];
    hojas_calculo: Archivo[];
    textos: Archivo[];
    otros: Archivo[];
}

interface Estadisticas {
    total_archivos: number;
    tamano_total: number;
    por_tipo: {
        [key: string]: {
            cantidad: number;
            tamano: number;
        };
    };
}

interface TicketRepositorioArchivosProps {
    ticketId: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function TicketRepositorioArchivos({
    ticketId,
    isOpen,
    onClose,
}: TicketRepositorioArchivosProps) {
    const [repositorio, setRepositorio] = useState<Repositorio>({
        imagenes: [],
        pdfs: [],
        documentos: [],
        hojas_calculo: [],
        textos: [],
        otros: [],
    });
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && ticketId) {
            cargarRepositorio();
        }
    }, [isOpen, ticketId]);

    const cargarRepositorio = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/ticket/${ticketId}/repositorio`);
            setRepositorio(response.data.repositorio);
            setEstadisticas(response.data.estadisticas);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    'Error al cargar el repositorio',
            );
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFileIcon = (tipo: string, nombre: string) => {
        const extension = nombre.split('.').pop()?.toLowerCase();

        if (tipo.startsWith('image/')) {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            );
        } else if (tipo === 'application/pdf' || extension === 'pdf') {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <svg
                        className="h-5 w-5 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            );
        } else if (extension === 'doc' || extension === 'docx') {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <span className="text-xs font-semibold text-blue-600">
                        DOC
                    </span>
                </div>
            );
        } else if (
            extension === 'xls' ||
            extension === 'xlsx' ||
            extension === 'csv'
        ) {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <span className="text-xs font-semibold text-green-600">
                        XLS
                    </span>
                </div>
            );
        } else if (extension === 'txt' || extension === 'md') {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <span className="text-xs font-semibold text-gray-600">
                        TXT
                    </span>
                </div>
            );
        } else {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <svg
                        className="h-5 w-5 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
            );
        }
    };

    const renderArchivosPorTipo = (tipo: string, archivos: Archivo[]) => {
        if (!archivos || archivos.length === 0) return null;

        return (
            <div key={tipo} className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800 capitalize">
                    {tipo.replace('_', ' ')} ({archivos.length})
                </h3>
                <div className="space-y-2">
                    {archivos.map((archivo, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                        >
                            {getFileIcon(archivo.tipo, archivo.nombre)}

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">
                                    {archivo.nombre}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(archivo.tamano)} •{' '}
                                    {formatDate(archivo.fecha_modificacion)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={archivo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 transition-colors hover:text-blue-800"
                                    title="Ver archivo"
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
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                </a>
                                <a
                                    href={archivo.url}
                                    download={archivo.nombre}
                                    className="text-green-600 transition-colors hover:text-green-800"
                                    title="Descargar archivo"
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
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#002c28] to-[#2b8838] px-6 py-5">
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
                                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Repositorio de Archivos
                                </h2>
                                <p className="text-xs text-white/70">
                                    Ticket #{ticketId}
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

                {/* Content */}
                <div
                    className="overflow-y-auto p-6"
                    style={{ maxHeight: 'calc(90vh - 160px)' }}
                >
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#2b8838]"></div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!loading && !error && estadisticas && (
                        <>
                            {/* Estadísticas */}
                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-blue-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                            <svg
                                                className="h-5 w-5 text-blue-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-blue-900">
                                                {estadisticas.total_archivos}
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Total Archivos
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-green-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                            <svg
                                                className="h-5 w-5 text-green-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-900">
                                                {formatFileSize(
                                                    estadisticas.tamano_total,
                                                )}
                                            </p>
                                            <p className="text-sm text-green-700">
                                                Espacio Total
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-purple-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                            <svg
                                                className="h-5 w-5 text-purple-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-purple-900">
                                                {
                                                    Object.keys(
                                                        estadisticas.por_tipo,
                                                    ).length
                                                }
                                            </p>
                                            <p className="text-sm text-purple-700">
                                                Tipos de Archivo
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Archivos por tipo */}
                            <div className="space-y-4">
                                {Object.entries(repositorio).map(
                                    ([tipo, archivos]) =>
                                        renderArchivosPorTipo(tipo, archivos),
                                )}

                                {Object.keys(repositorio).length === 0 && (
                                    <div className="py-12 text-center">
                                        <svg
                                            className="mx-auto mb-4 h-12 w-12 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            />
                                        </svg>
                                        <p className="text-gray-500">
                                            No hay archivos en el repositorio
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
