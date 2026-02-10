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
        Schema::create('pisos', function (Blueprint $table) {
            $table->id('piso_id');
            $table->unsignedBigInteger('torre_id');
            $table->string('piso_nombre', 50); // Ej: "Piso 1", "Sótano", "Azotea"
            $table->integer('piso_numero')->nullable(); // Número del piso (1, 2, 3, etc.)
            $table->text('piso_descripcion')->nullable();
            $table->boolean('piso_activo')->default(true);
            $table->timestamps();
            
            $table->foreign('torre_id')->references('torre_id')->on('torres')->onDelete('cascade');
            $table->index(['torre_id', 'piso_activo']);
            $table->unique(['torre_id', 'piso_numero']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pisos');
    }
};
