<?php

namespace Database\Seeders;

use App\Models\Peminjaman;
use App\Models\Peminta;
use App\Models\AlatUkur;
use App\Models\User;
use App\Models\Pekerjaan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PeminjamanSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil master data yang sudah kita buat di Seeder sebelumnya
        $pekerja = Peminta::where('role', 'user')->get();
        $petugas = User::first(); // Ambil admin yang sedang jaga
        $pekerjaanList = Pekerjaan::all();
        $alatUkurList = AlatUkur::all();

        // Pastikan master datanya tidak kosong
        if ($pekerja->isEmpty() || !$petugas || $pekerjaanList->isEmpty() || $alatUkurList->isEmpty()) {
            $this->command?->warn('Gagal: Butuh data Peminta, User, Pekerjaan, dan Alat Ukur terlebih dahulu.');
            return;
        }

        // --- SKENARIO 1: Alat sudah dipinjam dan SUDAH DIKEMBALIKAN ---
        Peminjaman::firstOrCreate([
            'alat_ukur_id' => $alatUkurList[0]->id,
            'tanggal_pinjam' => Carbon::now()->subDays(3), // Pinjam 3 hari yang lalu
        ], [
            'peminta_id' => $pekerja[0]->id, // Budi/Rafi
            'pekerjaan_id' => $pekerjaanList[0]->id, // Inspeksi Harian
            'dicatat_oleh' => $petugas->id,
            'tanggal_kembali' => Carbon::now()->subDays(1), // Dikembalikan kemarin
            'keterangan' => 'Pinjam untuk inspeksi shift pagi',
            'catatan_pengembalian' => 'Alat dikembalikan dalam kondisi baik dan bersih'
        ]);

        // --- SKENARIO 2: Alat SEDANG DIPINJAM (Belum kembali) ---
        if (isset($alatUkurList[1]) && isset($pekerja[1]) && isset($pekerjaanList[1])) {
            Peminjaman::firstOrCreate([
                'alat_ukur_id' => $alatUkurList[1]->id,
                'tanggal_pinjam' => Carbon::now()->subHours(5), // Dipinjam 5 jam yang lalu
            ], [
                'peminta_id' => $pekerja[1]->id,
                'pekerjaan_id' => $pekerjaanList[1]->id,
                'dicatat_oleh' => $petugas->id,
                'tanggal_kembali' => null, // KOSONG = Sedang Dipinjam
                'keterangan' => 'Sedang digunakan di line produksi mekanik',
                'catatan_pengembalian' => null
            ]);
        }
    }
}