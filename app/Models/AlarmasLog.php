<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlarmasLog extends Model
{
    //

    protected $table = 'alarmas_log';
    protected $primaryKey = 'alarma_log_id';

    protected   $fillable = [
    
        'alarma_id',
        'proceso_id',
        'usuario_id',
        'ticket_id',
        'alarma_log_estado',
        'alarma_fecha',        
    ];

        public function proceso()
        {
            return $this->belongsTo(Proceso::class, 'proceso_id');
        }
    
        public function usuario()
        {
            return $this->belongsTo(Usuario::class, 'usuario_id');
        }
    
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

}
