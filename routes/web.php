<?php

use App\Http\Controllers\TicketController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ProcesoController;
use App\Http\Controllers\TorreController;
use App\Http\Controllers\PisoController;
use App\Http\Controllers\TipoTicketController;
use App\Http\Controllers\SubtipoTicketController;
use App\Http\Controllers\RolTareaController;
use App\Http\Controllers\CampoController;
use App\Http\Controllers\DiccionarioController;
use App\Http\Controllers\ValorTicketController;
use App\Http\Controllers\AlarmasController;
use App\Http\Controllers\UsuariosAlarmasController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Welcome page
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [TicketController::class, 'index'])->name('ticket.dashboard');
    Route::get('/dashboard/{ticket}', [TicketController::class, 'showDetailBitacora'])->name('ticket.show');
    
    // Tickets module
    Route::get('/tickets', [TicketController::class, 'index'])->name('ticket.index');
    Route::get('/tickets/mis', [TicketController::class, 'myTickets'])->name('ticket.my');
    Route::get('/tickets/crear', [TicketController::class, 'create'])->name('ticket.create');
    //Route::get('/tickets/{ticket}', [TicketController::class, 'show'])->name('ticket.show');
    
    // Ticket actions
    Route::post('/tickets/{ticket}/resultado', [TicketController::class, 'ejecutarResultado'])->name('ticket.resultado');
    Route::post('/tickets/{ticket}/comentario', [TicketController::class, 'agregarComentario'])->name('ticket.comentario');
    Route::post('/tickets/{ticket}/adjunto', [TicketController::class, 'subirAdjunto'])->name('ticket.adjunto');
    Route::get('/tickets/{ticket}/repositorio', [TicketController::class, 'obtenerRepositorioArchivos'])->name('ticket.repositorio');
    
    // User Management
    Route::resource('usuarios', UsuarioController::class)->names('usuario');
    
    // Roles and Permissions
    Route::resource('rol-tareas', RolTareaController::class)->names('roltarea');
    
    // Location Management
    Route::resource('torres', TorreController::class)->names('torre');
    Route::resource('pisos', PisoController::class)->names('piso');
    
    // Process Configuration
    Route::resource('procesos', ProcesoController::class)->names('proceso');
    Route::resource('tipos-ticket', TipoTicketController::class)->names('tipoticket');
    Route::resource('subtipos-ticket', SubtipoTicketController::class)->names('subtipoticket');
    
    // System Configuration
    Route::resource('tareas', RolTareaController::class)->names('tarea');
    Route::resource('campos', CampoController::class)->names('campo');
    Route::resource('diccionarios', DiccionarioController::class)->names('diccionario');
    Route::resource('valor-ticket', ValorTicketController::class)->names('valorticket');
    
    // Security and Alarms
    Route::resource('alarmas', AlarmasController::class)->names('alarma');
    Route::resource('usuarios-alarmas', UsuariosAlarmasController::class)->names('usuariosalarma');
    
    // Legacy ticket creation routes (for backward compatibility)
    Route::prefix('ticket/crear')->group(function () {
        Route::get('/datos', [TicketController::class, 'datosCreacion'])->name('ticket.crear.datos');
        Route::get('/tipos/{proceso}', [TicketController::class, 'tiposPorProceso'])->name('ticket.crear.tipos');
        Route::get('/subtipos/{tipo}', [TicketController::class, 'subtiposPorTipo'])->name('ticket.crear.subtipos');
        Route::get('/torres', [TicketController::class, 'obtenerTorresCreacion'])->name('ticket.crear.torres');
        Route::get('/pisos/{torre}', [TicketController::class, 'obtenerPisosCreacion'])->name('ticket.crear.pisos');
        Route::get('/campos/{subtipo}', [TicketController::class, 'camposPorSubtipo'])->name('ticket.crear.campos');
        Route::post('/crear', [TicketController::class, 'store'])->name('ticket.store');
    });
});

require __DIR__.'/settings.php';