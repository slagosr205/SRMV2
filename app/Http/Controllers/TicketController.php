<?php

namespace App\Http\Controllers;

use App\Models\Adjunto;
use App\Models\Bitacora;
use App\Models\Resultado;
use App\Models\Ticket;
use App\Services\TicketFileService;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(TicketService $service)
    {
        $contadores = collect($service->procesosUsuario())
            ->mapWithKeys(fn($t) => [
                $t->tarea_id => $service->contarPorTarea($t->tarea_id)
            ]);

        $tickets = collect($service->ticketsUsuario())
            ->groupBy('tarea_id');

        return Inertia::render('Tickets/Index', [
            'procesos'   => $service->procesosUsuario(),
            'tickets'    => $tickets,
            'contadores' => $contadores,
            'puedeCrear' => $service->puedeCrearTicket(),
        ]);
    }

    public function showDetailBitacora(Request $request, TicketService $service, $ticketId)
    {
        $detallePorTicket = $service->obtenerTicketPorId($ticketId);

        return response()->json([
            'detalle' => $detallePorTicket,
        ]);
    }

    /**
     * Ejecutar un resultado: mueve el ticket a la siguiente tarea y registra en bitácora.
     * Si la tarea es de diagnóstico, también guarda cobro/moneda/monto.
     */
    public function ejecutarResultado(Request $request, int $ticket)
    {
        $request->validate([
            'resultado_id'  => 'required|integer|exists:resultado,resultado_id',
            'cobro'         => 'nullable|array',
            'cobro.cobrado' => 'nullable|integer|in:0,1',
            'cobro.moneda'  => 'nullable|string|in:LPS,USD,EUR',
            'cobro.monto'   => 'nullable|numeric|min:0',
            'comentario'    => 'nullable|string|max:2000',
        ]);

        $user = Auth::user();
        $userId = $user->usuario_id;
        $resultado = Resultado::findOrFail($request->resultado_id);
        $ticketModel = Ticket::findOrFail($ticket);
        $tareaAnteriorId = $ticketModel->tarea_id;
        $nuevaTareaId = $resultado->tarea_id_lleva_resultado;
        $comentario = $request->input('comentario', '');

        DB::transaction(function () use ($ticketModel, $resultado, $nuevaTareaId, $tareaAnteriorId, $userId, $request, $comentario) {
            // 1. Actualizar tarea del ticket
            $ticketModel->tarea_id = $nuevaTareaId;

            // 2. Si hay datos de cobro, guardarlos
            $cobro = $request->input('cobro');
            if ($cobro) {
                $ticketModel->ticket_cobrado = $cobro['cobrado'] ?? 0;
                $ticketModel->ticket_moneda  = $cobro['moneda'] ?? 'LPS';
                $ticketModel->ticket_monto   = $cobro['monto'] ?? 0;
            }

            $ticketModel->save();

            // 3. Registrar en bitácora (tipo 2 = cambio de tarea)
            Bitacora::create([
                'bitacora_fecha'              => now(),
                'bitacora_descripcion'        => $resultado->resultado_nombre,
                'ticket_id'                   => $ticketModel->ticket_id,
                'tarea_id_realizar'           => $nuevaTareaId,
                'tarea_id_actual'             => $tareaAnteriorId,
                'resultado_id'                => $resultado->resultado_id,
                'bitacora_tiporegistro'       => 2,
                'bitacora_comentario'         => $comentario ?? '',
                'usuario_id'                  => $userId,
                'bitacora_enviado'            => 0,
                'usuario_responsable'         => $userId,
                'bitacora_fecha_actualizacion' => now(),
            ]);
        });


        return response()->json(['success' => true]);
    }

    /**
     * Agregar un comentario a la bitácora del ticket.
     */
    public function agregarComentario(Request $request, int $ticket)
    {
        $request->validate([
            'comentario' => 'required|string|max:2000',
        ]);

        $user = Auth::user();
        $userId = $user->usuario_id;
        $ticketModel = Ticket::findOrFail($ticket);

        Bitacora::create([
            'bitacora_fecha'              => now(),
            'bitacora_descripcion'        => $request->comentario,
            'ticket_id'                   => $ticketModel->ticket_id,
            'tarea_id_realizar'           => $ticketModel->tarea_id,
            'tarea_id_actual'             => $ticketModel->tarea_id,
            'resultado_id'                => 0,
            'bitacora_tiporegistro'       => 4, // Comentario
            'bitacora_comentario'         => $request->comentario,
            'usuario_id'                  => $userId,
            'bitacora_enviado'            => 0,
            'usuario_responsable'         => $userId,
            'bitacora_fecha_actualizacion' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Subir un archivo adjunto al ticket (asociado a una entrada de bitácora).
     */
    public function subirAdjunto(Request $request, int $ticket)
    {
        $request->validate([
            'archivo' => 'required|file|max:10240', // 10MB max
        ]);

        $user = Auth::user();
        $userId = $user->usuario_id;
        $ticketModel = Ticket::findOrFail($ticket);
        $archivo = $request->file('archivo');

        DB::transaction(function () use ($ticketModel, $archivo, $userId) {
            // 1. Crear entrada en bitácora (tipo 1 = evento)
            $bitacora = Bitacora::create([
                'bitacora_fecha'              => now(),
                'bitacora_descripcion'        => 'Archivo adjunto: ' . $archivo->getClientOriginalName(),
                'ticket_id'                   => $ticketModel->ticket_id,
                'tarea_id_realizar'           => $ticketModel->tarea_id,
                'tarea_id_actual'             => $ticketModel->tarea_id,
                'resultado_id'                => 0,
                'bitacora_tiporegistro'       => 1,
                'bitacora_comentario'         => '',
                'usuario_id'                  => $userId,
                'bitacora_enviado'            => 0,
                'usuario_responsable'         => $userId,
                'bitacora_fecha_actualizacion' => now(),
            ]);

            // 2. Guardar el archivo usando el servicio especializado
            $ruta = TicketFileService::guardarArchivoTicket($ticketModel->ticket_id, $archivo);

            Adjunto::create([
                'adjuntos_nombre'         => $archivo->getClientOriginalName(),
                'adjuntos_descripcion'    => '',
                'adjuntos_contenido'      => $ruta,
                'adjuntos_tamano'         => $archivo->getSize(),
                'adjuntos_tipo'           => $archivo->getClientMimeType(),
                'adjuntos_nombre_adjunto' => $archivo->getClientOriginalName(),
                'adjuntos_unidad_tamano'  => 'bytes',
                'bitacora_id'             => $bitacora->bitacora_id,
            ]);
        });

        return response()->json(['success' => true]);
    }

    /**
     * Datos para el formulario de creación: procesos, tipos y subtipos.
     */
    public function datosCreacion(TicketService $service)
    {
        $procesos = $service->procesosParaCrear();

        return response()->json([
            'procesos' => $procesos,
        ]);
    }

    /**
     * Tipos de ticket por proceso (AJAX cascade).
     */
    public function tiposPorProceso(TicketService $service, int $procesoId)
    {
        return response()->json([
            'tipos' => $service->tiposTicketPorProceso($procesoId),
        ]);
    }

    /**
     * Subtipos de ticket por tipo (AJAX cascade).
     */
    public function subtiposPorTipo(TicketService $service, int $tipoId)
    {
        return response()->json([
            'subtipos' => $service->subtiposPorTipo($tipoId),
        ]);
    }

    /**
     * Obtener torres disponibles para creación de tickets
     */
    public function obtenerTorresCreacion(TicketService $service)
    {
        return response()->json([
            'torres' => $service->obtenerTorresParaCreacion(),
        ]);
    }

    /**
     * Obtener pisos disponibles para creación de tickets
     */
    public function obtenerPisosCreacion(TicketService $service, int $torreId)
    {
        return response()->json([
            'pisos' => $service->obtenerPisosParaCreacion($torreId),
        ]);
    }

    /**
     * Campos dinámicos por subtipo de ticket (AJAX).
     */
    public function camposPorSubtipo(TicketService $service, int $subtipoId)
    {
        return response()->json([
            'campos' => $service->camposPorSubtipo($subtipoId),
        ]);
    }

    /**
     * Crear un nuevo ticket.
     */
    public function store(Request $request, TicketService $service)
    {
        $request->validate([
            'proceso_id'       => 'required|integer',
            'subtipoticket_id' => 'required|integer|exists:subtipoticket,subtipoticket_id',
            'torre_id'         => 'required|integer|exists:torres,torre_id',
            'piso_id'          => 'required|integer|exists:pisos,piso_id',
            'ubicacion_detallada' => 'nullable|string|max:200',
            'descripcion'      => 'required|string|max:2000',
            'archivos'         => 'nullable|array',
            'archivos.*'       => 'file|max:10240',
            'campos_dinamicos'          => 'nullable|array',
            'campos_dinamicos.*.campo_id' => 'required_with:campos_dinamicos|integer|exists:campo,campo_id',
            'campos_dinamicos.*.valor'    => 'nullable|string|max:255',
        ]);

        $user = Auth::user();
        $userId = $user->usuario_id;

        // Obtener subtipo para la prioridad por defecto
        $subtipo = DB::selectOne("
            SELECT subtipoticket_prioridad FROM subtipoticket WHERE subtipoticket_id = ?
        ", [$request->subtipoticket_id]);

        // Obtener tarea inicial del proceso
        $tareaInicial = $service->tareaInicialProceso($request->proceso_id);

        if (!$tareaInicial) {
            return response()->json(['message' => 'No se encontró una tarea inicial para este proceso'], 422);
        }

        $prioridad = $subtipo->subtipoticket_prioridad ?? 0;

        // Calcular fecha final estimada basada en subtipoticket_tiempo (horas)
        $tiempoHoras = $subtipo->subtipoticket_tiempo ?? 24;
        $fechaEstimada = now()->addHours($tiempoHoras);

        // Usar la devolución de la transacción para obtener el ticket creado
        $ticketModel = DB::transaction(function () use ($request, $tareaInicial, $prioridad, $fechaEstimada, $userId) {
            // 1. Crear ticket
            $ticketModel = Ticket::create([
                'ticket_descripcion'        => $request->descripcion,
                'ticket_fecha_creacion'     => now(),
                'ticket_fecha_final_estimada' => $fechaEstimada,
                'ticket_fecha_final'        => null,
                'ticket_calificacion'       => 0,
                'ticket_cerrado'            => 0,
                'tarea_id'                  => $tareaInicial->tarea_id,
                'subtipoticket_id'          => $request->subtipoticket_id,
                'ticket_prioridad'          => $prioridad,
                'usuario_creador'           => $userId,
                'ticket_cobrado'            => 0,
                'ticket_moneda'             => 'LPS',
                'ticket_monto'              => 0,
                'torre_id'                 => $request->torre_id,
                'piso_id'                  => $request->piso_id,
                'ticket_ubicacion_detallada' => $request->ubicacion_detallada,
            ]);

            // 2. Insertar en usuariosticket
            DB::table('usuariosticket')->insert([
                'ticket_id'  => $ticketModel->ticket_id,
                'usuario_id' => $userId,
            ]);

            // 3. Crear estructura de directorios para el ticket
            TicketFileService::crearEstructuraTicket($ticketModel->ticket_id);

            // 4. Registrar en bitácora (tipo 3 = creación)
            Bitacora::create([
                'bitacora_fecha'              => now(),
                'bitacora_descripcion'        => 'Ticket creado',
                'ticket_id'                   => $ticketModel->ticket_id,
                'tarea_id_realizar'           => $tareaInicial->tarea_id,
                'tarea_id_actual'             => $tareaInicial->tarea_id,
                'resultado_id'                => 0,
                'bitacora_tiporegistro'       => 3,
                'bitacora_comentario'         => $request->descripcion,
                'usuario_id'                  => $userId,
                'bitacora_enviado'            => 0,
                'usuario_responsable'         => $userId,
                'bitacora_fecha_actualizacion' => now(),
            ]);

            // 5. Guardar campos dinámicos (valorticket)
            if ($request->has('campos_dinamicos')) {
                foreach ($request->campos_dinamicos as $campo) {
                    if (!empty($campo['campo_id'])) {
                        DB::table('valorticket')->insert([
                            'valorticket_valor' => $campo['valor'] ?? '',
                            'campo_id'          => $campo['campo_id'],
                            'ticket_id'         => $ticketModel->ticket_id,
                        ]);
                    }
                }
            }

            // 6. Procesar archivos adjuntos si existen
            if ($request->hasFile('archivos')) {
                foreach ($request->file('archivos') as $archivo) {
                    if ($archivo->isValid()) {
                        // Crear entrada en bitácora para el archivo (tipo 1 = evento)
                        $bitacoraArchivo = Bitacora::create([
                            'bitacora_fecha'              => now(),
                            'bitacora_descripcion'        => 'Archivo adjunto: ' . $archivo->getClientOriginalName(),
                            'ticket_id'                   => $ticketModel->ticket_id,
                            'tarea_id_realizar'           => $tareaInicial->tarea_id,
                            'tarea_id_actual'             => $tareaInicial->tarea_id,
                            'resultado_id'                => 0,
                            'bitacora_tiporegistro'       => 1,
                            'bitacora_comentario'         => '',
                            'usuario_id'                  => $userId,
                            'bitacora_enviado'            => 0,
                            'usuario_responsable'         => $userId,
                            'bitacora_fecha_actualizacion' => now(),
                        ]);

                        // Guardar archivo usando el servicio especializado
                        $ruta = TicketFileService::guardarArchivoTicket($ticketModel->ticket_id, $archivo);

                        Adjunto::create([
                            'adjuntos_nombre'         => $archivo->getClientOriginalName(),
                            'adjuntos_descripcion'    => '',
                            'adjuntos_contenido'      => $ruta,
                            'adjuntos_tamano'         => $archivo->getSize(),
                            'adjuntos_tipo'           => $archivo->getClientMimeType(),
                            'adjuntos_nombre_adjunto' => $archivo->getClientOriginalName(),
                            'adjuntos_unidad_tamano'  => 'bytes',
                            'bitacora_id'             => $bitacoraArchivo->bitacora_id,
                        ]);
                    }
                }
            }
            return $ticketModel;
        });

        return response()->json([
            'success'   => true,
            'ticket_id' => $ticketModel->ticket_id,
        ]);
    }

    /**
     * Obtener el repositorio de archivos de un ticket
     */
    public function obtenerRepositorioArchivos(int $ticketId)
    {
        $ticket = Ticket::findOrFail($ticketId);
        
        // Verificar que el usuario tenga acceso al ticket
        $user = Auth::user();
        if (!$user || !$this->usuarioTieneAccesoTicket($user->usuario_id, $ticketId)) {
            return response()->json(['message' => 'No tiene acceso a este ticket'], 403);
        }

        $repositorio = TicketFileService::obtenerRepositorioTicket($ticketId);
        $estadisticas = TicketFileService::obtenerEstadisticasTicket($ticketId);

        return response()->json([
            'repositorio' => $repositorio,
            'estadisticas' => $estadisticas,
            'ticket_id' => $ticketId,
        ]);
    }

    /**
     * Verificar si un usuario tiene acceso a un ticket
     */
    private function usuarioTieneAccesoTicket(int $userId, int $ticketId): bool
    {
        return DB::table('usuariosticket')
            ->where('ticket_id', $ticketId)
            ->where('usuario_id', $userId)
            ->exists();
    }
}
