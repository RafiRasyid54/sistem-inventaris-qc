<?php

namespace App\Http\Controllers\Api; // <-- Diperbaiki (huruf kecil 'pi') agar tidak error di Linux/Server

use App\Http\Controllers\Controller;
use App\Models\Peminta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PemintaController extends Controller
{
    /**
     * GET /api/peminta
     * Menampilkan semua pekerja (bisa difilter yang aktif saja untuk dropdown)
     */
    public function index(Request $request)
    {
        // Pastikan nama kolom di database nanti adalah 'nama_peminta' ya!
        $query = Peminta::orderBy('nama_peminta');

        if ($request->has('aktif')) {
            $query->where('aktif', $request->boolean('aktif'));
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    /**
     * GET /api/peminta/{id}
     * Menampilkan detail satu pekerja (Berdasarkan Nomor Kartu RFID)
     */
    public function show(string $id)
    {
        $peminta = Peminta::find($id);

        if (!$peminta) {
            return response()->json(['message' => 'Peminta/Pekerja tidak ditemukan'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $peminta
        ]);
    }

    /**
     * POST /api/peminta
     * Mendaftarkan pekerja baru (Tap kartu RFID baru untuk merekam ID-nya)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|string|unique:peminta,id', // <-- Ini adalah Nomor Kartu RFID
            'nama_peminta' => 'required|string|max:255',
            'divisi' => 'required|string|max:255',
            'role' => 'nullable|string|in:user,inventory man', 
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
        // Default role jika tidak diisi adalah 'user' biasa
        if (empty($data['role'])) {
            $data['role'] = 'user';
        }

        // Otomatis aktif saat pertama dibuat
        $data['aktif'] = true;

        $peminta = Peminta::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Pekerja baru berhasil didaftarkan.',
            'data' => $peminta
        ], 201);
    }

    /**
     * PUT/PATCH /api/peminta/{id}
     * Edit data pekerja
     */
    public function update(Request $request, string $id)
    {
        $peminta = Peminta::find($id);

        if (!$peminta) {
            return response()->json(['message' => 'Peminta/Pekerja tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'id' => 'sometimes|string|unique:peminta,id,' . $id,
            'nama_peminta' => 'sometimes|required|string|max:255',
            'divisi' => 'sometimes|required|string|max:255',
            'role' => 'sometimes|required|string|in:user,inventory man',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $peminta->update($validator->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Data pekerja berhasil diperbarui.',
            'data' => $peminta
        ]);
    }

    /**
     * DELETE /api/peminta/{id}
     * Menonaktifkan pekerja (Bukan dihapus permanen agar riwayat alat tidak hilang)
     */
    public function destroy(string $id)
    {
        $peminta = Peminta::find($id);

        if (!$peminta) {
            return response()->json(['message' => 'Peminta/Pekerja tidak ditemukan'], 404);
        }

        $peminta->update(['aktif' => false]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pekerja berhasil dinonaktifkan. Riwayat transaksi lama tetap aman.',
            'data' => $peminta,
        ]);
    }

    /**
     * PATCH /api/peminta/{id}/aktifkan
     * Mengaktifkan kembali pekerja
     */
    public function aktifkan(string $id)
    {
        $peminta = Peminta::find($id);

        if (!$peminta) {
            return response()->json(['message' => 'Peminta/Pekerja tidak ditemukan'], 404);
        }

        $peminta->update(['aktif' => true]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pekerja berhasil diaktifkan kembali.',
            'data' => $peminta,
        ]);
    }
}