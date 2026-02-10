<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Torre extends Model
{
    protected $table = 'torres';

    protected $primaryKey = 'torre_id';

    protected $fillable = [
        'torre_nombre',
        'torre_descripcion',
        'torre_direccion',
        'torre_cantidad_pisos',
        'torre_coordenadas',
        'torre_activo',
    ];

    protected $casts = [
        'torre_activo' => 'boolean',
        'torre_cantidad_pisos' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function pisos(): HasMany
    {
        return $this->hasMany(Piso::class, 'torre_id', 'torre_id')
            ->where('piso_activo', true)
            ->orderBy('piso_numero');
    }

    public function todosPisos(): HasMany
    {
        return $this->hasMany(Piso::class, 'torre_id', 'torre_id')
            ->orderBy('piso_numero');
    }

    public function procesos(): HasMany
    {
        return $this->hasMany(Proceso::class, 'torre_id', 'torre_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'torre_id', 'torre_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('torre_activo', true);
    }

    public function scopePorNombre($query, $nombre)
    {
        return $query->where('torre_nombre', 'like', "%{$nombre}%");
    }
}
