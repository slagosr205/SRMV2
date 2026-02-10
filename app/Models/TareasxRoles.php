<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TareasxRoles extends Model
{
    protected $table = 'tareasxroles';

    protected $primaryKey = 'tareasxroles_id';

    protected $fillable = [
        'roltarea_id',
        'tarea_id',
    ];

    public function rolTarea(): BelongsTo
    {
        return $this->belongsTo(RolTarea::class, 'roltarea_id', 'roltarea_id');
    }

    public function tarea(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id', 'tarea_id');
    }
}
