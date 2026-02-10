<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TicketService
{
    
    /**
     * Cuenta tickets por tarea (equivalente a Request_QuantTicket legacy)
     */
    public function contarPorTarea(int $tareaId): int
    {
        $userId = Auth::user()->usuario_id;

        $row = DB::selectOne("
            SELECT SUM(cuenta) AS total FROM (

                /* Tickets del usuario o su departamento */
                SELECT COUNT(t.ticket_id) AS cuenta
                FROM ticket t
                INNER JOIN usuariosticket ut ON ut.ticket_id = t.ticket_id
                INNER JOIN tarea ta ON ta.tarea_id = t.tarea_id
                INNER JOIN proceso p ON p.proceso_id = ta.proceso_id
                WHERE (
                    ut.usuario_id = ?
                    OR ut.usuario_id IN (
                        SELECT usuario_id
                        FROM usuario
                        WHERE depto_id = (
                            SELECT depto_id FROM usuario WHERE usuario_id = ?
                        )
                    )
                )
                AND t.tarea_id = ?
                AND t.ticket_calificacion = 0
                AND t.ticket_cerrado <> -1
                AND t.ticket_fecha_creacion >= '2022-09-01'
                AND ta.tarea_id NOT IN (
                    SELECT ta2.tarea_id
                    FROM tarea ta2
                    INNER JOIN proceso p2 ON p2.proceso_id = ta2.proceso_id
                    WHERE p2.proceso_nombre LIKE '%Mant%Int%'
                    AND ta2.tarea_nombre LIKE '%Solici%Cerrad%'
                )

                UNION ALL

                /* Tickets por rol helpdesk */
                SELECT COUNT(t.ticket_id)
                FROM ticket t
                INNER JOIN tarea ta ON ta.tarea_id = t.tarea_id
                INNER JOIN proceso p ON p.proceso_id = ta.proceso_id
                INNER JOIN roltarea rt ON rt.proceso_id = p.proceso_id
                INNER JOIN rolesxusuarioxtarea rxt ON rxt.roltarea_id = rt.roltarea_id
                WHERE rt.roltarea_helpdesk = 1
                AND rxt.usuario_id = ?
                AND t.tarea_id = ?
                AND t.ticket_calificacion = 0
                AND t.ticket_cerrado <> -1
                AND t.ticket_fecha_creacion >= '2022-09-01'
                AND ta.tarea_id NOT IN (
                    SELECT ta2.tarea_id
                    FROM tarea ta2
                    INNER JOIN proceso p2 ON p2.proceso_id = ta2.proceso_id
                    WHERE p2.proceso_nombre LIKE '%Mant%Int%'
                    AND ta2.tarea_nombre LIKE '%Solici%Cerrad%'
                )

            ) x
        ", [$userId, $userId, $tareaId, $userId, $tareaId]);

        return (int) ($row->total ?? 0);
    }

    /**
     * Procesos y tareas visibles para el usuario
     */
    public function procesosUsuario(): array
    {
        $userId =  Auth::user()->usuario_id;

        return DB::select("
            SELECT DISTINCT
                p.proceso_id,
                p.proceso_nombre,
                t.tarea_id,
                t.tarea_nombre,
                t.tarea_kanbanDisplayOrder
            FROM usuario u
            INNER JOIN rolesxusuarioxtarea rxt ON u.usuario_id = rxt.usuario_id
            INNER JOIN roltarea rt ON rt.roltarea_id = rxt.roltarea_id
            INNER JOIN proceso p ON p.proceso_id = rt.proceso_id
            INNER JOIN tarea t ON t.proceso_id = p.proceso_id
            WHERE u.usuario_id = ?
            ORDER BY t.tarea_kanbanDisplayOrder
        ", [$userId]);
    }

    /**
     * Tickets visibles para el usuario (agrupables por tarea en React)
     */
    public function ticketsUsuario(string $order = 'ASC'): array
    {
        $userId = Auth::user()->usuario_id;
        $order = strtoupper($order) === 'DESC' ? 'DESC' : 'ASC';



        $queryTickets = "
                        SELECT DISTINCT ticket.*, proceso.proceso_id, proceso.proceso_nombre, tarea.tarea_id, calcular_porcentaje_tiempo(ticket.ticket_id) as porcentaje_tiempo
                        FROM ticket
                        INNER JOIN usuariosticket ON usuariosticket.ticket_id = ticket.ticket_id
                        INNER JOIN tarea ON ticket.tarea_id = tarea.tarea_id
                        INNER JOIN proceso ON proceso.proceso_id = tarea.proceso_id
                        WHERE 
                        (
                            usuariosticket.usuario_id = ?  -- Tickets del usuario actual
                            OR
                            usuariosticket.usuario_id IN (
                                SELECT usuario_id
                                FROM usuario
                                WHERE depto_id = (
                                    SELECT depto_id
                                    FROM usuario
                                    WHERE usuario_id = ?
                                )
                            )  -- O tickets de otros usuarios del mismo departamento
                        )
                        AND ticket.ticket_calificacion = 0
                        AND ticket.ticket_cerrado <> -1
                        AND ticket.ticket_fecha_creacion >= '2022-09-01'
                        AND tarea.tarea_id NOT IN (
                            SELECT tarea_id FROM tarea
                            INNER JOIN proceso ON proceso.proceso_id = tarea.proceso_id
                            WHERE proceso.proceso_nombre LIKE '%Mant%Int%'
                            AND tarea.tarea_nombre LIKE '%Solici%Cerrad%'
                        )
                        UNION DISTINCT
                        SELECT DISTINCT ticket.*, proceso.proceso_id, proceso.proceso_nombre, tarea.tarea_id, calcular_porcentaje_tiempo(ticket.ticket_id) as porcentaje_tiempo
                        FROM ticket
                        INNER JOIN tarea ON ticket.tarea_id = tarea.tarea_id
                        INNER JOIN proceso ON proceso.proceso_id = tarea.proceso_id
                        INNER JOIN roltarea ON roltarea.proceso_id = proceso.proceso_id
                        INNER JOIN rolesxusuarioxtarea ON rolesxusuarioxtarea.roltarea_id = roltarea.roltarea_id
                        INNER JOIN usuario ON rolesxusuarioxtarea.usuario_id = usuario.usuario_id
                        WHERE roltarea.roltarea_helpdesk = 1
                        AND ticket.ticket_calificacion = 0
                        AND ticket.ticket_cerrado <> -1
                        AND ticket.ticket_fecha_creacion >= '2022-09-01'
                        AND tarea.tarea_id NOT IN (
                            SELECT tarea_id FROM tarea
                            INNER JOIN proceso ON proceso.proceso_id = tarea.proceso_id
                            WHERE proceso.proceso_nombre LIKE '%Mant%Int%'
                            AND tarea.tarea_nombre LIKE '%Solici%Cerrad%'
                        )
                        AND usuario.usuario_id =?";

        $result = DB::select($queryTickets, [$userId, $userId, $userId]);


        return $result;
    }


    public function obtenerTicketPorId(int $ticketId): array
    {
        $userId =  Auth::user()->usuario_id;

        // 🔐 Rol helpdesk
        $rol = Cache::remember(
            "rol_helpdesk_usuario_{$userId}",
            now()->addMinutes(30),
            fn() => DB::selectOne("
        SELECT MAX(rt.roltarea_helpdesk) AS es_helpdesk
        FROM rolesxusuarioxtarea rxt
        INNER JOIN roltarea rt ON rt.roltarea_id = rxt.roltarea_id
        WHERE rxt.usuario_id = ?
    ", [$userId])
        );

        // 📜 Bitácora con nombre de usuario responsable
        $bitacora = DB::select("
        SELECT
            b.*,
            u.usuario_cuenta AS responsable_cuenta,
            u.usuario_nombre AS responsable_nombre
        FROM bitacora b
        LEFT JOIN usuario u ON u.usuario_id = b.usuario_responsable
        WHERE b.ticket_id = ?
        ORDER BY b.bitacora_fecha DESC LIMIT 20
    ", [$ticketId]);

        // 🎫 Ticket + proceso + tarea + torre + piso + creador
        $ticket = DB::selectOne("
        SELECT
            t.ticket_id,
            t.ticket_descripcion,
            t.ticket_cerrado,
            p.proceso_nombre,
            ta.tarea_nombre,
            t.usuario_creador,
            uc.usuario_nombre AS creador_nombre,
            uc.usuario_cuenta AS creador_cuenta,
            t.ticket_calificacion,
            tt.tipoticket_nombre,
            st.subtipoticket_nombre,
            t.ticket_prioridad,
            t.ticket_fecha_creacion,
            t.ticket_fecha_final_estimada,
            t.ticket_fecha_final,
            t.ticket_cobrado,
            t.ticket_monto,
            t.ticket_moneda,
            t.tarea_id,
            t.torre_id,
            t.piso_id,
            t.ticket_ubicacion_detallada,
            tor.torre_nombre,
            pis.piso_nombre
        FROM ticket t
        INNER JOIN tarea ta ON ta.tarea_id = t.tarea_id
        INNER JOIN subtipoticket st ON st.subtipoticket_id = t.subtipoticket_id
        INNER JOIN tipoticket tt ON tt.tipoticket_id = st.tipoticket_id
        INNER JOIN proceso p ON p.proceso_id = tt.proceso_id
        LEFT JOIN usuario uc ON uc.usuario_id = t.usuario_creador
        LEFT JOIN torres tor ON tor.torre_id = t.torre_id
        LEFT JOIN pisos pis ON pis.piso_id = t.piso_id
        WHERE t.ticket_id = ?
    ", [$ticketId]);

        // 💰 Permiso para agregar cobro (roltarea_agregar_cobro = 1)
        $puedeCobrar = false;
        if ($ticket) {
            $rolCobro = DB::selectOne("
                SELECT COUNT(*) AS total
                FROM rolesxusuarioxtarea rxt
                INNER JOIN roltarea rt ON rt.roltarea_id = rxt.roltarea_id
                INNER JOIN tareasxroles txr ON txr.roltarea_id = rt.roltarea_id
                WHERE rxt.usuario_id = ?
                AND txr.tarea_id = ?
                AND rt.roltarea_agregar_cobro = 1
            ", [$userId, $ticket->tarea_id]);
            $puedeCobrar = ($rolCobro->total ?? 0) > 0;
        }

        // 🎯 Resultados (botones de acción) para la tarea actual del ticket
        $resultados = [];
        if ($ticket) {
            $resultados = DB::select("
                SELECT
                    r.resultado_id,
                    r.resultado_nombre,
                    r.tarea_id,
                    r.tarea_id_lleva_resultado,
                    t.tarea_nombre,
                    p.proceso_nombre,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM rolesxusuarioxtarea rxt
                        INNER JOIN roltarea rt ON rt.roltarea_id = rxt.roltarea_id
                        INNER JOIN tareasxroles txr ON txr.roltarea_id = rt.roltarea_id
                        WHERE rxt.usuario_id = ?
                        AND txr.tarea_id = r.tarea_id
                    ), 0) AS tiene_rol
                FROM resultado r
                INNER JOIN tarea t ON t.tarea_id = r.tarea_id
                INNER JOIN proceso p ON p.proceso_id = t.proceso_id
                WHERE r.tarea_id = ?
                ORDER BY r.tarea_id_lleva_resultado ASC
            ", [$userId, $ticket->tarea_id]);
        }

        // 📎 Adjuntos del ticket (via bitácora)
        $adjuntos = DB::select("
            SELECT
                a.adjuntos_id,
                a.adjuntos_nombre,
                a.adjuntos_contenido,
                a.adjuntos_tamano,
                a.adjuntos_tipo,
                a.adjuntos_nombre_adjunto,
                a.bitacora_id,
                b.bitacora_fecha
            FROM adjuntos a
            INNER JOIN bitacora b ON b.bitacora_id = a.bitacora_id
            WHERE b.ticket_id = ?
            ORDER BY b.bitacora_fecha DESC
        ", [$ticketId]);

        // 📋 Valores de campos dinámicos
        $valoresCampos = $ticket ? $this->valoresTicket($ticketId) : [];

        return [
            'ticket' => $ticket,
            'bitacora' => $bitacora,
            'resultados' => $resultados,
            'adjuntos' => $adjuntos,
            'valores_campos' => $valoresCampos,
            'permisos' => [
                'es_helpdesk' => (bool) ($rol->es_helpdesk ?? false),
                'puede_cobrar' => $puedeCobrar,
            ],
        ];
    }

    /**
     * Verifica si el usuario tiene permiso de creación (roltarea_creacion = 1)
     */
    public function puedeCrearTicket(): bool
    {
        $userId = Auth::user()->usuario_id;

        $row = DB::selectOne("
            SELECT COUNT(*) AS total
            FROM rolesxusuarioxtarea rxt
            INNER JOIN roltarea rt ON rt.roltarea_id = rxt.roltarea_id
            WHERE rxt.usuario_id = ?
            AND rt.roltarea_creacion = 1
        ", [$userId]);

        return ($row->total ?? 0) > 0;
    }

    /**
     * Procesos donde el usuario tiene permiso de creación
     */
    public function procesosParaCrear(): array
    {
        $userId = Auth::user()->usuario_id;

        return DB::select("
            SELECT DISTINCT p.proceso_id, p.proceso_nombre
            FROM rolesxusuarioxtarea rxt
            INNER JOIN roltarea rt ON rt.roltarea_id = rxt.roltarea_id
            INNER JOIN proceso p ON p.proceso_id = rt.proceso_id
            WHERE rxt.usuario_id = ?
            AND rt.roltarea_creacion = 1
            ORDER BY p.proceso_nombre
        ", [$userId]);
    }

    /**
     * Obtener todas las torres activas
     */
    public function obtenerTorres(): array
    {
        return DB::select("
            SELECT 
                t.torre_id,
                t.torre_nombre,
                t.torre_descripcion,
                t.torre_direccion,
                t.torre_cantidad_pisos
            FROM torres t
            WHERE t.torre_activo = 1
            ORDER BY t.torre_nombre
        ");
    }

    /**
     * Obtener pisos de una torre específica
     */
    public function obtenerPisosPorTorre(int $torreId): array
    {
        return DB::select("
            SELECT 
                p.piso_id,
                p.piso_nombre,
                p.piso_numero,
                p.piso_descripcion
            FROM pisos p
            WHERE p.torre_id = ? 
            AND p.piso_activo = 1
            ORDER BY p.piso_numero
        ", [$torreId]);
    }

    /**
     * Obtener procesos con información de torre y piso
     */
    public function procesosConUbicacion(): array
    {
        $userId = Auth::user()->usuario_id;

        return DB::select("
            SELECT DISTINCT
                p.proceso_id,
                p.proceso_nombre,
                p.proceso_descripcion,
                p.torre_id,
                p.piso_id,
                p.proceso_multitorre,
                COALESCE(t.torre_nombre, 'Sin Torre') as torre_nombre,
                COALESCE(ps.piso_nombre, 'Sin Piso') as piso_nombre
            FROM rolesxusuarioxtarea rxt
            INNER JOIN roltarea rt ON rt.roltarea_id = rxt.roltarea_id
            INNER JOIN proceso p ON p.proceso_id = rt.proceso_id
            LEFT JOIN torres t ON t.torre_id = p.torre_id AND t.torre_activo = 1
            LEFT JOIN pisos ps ON ps.piso_id = p.piso_id AND ps.piso_activo = 1
            WHERE rxt.usuario_id = ?
            AND rt.roltarea_creacion = 1
            ORDER BY p.proceso_nombre
        ", [$userId]);
    }

    /**
     * Obtener torres disponibles para crear tickets
     */
    public function obtenerTorresParaCreacion(): array
    {
        $userId = Auth::user()->usuario_id;

        return DB::select("
            SELECT DISTINCT
                t.torre_id,
                t.torre_nombre,
                t.torre_descripcion
            FROM torres t
            WHERE t.torre_activo = 1
            AND EXISTS (
                SELECT 1 FROM rolesxusuarioxtarea rxt
                INNER JOIN roltarea rt ON rxt.roltarea_id = rt.roltarea_id
                INNER JOIN proceso p ON rt.proceso_id = p.proceso_id
                WHERE rxt.usuario_id = ?
                AND rt.roltarea_creacion = 1
                AND (
                    p.torre_id = t.torre_id
                    OR p.proceso_multitorre = 1
                )
            )
            ORDER BY t.torre_nombre
        ", [$userId]);
    }

    /**
     * Obtener pisos disponibles para crear tickets en una torre
     */
    public function obtenerPisosParaCreacion(int $torreId): array
    {
        try {
            $userId = Auth::user()->usuario_id;
        } catch (\Exception $e) {
            // Si no hay usuario autenticado, devolver vacío
            return [];
        }

        return DB::select("
            SELECT DISTINCT
                p.piso_id,
                p.piso_nombre,
                p.piso_numero,
                p.piso_descripcion
            FROM pisos p
            WHERE p.torre_id = ?
            AND p.piso_activo = 1
            AND EXISTS (
                SELECT 1 FROM rolesxusuarioxtarea rxt
                INNER JOIN roltarea rt ON rxt.roltarea_id = rt.roltarea_id
                INNER JOIN proceso pr ON rt.proceso_id = pr.proceso_id
                WHERE rxt.usuario_id = ?
                AND rt.roltarea_creacion = 1
                AND (
                    pr.proceso_multitorre = 1
                    OR pr.torre_id = ?
                )
            )
            ORDER BY p.piso_numero
        ", [$torreId, $userId, $torreId]);
    }

    /**
     * Tipos de ticket por proceso
     */
    public function tiposTicketPorProceso(int $procesoId): array
    {
        return DB::select("
            SELECT tipoticket_id, tipoticket_nombre
            FROM tipoticket
            WHERE proceso_id = ?
            ORDER BY tipoticket_nombre
        ", [$procesoId]);
    }

    /**
     * Subtipos de ticket por tipo
     */
    public function subtiposPorTipo(int $tipoTicketId): array
    {
        return DB::select("
            SELECT subtipoticket_id, subtipoticket_nombre, subtipoticket_tiempo, subtipoticket_prioridad
            FROM subtipoticket
            WHERE tipoticket_id = ?
            ORDER BY subtipoticket_nombre
        ", [$tipoTicketId]);
    }

    /**
     * Primera tarea del proceso (tarea inicial donde se crea el ticket)
     */
    public function tareaInicialProceso(int $procesoId): ?object
    {
        return DB::selectOne("
            SELECT tarea_id, tarea_nombre
            FROM tarea
            WHERE proceso_id = ?
            ORDER BY tarea_kanbanDisplayOrder ASC, tarea_id ASC
            LIMIT 1
        ", [$procesoId]);
    }

    /**
     * Campos dinámicos por subtipo de ticket.
     * Tipo 1 = texto libre, Tipo 3 = select con opciones de valordiccionario.
     */
    public function camposPorSubtipo(int $subtipoticketId): array
    {
        $campos = DB::select("
            SELECT
                c.campo_id,
                c.campo_orden,
                d.diccionario_id,
                d.diccionario_nombre,
                d.diccionario_tipo,
                d.diccionario_etiqueta
            FROM campo c
            INNER JOIN diccionario d ON d.diccionario_id = c.diccionario_id
            WHERE c.subtipoticket_id = ?
            ORDER BY c.campo_orden ASC
        ", [$subtipoticketId]);

        // Para los campos tipo 3 (select), cargar sus opciones
        foreach ($campos as &$campo) {
            if ($campo->diccionario_tipo == 3) {
                $campo->opciones = DB::select("
                    SELECT valordiccionario_id, valordiccionario_valor
                    FROM valordiccionario
                    WHERE diccionario_id = ?
                    ORDER BY valordiccionario_valor
                ", [$campo->diccionario_id]);
            } else {
                $campo->opciones = [];
            }
        }

        return $campos;
    }

    /**
     * Valores de campos dinámicos para un ticket (para mostrar en detalle).
     */
    public function valoresTicket(int $ticketId): array
    {
        return DB::select("
            SELECT
                vt.valorticket_id,
                vt.valorticket_valor,
                vt.campo_id,
                c.campo_orden,
                d.diccionario_nombre,
                d.diccionario_etiqueta,
                d.diccionario_tipo
            FROM valorticket vt
            INNER JOIN campo c ON c.campo_id = vt.campo_id
            INNER JOIN diccionario d ON d.diccionario_id = c.diccionario_id
            WHERE vt.ticket_id = ?
            ORDER BY c.campo_orden ASC
        ", [$ticketId]);
    }
}
