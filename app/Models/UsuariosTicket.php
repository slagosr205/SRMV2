<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsuariosTicket extends Model
{
    //

    protected $table = 'usuarios_ticket';

    protected $primaryKey = 'usuariosticket_id';

    protected $fillable = [
        'usuario_id',
        'ticket_id',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }
}
