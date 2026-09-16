<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlatUkur extends Model
{
    use HasFactory;

    protected $table = 'alat_ukur'; // Menyesuaikan nama tabel di database

    protected $fillable = [
        'kode_alat',
        'nama_alat',
        'merk',
        'sn',
        'spesifikasi',
        'kondisi', // Baik, RPP, RT
        'tanggal_kalibrasi_terakhir',
        'tanggal_kalibrasi_selanjutnya',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_kalibrasi_terakhir' => 'date',
        'tanggal_kalibrasi_selanjutnya' => 'date',
    ];

    // Relasi: 1 Alat punya BANYAK Riwayat Kalibrasi
    public function riwayatKalibrasi()
    {
        return $this->hasMany(RiwayatKalibrasi::class, 'alat_ukur_id')->orderBy('tanggal_kalibrasi', 'desc');
    }

    // Relasi: 1 Alat bisa DIPINJAM berkali-kali (Riwayat Peminjaman)
    public function peminjaman()
    {
        return $this->hasMany(Peminjaman::class, 'alat_ukur_id')->orderBy('tanggal_pinjam', 'desc');
    }
}