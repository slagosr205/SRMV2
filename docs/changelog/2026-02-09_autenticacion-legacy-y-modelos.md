# Changelog — 2026-02-09

## Autenticación con tabla `usuario` existente y modelos de roles

---

### Resumen

Se configuró Laravel para autenticarse contra la tabla `usuario` existente (contraseñas MD5 legacy) con migración automática a bcrypt, y se crearon los modelos Eloquent para las tablas de roles y tareas.

---

### Archivos modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `app/Models/Usuario.php` | Modificado | Ahora extiende `Authenticatable`, con accessors `name`/`email` y `$appends` para serialización Inertia |
| `app/Auth/LegacyUserProvider.php` | Modificado | Corregido: usa `Usuario` en vez de `User`, mapea campo `email` → `usuario_cuenta`, guarda con `save()` tras rehash |
| `config/auth.php` | Modificado | Provider cambiado a driver `legacy` con modelo `Usuario` |
| `app/Models/RolTarea.php` | Creado | Modelo para tabla `roltarea` |
| `app/Models/RolesxUsuarioxTarea.php` | Creado | Modelo para tabla `rolesxusuarioxtarea` |
| `app/Models/TareasxRoles.php` | Creado | Modelo para tabla `tareasxroles` |

---

### Detalle de cambios

#### 1. Modelo `Usuario` (`app/Models/Usuario.php`)

- Extiende `Illuminate\Foundation\Auth\User as Authenticatable` en lugar de `Model`
- Trait `Notifiable` agregado
- `getAuthPassword()` retorna `usuario_contrasena`
- Accessor `getNameAttribute()` → `usuario_nombre`
- Accessor `getEmailAttribute()` → `usuario_correo`
- `$appends = ['name', 'email']` para que Inertia serialice estos campos
- `$hidden` incluye `usuario_contrasena` y `remember_token`
- Relaciones: `rolesTarea()` (BelongsToMany) y `rolesAsignados()` (HasMany)

#### 2. `LegacyUserProvider` (`app/Auth/LegacyUserProvider.php`)

Maneja autenticación con contraseñas legacy:

- `retrieveByCredentials()`: mapea `$credentials['email']` a columna `usuario_cuenta`
- `validateCredentials()`: verifica en orden:
  1. **MD5** — si coincide, rehashea a bcrypt y guarda
  2. **SHA1** — si coincide, rehashea a bcrypt y guarda
  3. **Bcrypt** — verificación estándar de Laravel
- Comparaciones con `hash_equals()` para prevenir timing attacks
- `retrieveByToken()` y `updateRememberToken()` implementados correctamente

#### 3. Configuración Auth (`config/auth.php`)

```php
'providers' => [
    'users' => [
        'driver' => 'legacy',
        'model'  => App\Models\Usuario::class,
    ],
],
```

#### 4. Modelo `RolTarea` (`app/Models/RolTarea.php`)

- Tabla: `roltarea` | PK: `roltarea_id`
- Campos de permisos: `roltarea_creacion`, `roltarea_asignacion`, `roltarea_comentario`, `roltarea_cerrado`, `roltarea_modificacion`, `roltarea_certificacion`, `roltarea_helpdesk`, `roltarea_asignar`, `roltarea_certificar`, `roltarea_visualizar`, `roltarea_resolucion`, `roltarea_resolver`, `roltarea_adjuntar`, `roltarea_editar`, `roltarea_cerrar`
- FK: `proceso_id`
- Relaciones: `proceso()`, `usuarios()` (BelongsToMany), `tareas()` (BelongsToMany), `rolesUsuarios()` (HasMany)

#### 5. Modelo `RolesxUsuarioxTarea` (`app/Models/RolesxUsuarioxTarea.php`)

- Tabla pivot: `rolesxusuarioxtarea` | PK: `rolesxusuarioxtarea_id`
- FKs: `roltarea_id`, `usuario_id`
- Relaciones: `rolTarea()`, `usuario()`

#### 6. Modelo `TareasxRoles` (`app/Models/TareasxRoles.php`)

- Tabla pivot: `tareasxroles` | PK: `tareasxroles_id`
- FKs: `roltarea_id`, `tarea_id`
- Relaciones: `rolTarea()`, `tarea()`

---

### Flujo de autenticación

```
Usuario ingresa credenciales
        │
        ▼
  Fortify recibe { email, password }
        │
        ▼
  LegacyUserProvider.retrieveByCredentials()
  → busca en tabla `usuario` WHERE usuario_cuenta = email
        │
        ▼
  LegacyUserProvider.validateCredentials()
        │
        ├─ MD5 match? → rehash a bcrypt, save(), return true
        ├─ SHA1 match? → rehash a bcrypt, save(), return true
        └─ Bcrypt match? → return true/false
        │
        ▼
  Login exitoso → próximo login ya usa bcrypt
```

---

### Notas importantes

- **Migración transparente**: Las contraseñas MD5/SHA1 se migran a bcrypt automáticamente al primer login exitoso. No requiere intervención del usuario.
- **Sin pérdida de datos**: La tabla `usuario` existente se usa tal cual, sin modificar su estructura.
- **Compatibilidad Inertia**: Los accessors `name` y `email` con `$appends` permiten que el frontend siga usando `auth.user.name` y `auth.user.email`.
