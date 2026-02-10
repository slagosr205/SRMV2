<?php

namespace App\Auth;

use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;

class LegacyUserProvider implements UserProvider
{
    protected $model;

    public function __construct($model)
    {
        $this->model = $model;
    }

    public function retrieveByCredentials(array $credentials)
    {
        // Fortify envía 'email' como username field; mapeamos a usuario_cuenta
        $login = $credentials['email'] ?? $credentials['usuario_cuenta'] ?? null;

        if (! $login) {
            return null;
        }

        return Usuario::where('usuario_cuenta', $login)->first();
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        $plain = $credentials['password'];

        // 1. Legacy MD5
        if (hash_equals($user->usuario_contrasena, md5($plain))) {
            // Migración silenciosa a bcrypt
            $user->usuario_contrasena = Hash::make($plain);
            $user->save();
            return true;
        }

        // 2. Legacy SHA1
        if (hash_equals($user->usuario_contrasena, sha1($plain))) {
            $user->usuario_contrasena = Hash::make($plain);
            $user->save();
            return true;
        }

        // 3. Bcrypt (ya migrado)
        return Hash::check($plain, $user->usuario_contrasena);
    }

    public function retrieveById($identifier)
    {
        return Usuario::find($identifier);
    }

    public function retrieveByToken($identifier, $token)
    {
        $user = Usuario::find($identifier);

        if (! $user || $user->getRememberToken() !== $token) {
            return null;
        }

        return $user;
    }

    public function updateRememberToken(Authenticatable $user, $token)
    {
        $user->setRememberToken($token);
        $user->save();
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        if (! Hash::needsRehash($user->usuario_contrasena) && ! $force) {
            return;
        }

        $user->usuario_contrasena = Hash::make($credentials['password']);
        $user->save();
    }
}
