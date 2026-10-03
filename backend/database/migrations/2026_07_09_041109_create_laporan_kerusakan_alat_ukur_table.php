<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_kerusakan_alat_ukur', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('tanggal');
            
            $table->uuid('alat_ukur_id');
            $table->uuid('peminjaman_id')->nullable();

            $table->enum('status', ['bisa_diperbaiki', 'rusak_permanen', 'selesai_diperbaiki'])->default('bisa_diperbaiki');
            $table->text('keterangan')->nullable();
            $table->text('catatan_perbaikan')->nullable();
            $table->dateTime('tanggal_diperbaiki')->nullable();
            
            $table->uuid('dilaporkan_oleh');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_kerusakan_alat_ukur');
    }
};