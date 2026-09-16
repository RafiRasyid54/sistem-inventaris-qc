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

    // Karena ID kita bisa berupa nomor RFID (string) atau UUID, kita matikan auto-increment
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', // <-- Diisi nomor RFID dari Frontend
        'nama_peminta', // <-- WAJIB nama_peminta, jangan nama
        'divisi',
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
            // Jika id kosong (pekerja didaftarkan manual tanpa tap kartu RFID),
            // maka Laravel otomatis membuatkan UUID acak.
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