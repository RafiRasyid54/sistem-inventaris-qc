<?php

namespace Database\Seeders;

use App\Models\Peminta;
use Illuminate\Database\Seeder;

class PemintaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['id' => '0004112233', 'nama_peminta' => 'Dedi Kurniawan', 'divisi' => 'HL', 'role' => 'inventory man', 'aktif' => true],
            ['id' => '0004112234', 'nama_peminta' => 'Rian Setiawan', 'divisi' => 'MGTI', 'role' => 'inventory man', 'aktif' => true],
            ['id' => '0004112235', 'nama_peminta' => 'Bambang Sutrisno', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112236', 'nama_peminta' => 'Yusuf Hidayat', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112237', 'nama_peminta' => 'Wahyu Prasetyo', 'divisi' => 'MGTI', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112238', 'nama_peminta' => 'Agus Salim', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112239', 'nama_peminta' => 'Fajar Nugroho', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112240', 'nama_peminta' => 'Iwan Setiadi', 'divisi' => 'MGTI', 'role' => 'user', 'aktif' => false],
        ];

        foreach ($data as $item) {
            Peminta::updateOrCreate(['id' => $item['id']], $item);
        }
    }
}