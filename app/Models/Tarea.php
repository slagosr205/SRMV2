<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tarea extends Model
{
    public $timestamps = false;

    protected $table = 'tarea';

    protected $primaryKey = 'tarea_id';

    protected $fillable = [
        'tarea_nombre',
        'tarea_descripcion',
        'proceso_id',
        'tarea_tipo',
        'tarea_kanbanDisplayOrder',
    ];

    public function proceso(): BelongsTo
    {
        return $this->belongsTo(Proceso::class, 'proceso_id', 'proceso_id');
    }

    public function resultados(): HasMany
    {
        return $this->hasMany(Resultado::class, 'tarea_id', 'tarea_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'tarea_id', 'tarea_id');
    }
}
