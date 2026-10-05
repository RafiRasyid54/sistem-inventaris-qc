<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Peminta extends Model
{
    use HasFactory;

    protected $table = 'peminta';

    // Karena ID kita murni berupa UUID (string), kita matikan auto-increment
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',              // <-- Berisi UUID acak (Bukan RFID lagi)
        'rfid_uid',        // <-- Diisi nomor RFID dari Frontend (Bisa null untuk Vendor)
        'kategori',        // <-- 'Internal' atau 'Vendor'
        'instansi_vendor', // <-- Nama instansi jika kategori = Vendor
        'nama_peminta',    // <-- WAJIB nama_peminta
        'divisi',          // <-- Bisa null untuk Vendor
        'aktif',
        'role',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Selalu pastikan ID terisi UUID jika terlewat dari Controller
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            
            // Default aktif
            if (! isset($model->aktif)) {
                $model->aktif = true;
            }

            // Default role
            if (! isset($model->role)) {
                $model->role = 'user';
            }

            // Default kategori
            if (! isset($model->kategori)) {
                $model->kategori = 'Internal';
            }
        });
    }

    /**
     * Relasi: 1 Peminta/Pekerja bisa melakukan BANYAK transaksi peminjaman
     */
    public function peminjaman(): HasMany
    {
        return $this->hasMany(Peminjaman::class, 'peminta_id');
    }
}