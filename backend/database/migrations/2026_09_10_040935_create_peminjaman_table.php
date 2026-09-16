<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peminjaman', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke Master Alat
            $table->foreignId('alat_ukur_id')->constrained('alat_ukur')->onDelete('cascade');
            
            // Relasi ke Pekerja (karena ID Peminta adalah string/RFID)
            $table->string('peminta_id');
            $table->foreign('peminta_id')->references('id')->on('peminta')->onDelete('cascade');
            
            // Relasi ke Pekerjaan
            $table->foreignId('pekerjaan_id')->constrained('pekerjaan')->onDelete('cascade');
            
            // Kolom UUID untuk mencatat user (tanpa foreign key constraint fisik ke users)
            $table->uuid('dicatat_oleh')->nullable();

            $table->dateTime('tanggal_pinjam');
            $table->dateTime('tanggal_kembali')->nullable();
            $table->text('keterangan')->nullable();
            $table->text('catatan_pengembalian')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peminjaman');
    }
};