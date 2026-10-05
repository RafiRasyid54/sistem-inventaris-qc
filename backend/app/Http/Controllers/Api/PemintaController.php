<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Peminta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str; // <-- Tambahkan ini untuk generate UUID

class PemintaController extends Controller
{
    /**
     * GET /api/peminta
     * Menampilkan semua peminjam (bisa difilter yang aktif saja)
     */
    public function index(Request $request)
    {
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
     * Menampilkan detail satu peminjam (Berdasarkan UUID)
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
     * Mendaftarkan peminjam baru (Pegawai Internal atau Vendor)
     */
    public function store(Request $request)
    {
        // 1. Ubah string kosong dari Frontend menjadi null agar tidak error validasi
        if (empty($request->rfid_uid)) {
            $request->merge(['rfid_uid' => null]);
        }
        if (empty($request->divisi)) {
            $request->merge(['divisi' => null]);
        }

        $validator = Validator::make($request->all(), [
            'nama_peminta' => 'required|string|max:255',
            'kategori' => 'required|in:Internal,Vendor',
            'rfid_uid' => 'required_if:kategori,Internal|nullable|string|unique:peminta,rfid_uid',
            'divisi' => 'required_if:kategori,Internal|nullable|string|max:255',
            'role' => 'nullable|string|in:user,inventory man', 
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['id'] = Str::uuid()->toString();

        if (empty($data['role'])) {
            $data['role'] = 'user';
        }

        // Pembersihan Data tambahan
        if ($data['kategori'] === 'Vendor') {
            $data['rfid_uid'] = null; 
            $data['divisi'] = null;
            $data['role'] = 'user'; 
        } 

        $data['aktif'] = true;

        $peminta = Peminta::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Data peminjam baru berhasil didaftarkan.',
            'data' => $peminta
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $peminta = Peminta::find($id);

        if (!$peminta) {
            return response()->json(['message' => 'Peminta/Pekerja tidak ditemukan'], 404);
        }

        // 1. Ubah string kosong dari Frontend menjadi null
        if (empty($request->rfid_uid)) {
            $request->merge(['rfid_uid' => null]);
        }
        if (empty($request->divisi)) {
            $request->merge(['divisi' => null]);
        }

        $validator = Validator::make($request->all(), [
            'nama_peminta' => 'sometimes|required|string|max:255',
            'kategori' => 'sometimes|required|in:Internal,Vendor',
            'rfid_uid' => 'nullable|string|unique:peminta,rfid_uid,' . $id,
            'divisi' => 'nullable|string|max:255',
            'role' => 'sometimes|required|string|in:user,inventory man',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $kategori = $data['kategori'] ?? $peminta->kategori;

        // Pembersihan Data
        if ($kategori === 'Vendor') {
            $data['rfid_uid'] = null;
            $data['divisi'] = null;
            $data['role'] = 'user';
        } else {
            if (empty($data['rfid_uid']) && empty($peminta->rfid_uid)) {
                return response()->json(['errors' => ['rfid_uid' => ['RFID UID wajib diisi untuk kategori Internal']]], 422);
            }
        }

        $peminta->update($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Data peminjam berhasil diperbarui.',
            'data' => $peminta
        ]);
    }

    /**
     * DELETE /api/peminta/{id}
     * Menonaktifkan peminjam
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
            'message' => 'Peminjam berhasil dinonaktifkan.',
            'data' => $peminta,
        ]);
    }

    /**
     * PATCH /api/peminta/{id}/aktifkan
     * Mengaktifkan kembali peminjam
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
            'message' => 'Peminjam berhasil diaktifkan kembali.',
            'data' => $peminta,
        ]);
    }
}