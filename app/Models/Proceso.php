<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proceso extends Model
{
    public $timestamps = false;

    protected $primaryKey = 'proceso_id';

    protected $table = 'proceso';

    protected $fillable = [
        'proceso_nombre',
        'proceso_descripcion',
        'depto_id',
        'proceso_cant_archivo',
        'proceso_tam_archivo',
        'torre_id',
        'piso_id',
        'proceso_multitorre',
    ];

    protected $casts = [
        'proceso_multitorre' => 'boolean',
    ];

    /**
     * Un Proceso tiene muchas Tareas
     */
    public function tareas(): HasMany
    {
        return $this->hasMany(Tarea::class, 'proceso_id', 'proceso_id');
    }

    /**
     * Relación con Torre
     */
    public function torre(): BelongsTo
    {
        return $this->belongsTo(Torre::class, 'torre_id', 'torre_id');
    }

    /**
     * Relación con Piso
     */
    public function piso(): BelongsTo
    {
        return $this->belongsTo(Piso::class, 'piso_id', 'piso_id');
    }

    /**
     * Un Proceso tiene muchos Tipos de Ticket
     */
    public function tiposTicket(): HasMany
    {
        return $this->hasMany(TipoTicket::class, 'proceso_id', 'proceso_id');
    }

    /**
     * Un Proceso tiene muchos Tickets a través de sus Tareas
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'proceso_id', 'proceso_id');
    }

     public function alarmas(): HasMany
    {
        return $this->hasMany(Alarmas::class, 'proceso_id', 'proceso_id');
    }

    

    /**
     * Scope para procesos multitorre
     */
    public function scopeMultitorre($query, $multitorre = true)
    {
        return $query->where('proceso_multitorre', $multitorre);
    }

    /**
     * Scope para procesos de una torre específica
     */
    public function scopeDeTorre($query, $torreId)
    {
        return $query->where('torre_id', $torreId);
    }

    /**
     * Scope para procesos de un piso específico
     */
    public function scopeDePiso($query, $pisoId)
    {
        return $query->where('piso_id', $pisoId);
    }

    /**
     * Obtener el nombre completo con ubicación
     */
    public function getNombreConUbicacionAttribute()
    {
        $ubicacion = [];
        
        if ($this->torre) {
            $ubicacion[] = $this->torre->torre_nombre;
        }
        
        if ($this->piso) {
            $ubicacion[] = $this->piso->piso_nombre;
        }
        
        $ubicacionStr = count($ubicacion) > 0 ? ' (' . implode(' - ', $ubicacion) . ')' : '';
        
        return $this->proceso_nombre . $ubicacionStr;
    }
}
