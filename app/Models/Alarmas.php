<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alarmas extends Model
{
    //

    protected $table = 'alarmas';

    protected $primaryKey = 'alarma_id';

    protected   $fillable = [
    
        'alarma_nombre',
        'alarma_descripcion',
        'alarma_tipo',
        'alarma_tiempo',
        'proceso_id',
    ];


    public function proceso()
    {
        return $this->belongsTo(Proceso::class, 'proceso_id');
    }

    
}
