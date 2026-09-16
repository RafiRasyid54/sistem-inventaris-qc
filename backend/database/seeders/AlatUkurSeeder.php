<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlatUkur;
use Carbon\Carbon;

class AlatUkurSeeder extends Seeder
{
    public function run(): void
    {
        AlatUkur::firstOrCreate(['kode_alat' => '3MMC001'], [
            'nama_alat' => 'Outside Micrometer',
            'merk' => 'Mitutoyo',
            'sn' => '66360229',
            'spesifikasi' => '0-100 mm',
            'kondisi' => 'Baik',
            'tanggal_kalibrasi_terakhir' => Carbon::now()->subMonths(6),
            'tanggal_kalibrasi_selanjutnya' => Carbon::now()->addMonths(6),
        ]);

        AlatUkur::firstOrCreate(['kode_alat' => '3MMC002'], [
            'nama_alat' => 'Vernier Caliper',
            'merk' => 'Mitutoyo',
            'sn' => '87654321',
            'spesifikasi' => '0-150 mm',
            'kondisi' => 'Baik',
            'tanggal_kalibrasi_terakhir' => Carbon::now()->subMonths(1),
            'tanggal_kalibrasi_selanjutnya' => Carbon::now()->subDays(2),
        ]);
    }
}