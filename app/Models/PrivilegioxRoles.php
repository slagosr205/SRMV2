<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrivilegioxRoles extends Model
{
    //

    protected     $table = 'privilegiosxroles';

    protected   $primaryKey = 'privilegiosxroles_id';

    protected  $fillable = [
        'rolprivilegios_id',
        'privilegios_id',
    ];
}
