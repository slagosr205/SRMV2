<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuario';

    protected $primaryKey = 'usuario_id';

    protected $fillable = [
        'usuario_nombre',
        'usuario_cuenta',
        'usuario_contrasena',
        'usuario_correo',
        'usuario_estados',
        'depto_id',
    ];

    protected $hidden = [
        'usuario_contrasena',
        'remember_token',
    ];

    protected $appends = [
        'name',
        'email',
    ];

    /**
     * Map Laravel's expected "password" attribute to the existing column.
     */
    public function getAuthPassword(): string
    {
        return $this->usuario_contrasena;
    }

    /**
     * Map Laravel's expected "email" for notifications.
     */
    public function getEmailAttribute(): string
    {
        return $this->usuario_correo;
    }

    /**
     * Map "name" attribute for compatibility with shared data / Inertia.
     */
    public function getNameAttribute(): string
    {
        return $this->usuario_nombre;
    }

    public function rolesTarea(): BelongsToMany
    {
        return $this->belongsToMany(
            RolTarea::class,
            'rolesxusuarioxtarea',
            'usuario_id',
            'roltarea_id',
            'usuario_id',
            'roltarea_id'
        );
    }

    public function rolesAsignados(): HasMany
    {
        return $this->hasMany(RolesxUsuarioxTarea::class, 'usuario_id', 'usuario_id');
    }
}
