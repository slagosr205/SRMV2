import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    userPrivileges: number[];
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Ticket {
    ticket_id: number;
    ticket_descripcion: string;
    ticket_fecha_creacion: string;
    ticket_fecha_final_estimada: string;
    ticket_fecha_final: string;
    ticket_calificacion: string;
    ticket_cerrado: string;
    tarea_id: number;
    tarea_nombre: string;
    subtipoticket_id: number;
    ticket_prioridad: string;
    usuario_creador: number;
    creador_nombre: string | null;
    creador_cuenta: string | null;
    ticket_cobrado: number;
    ticket_moneda: string;
    ticket_monto: number;
    torre_id: number | null;
    piso_id: number | null;
    ticket_ubicacion_detallada: string | null;
    torre_nombre: string | null;
    piso_nombre: string | null;
    proceso_nombre: string;
    tipoticket_nombre: string;
    subtipoticket_nombre: string;
    created_at: string;
    updated_at: string;
}

export interface Tarea {
    tarea_id: number;
    tarea_nombre: string;
    tarea_descripcion: string;
    proceso_id: number;
    created_at: string;
    updated_at: string;
}

export interface Proceso {
    proceso_id: number;
    proceso_nombre: string;
    proceso_descripcion: string;
    created_at: string;
    updated_at: string;
}

export interface SubtipoTicket {
    subtipoticket_id: number;
    subtipoticket_nombre: string;
    subtipoticket_descripcion: string;
    subtipoticket_tiempo: number;
    tipoticket_id: number;
    usuario_id: number;
    subtipoticket_prioridad: number;
    created_at: string;
    updated_at: string;
}

export interface TicketProps {
    procesos: Array<{
        proceso_id: number;
        proceso_nombre: string;
        tarea_id: number;
        tarea_nombre: string;
    }>;
    tickets: Record<number, Ticket[]>;
    contadores: Record<number, number>;
    puedeCrear: boolean;
}

export interface TipoTicket {
    tipoticket_id: number;
    tipoticket_nombre: string;
}

export interface SubtipoTicketOption {
    subtipoticket_id: number;
    subtipoticket_nombre: string;
    subtipoticket_tiempo: number;
    subtipoticket_prioridad: number;
}

export interface ProcesoCrear {
    proceso_id: number;
    proceso_nombre: string;
}

export interface TorreOption {
    torre_id: number;
    torre_nombre: string;
    torre_descripcion?: string;
}

export interface PisoOption {
    piso_id: number;
    piso_nombre: string;
    piso_numero: number;
    piso_descripcion?: string;
}

export interface Bitacora {
    bitacora_id: number;
    bitacora_fecha: string;
    bitacora_descripcion: string;
    ticket_id: number;
    tarea_id_realizar: number;
    tarea_id_actual: number;
    resultado_id: number;
    bitacora_tiporegistro: number;
    bitacora_comentario: string;
    usuario_id: number;
    bitacora_enviado: string;
    usuario_responsable: number;
    responsable_cuenta: string;
    responsable_nombre: string;
    bitacora_fecha_actualizacion: string;
    created_at: string;
    updated_at: string;
}

export interface Resultado {
    resultado_id: number;
    resultado_nombre: string;
    tarea_id: number;
    tarea_id_lleva_resultado: number;
    tarea_nombre: string;
    proceso_nombre: string;
    tiene_rol: number;
}

export interface Permisos {
    es_helpdesk: boolean;
    puede_cobrar: boolean;
}

export interface TicketDetailModalProps {
    ticket: Ticket | null;
    bitacora: Bitacora[];
    resultados: Resultado[];
    adjuntos: Adjunto[];
    valoresCampos: ValorCampo[];
    permisos: Permisos;
    isOpen: boolean;
    loading?: boolean;
    onClose: () => void;
    onResultado?: (
        resultadoId: number,
        ticketId: number,
        cobro?: { cobrado: number; moneda: string; monto: number },
        comentario?: string,
    ) => void;
    onComentario?: (ticketId: number, comentario: string) => Promise<void>;
    onAdjunto?: (ticketId: number, archivo: File) => Promise<void>;
}

export interface Adjunto {
    adjuntos_id: number;
    adjuntos_nombre: string;
    adjuntos_contenido: string;
    adjuntos_tamano: number;
    adjuntos_tipo: string;
    adjuntos_nombre_adjunto: string;
    bitacora_id: number;
    bitacora_fecha: string;
}

export interface OpcionDiccionario {
    valordiccionario_id: number;
    valordiccionario_valor: string;
}

export interface CampoDinamico {
    campo_id: number;
    campo_orden: number;
    diccionario_id: number;
    diccionario_nombre: string;
    diccionario_tipo: number; // 1 = texto, 3 = select
    diccionario_etiqueta: string;
    opciones: OpcionDiccionario[];
}

export interface ValorCampo {
    valorticket_id: number;
    valorticket_valor: string;
    campo_id: number;
    campo_orden: number;
    diccionario_nombre: string;
    diccionario_etiqueta: string;
    diccionario_tipo: number;
}
