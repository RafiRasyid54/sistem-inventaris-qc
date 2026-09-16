<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlatUkur;
use App\Models\Peminjaman;
use App\Models\Peminta;
use App\Models\Pekerjaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * 1. GET /api/dashboard/summary
     * Menampilkan angka ringkasan utama di bagian atas Dashboard.
     */
    public function summary()
    {
        // Menghitung alat yang batas kalibrasinya kurang dari 30 hari lagi (atau sudah lewat)
        $kalibrasiMendekati = AlatUkur::where('tanggal_kalibrasi_selanjutnya', '<=', Carbon::now()->addDays(30))
                                      ->orWhereNull('tanggal_kalibrasi_selanjutnya')
                                      ->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_alat_ukur' => AlatUkur::count(),
                'sedang_dipinjam' => Peminjaman::whereNull('tanggal_kembali')->count(),
                'total_peminta_aktif' => Peminta::where('aktif', true)->count(),
                'total_pekerjaan_aktif' => Pekerjaan::where('is_active', true)->count(),
                'peringatan_kalibrasi' => $kalibrasiMendekati, // Angka merah untuk peringatan QC
            ]
        ]);
    }

    /**
     * 2. GET /api/dashboard/kalibrasi-mendekati
     * Pengganti "stok menipis". Menampilkan daftar alat yang butuh kalibrasi secepatnya.
     */
    public function kalibrasiMendekati()
    {
        $data = AlatUkur::where('tanggal_kalibrasi_selanjutnya', '<=', Carbon::now()->addDays(30))
                    ->orderBy('tanggal_kalibrasi_selanjutnya', 'asc')
                    ->limit(5)
                    ->get(['id', 'kode_alat', 'nama_alat', 'sn', 'tanggal_kalibrasi_selanjutnya']);

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * 3. GET /api/dashboard/telat-kembali
     * Menampilkan daftar alat yang belum dikembalikan lebih dari 3 hari.
     */
    public function telatKembali()
    {
        $batasHari = 3; // Ubah sesuai kebijakan perusahaan (misal telat jika lebih dari 3 hari)

        $data = Peminjaman::with(['alatUkur', 'peminta'])
            ->whereNull('tanggal_kembali')
            ->where('tanggal_pinjam', '<', Carbon::now()->subDays($batasHari))
            ->orderBy('tanggal_pinjam', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'kode_alat' => $p->alatUkur->kode_alat ?? '-',
                    'nama_alat' => $p->alatUkur->nama_alat ?? '-',
                    'nama_peminjam' => $p->peminta->nama_peminta ?? '-',
                    'tanggal_pinjam' => $p->tanggal_pinjam,
                    'hari_terlambat' => (int) floor(abs(Carbon::now()->diffInDays($p->tanggal_pinjam))),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * 4. GET /api/dashboard/alat-terpopuler
     * Menampilkan alat yang paling sering dipinjam.
     */
    public function alatTerpopuler()
    {
        $data = Peminjaman::select('alat_ukur_id', DB::raw('COUNT(*) as total_transaksi'))
            ->groupBy('alat_ukur_id')
            ->orderByDesc('total_transaksi')
            ->limit(5)
            ->with('alatUkur:id,kode_alat,nama_alat,merk,sn')
            ->get()
            ->map(function ($row) {
                return [
                    'kode_alat' => $row->alatUkur->kode_alat ?? '-',
                    'nama_alat' => $row->alatUkur->nama_alat ?? '-',
                    'merk' => $row->alatUkur->merk ?? '-',
                    'sn' => $row->alatUkur->sn ?? '-',
                    'total_dipinjam' => $row->total_transaksi, // Karena 1 resi = 1 alat fisik
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * 5. GET /api/dashboard/aktivitas-terbaru
     * Menggabungkan log peminjaman dan pengembalian terbaru secara real-time.
     */
    public function aktivitasTerbaru()
    {
        // 5 Peminjaman terakhir
        $peminjaman = Peminjaman::with(['alatUkur', 'peminta'])
            ->latest('tanggal_pinjam')
            ->limit(5)
            ->get()
            ->map(function ($p) {
                $namaAlat = $p->alatUkur->nama_alat ?? 'Alat';
                $namaPeminta = $p->peminta->nama_peminta ?? 'Seseorang';
                return [
                    'jenis' => 'Peminjaman',
                    'deskripsi' => "{$namaPeminta} meminjam {$namaAlat}",
                    'waktu' => $p->tanggal_pinjam,
                ];
            });

        // 5 Pengembalian terakhir
        $pengembalian = Peminjaman::with(['alatUkur', 'peminta'])
            ->whereNotNull('tanggal_kembali')
            ->latest('tanggal_kembali')
            ->limit(5)
            ->get()
            ->map(function ($p) {
                $namaAlat = $p->alatUkur->nama_alat ?? 'Alat';
                $namaPeminta = $p->peminta->nama_peminta ?? 'Seseorang';
                return [
                    'jenis' => 'Pengembalian',
                    'deskripsi' => "{$namaPeminta} mengembalikan {$namaAlat}",
                    'waktu' => $p->tanggal_kembali,
                ];
            });

        // Gabungkan dan urutkan berdasarkan waktu paling baru
        $gabungan = $peminjaman->concat($pengembalian)
            ->sortByDesc('waktu')
            ->take(8)
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => $gabungan
        ]);
    }

    /**
     * 6. GET /api/dashboard/tren-peminjaman
     * Grafik tren peminjaman alat selama 30 hari terakhir.
     */
    public function trenPeminjaman()
    {
        $data = Peminjaman::select(
                DB::raw('DATE(tanggal_pinjam) as tanggal'),
                DB::raw('COUNT(*) as total')
            )
            ->where('tanggal_pinjam', '>=', Carbon::now()->subDays(30))
            ->groupBy(DB::raw('DATE(tanggal_pinjam)'))
            ->orderBy('tanggal', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
}