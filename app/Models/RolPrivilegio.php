<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolPrivilegio extends Model
{
    //

    protected     $table = 'rolprivilegios';

    protected   $primaryKey = 'rolprivilegios_id';

    protected  $fillable = [
        'rolprivilegios_nombre',
        
    ];
}
