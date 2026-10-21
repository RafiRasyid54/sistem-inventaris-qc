<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatKalibrasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RiwayatKalibrasiController extends Controller
{
    private const DISK = 'local'; // privat, tidak bisa diakses lewat URL langsung
    private const DIR  = 'sertifikat_kalibrasi';

    public function index(Request $request)
    {
        $query = RiwayatKalibrasi::with('alatUkur')->latest('tanggal_kalibrasi');

        if ($request->filled('alat_ukur_id')) {
            $query->where('alat_ukur_id', $request->alat_ukur_id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    public function getByAlatUkur($alat_ukur_id)
    {
        $data = RiwayatKalibrasi::with('alatUkur')
            ->where('alat_ukur_id', $alat_ukur_id)
            ->latest('tanggal_kalibrasi')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'alat_ukur_id'        => 'required|exists:alat_ukur,id',
            'tanggal_kalibrasi'   => 'required|date',
            'tanggal_jatuh_tempo' => 'nullable|date',
            'kondisi'             => 'required|in:Baik,RPP,RT',
            'pelaksana_kalibrasi' => 'nullable|string|max:255',
            'keterangan'          => 'nullable|string',
            'file_sertifikat'     => 'nullable|file|mimes:pdf|max:5120', // maks 5 MB
        ]);

        if ($request->hasFile('file_sertifikat')) {
            $validated['file_sertifikat'] = $request->file('file_sertifikat')
                ->store(self::DIR, self::DISK);
        }

        $kalibrasi = RiwayatKalibrasi::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat kalibrasi berhasil ditambahkan',
            'data'    => $kalibrasi->load('alatUkur'),
        ], 201);
    }

    // Untuk update dengan file dari frontend, kirim POST + field _method=PUT
    // (PHP tidak membaca multipart pada request PUT asli).
    public function update(Request $request, $id)
    {
        $kalibrasi = RiwayatKalibrasi::findOrFail($id);

        $validated = $request->validate([
            'alat_ukur_id'        => 'sometimes|required|exists:alat_ukur,id',
            'tanggal_kalibrasi'   => 'sometimes|required|date',
            'tanggal_jatuh_tempo' => 'nullable|date',
            'kondisi'             => 'sometimes|required|in:Baik,RPP,RT',
            'pelaksana_kalibrasi' => 'nullable|string|max:255',
            'keterangan'          => 'nullable|string',
            'file_sertifikat'     => 'nullable|file|mimes:pdf|max:5120',
        ]);

        if ($request->hasFile('file_sertifikat')) {
            if ($kalibrasi->file_sertifikat && Storage::disk(self::DISK)->exists($kalibrasi->file_sertifikat)) {
                Storage::disk(self::DISK)->delete($kalibrasi->file_sertifikat);
            }
            $validated['file_sertifikat'] = $request->file('file_sertifikat')
                ->store(self::DIR, self::DISK);
        }

        $kalibrasi->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat kalibrasi berhasil diperbarui',
            'data'    => $kalibrasi->load('alatUkur'),
        ]);
    }

    public function destroy($id)
    {
        $kalibrasi = RiwayatKalibrasi::findOrFail($id);

        if ($kalibrasi->file_sertifikat && Storage::disk(self::DISK)->exists($kalibrasi->file_sertifikat)) {
            Storage::disk(self::DISK)->delete($kalibrasi->file_sertifikat);
        }

        $kalibrasi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat kalibrasi berhasil dihapus',
        ]);
    }

    // Menampilkan PDF sertifikat. Diakses lewat link bertanda tangan (lihat model + route).
    public function sertifikat($id)
    {
        $kalibrasi = RiwayatKalibrasi::findOrFail($id);

        abort_unless(
            $kalibrasi->file_sertifikat && Storage::disk(self::DISK)->exists($kalibrasi->file_sertifikat),
            404,
            'File sertifikat tidak ditemukan'
        );

        return response()->file(
            Storage::disk(self::DISK)->path($kalibrasi->file_sertifikat),
            [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="sertifikat-kalibrasi-' . $kalibrasi->id . '.pdf"',
            ]
        );
    }
}