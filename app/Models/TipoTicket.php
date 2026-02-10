<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoTicket extends Model
{
    public $timestamps = false;

    protected $table = 'tipoticket';

    protected $primaryKey = 'tipoticket_id';

    protected $fillable = [
        'tipoticket_nombre',
        'tipoticket_descripcion',
        'proceso_id',
    ];

    public function proceso(): BelongsTo
    {
        return $this->belongsTo(Proceso::class, 'proceso_id', 'proceso_id');
    }

    public function subtipos(): HasMany
    {
        return $this->hasMany(SubtipoTicket::class, 'tipoticket_id', 'tipoticket_id');
    }
}
