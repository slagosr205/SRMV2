<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ValorTicket extends Model
{
    //

    protected $table = 'valorticket';

    protected $primaryKey = 'valorticket_id';

    protected   $fillable = [
    
        'valorticket_valor',
        'campo_id',
        'ticket_id',
    ];

    public function campo()
    {
        return $this->belongsTo(Campo::class, 'campo_id');
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    
}
