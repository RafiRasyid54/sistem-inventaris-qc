<?php

namespace Database\Seeders;

use App\Models\Peminta;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PemintaSeeder extends Seeder
{
    public function run(): void
    {
        // Data pegawai PLN Pusharlis UP2W III (Agustus 2026): 75 orang.
        // rfid_uid dikosongkan karena tidak ada di data sumber, isi nanti lewat halaman Peminta.
        $data = [
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ahmad Arif Amrul Bahtiyar', 'kategori' => 'Internal', 'divisi' => 'MANAGER', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Jajat Sudrajat', 'kategori' => 'Internal', 'divisi' => null, 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Muchtar Buchori', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Yudha Syafe\'i Agustian', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Bagus Sanjaya', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI QC', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Andreas Widha Puspita', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Firman Sidik', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Mohammad Andriansyah', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Rismat Rismawan', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Fanji Ahmad S', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Yusron Syahrul Fiqron', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Muhamad Arif Munandar', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Arif Rinaldy', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Agus Rohimat', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI MEKANIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dwi Purnomo', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI ELEKTRIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Bambang Slamet R', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI ELEKTRIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Agus Irwan Faisol R', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI ELEKTRIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ary Sugiarto', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI ELEKTRIKAL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Yohanes Silaban', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI PERENCANAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Apriyanto Dwi Wardoyo', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI PERENCANAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dicky Okta G', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI PERENCANAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Hadinul Gunawan', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI PERENCANAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Nazmuddin F', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI PERENCANAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ariono Verdianto', 'kategori' => 'Internal', 'divisi' => 'PRODUKSI PERENCANAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Hadi Iffendi', 'kategori' => 'Internal', 'divisi' => 'KU', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Delis Syafaraya', 'kategori' => 'Internal', 'divisi' => 'KU', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Risma Lismiati', 'kategori' => 'Internal', 'divisi' => 'KU', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Teta Manggala Putera', 'kategori' => 'Internal', 'divisi' => 'KU', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ani Pridahari', 'kategori' => 'Internal', 'divisi' => 'KU', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Aar Armenda', 'kategori' => 'Internal', 'divisi' => 'LAKS DAN PENGADAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ari Sandi Pertama Putra', 'kategori' => 'Internal', 'divisi' => 'LAKS DAN PENGADAAN', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Hariron Febri Suseki', 'kategori' => 'Internal', 'divisi' => 'K3L DAN KAM', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Rudi Hermawan', 'kategori' => 'Internal', 'divisi' => 'OPERATOR PT HPI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Agus Burhanudin', 'kategori' => 'Internal', 'divisi' => 'OPERATOR PT HPI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Herman Hermawan', 'kategori' => 'Internal', 'divisi' => 'OPERATOR PT HPI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ari Pebriyana', 'kategori' => 'Internal', 'divisi' => 'OPERATOR PT HPI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Febriyan Alif Eka', 'kategori' => 'Internal', 'divisi' => 'OPERATOR PT HPI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Saripudin', 'kategori' => 'Internal', 'divisi' => 'OPERATOR PT HPI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Bahtiar', 'kategori' => 'Internal', 'divisi' => 'OPERATOR PT HPI', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'M. Rizky Ammar', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Sandi Juliana', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Endang Rustiawan', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dicky Yusup Wahyudi', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dadan', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Syarif Hidayat', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ajang Juhana', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Indra Hafifudin', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Aldi Mukhlis Aripin', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Kiki Sandi', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dede Koswara', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Taufik Sofi Hamdani', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Genta Kurnia', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Kindarna', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Lutfi Habibu', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Sarno', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Khalid Ramadhan Ruhiyat', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Ilham Nuryandi', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Rangga Fahmi Apriansyah', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Aji Sidik Setiadi', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dadang Moch Syam', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Diki Ambara', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Rizal Mochammad Furqon', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Abdul Aziz Muslim', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Riswandi Sutrisna', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'M Daezan', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Alan Muhamad Jailani', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Edi Supardi', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Jaka Yudha Pamungkas', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dian Widiana', 'kategori' => 'Internal', 'divisi' => 'PL', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Haris Maulana', 'kategori' => 'Internal', 'divisi' => 'UJPK', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Teguh Imam Prayoga', 'kategori' => 'Internal', 'divisi' => 'UJPK', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Witarja', 'kategori' => 'Internal', 'divisi' => 'PL (SEMENTARA)', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Awaldi Rizki', 'kategori' => 'Internal', 'divisi' => 'PL (SEMENTARA)', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Dhiyan Hidayat', 'kategori' => 'Internal', 'divisi' => 'PL (SEMENTARA)', 'role' => 'user', 'aktif' => true],
            ['id' => Str::uuid()->toString(), 'rfid_uid' => null, 'nama_peminta' => 'Asep', 'kategori' => 'Internal', 'divisi' => 'PL (SEMENTARA)', 'role' => 'user', 'aktif' => true],
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