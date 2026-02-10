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
        Schema::table('proceso', function (Blueprint $table) {
            $table->unsignedBigInteger('torre_id')->nullable()->after('depto_id');
            $table->unsignedBigInteger('piso_id')->nullable()->after('torre_id');
            $table->boolean('proceso_multitorre')->default(false)->after('piso_id'); // Si el proceso aplica a múltiples torres
            
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
        Schema::table('proceso', function (Blueprint $table) {
            $table->dropForeign(['torre_id']);
            $table->dropForeign(['piso_id']);
            $table->dropIndex(['torre_id', 'piso_id']);
            $table->dropColumn(['torre_id', 'piso_id', 'proceso_multitorre']);
        });
    }
};
