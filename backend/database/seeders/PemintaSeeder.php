<?php

namespace Database\Seeders;

use App\Models\Peminta;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PemintaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112233', 'nama_peminta' => 'Dedi Kurniawan', 'kategori' => 'Internal', 'divisi' => 'HL', 'role' => 'inventory man', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112234', 'nama_peminta' => 'Rian Setiawan', 'kategori' => 'Internal', 'divisi' => 'MGTI', 'role' => 'inventory man', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112235', 'nama_peminta' => 'Bambang Sutrisno', 'kategori' => 'Internal', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112236', 'nama_peminta' => 'Yusuf Hidayat', 'kategori' => 'Internal', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112237', 'nama_peminta' => 'Wahyu Prasetyo', 'kategori' => 'Internal', 'divisi' => 'MGTI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112238', 'nama_peminta' => 'Agus Salim', 'kategori' => 'Internal', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112239', 'nama_peminta' => 'Fajar Nugroho', 'kategori' => 'Internal', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => '0004112240', 'nama_peminta' => 'Iwan Setiadi', 'kategori' => 'Internal', 'divisi' => 'MGTI', 'role' => 'user', 'aktif' => false],
            
            // Tambahan contoh data Vendor
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'PT Maju Jaya (Vendor)', 'kategori' => 'Vendor', 'divisi' => null, 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'CV Inti Teknik (Vendor)', 'kategori' => 'Vendor', 'divisi' => null, 'role' => 'user', 'aktif' => true],
        ];

        foreach ($data as $item) {
            // Menggunakan 'nama_peminta' sebagai acuan pencarian agar UUID tidak menyebabkan error
            Peminta::updateOrCreate(
                ['nama_peminta' => $item['nama_peminta']], 
                $item
            );
        }
    }
}