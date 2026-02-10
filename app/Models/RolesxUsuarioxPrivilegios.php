<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolesxUsuarioxPrivilegios extends Model
{
    //

    protected     $table = 'rolesxusuarioxprivilegios';

    protected   $primaryKey = 'rolesxusuarioxprivilegios_id';

    protected  $fillable = [
        'usuario_id',
        'rolprivilegios_id',
       
    ];


}
