<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riwayat_kalibrasi', function (Blueprint $table) {
            $table->id(); // ID riwayat kalibrasi tetap biarkan begini tidak apa-apa
            
            // UBAH BAGIAN INI MENJADI UUID:
            $table->uuid('alat_ukur_id');
            $table->foreign('alat_ukur_id')->references('id')->on('alat_ukur')->onDelete('cascade');
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