<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'userPrivileges' => $this->getUserPrivileges($request),
        ];
    }

    /**
     * Obtiene los privilegios_id del usuario autenticado.
     * Cadena: usuario → rolesxusuarioxprivilegios → rolprivilegios → privilegiosxroles → privilegios
     *
     * @return int[]
     */
    private function getUserPrivileges(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $userId = $request->user()->usuario_id;

        $rows = DB::select("
            SELECT DISTINCT p.privilegios_id
            FROM privilegios p
            INNER JOIN privilegiosxroles pxr ON pxr.privilegios_id = p.privilegios_id
            INNER JOIN rolprivilegios rp ON rp.rolprivilegios_id = pxr.rolprivilegios_id
            INNER JOIN rolesxusuarioxprivilegios rxup ON rxup.rolprivilegios_id = rp.rolprivilegios_id
            WHERE rxup.usuario_id = ?
        ", [$userId]);

        return array_map(fn ($row) => (int) $row->privilegios_id, $rows);
    }
}
