<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    public $timestamps = false;

    protected $table = 'ticket';

    protected $primaryKey = 'ticket_id';

    protected $fillable = [
        'ticket_descripcion',
        'ticket_fecha_creacion',
        'ticket_fecha_final_estimada',
        'ticket_fecha_final',
        'ticket_calificacion',
        'ticket_cerrado',
        'tarea_id',
        'subtipoticket_id',
        'ticket_prioridad',
        'usuario_creador',
        'ticket_cobrado',
        'ticket_moneda',
        'ticket_monto',
        'torre_id',
        'piso_id',
        'ticket_ubicacion_detallada',
    ];

    public function tarea(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id', 'tarea_id');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_creador', 'usuario_id');
    }

    public function bitacoras(): HasMany
    {
        return $this->hasMany(Bitacora::class, 'ticket_id', 'ticket_id')
            ->orderByDesc('bitacora_fecha');
    }

    public function adjuntos(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(
            Adjunto::class,
            Bitacora::class,
            'ticket_id',
            'bitacora_id',
            'ticket_id',
            'bitacora_id'
        );
    }

    public function torre(): BelongsTo
    {
        return $this->belongsTo(Torre::class, 'torre_id', 'torre_id');
    }

    public function piso(): BelongsTo
    {
        return $this->belongsTo(Piso::class, 'piso_id', 'piso_id');
    }

    public function subtipoTicket(): BelongsTo
    {
        return $this->belongsTo(SubtipoTicket::class, 'subtipoticket_id', 'subtipoticket_id');
    }

    /**
     * Obtener ubicación completa del ticket
     */
    public function getUbicacionCompletaAttribute()
    {
        $ubicacion = [];
        
        if ($this->torre) {
            $ubicacion[] = $this->torre->torre_nombre;
        }
        
        if ($this->piso) {
            $ubicacion[] = $this->piso->piso_nombre;
        }
        
        if ($this->ticket_ubicacion_detallada) {
            $ubicacion[] = $this->ticket_ubicacion_detallada;
        }
        
        return implode(' - ', array_filter($ubicacion));
    }
        
        if ($this->piso) {
            $ubicacion[] = $this->piso->piso_nombre;
        }
        
        if ($this->ticket_ubicacion_detallada) {
            $ubicacion[] = $this->ticket_ubicacion_detallada;
        }
        
        return implode(' - ', $ubicacion);
    }

    /**
     * Scope para tickets de una torre específica
     */
    public function scopeDeTorre($query, $torreId)
    {
        return $query->where('torre_id', $torreId);
    }

    /**
     * Scope para tickets de un piso específico
     */
    public function scopeDePiso($query, $pisoId)
    {
        return $query->where('piso_id', $pisoId);
    }

    public function usuariosTicket(): HasMany
    {
        return $this->hasMany(UsuariosTicket::class, 'ticket_id', 'ticket_id');
    }

     public function alarmasLog(): HasMany
    {
        return $this->hasMany(AlarmasLog::class, 'ticket_id', 'ticket_id');
    }

    public function valorTickets(): HasMany
    {
        return $this->hasMany(ValorTicket::class, 'ticket_id', 'ticket_id');
    }
}
