<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Adjunto extends Model
{
    public $timestamps = false;

    protected $table = 'adjuntos';

    protected $primaryKey = 'adjuntos_id';

    protected $fillable = [
        'adjuntos_nombre',
        'adjuntos_descripcion',
        'adjuntos_contenido',
        'adjuntos_tamano',
        'adjuntos_tipo',
        'adjuntos_nombre_adjunto',
        'adjuntos_unidad_tamano',
        'bitacora_id',
    ];

    public function bitacora(): BelongsTo
    {
        return $this->belongsTo(Bitacora::class, 'bitacora_id', 'bitacora_id');
    }
}
