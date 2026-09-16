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
        if (!Schema::hasTable('alat_ukur')) {
            Schema::create('alat_ukur', function (Blueprint $table) {
                $table->id();
                $table->string('kode_alat')->unique();
                $table->string('nama_alat');
                $table->string('merk')->nullable();
                $table->string('sn')->nullable();
                $table->string('spesifikasi')->nullable();
                $table->enum('kondisi', ['Baik', 'RPP', 'RT'])->default('Baik');
                $table->date('tanggal_kalibrasi_terakhir')->nullable();
                $table->date('tanggal_kalibrasi_selanjutnya')->nullable();
                $table->text('keterangan')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alat_ukur');
    }
};