<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatKalibrasi extends Model
{
    use HasFactory;

    // 1. Tentukan nama tabel secara eksplisit
    protected $table = 'riwayat_kalibrasi';

    // 2. Kolom apa saja yang boleh diisi datanya (sesuai Controller tadi)
    protected $fillable = [
        'alat_ukur_id',
        'tanggal_kalibrasi',
        'tanggal_jatuh_tempo',
        'kondisi', // Baik, RPP, RT
        'pelaksana_kalibrasi',
        'keterangan',
    ];

    // 3. Pastikan format tanggal dibaca sebagai tipe Date oleh sistem
    protected $casts = [
        'tanggal_kalibrasi' => 'date',
        'tanggal_jatuh_tempo' => 'date',
    ];

    /**
     * 4. Relasi ke Alat Ukur
     * Artinya: Setiap 1 baris riwayat kalibrasi ini, adalah milik 1 Alat Ukur.
     */
    public function alatUkur()
    {
        return $this->belongsTo(AlatUkur::class, 'alat_ukur_id');
    }
}