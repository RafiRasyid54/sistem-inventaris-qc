<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlatUkur extends Model
{
    use HasFactory;

    protected $table = 'alat_ukur'; // Menyesuaikan nama tabel di database

    // Konfigurasi Primary Key UUID (jika migrasi menggunakan string/uuid)
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'kode_alat',
        'nama_alat',
        'kategori',
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

    // Otomatis menyertakan status peminjaman pada respons JSON API
    protected $appends = ['status_peminjaman'];

    /**
     * Accessor untuk mengecek status peminjaman aktif secara real-time.
     */
    public function getStatusPeminjamanAttribute()
    {
        // Cek apakah ada relasi peminjaman yang belum dikembalikan (tanggal_kembali masih null)
        $sedangDipinjam = $this->peminjaman()
            ->whereNull('tanggal_kembali')
            ->exists();

        return $sedangDipinjam ? 'Dipinjam' : 'Tersedia';
    }

    // ==========================================
    // RELASI ELOQUENT
    // ==========================================

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