<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Piso extends Model
{
    protected $table = 'pisos';

    protected $primaryKey = 'piso_id';

    protected $fillable = [
        'torre_id',
        'piso_nombre',
        'piso_numero',
        'piso_descripcion',
        'piso_activo',
    ];

    protected $casts = [
        'piso_activo' => 'boolean',
        'piso_numero' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function torre(): BelongsTo
    {
        return $this->belongsTo(Torre::class, 'torre_id', 'torre_id');
    }

    public function procesos(): HasMany
    {
        return $this->hasMany(Proceso::class, 'piso_id', 'piso_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'piso_id', 'piso_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('piso_activo', true);
    }

    public function scopeDeTorre($query, $torreId)
    {
        return $query->where('torre_id', $torreId);
    }

    public function scopePorNumero($query, $orden = 'asc')
    {
        return $query->orderBy('piso_numero', $orden);
    }

    public function getNombreCompletoAttribute()
    {
        return $this->piso_nombre . ' (' . $this->torre->torre_nombre . ')';
    }
}
