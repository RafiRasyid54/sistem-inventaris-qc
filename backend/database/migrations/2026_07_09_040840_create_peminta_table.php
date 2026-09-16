<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peminta', function (Blueprint $table) {
            $table->string('id')->primary(); // Berisi nomor unik dari kartu RFID
            $table->string('nama_peminta');
            $table->string('divisi');
            $table->boolean('aktif')->default(true);
            $table->string('role')->default('user');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peminta');
    }
};