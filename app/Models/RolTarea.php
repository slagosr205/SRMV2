<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RolTarea extends Model
{
    protected $table = 'roltarea';

    protected $primaryKey = 'roltarea_id';

    protected $fillable = [
        'roltarea_nombre',
        'roltarea_creacion',
        'roltarea_asignacion',
        'roltarea_comentario',
        'roltarea_cerrado',
        'roltarea_modificacion',
        'roltarea_certificacion',
        'roltarea_helpdesk',
        'roltarea_asignar',
        'roltarea_certificar',
        'roltarea_visualizar',
        'proceso_id',
        'roltarea_resolucion',
        'roltarea_resolver',
        'roltarea_adjuntar',
        'roltarea_editar',
        'roltarea_cerrar',
        'roltarea_agregar_cobro',
    ];

    public function proceso(): BelongsTo
    {
        return $this->belongsTo(Proceso::class, 'proceso_id', 'proceso_id');
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(
            Usuario::class,
            'rolesxusuarioxtarea',
            'roltarea_id',
            'usuario_id',
            'roltarea_id',
            'usuario_id'
        );
    }

    public function tareas(): BelongsToMany
    {
        return $this->belongsToMany(
            Tarea::class,
            'tareasxroles',
            'roltarea_id',
            'tarea_id',
            'roltarea_id',
            'tarea_id'
        );
    }

    public function rolesUsuarios(): HasMany
    {
        return $this->hasMany(RolesxUsuarioxTarea::class, 'roltarea_id', 'roltarea_id');
    }
}
