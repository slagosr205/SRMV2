<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UsuarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $estado = $request->input('estado'); // activos | inactivos
        $perPage = $request->input('perPage', 10);

        $query = Usuario::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('usuario_nombre', 'like', "%{$search}%")
                    ->orWhere('usuario_correo', 'like', "%{$search}%")
                    ->orWhere('usuario_cuenta', 'like', "%{$search}%");
            });
        }

        if ($estado === 'activos') {
            $query->where('usuario_estados', 'A');
        }

        if ($estado === 'inactivos') {
            $query->where('usuario_estados', 'I');
        }

        $usuarios = $query
            ->orderBy('usuario_id', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Verificar si el usuario actual es administrador (rolprivilegios_id = 1 → ADMINISTRADOR)
        $userId = Auth::user()->usuario_id;
        $esAdmin = (bool) DB::selectOne("
            SELECT COUNT(*) AS total
            FROM rolesxusuarioxprivilegios
            WHERE usuario_id = ? AND rolprivilegios_id = 1
        ", [$userId])->total;

        return Inertia::render('Usuarios/UsuariosIndex', [
            'usuarios' => $usuarios,
            'filters' => [
                'search' => $search,
                'estado' => $estado,
                'perPage' => $perPage,
            ],
            'esAdmin' => $esAdmin,
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $this->autorizarAdmin();

        return Inertia::render('Usuarios/UsuariosCreate', [
            'catalogos' => [
                'estados' => [
                    ['value' => 'A', 'label' => 'Activo'],
                    ['value' => 'I', 'label' => 'Inactivo'],
                ],
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->autorizarAdmin();

        $data = $request->validate([
            'usuario_nombre' => ['required', 'string', 'max:255'],
            'usuario_correo' => ['required', 'email', 'max:255', 'unique:usuario,usuario_correo'],
            'usuario_cuenta' => ['required', 'string', 'max:100', 'unique:usuario,usuario_cuenta'],
            'usuario_estados' => ['required', 'in:A,I'],
        ]);

        Usuario::create($data);

        return redirect()->route('usuario.index')
            ->with('success', 'Usuario creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Usuario $usuario)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $this->autorizarAdmin();

        $usuario = Usuario::where('usuario_id', $id)->firstOrFail();

        return Inertia::render('Usuarios/UsuariosEdit', [
            'usuario' => $usuario,
            'catalogos' => [
                'estados' => [
                    ['value' => 'A', 'label' => 'Activo'],
                    ['value' => 'I', 'label' => 'Inactivo'],
                ],
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $this->autorizarAdmin();

        $usuario = Usuario::where('usuario_id', $id)->firstOrFail();

        $data = $request->validate([
            'usuario_nombre' => ['required', 'string', 'max:255'],
            'usuario_correo' => ['required', 'email', 'max:255', 'unique:usuario,usuario_correo,' . $usuario->usuario_id . ',usuario_id'],
            'usuario_cuenta' => ['required', 'string', 'max:100', 'unique:usuario,usuario_cuenta,' . $usuario->usuario_id . ',usuario_id'],
            'usuario_estados' => ['required', 'in:A,I'],
        ]);

        $usuario->update($data);

        return redirect()->route('usuario.index')
            ->with('success', 'Usuario actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Usuario $usuario)
    {
        //
    }

    /**
     * Verifica que el usuario actual tenga privilegio ADMINISTRADOR (rolprivilegios_id = 1).
     */
    private function autorizarAdmin(): void
    {
        $userId = Auth::user()->usuario_id;
        $esAdmin = DB::selectOne("
            SELECT COUNT(*) AS total
            FROM rolesxusuarioxprivilegios
            WHERE usuario_id = ? AND rolprivilegios_id = 1
        ", [$userId]);

        if (!$esAdmin || !$esAdmin->total) {
            abort(403, 'No tiene permisos de administrador para esta acción.');
        }
    }
}
