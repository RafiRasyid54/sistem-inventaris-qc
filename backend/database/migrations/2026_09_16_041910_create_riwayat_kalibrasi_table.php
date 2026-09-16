<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riwayat_kalibrasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alat_ukur_id')->constrained('alat_ukur')->onDelete('cascade');
            $table->date('tanggal_kalibrasi');
            $table->date('tanggal_jatuh_tempo')->nullable();
            $table->enum('kondisi', ['Baik', 'RPP', 'RT']);
            $table->string('pelaksana_kalibrasi')->nullable();
            $table->text('keterangan')->nullable(); // Untuk menyimpan info seperti "Uncertainty : ± 0,01"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('riwayat_kalibrasi');
    }
};