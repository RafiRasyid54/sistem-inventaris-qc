<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanKerusakanAlatUkur extends Model
{
    use HasFactory;

    protected $table = 'laporan_kerusakan_alat_ukur';

    // Karena menggunakan UUID sebagai primary key
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tanggal',
        'alat_ukur_id',
        'peminjaman_id',
        'status', // bisa_diperbaiki, rusak_permanen, selesai_diperbaiki
        'keterangan',
        'catatan_perbaikan',
        'tanggal_diperbaiki',
        'dilaporkan_oleh'
    ];

    protected $casts = [
        'tanggal' => 'date',
        'tanggal_diperbaiki' => 'datetime',
    ];

    // ==========================================
    // RELASI
    // ==========================================
    public function alatUkur()
    {
        return $this->belongsTo(AlatUkur::class, 'alat_ukur_id');
    }

    public function peminjaman()
    {
        return $this->belongsTo(Peminjaman::class, 'peminjaman_id');
    }

    public function dilaporkanOleh()
    {
        return $this->belongsTo(User::class, 'dilaporkan_oleh');
    }
}