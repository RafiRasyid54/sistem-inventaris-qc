<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlatUkur;
use Carbon\Carbon;

class AlatUkurSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // ==========================================
            // KATEGORI MEKANIK (Sesuai File Excel)
            // ==========================================
            [
                'kode_alat' => '3MMC001',
                'nama_alat' => 'Outside Micrometer',
                'merk' => 'Mitutoyo 104 139',
                'sn' => '66360229',
                'spesifikasi' => '0-100 mm',
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2025, 11, 1),
                'tanggal_kalibrasi_selanjutnya' => Carbon::create(2026, 12, 1),
                'keterangan' => 'Uncertainty : ± 0,01',
            ],
            [
                'kode_alat' => '3MMC002',
                'nama_alat' => 'Outside Micrometer',
                'merk' => 'Mitutoyo 293-240',
                'sn' => '95100904',
                'spesifikasi' => '0-1"',
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2025, 11, 1),
                'tanggal_kalibrasi_selanjutnya' => Carbon::create(2026, 12, 1),
                'keterangan' => null,
            ],
            [
                'kode_alat' => '3MMC003',
                'nama_alat' => 'Outside Micrometer',
                'merk' => 'Mitutoyo 104 140',
                'sn' => '72452612',
                'spesifikasi' => '0-25 mm',
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2025, 11, 1),
                'tanggal_kalibrasi_selanjutnya' => Carbon::create(2026, 12, 1),
                'keterangan' => null,
            ],
            [
                'kode_alat' => '3MMC005',
                'nama_alat' => 'Outside Micrometer',
                'merk' => 'Mitutoyo 103 2060',
                'sn' => '1032060',
                'spesifikasi' => '25-50 mm',
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2025, 11, 1),
                'tanggal_kalibrasi_selanjutnya' => Carbon::create(2026, 12, 1),
                'keterangan' => 'Uncertainty : ± 0,01',
            ],

            // ==========================================
            // KATEGORI ELEKTRIK (Sesuai File Excel)
            // ==========================================
            [
                'kode_alat' => '3MHV01',
                'nama_alat' => 'Alat Uji Tegangan Terapan',
                'merk' => null,
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2018, 12, 1),
                'tanggal_kalibrasi_selanjutnya' => null, // Di excel ditandai "-"
                'keterangan' => 'Good',
            ],
            [
                'kode_alat' => '3MIT001',
                'nama_alat' => 'Alat Test Tahanan Isolasi Digital',
                'merk' => null,
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2018, 12, 1),
                'tanggal_kalibrasi_selanjutnya' => null,
                'keterangan' => 'Good',
            ],
            [
                'kode_alat' => '3MTT002',
                'nama_alat' => 'Alat Uji Pembanding Belitan Trafo',
                'merk' => null,
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2018, 12, 1),
                'tanggal_kalibrasi_selanjutnya' => null,
                'keterangan' => 'Good',
            ],
            [
                'kode_alat' => '3MMT003',
                'nama_alat' => 'Alat Uji Rugi Tembaga/Besi (Losses)',
                'merk' => null,
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2018, 12, 1),
                'tanggal_kalibrasi_selanjutnya' => null,
                'keterangan' => 'Good',
            ],

            // ==========================================
            // KATEGORI SIPIL (Sesuai File Excel)
            // ==========================================
            [
                'kode_alat' => '3SSY001',
                'nama_alat' => 'Lensa',
                'merk' => 'Lensa SOKKIA',
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => null,
                'tanggal_kalibrasi_selanjutnya' => null,
                'keterangan' => null,
            ],
            [
                'kode_alat' => '3SSY002',
                'nama_alat' => 'Total Station Topcon',
                'merk' => 'ES-105/Theodolid',
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2018, 12, 1),
                'tanggal_kalibrasi_selanjutnya' => null,
                'keterangan' => 'Uncertainty : ± 0,001˚',
            ],
            [
                'kode_alat' => '3SSY003',
                'nama_alat' => 'Auto Level Topcon',
                'merk' => 'Topcon AT B2',
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2018, 12, 1),
                'tanggal_kalibrasi_selanjutnya' => null,
                'keterangan' => 'Good',
            ],
            [
                'kode_alat' => '3SSY004',
                'nama_alat' => 'GPS Garmin 62',
                'merk' => 'Garmin',
                'sn' => null,
                'spesifikasi' => null,
                'kondisi' => 'Baik',
                'tanggal_kalibrasi_terakhir' => Carbon::create(2018, 12, 1),
                'tanggal_kalibrasi_selanjutnya' => null,
                'keterangan' => 'Good',
            ],
        ];

        foreach ($data as $item) {
            AlatUkur::firstOrCreate(['kode_alat' => $item['kode_alat']], $item);
        }
    }
}