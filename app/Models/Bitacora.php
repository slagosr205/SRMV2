<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bitacora extends Model
{
    public $timestamps = false;

    protected $table = 'bitacora';

    protected $primaryKey = 'bitacora_id';

    protected $fillable = [
        'bitacora_fecha',
        'bitacora_descripcion',
        'ticket_id',
        'tarea_id_realizar',
        'tarea_id_actual',
        'resultado_id',
        'bitacora_tiporegistro',
        'bitacora_comentario',
        'usuario_id',
        'bitacora_enviado',
        'usuario_responsable',
        'bitacora_fecha_actualizacion',
    ];

    /**
     * Tipos de registro en bitácora:
     * 1 = Creación, 2 = Cambio de tarea (resultado), 3 = Asignación, 4 = Comentario
     */

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticket_id', 'ticket_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'usuario_id');
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_responsable', 'usuario_id');
    }

    public function tareaActual(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id_actual', 'tarea_id');
    }

    public function tareaRealizar(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id_realizar', 'tarea_id');
    }

    public function resultado(): BelongsTo
    {
        return $this->belongsTo(Resultado::class, 'resultado_id', 'resultado_id');
    }

    public function adjuntos(): HasMany
    {
        return $this->hasMany(Adjunto::class, 'bitacora_id', 'bitacora_id');
    }
}
