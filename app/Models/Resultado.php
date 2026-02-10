<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resultado extends Model
{
    public $timestamps = false;

    protected $table = 'resultado';

    protected $primaryKey = 'resultado_id';

    protected $fillable = [
        'resultado_nombre',
        'resultado_descripcion',
        'tarea_id',
        'tarea_id_lleva_resultado',
    ];

    /**
     * Tarea origen (donde está el resultado disponible).
     */
    public function tarea(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id', 'tarea_id');
    }

    /**
     * Tarea destino (a donde lleva el ticket al seleccionar este resultado).
     */
    public function tareaDestino(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id_lleva_resultado', 'tarea_id');
    }
}
