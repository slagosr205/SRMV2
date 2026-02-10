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
        Schema::create('torres', function (Blueprint $table) {
            $table->id('torre_id');
            $table->string('torre_nombre', 100)->unique();
            $table->text('torre_descripcion')->nullable();
            $table->string('torre_direccion')->nullable();
            $table->integer('torre_cantidad_pisos')->default(0);
            $table->string('torre_coordenadas')->nullable(); // GPS coordinates
            $table->boolean('torre_activo')->default(true);
            $table->timestamps();
            
            $table->index('torre_activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('torres');
    }
};
