<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ticket', function (Blueprint $table) {
            $table->unsignedBigInteger('torre_id')->nullable()->after('subtipoticket_id');
            $table->unsignedBigInteger('piso_id')->nullable()->after('torre_id');
            $table->string('ticket_ubicacion_detallada')->nullable()->after('piso_id'); // Ej: "Oficina 203", "Área de Servicios"
            
            $table->foreign('torre_id')->references('torre_id')->on('torres')->onDelete('set null');
            $table->foreign('piso_id')->references('piso_id')->on('pisos')->onDelete('set null');
            
            $table->index(['torre_id', 'piso_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket', function (Blueprint $table) {
            $table->dropForeign(['torre_id']);
            $table->dropForeign(['piso_id']);
            $table->dropIndex(['torre_id', 'piso_id']);
            $table->dropColumn(['torre_id', 'piso_id', 'ticket_ubicacion_detallada']);
        });
    }
};
