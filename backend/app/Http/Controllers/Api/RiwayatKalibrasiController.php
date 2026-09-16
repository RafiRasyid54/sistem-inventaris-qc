<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatKalibrasi;
use App\Models\AlatUkur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RiwayatKalibrasiController extends Controller
{
    /**
     * Menampilkan semua riwayat kalibrasi dari satu alat ukur tertentu.
     */
    public function getByAlatUkur($alat_ukur_id)
    {
        $riwayat = RiwayatKalibrasi::where('alat_ukur_id', $alat_ukur_id)
                    ->orderBy('tanggal_kalibrasi', 'desc')
                    ->get();

        return response()->json([
            'status' => 'success',
            'data' => $riwayat
        ]);
    }

    /**
     * Menyimpan data riwayat kalibrasi baru.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'alat_ukur_id' => 'required|exists:alat_ukur,id',
            'tanggal_kalibrasi' => 'required|date',
            'tanggal_jatuh_tempo' => 'nullable|date',
            'kondisi' => 'required|in:Baik,RPP,RT',
            'pelaksana_kalibrasi' => 'nullable|string',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $riwayat = RiwayatKalibrasi::create($request->all());

        // Update tanggal kalibrasi terakhir & kondisi di tabel master Alat Ukur
        $alat = AlatUkur::find($request->alat_ukur_id);
        $alat->update([
            'tanggal_kalibrasi_terakhir' => $request->tanggal_kalibrasi,
            'tanggal_kalibrasi_selanjutnya' => $request->tanggal_jatuh_tempo,
            'kondisi' => $request->kondisi,
            'keterangan' => $request->keterangan // Update keterangan master (misal: uncertainty)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat kalibrasi berhasil ditambahkan dan master alat diperbarui.',
            'data' => $riwayat
        ], 201);
    }

    /**
     * Memperbarui riwayat kalibrasi tertentu.
     */
    public function update(Request $request, $id)
    {
        $riwayat = RiwayatKalibrasi::find($id);
        
        if (!$riwayat) {
            return response()->json(['message' => 'Riwayat kalibrasi tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal_kalibrasi' => 'date',
            'tanggal_jatuh_tempo' => 'nullable|date',
            'kondisi' => 'in:Baik,RPP,RT',
            'pelaksana_kalibrasi' => 'nullable|string',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $riwayat->update($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat kalibrasi berhasil diperbarui.',
            'data' => $riwayat
        ]);
    }

    /**
     * Menghapus riwayat kalibrasi.
     */
    public function destroy($id)
    {
        $riwayat = RiwayatKalibrasi::find($id);
        
        if (!$riwayat) {
            return response()->json(['message' => 'Riwayat kalibrasi tidak ditemukan.'], 404);
        }

        $riwayat->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat kalibrasi berhasil dihapus.'
        ]);
    }
}