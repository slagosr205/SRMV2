<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campo extends Model
{
    //

    protected $table = 'campo';

    protected $primaryKey = 'campo_id';

    protected   $fillable = [
    
        'campo_orden',
        'subtipoticket_id',
        'diccionario_id',
        
    ];


    public function subtipoticket()
    {
        return $this->belongsTo(SubTipoTicket::class, 'subtipoticket_id');
    }

    public function diccionario()
    {
        return $this->belongsTo(Diccionario::class, 'diccionario_id');
    }

    public function valorticket()
    {
        return $this->hasMany(ValorTicket::class, 'campo_id', 'campo_id');
    }
}
