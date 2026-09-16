<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Peminjaman extends Model
{
    use HasFactory;

    protected $table = 'peminjaman';

    // Kolom-kolom inti untuk scan < 1 menit
    protected $fillable = [
        'alat_ukur_id',
        'peminta_id', // ID pekerja dari kartu RFID
        'pekerjaan_id', 
        'dicatat_oleh', // ID admin yang login
        'tanggal_pinjam',
        'tanggal_kembali',
        'keterangan',
        'catatan_pengembalian'
    ];

    protected $casts = [
        'tanggal_pinjam' => 'datetime',
        'tanggal_kembali' => 'datetime',
    ];

    // Relasi Balik: Transaksi ini meminjam alat apa?
    public function alatUkur()
    {
        return $this->belongsTo(AlatUkur::class, 'alat_ukur_id');
    }

    // Relasi Balik: Siapa pekerja yang pinjam?
    public function peminta()
    {
        return $this->belongsTo(Peminta::class, 'peminta_id');
    }

    // Relasi Balik: Dipinjam untuk proyek/tugas apa?
    public function pekerjaan()
    {
        return $this->belongsTo(Pekerjaan::class, 'pekerjaan_id');
    }

    // Relasi Balik: Admin siapa yang jaga saat itu?
    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}