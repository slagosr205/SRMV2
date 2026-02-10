import { Breadcrumbs } from "@/components/breadcrumbs";
import { Icon } from "@/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserMenuContent } from "@/components/user-menu-content";
import { useInitials } from "@/hooks/use-initials";
import { cn, isSameUrl, resolveUrl } from "@/lib/utils";

import { type BreadcrumbItem, type NavItem, type SharedData } from "@/types";
import { Link, usePage } from "@inertiajs/react";
import { ChevronDown, Menu } from "lucide-react";
import AppLogoIcon from "./app-logo-icon";
import { NavMain } from "./nav-main";

// rutas
import ticket from "@/routes/ticket";
import usuario from "@/routes/usuario";
import roltarea from "@/routes/roltarea";
import torre from "@/routes/torre";
import piso from "@/routes/piso";
import proceso from "@/routes/proceso";
import tarea from "@/routes/tarea";
import tipoticket from "@/routes/tipoticket";
import subtipoticket from "@/routes/subtipoticket";
import campo from "@/routes/campo";
import diccionario from "@/routes/diccionario";
import valorticket from "@/routes/valorticket";
import alarma from "@/routes/alarma";
import usuariosalarma from "@/routes/usuariosalarma";

import {
  Bell,
  BookOpen,
  Building,
  FileText,
  Folder,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Cada item del menú tiene un campo `priv` que corresponde al privilegios_id del sistema legacy.
 */
interface PrivNavItem extends NavItem {
  priv?: number;
  children?: PrivNavItem[];
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: ticket.dashboard(), icon: LayoutGrid },
];

// priv 6 = Usuario, priv 10 = Rol Tarea
const userNavItems: PrivNavItem[] = [
  {
    title: "Gestión de Usuarios",
    href: usuario.index.url(),
    icon: Users,
    children: [
      { title: "Usuarios", href: usuario.index.url(), icon: Users, priv: 6 },
      { title: "Roles y Permisos", href: roltarea.index.url(), icon: ShieldCheck, priv: 10 },
    ],
  },
];

// priv 2 = Empresa (ubicación)
const locationNavItems: PrivNavItem[] = [
  {
    title: "Ubicaciones",
    href: torre.index.url(),
    icon: Building,
    children: [
      { title: "Torres", href: torre.index.url(), icon: Building, priv: 2 },
      { title: "Pisos", href: piso.index.url(), icon: Building, priv: 2 },
    ],
  },
];

// priv 3 = Proceso, priv 4 = Tarea, priv 13 = Tipo Solicitud, priv 14 = Subtipo Solicitud
const processNavItems: PrivNavItem[] = [
  {
    title: "Configuración de Procesos",
    href: proceso.index.url(),
    icon: Wrench,
    children: [
      { title: "Procesos", href: proceso.index.url(), icon: FileText, priv: 3 },
      { title: "Tareas", href: tarea.index.url(), icon: FileText, priv: 4 },
      { title: "Tipos de Ticket", href: tipoticket.index.url(), icon: FileText, priv: 13 },
      { title: "Subtipos de Ticket", href: subtipoticket.index.url(), icon: FileText, priv: 14 },
    ],
  },
];

// priv 12 = Diccionario
const systemNavItems: PrivNavItem[] = [
  {
    title: "Sistema",
    href: campo.index.url(),
    icon: Settings,
    children: [
      { title: "Campos Dinámicos", href: campo.index.url(), icon: FileText, priv: 12 },
      { title: "Diccionarios", href: diccionario.index.url(), icon: FileText, priv: 12 },
      { title: "Valores por Ticket", href: valorticket.index.url(), icon: FileText, priv: 12 },
    ],
  },
];

// priv 38 = Alarma
const securityNavItems: PrivNavItem[] = [
  {
    title: "Seguridad y Alarmas",
    href: alarma.index.url(),
    icon: Bell,
    children: [
      { title: "Alarmas", href: alarma.index.url(), icon: Bell, priv: 38 },
      { title: "Usuarios de Alarmas", href: usuariosalarma.index.url(), icon: Bell, priv: 38 },
    ],
  },
];

// ✅ arreglado: antes tenías footerNavItems pero usabas rightNavItems
const rightNavItems: NavItem[] = [
  { title: "Repository", href: "https://github.com/laravel/react-starter-kit", icon: Folder },
  { title: "Documentation", href: "https://laravel.com/docs/starter-kits#react", icon: BookOpen },
];

function filterByPrivileges(items: PrivNavItem[], privileges: number[]): NavItem[] {
  return items
    .map((item) => {
      if (item.children?.length) {
        const filteredChildren = item.children.filter(
          (child) => !child.priv || privileges.includes(child.priv)
        );
        if (filteredChildren.length === 0) return null;

        const { priv, children, ...rest } = item;
        return { ...rest, children: filteredChildren.map(({ priv: _p, ...c }) => c) } as NavItem;
      }

      if (item.priv && !privileges.includes(item.priv)) return null;
      const { priv, ...rest } = item;
      return rest as NavItem;
    })
    .filter(Boolean) as NavItem[];
}

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

function DesktopNavGroup({ title, items }: { title: string; items: NavItem[] }) {
  if (!items?.length) return null;

  // Si solo hay 1 item y no tiene children, lo mostramos como link directo
  const single = items.length === 1 && !items[0].children?.length;

  if (single) {
    const it = items[0];
    return (
      <li className="relative flex h-full items-center">
        <Link
          href={it.href}
          className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:bg-white/8 hover:text-white transition-all"
        >
          {it.icon && <Icon iconNode={it.icon} className="h-4 w-4" />}
          {it.title}
        </Link>
      </li>
    );
  }

  // Dropdown de grupo
  return (
    <li className="relative flex h-full items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/8 hover:text-white focus:outline-none">
            {title}
            <ChevronDown className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-64 overflow-hidden rounded-xl border border-[#d4e8d4] bg-white p-1.5 shadow-xl shadow-[#002c28]/10 dark:border-[#1a3d35] dark:bg-[#0f2b27]"
        >
          {items.map((module) => {
            // module puede tener children
            if (module.children?.length) {
              return (
                <div key={module.title} className="px-1 py-1">
                  <div className="px-2 py-1 text-xs font-semibold text-[#4a6b4a] dark:text-[#a7dbb0]/70">
                    {module.title}
                  </div>
                  <div className="mt-1">
                    {module.children.map((child) => (
                      <DropdownMenuItem key={child.title} asChild>
                        <Link
                          href={child.href}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#002c28] hover:bg-[#a7dbb0]/20 hover:text-[#2b8838] dark:text-[#a7dbb0] dark:hover:bg-[#a7dbb0]/10 dark:hover:text-[#8dc63f]"
                        >
                          {child.icon && (
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a7dbb0]/20 dark:bg-[#a7dbb0]/10">
                              <Icon iconNode={child.icon} className="h-4 w-4 text-[#2b8838] dark:text-[#8dc63f]" />
                            </span>
                          )}
                          {child.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <DropdownMenuItem key={module.title} asChild>
                <Link
                  href={module.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#002c28] hover:bg-[#a7dbb0]/20 hover:text-[#2b8838] dark:text-[#a7dbb0] dark:hover:bg-[#a7dbb0]/10 dark:hover:text-[#8dc63f]"
                >
                  {module.icon && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a7dbb0]/20 dark:bg-[#a7dbb0]/10">
                      <Icon iconNode={module.icon} className="h-4 w-4 text-[#2b8838] dark:text-[#8dc63f]" />
                    </span>
                  )}
                  {module.title}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const page = usePage<SharedData>();
  const { auth, userPrivileges } = page.props;
  const getInitials = useInitials();

  const privs = userPrivileges ?? [];

  const filteredUsers = filterByPrivileges(userNavItems, privs);
  const filteredLocations = filterByPrivileges(locationNavItems, privs);
  const filteredProcesses = filterByPrivileges(processNavItems, privs);
  const filteredSystem = filterByPrivileges(systemNavItems, privs);
  const filteredSecurity = filterByPrivileges(securityNavItems, privs);

  const userName = auth?.user?.name ?? "Usuario";
  const avatarUrl = auth?.user?.avatar ?? "";

  return (
    <>
      <header className="top-navbar fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 h-[34px] w-[34px] text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="flex h-full w-72 flex-col items-stretch justify-between border-r border-[#0a3d38] bg-[#002c28]"
              >
                <div className="space-y-3">
                  <SheetHeader>
                    <SheetTitle className="text-white">Menú</SheetTitle>
                  </SheetHeader>

                  {/* ✅ Móvil: solo los módulos filtrados */}
                  <NavMain items={mainNavItems} />

                  {filteredUsers.length > 0 && <NavMain items={filteredUsers} />}
                  {filteredLocations.length > 0 && <NavMain items={filteredLocations} />}
                  {filteredProcesses.length > 0 && <NavMain items={filteredProcesses} />}
                  {filteredSystem.length > 0 && <NavMain items={filteredSystem} />}
                  {filteredSecurity.length > 0 && <NavMain items={filteredSecurity} />}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link
            href={ticket.dashboard()}
            prefetch
            className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#8dc63f] to-[#2b8838] shadow-lg shadow-[#8dc63f]/20">
              <AppLogoIcon className="h-5 w-5 fill-current text-white" />
            </div>
            <span className="hidden text-lg font-bold tracking-tight text-white sm:block">
              SRM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="ml-8 hidden h-full items-center lg:flex">
            <ul className="flex h-full items-center gap-1">
              {/* Dashboard */}
              {mainNavItems.map((item) => (
                <li key={item.title} className="relative flex h-full items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                      isSameUrl(page.url, item.href)
                        ? "nav-link-active bg-white/12 text-white"
                        : "text-white/70 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    {item.icon && <Icon iconNode={item.icon} className="h-4 w-4" />}
                    {item.title}
                  </Link>
                </li>
              ))}

              {/* ✅ Desktop: dropdowns por módulo */}
              <DesktopNavGroup title="Usuarios" items={filteredUsers} />
              <DesktopNavGroup title="Ubicaciones" items={filteredLocations} />
              <DesktopNavGroup title="Procesos" items={filteredProcesses} />
              <DesktopNavGroup title="Sistema" items={filteredSystem} />
              <DesktopNavGroup title="Seguridad" items={filteredSecurity} />
            </ul>
          </nav>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-2">
            {/* Resources Dropdown (Desktop) */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/8 hover:text-white focus:outline-none">
                    Resources
                    <ChevronDown className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 overflow-hidden rounded-xl border border-[#d4e8d4] bg-white p-1.5 shadow-xl shadow-[#002c28]/10 dark:border-[#1a3d35] dark:bg-[#0f2b27]"
                >
                  {rightNavItems.map((item) => (
                    <a
                      key={item.title}
                      href={resolveUrl(item.href)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#002c28] transition-all duration-150 hover:bg-[#a7dbb0]/20 hover:text-[#2b8838] dark:text-[#a7dbb0] dark:hover:bg-[#a7dbb0]/10 dark:hover:text-[#8dc63f]"
                    >
                      {item.icon && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a7dbb0]/20 dark:bg-[#a7dbb0]/10">
                          <Icon iconNode={item.icon} className="h-4 w-4 text-[#2b8838] dark:text-[#8dc63f]" />
                        </div>
                      )}
                      <span>{item.title}</span>
                    </a>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-all duration-200 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-[#8dc63f]"
                >
                  <Avatar className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-[#8dc63f]/40 transition-all duration-200 hover:ring-[#8dc63f]/70">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-[#2b8838] to-[#8dc63f] text-xs font-semibold text-white">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-white/80 md:block">
                    {userName}
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-white/50 md:block" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56 overflow-hidden rounded-xl border border-[#d4e8d4] bg-white p-1 shadow-xl shadow-[#002c28]/10 dark:border-[#1a3d35] dark:bg-[#0f2b27]"
                align="end"
              >
                <UserMenuContent user={auth?.user} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="border-b border-[#d4e8d4] bg-white/60 backdrop-blur-sm dark:border-[#1a3d35] dark:bg-[#0a1f1c]/60">
          <div className="mx-auto flex h-11 w-full items-center justify-start px-4 text-[#4a6b4a] md:max-w-7xl dark:text-[#a7dbb0]/70">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      )}
    </>
  );
}
