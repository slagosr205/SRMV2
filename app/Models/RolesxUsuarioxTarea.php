<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolesxUsuarioxTarea extends Model
{
    protected $table = 'rolesxusuarioxtarea';

    protected $primaryKey = 'rolesxusuarioxtarea_id';

    protected $fillable = [
        'roltarea_id',
        'usuario_id',
    ];

    public function rolTarea(): BelongsTo
    {
        return $this->belongsTo(RolTarea::class, 'roltarea_id', 'roltarea_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'usuario_id');
    }
}
