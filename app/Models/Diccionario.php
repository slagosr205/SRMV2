<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diccionario extends Model
{
    //
    
    protected $table = 'diccionario';
    

    protected $primaryKey = 'diccionario_id';

    protected   $fillable = [
    
        'diccionario_nombre',
        'diccionario_tipo',
        'diccionario_etiqueta',

    ];

     public function campo()
    {
        return $this->hasMany(Campo::class, 'diccionario_id', 'diccionario_id');
    }
}
