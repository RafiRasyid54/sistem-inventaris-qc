<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlatUkur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AlatUkurController extends Controller
{
    /**
     * GET /api/alat-ukur
     * Tampilkan semua data alat ukur beserta status ketersediaannya saat ini.
     */
    public function index()
    {
        // Kita ambil data alat ukur sekaligus mengecek apakah sedang dipinjam
        $alatUkur = AlatUkur::orderBy('kode_alat')->get()->map(function ($alat) {
            
            // Cek di tabel peminjaman apakah alat ini belum dikembalikan
            $sedangDipinjam = $alat->peminjaman()->whereNull('tanggal_kembali')->first();

            return [
                'id' => $alat->id,
                'kode_alat' => $alat->kode_alat,
                'nama_alat' => $alat->nama_alat,
                'merk' => $alat->merk,
                'sn' => $alat->sn,
                'spesifikasi' => $alat->spesifikasi,
                'kondisi' => $alat->kondisi,
                'tanggal_kalibrasi_terakhir' => $alat->tanggal_kalibrasi_terakhir,
                'tanggal_kalibrasi_selanjutnya' => $alat->tanggal_kalibrasi_selanjutnya,
                'keterangan' => $alat->keterangan,
                // Status tambahan untuk mempermudah frontend
                'status_pinjam' => $sedangDipinjam ? 'Dipinjam' : 'Tersedia',
                'peminjam_saat_ini' => $sedangDipinjam ? $sedangDipinjam->peminta->nama_peminta ?? 'Unknown' : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $alatUkur
        ]);
    }

    /**
     * POST /api/alat-ukur
     * Tambah data alat fisik baru.
     */
    public function store(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'kode_alat' => 'required|string|unique:alat_ukur,kode_alat',
            'nama_alat' => 'required|string',
            'merk' => 'nullable|string',
            'sn' => 'nullable|string',
            'spesifikasi' => 'nullable|string',
            'kondisi' => 'required|in:Baik,RPP,RT',
            'tanggal_kalibrasi_terakhir' => 'nullable|date',
            'tanggal_kalibrasi_selanjutnya' => 'nullable|date',
            'keterangan' => 'nullable|string',
        ]);

        if ($validated->fails()) {
            return response()->json(['errors' => $validated->errors()], 422);
        }

        $alat = AlatUkur::create($validated->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Alat ukur baru berhasil didaftarkan.',
            'data' => $alat
        ], 201);
    }

    /**
     * GET /api/alat-ukur/{id}
     * Tampilkan detail satu alat, termasuk riwayat peminjaman dan kalibrasinya.
     */
    public function show($id)
    {
        // Mengambil alat beserta seluruh riwayat peminjaman (yang terhubung ke Peminta) dan kalibrasinya
        $alat = AlatUkur::with(['peminjaman.peminta', 'riwayatKalibrasi'])->find($id);

        if (!$alat) {
            return response()->json(['message' => 'Alat Ukur tidak ditemukan.'], 404);
        }

        $sedangDipinjam = $alat->peminjaman()->whereNull('tanggal_kembali')->first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'detail_alat' => $alat,
                'status_saat_ini' => $sedangDipinjam ? 'Sedang Dipinjam' : 'Tersedia',
            ]
        ]);
    }

    /**
     * PUT/PATCH /api/alat-ukur/{id}
     * Edit data master alat ukur.
     */
    public function update(Request $request, $id)
    {
        $alat = AlatUkur::find($id);
        
        if (!$alat) {
            return response()->json(['message' => 'Alat Ukur tidak ditemukan.'], 404);
        }

        $validated = Validator::make($request->all(), [
            'kode_alat' => [
                'sometimes',
                'string',
                Rule::unique('alat_ukur', 'kode_alat')->ignore($id),
            ],
            'nama_alat' => 'sometimes|string',
            'merk' => 'nullable|string',
            'sn' => 'nullable|string',
            'spesifikasi' => 'nullable|string',
            'kondisi' => 'sometimes|in:Baik,RPP,RT',
            'tanggal_kalibrasi_terakhir' => 'nullable|date',
            'tanggal_kalibrasi_selanjutnya' => 'nullable|date',
            'keterangan' => 'nullable|string',
        ]);

        if ($validated->fails()) {
            return response()->json(['errors' => $validated->errors()], 422);
        }

        $alat->update($validated->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Data Alat Ukur berhasil diperbarui.',
            'data' => $alat
        ]);
    }

    /**
     * DELETE /api/alat-ukur/{id}
     * Hapus data alat dari sistem.
     */
    public function destroy($id)
    {
        $alat = AlatUkur::find($id);
        
        if (!$alat) {
            return response()->json(['message' => 'Alat Ukur tidak ditemukan.'], 404);
        }

        // Jika dihapus, otomatis terhapus permanen dari database
        $alat->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Alat Ukur berhasil dihapus secara permanen.'
        ]);
    }
}