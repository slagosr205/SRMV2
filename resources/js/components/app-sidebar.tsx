import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import alarma from '@/routes/alarma';
import campo from '@/routes/campo';
import diccionario from '@/routes/diccionario';
import piso from '@/routes/piso';
import proceso from '@/routes/proceso';
import roltarea from '@/routes/roltarea';
import subtipoticket from '@/routes/subtipoticket';
import tarea from '@/routes/tarea';
import ticket from '@/routes/ticket';
import tipoticket from '@/routes/tipoticket';
import torre from '@/routes/torre';
import usuario from '@/routes/usuario';
import usuariosalarma from '@/routes/usuariosalarma';
import valorticket from '@/routes/valorticket';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    BookOpen,
    Building,
    FileText,
    Folder,
    LayoutGrid,
    Settings,
    ShieldCheck,
    TicketIcon,
    Users,
    Wrench,
} from 'lucide-react';
import AppLogo from './app-logo';

/**
 * Cada item del menú tiene un campo `priv` que corresponde al privilegios_id del sistema legacy.
 * Si el usuario no tiene ese privilegio, el item no se muestra.
 */
interface PrivNavItem extends NavItem {
    priv?: number;
    children?: PrivNavItem[];
}

/**
 * Filtra items de navegación según los privilegios del usuario.
 * - Si un item tiene `priv`, solo se muestra si el usuario tiene ese privilegio.
 * - Si un item tiene `children`, filtra los children y solo muestra el dropdown si tiene al menos 1 hijo visible.
 * - Si no tiene `priv`, siempre se muestra.
 */
function filterByPrivileges(items: PrivNavItem[], privileges: number[]): NavItem[] {
    return items
        .map((item) => {
            if (item.children && item.children.length > 0) {
                const filteredChildren = item.children.filter(
                    (child) => !child.priv || privileges.includes(child.priv),
                );
                if (filteredChildren.length === 0) return null;

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { priv, children, ...rest } = item;
                return {
                    ...rest,
                    children: filteredChildren.map(({ priv: _p, ...c }) => c),
                } as NavItem;
            }

            if (item.priv && !privileges.includes(item.priv)) return null;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { priv, ...rest } = item;
            return rest as NavItem;
        })
        .filter(Boolean) as NavItem[];
}

// ─── Definición de menús con privilegios ──────────────────────────────

// Dashboard - siempre visible para usuarios autenticados
const mainNavItems: PrivNavItem[] = [
    {
        title: 'Dashboard',
        href: ticket.dashboard.url(),
        icon: LayoutGrid,
    },
];

// Tickets module (priv 15 = Solicitud)
const ticketsNavItems: PrivNavItem[] = [
    {
        title: 'Mis Tickets',
        href: ticket.my.url(),
        icon: TicketIcon,
        priv: 15,
    },
    {
        title: 'Todos los Tickets',
        href: ticket.index.url(),
        icon: TicketIcon,
        priv: 15,
    },
    {
        title: 'Crear Ticket',
        href: ticket.create.url(),
        icon: TicketIcon,
        priv: 15,
    },
];

// User management module (dropdown)
// priv 6 = Usuario, priv 10 = Rol Tarea
const userNavItems: PrivNavItem[] = [
    {
        title: 'Gestión de Usuarios',
        href: usuario.index.url(),
        icon: Users,
        children: [
            {
                title: 'Usuarios',
                href: usuario.index.url(),
                icon: Users,
                priv: 6,
            },
            {
                title: 'Roles y Permisos',
                href: roltarea.index.url(),
                icon: ShieldCheck,
                priv: 10,
            },
        ],
    },
];

// Location management module
// priv 2 = Empresa (ubicación)
const locationNavItems: PrivNavItem[] = [
    {
        title: 'Ubicaciones',
        href: torre.index.url(),
        icon: Building,
        children: [
            {
                title: 'Torres',
                href: torre.index.url(),
                icon: Building,
                priv: 2,
            },
            {
                title: 'Pisos',
                href: piso.index.url(),
                icon: Building,
                priv: 2,
            },
        ],
    },
];

// Process configuration module
// priv 3 = Proceso, priv 4 = Tarea, priv 13 = Tipo Solicitud, priv 14 = Subtipo Solicitud
const processNavItems: PrivNavItem[] = [
    {
        title: 'Configuración de Procesos',
        href: proceso.index.url(),
        icon: Wrench,
        children: [
            {
                title: 'Procesos',
                href: proceso.index.url(),
                icon: FileText,
                priv: 3,
            },
            {
                title: 'Tareas',
                href: tarea.index.url(),
                icon: FileText,
                priv: 4,
            },
            {
                title: 'Tipos de Ticket',
                href: tipoticket.index.url(),
                icon: FileText,
                priv: 13,
            },
            {
                title: 'Subtipos de Ticket',
                href: subtipoticket.index.url(),
                icon: FileText,
                priv: 14,
            },
        ],
    },
];

// System configuration module
// priv 12 = Diccionario
const systemNavItems: PrivNavItem[] = [
    {
        title: 'Sistema',
        href: campo.index.url(),
        icon: Settings,
        children: [
            {
                title: 'Campos Dinámicos',
                href: campo.index.url(),
                icon: FileText,
                priv: 12,
            },
            {
                title: 'Diccionarios',
                href: diccionario.index.url(),
                icon: FileText,
                priv: 12,
            },
            {
                title: 'Valores por Ticket',
                href: valorticket.index.url(),
                icon: FileText,
                priv: 12,
            },
        ],
    },
];

// Security and alarms module (priv 38 = Alarma)
const securityNavItems: PrivNavItem[] = [
    {
        title: 'Seguridad y Alarmas',
        href: alarma.index.url(),
        icon: Bell,
        children: [
            {
                title: 'Alarmas',
                href: alarma.index.url(),
                icon: Bell,
                priv: 38,
            },
            {
                title: 'Usuarios de Alarmas',
                href: usuariosalarma.index.url(),
                icon: Bell,
                priv: 38,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { userPrivileges } = usePage<SharedData>().props;
    const privs = userPrivileges ?? [];

    
    // Filtrar cada sección según privilegios del usuario
    const filteredTickets = filterByPrivileges(ticketsNavItems, privs);
    const filteredUsers = filterByPrivileges(userNavItems, privs);
    const filteredLocations = filterByPrivileges(locationNavItems, privs);
    const filteredProcesses = filterByPrivileges(processNavItems, privs);
    const filteredSystem = filterByPrivileges(systemNavItems, privs);
    const filteredSecurity = filterByPrivileges(securityNavItems, privs);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuButton size="lg" asChild>
                        <Link href={ticket.dashboard.url()} prefetch>
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {/* Tickets Module */}
                {filteredTickets.length > 0 && (
                    <NavMain items={filteredTickets} />
                )}

                {/* User Management Module (dropdown) */}
                {filteredUsers.length > 0 && (
                    <NavMain items={filteredUsers} />
                )}

                {/* Location Management Module */}
                {filteredLocations.length > 0 && (
                    <NavMain items={filteredLocations} />
                )}

                {/* Process Configuration Module */}
                {filteredProcesses.length > 0 && (
                    <NavMain items={filteredProcesses} />
                )}

                {/* System Configuration Module */}
                {filteredSystem.length > 0 && (
                    <NavMain items={filteredSystem} />
                )}

                {/* Security & Alarms Module */}
                {filteredSecurity.length > 0 && (
                    <NavMain items={filteredSecurity} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
