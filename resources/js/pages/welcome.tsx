import { login, register } from '@/routes';
import ticket from '@/routes/ticket';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={ticket.dashboard()}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Texto */}
                        <div>
                            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mb-4">
                                Gestión de tickets y procesos
                            </h1>

                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl">
                                Centraliza solicitudes, automatiza flujos de trabajo y mejora la
                                trazabilidad operativa de tu organización desde un solo lugar.
                            </p>

                            <div className="flex gap-4">
                                {auth.user ? (
                                    <Link
                                        href={ticket.dashboard()}
                                        className="px-6 py-3 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition"
                                    >
                                        Ir al Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="px-6 py-3 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition"
                                        >
                                            Iniciar sesión
                                        </Link>

                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="px-6 py-3 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                                            >
                                                Solicitar acceso
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Visual */}
                        <div className="hidden lg:flex justify-center">
                            <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-8 text-white shadow-xl">
                                <h3 className="text-lg font-semibold mb-4">
                                    ¿Qué puedes hacer?
                                </h3>
                                <ul className="space-y-3 text-sm text-slate-200">
                                    <li>✔ Gestión de tickets por proceso</li>
                                    <li>✔ Flujo Kanban por tareas</li>
                                    <li>✔ Bitácora y trazabilidad completa</li>
                                    <li>✔ Control de permisos y roles</li>
                                </ul>
                            </div>
                        </div>
                    </main>

                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
