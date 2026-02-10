import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Role {
    id: number;
    name: string;
    description: string;
}

interface Props {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    roles: Role[];
    catalogos?: {
        estados?: Array<{ value: string; label: string }>;
    };
}

export default function UsuariosCreate({ auth, roles, catalogos }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '',
        telefono: '',
        is_active: true,
        email_verified: false,
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/usuarios', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <>
            <Head title="Crear Usuario" />

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
                            Crear Nuevo Usuario
                        </h1>
                        <p className="mt-1 text-sm text-[#4a6b4a]">
                            Complete los campos para registrar un nuevo usuario
                        </p>
                    </div>

                    {/* Form card */}
                    <div className="rounded-xl border border-[#d4e8d4] bg-white shadow-sm">
                        <div className="rounded-t-xl bg-gradient-to-r from-[#002c28] to-[#2b8838] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
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
                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold text-white">
                                    Información del Usuario
                                </span>
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
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="Ingrese el nombre completo"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.name}
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
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.email}
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
                                        Rol
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={data.role_id}
                                        onChange={(e) =>
                                            setData('role_id', e.target.value)
                                        }
                                        required
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

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full rounded-lg border border-[#d4e8d4] bg-white px-4 py-2.5 text-sm focus:border-[#2b8838] focus:ring-2 focus:ring-[#2b8838]/20 focus:outline-none"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        placeholder="••••••••"
                                        required
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-[#002c28]">
                                        Confirmar Contraseña
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
                                        required
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.password_confirmation}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 border-t border-[#d4e8d4] pt-6 sm:flex-row">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-[#2b8838] focus:ring-[#2b8838]"
                                    />
                                    <label
                                        htmlFor="is_active"
                                        className="text-sm font-medium text-[#002c28]"
                                    >
                                        Usuario Activo
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="email_verified"
                                        checked={data.email_verified}
                                        onChange={(e) =>
                                            setData(
                                                'email_verified',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-[#2b8838] focus:ring-[#2b8838]"
                                    />
                                    <label
                                        htmlFor="email_verified"
                                        className="text-sm font-medium text-[#002c28]"
                                    >
                                        Email Verificado
                                    </label>
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
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            Crear Usuario
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
