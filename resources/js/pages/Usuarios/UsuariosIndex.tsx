import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useState } from 'react';

type Usuario = {
    usuario_id: number;
    usuario_nombre: string;
    usuario_cuenta: string;
    usuario_correo: string;
    usuario_estados: string;
    depto_id: number | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginationLink[];
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
    from?: number;
    to?: number;
};

interface PageProps {
    usuarios: Paginator<Usuario>;
    filters: {
        search?: string;
        estado?: string;
        perPage?: number;
    };
    esAdmin: boolean;
    flash?: { success?: string; error?: string };
}

export default function UsuariosIndex({
    usuarios,
    filters,
    esAdmin = false,
    flash = {},
}: PageProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [estado, setEstado] = useState(filters.estado ?? '');
    const [perPage, setPerPage] = useState(filters.perPage ?? 10);
    const [showFlash, setShowFlash] = useState(!!flash?.success);

    useEffect(() => {
        if (flash?.success) {
            setShowFlash(true);
            const t = setTimeout(() => setShowFlash(false), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    useEffect(() => {
        const t = setTimeout(() => {
            applyFilters({ search });
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const applyFilters = (override: Partial<PageProps['filters']> = {}) => {
        router.get(
            '/usuarios',
            { search, estado, perPage, ...override },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setEstado('');
        setPerPage(10);
        router.get(
            '/usuarios',
            { perPage: 10 },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout>
            <Head title="Usuarios" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Flash success */}
                    {showFlash && flash?.success && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#a7dbb0] bg-[#f0faf2] px-4 py-3 text-sm text-[#2b8838]">
                            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {flash.success}
                            <button onClick={() => setShowFlash(false)} className="ml-auto text-[#2b8838]/60 hover:text-[#2b8838]">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#002c28]">
                                Gestión de Usuarios
                            </h1>
                            <p className="mt-1 text-sm text-[#4a6b4a]">
                                Administra los usuarios del sistema
                            </p>
                        </div>
                        {esAdmin && (
                            <Link
                                href="/usuarios/create"
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2b8838] to-[#8dc63f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-[#236e2d] hover:to-[#7ab536]"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo Usuario
                            </Link>
                        )}
                    </div>

                    {/* Filtros */}
                    <div className="mb-6 rounded-xl border border-[#d4e8d4] bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-[#002c28]">
                                    Buscar
                                </label>
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a6b4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Nombre, cuenta o correo..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[#002c28]">
                                    Estado
                                </label>
                                <select
                                    className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                    value={estado}
                                    onChange={(e) => {
                                        setEstado(e.target.value);
                                        setTimeout(() => applyFilters({ estado: e.target.value }), 0);
                                    }}
                                >
                                    <option value="">Todos</option>
                                    <option value="activos">Activos</option>
                                    <option value="inactivos">Inactivos</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[#002c28]">
                                    Por página
                                </label>
                                <select
                                    className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                    value={perPage}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setPerPage(v);
                                        setTimeout(() => applyFilters({ perPage: v }), 0);
                                    }}
                                >
                                    {[10, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(search || estado) && (
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#d4e8d4] bg-white px-3 py-1.5 text-xs font-medium text-[#4a6b4a] transition-colors hover:bg-[#f8faf8]"
                                >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Limpiar filtros
                                </button>
                                <span className="text-xs text-[#4a6b4a]">
                                    {usuarios.total ?? usuarios.data.length} resultado{(usuarios.total ?? usuarios.data.length) !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tabla */}
                    <div className="overflow-hidden rounded-xl border border-[#d4e8d4] bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#d4e8d4]">
                                <thead className="bg-[#f0faf2]">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#002c28]">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#002c28]">
                                            Cuenta
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#002c28]">
                                            Correo
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#002c28]">
                                            Estado
                                        </th>
                                        {esAdmin && (
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#002c28]">
                                                Acciones
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#d4e8d4] bg-white">
                                    {usuarios.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={esAdmin ? 5 : 4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg className="h-10 w-10 text-[#a7dbb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <p className="text-sm font-medium text-[#002c28]">No se encontraron usuarios</p>
                                                    <p className="text-xs text-[#4a6b4a]">Intente con otros criterios de búsqueda</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        usuarios.data.map((u) => (
                                            <tr key={u.usuario_id} className="transition-colors hover:bg-[#f8faf8]">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#002c28] to-[#2b8838] text-xs font-bold text-white">
                                                            {(u.usuario_nombre ?? '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium text-[#002c28]">
                                                            {u.usuario_nombre ?? '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4a6b4a]">
                                                    {u.usuario_cuenta ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4a6b4a]">
                                                    {u.usuario_correo ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {u.usuario_estados === 'A' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#a7dbb0]/30 px-2.5 py-1 text-xs font-medium text-[#2b8838]">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-[#2b8838]" />
                                                            Activo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                                {esAdmin && (
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <Link
                                                            href={`/usuarios/${u.usuario_id}/edit`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4e8d4] bg-white px-3 py-1.5 text-xs font-medium text-[#2b8838] transition-colors hover:bg-[#f0faf2]"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Editar
                                                        </Link>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#d4e8d4] bg-[#f8faf8] px-6 py-4 md:flex-row">
                            <p className="text-sm text-[#4a6b4a]">
                                Mostrando{' '}
                                <span className="font-medium text-[#002c28]">{usuarios.from ?? 0}</span>
                                {' '}a{' '}
                                <span className="font-medium text-[#002c28]">{usuarios.to ?? 0}</span>
                                {' '}de{' '}
                                <span className="font-medium text-[#002c28]">{usuarios.total ?? usuarios.data.length}</span>
                                {' '}usuarios
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {usuarios.links.map((l, idx) => (
                                    <Link
                                        key={idx}
                                        href={l.url ?? ''}
                                        preserveScroll
                                        preserveState
                                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                            l.active
                                                ? 'border-[#2b8838] bg-[#2b8838] font-medium text-white'
                                                : l.url
                                                  ? 'border-[#d4e8d4] bg-white text-[#002c28] hover:bg-[#f0faf2]'
                                                  : 'cursor-not-allowed border-[#d4e8d4] bg-gray-50 text-gray-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: l.label }}
                                        as="button"
                                        disabled={!l.url}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
