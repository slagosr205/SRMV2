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
            <Head title="SRM - Sistema de Respuesta">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="flex min-h-screen flex-col justify-center bg-gray-50">
                <div className="flex flex-1 items-center justify-center px-4">
                    <div className="w-full max-w-md">
                        <div className="mb-8 text-center">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-[#2b8838] to-[#8dc63f]">
                                <span className="text-2xl font-bold text-white">
                                    SRM
                                </span>
                            </div>
                            <h1 className="mb-2 text-3xl font-bold text-[#002c28]">
                                Sistema de Respuesta
                            </h1>
                            <p className="text-[#4a6b4a]">
                                Gestión de Tickets del Parque de Edificios
                            </p>
                        </div>

                        <div className="space-y-4">
                            {auth.user ? (
                                <Link
                                    href={ticket.dashboard()}
                                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#2b8838] to-[#8dc63f] px-6 py-3 font-medium text-white transition-colors hover:from-[#236e2d] hover:to-[#7ab536]"
                                >
                                    Ingresar al Sistema
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#2b8838] to-[#8dc63f] px-6 py-3 font-medium text-white transition-colors hover:from-[#236e2d] hover:to-[#7ab536]"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="flex w-full items-center justify-center rounded-lg border border-[#d4e8d4] px-6 py-3 font-medium text-[#2b8838] transition-colors hover:bg-[#e8f5e9]"
                                        >
                                            Solicitar Acceso
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mt-8 text-center text-sm text-[#4a6b4a]">
                            <p>
                                Para asistencia, contacte al administrador del
                                sistema
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="py-6 text-center text-sm text-[#4a6b4a]">
                    <p>© 2024 SRM - Sistema de Respuesta</p>
                </footer>
            </div>
        </>
    );
}
