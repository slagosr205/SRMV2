<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ValorDiccionario extends Model
{
    //

    protected $table = 'valordiccionario';

    protected $primaryKey = 'valordiccionario_id';

    protected   $fillable = [
    
        'valordiccionario_valor',
        'diccionario_id',
    ];

    public function diccionario()
    {
        return $this->belongsTo(Diccionario::class, 'diccionario_id');
    }
}
