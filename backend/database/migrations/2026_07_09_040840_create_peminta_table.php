<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peminta', function (Blueprint $table) {
            // 1. Ubah Primary Key menjadi UUID (atau $table->id() jika ingin angka berurutan)
            $table->uuid('id')->primary(); 

            // 2. Pindahkan data RFID ke kolom terpisah yang boleh kosong
            $table->string('rfid_uid')->nullable()->unique(); 

            $table->string('nama_peminta');

            // 3. Tambahkan pembeda kategori
            $table->enum('kategori', ['Internal', 'Vendor'])->default('Internal');
            
            // 4. Tambahan khusus vendor
            $table->string('instansi_vendor')->nullable();

            // 5. Ubah divisi menjadi nullable (karena vendor tidak punya divisi internal PLN)
            $table->string('divisi')->nullable(); 

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