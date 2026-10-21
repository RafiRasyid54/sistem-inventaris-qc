<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

class RiwayatKalibrasi extends Model
{
    use HasFactory;

    protected $table = 'riwayat_kalibrasi';

    protected $fillable = [
        'alat_ukur_id',
        'tanggal_kalibrasi',
        'tanggal_jatuh_tempo',
        'kondisi',
        'pelaksana_kalibrasi',
        'keterangan',
        'file_sertifikat',
    ];

    protected $appends = ['file_sertifikat_url'];

    // Link bertanda tangan, berlaku 60 menit sejak data dimuat.
    public function getFileSertifikatUrlAttribute()
    {
        return $this->file_sertifikat
            ? URL::temporarySignedRoute(
                'kalibrasi.sertifikat',
                now()->addMinutes(60),
                ['id' => $this->id]
            )
            : null;
    }

    public function alatUkur()
    {
        return $this->belongsTo(AlatUkur::class, 'alat_ukur_id');
    }
}