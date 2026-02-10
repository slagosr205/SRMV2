<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubtipoTicket extends Model
{
    public $timestamps = false;

    protected $table = 'subtipoticket';

    protected $primaryKey = 'subtipoticket_id';

    protected $fillable = [
        'subtipoticket_nombre',
        'subtipoticket_descripcion',
        'subtipoticket_tiempo',
        'tipoticket_id',
        'usuario_id',
        'subtipoticket_prioridad',
    ];

    public function tipoTicket(): BelongsTo
    {
        return $this->belongsTo(TipoTicket::class, 'tipoticket_id', 'tipoticket_id');
    }
}
