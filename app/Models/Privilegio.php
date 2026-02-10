<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Privilegio extends Model
{
    //

    protected $table = 'privilegios';

    protected $primaryKey = 'privilegios_id';

    protected   $fillable = [
        'privilegios_nombre',
        
    ];
}
