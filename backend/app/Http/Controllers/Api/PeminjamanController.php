<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Peminjaman;
use App\Models\AlatUkur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PeminjamanController extends Controller
{
    /**
     * 1. GET /api/peminjaman
     * Tampilkan semua riwayat peminjaman (Aktif & Selesai)
     */
    public function index()
    {
        $data = Peminjaman::with(['alatUkur', 'peminta', 'pekerjaan', 'dicatatOleh'])
            ->orderBy('tanggal_pinjam', 'desc')
            ->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * 2. GET /api/peminjaman/belum-kembali
     * Tampilkan HANYA alat yang sedang dipinjam saat ini
     */
    public function belumKembali()
    {
        $data = Peminjaman::with(['alatUkur', 'peminta', 'pekerjaan', 'dicatatOleh'])
            ->whereNull('tanggal_kembali')
            ->orderBy('tanggal_pinjam', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'total' => $data->count(),
            'data' => $data
        ]);
    }

    /**
     * 3. POST /api/peminjaman/proses
     * INI ADALAH CORE DARI SISTEM SCAN < 1 MENIT
     */
    public function prosesPeminjaman(Request $request)
    {
        // 1. Validasi Input dari Frontend (Hasil Scan)
        $validator = Validator::make($request->all(), [
            'kode_alat' => 'required|string|exists:alat_ukur,kode_alat', // Dari scan fisik alat
            'peminta_id' => 'required|exists:peminta,id', // Dari scan kartu RFID pekerja
            'pekerjaan_id' => 'required|exists:pekerjaan,id', // Pilihan dropdown
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 2. Cari ID alat berdasarkan kode_alat hasil scan
        $alat = AlatUkur::where('kode_alat', $request->kode_alat)->first();

        // 3. Keamanan: Pastikan alat ini tidak sedang dipinjam orang lain
        $sedangDipinjam = Peminjaman::where('alat_ukur_id', $alat->id)
            ->whereNull('tanggal_kembali')
            ->first();

        if ($sedangDipinjam) {
            return response()->json([
                'status' => 'error',
                'message' => "Gagal: Alat '{$alat->nama_alat}' saat ini sedang dipinjam dan belum dikembalikan!"
            ], 400);
        }

        // 4. Eksekusi Simpan (Langsung tanpa keranjang sementara)
        $peminjaman = Peminjaman::create([
            'alat_ukur_id' => $alat->id,
            'peminta_id' => $request->peminta_id,
            'pekerjaan_id' => $request->pekerjaan_id,
            'dicatat_oleh' => $request->user('sanctum')?->id ?? null, // Mencatat admin yang sedang login
            'tanggal_pinjam' => Carbon::now(),
            'tanggal_kembali' => null, // Karena baru dipinjam
            'keterangan' => $request->keterangan,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Alat berhasil dipinjam!',
            'data' => $peminjaman->load(['alatUkur', 'peminta', 'pekerjaan'])
        ], 201);
    }

    /**
     * 4. PATCH /api/peminjaman/{id}/kembali
     * Proses pengembalian alat ukur
     */
    public function kembali(Request $request, $id)
    {
        $peminjaman = Peminjaman::find($id);

        if (!$peminjaman) {
            return response()->json(['message' => 'Data transaksi tidak ditemukan'], 404);
        }

        if ($peminjaman->tanggal_kembali != null) {
            return response()->json(['message' => 'Alat ini sudah dikembalikan sebelumnya.'], 422);
        }

        // Tandai waktu kembali (detik itu juga)
        $peminjaman->update([
            'tanggal_kembali' => Carbon::now(),
            'catatan_pengembalian' => $request->catatan_pengembalian ?? null
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Alat berhasil dikembalikan!',
            'data' => $peminjaman->load('alatUkur')
        ]);
    }

    /**
     * 5. GET /api/peminjaman/{id}
     * Tampilkan detail satu transaksi
     */
    public function show($id)
    {
        $data = Peminjaman::with(['alatUkur', 'peminta', 'pekerjaan', 'dicatatOleh'])->find($id);

        if (!$data) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * 6. DELETE /api/peminjaman/{id}
     * Hapus riwayat (Opsional, khusus Super Admin)
     */
    public function destroy($id)
    {
        $peminjaman = Peminjaman::find($id);

        if (!$peminjaman) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $peminjaman->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat peminjaman berhasil dihapus'
        ]);
    }
}