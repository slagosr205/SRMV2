import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Role {
    id: number;
    name: string;
    description: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    telefono?: string;
    is_active: boolean;
    email_verified: boolean;
    role?: Role;
    created_at: string;
}

interface Props {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    usuario: any;
    catalogos?: {
        estados?: Array<{ value: string; label: string }>;
    };
    roles?: Role[];
}

export default function UsuariosEdit({
    auth,
    usuario,
    catalogos,
    roles,
}: Props) {
    interface FormData {
        name: string;
        email: string;
        telefono: string;
        role_id: string;
        is_active: boolean;
        email_verified: boolean;
        password: string;
        password_confirmation: string;
        usuario_nombre: string;
        usuario_correo: string;
        usuario_cuenta: string;
        usuario_estados: string;
    }

    const { data, setData, put, processing, errors, reset } = useForm<FormData>({
        name: usuario.usuario_nombre ?? '',
        email: usuario.usuario_correo ?? '',
        telefono: usuario.usuario_telefono ?? '',
        role_id: usuario.role_id?.toString() ?? '',
        is_active: usuario.usuario_estados === 'A',
        email_verified: usuario.email_verified ?? false,
        password: '',
        password_confirmation: '',
        usuario_nombre: usuario.usuario_nombre ?? '',
        usuario_correo: usuario.usuario_correo ?? '',
        usuario_cuenta: usuario.usuario_cuenta ?? '',
        usuario_estados: usuario.usuario_estados ?? 'A',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        put(`/usuarios/${usuario.usuario_id}`, {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <>
            <Head title="Editar Usuario" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/usuarios"
                            className="mb-3 inline-flex items-center gap-1.5 text-sm text-[#4a6b4a] transition-colors hover:text-[#002c28]"
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
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Volver a Usuarios
                        </Link>
                        <h1 className="text-2xl font-bold text-[#002c28]">
                            Editar Usuario
                        </h1>
                        <p className="mt-1 text-sm text-[#4a6b4a]">
                            Modificando datos de{' '}
                            <span className="font-medium text-[#002c28]">
                                {usuario.usuario_nombre}
                            </span>
                        </p>
                    </div>

                    {/* Form card */}
                    <div className="rounded-xl border border-[#d4e8d4] bg-white shadow-sm">
                        <div className="rounded-t-xl bg-gradient-to-r from-[#002c28] to-[#2b8838] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                                    {(usuario.usuario_nombre ?? '?')
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-white">
                                        Editar Información del Usuario
                                    </span>
                                    <p className="text-xs text-white/70">
                                        ID: {usuario.usuario_id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={data.usuario_nombre}
                                        onChange={(e) =>
                                            setData(
                                                'usuario_nombre',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Ingrese el nombre completo"
                                        required
                                    />
                                    {errors.usuario_nombre && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.usuario_nombre}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={data.usuario_correo}
                                        onChange={(e) =>
                                            setData(
                                                'usuario_correo',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                    {errors.usuario_correo && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.usuario_correo}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={data.telefono}
                                        onChange={(e) =>
                                            setData('telefono', e.target.value)
                                        }
                                        placeholder="+1 234 567 8900"
                                    />
                                    {errors.telefono && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.telefono}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                        Cuenta / Usuario
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={data.usuario_cuenta}
                                        onChange={(e) =>
                                            setData(
                                                'usuario_cuenta',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="nombre.usuario"
                                    />
                                    {errors.usuario_cuenta && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.usuario_cuenta}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                        Estado
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={data.usuario_estados}
                                        onChange={(e) =>
                                            setData(
                                                'usuario_estados',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {catalogos?.estados?.map((e: any) => (
                                            <option
                                                key={e.value}
                                                value={e.value}
                                            >
                                                {e.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.usuario_estados && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.usuario_estados}
                                        </p>
                                    )}
                                </div>

                                {roles && (
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Rol
                                        </label>
                                        <select
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                            value={data.role_id}
                                            onChange={(e) =>
                                                setData(
                                                    'role_id',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Seleccionar rol
                                            </option>
                                            {roles.map((role) => (
                                                <option
                                                    key={role.id}
                                                    value={role.id.toString()}
                                                >
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.role_id && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.role_id}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-[#d4e8d4] pt-5">
                                <h3 className="mb-4 text-sm font-semibold text-[#002c28]">
                                    Cambiar Contraseña (opcional)
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Nueva Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="••••••••"
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                            Confirmar Nueva Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="••••••••"
                                        />
                                        {errors.password_confirmation && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.password_confirmation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 border-t border-[#d4e8d4] pt-5">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2b8838] to-[#8dc63f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-[#236e2d] hover:to-[#7ab536] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? (
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
                                            Actualizando...
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
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            Actualizar Usuario
                                        </>
                                    )}
                                </button>
                                <Link
                                    href="/usuarios"
                                    className="rounded-lg border border-[#d4e8d4] bg-white px-5 py-2.5 text-sm font-medium text-[#002c28] transition-colors hover:bg-gray-50"
                                >
                                    Cancelar
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
