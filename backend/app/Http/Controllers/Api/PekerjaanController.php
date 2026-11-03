<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pekerjaan;
use Illuminate\Http\Request;

class PekerjaanController extends Controller
{
    // Mengambil semua data pekerjaan (untuk halaman manajemen)
    public function index()
    {
        $pekerjaan = Pekerjaan::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $pekerjaan
        ]);
    }

    // Mengambil khusus pekerjaan yang aktif (untuk dropdown peminjaman)
    public function getActive()
    {
        $pekerjaan = Pekerjaan::where('is_active', true)->orderBy('nama_pekerjaan', 'asc')->get();
        return response()->json([
            'success' => true,
            'data' => $pekerjaan
        ]);
    }

    // Menyimpan pekerjaan baru (admin saja)
    public function store(Request $request)
    {
        abort_unless($request->user()->hasRole('admin'), 403, 'Anda tidak memiliki akses untuk aksi ini.');

        $request->validate([
            'nama_pekerjaan' => 'required|string|max:255|unique:pekerjaan,nama_pekerjaan',
        ]);

        $pekerjaan = Pekerjaan::create([
            'nama_pekerjaan' => $request->nama_pekerjaan,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pekerjaan berhasil ditambahkan',
            'data' => $pekerjaan
        ], 201);
    }

    // Mengubah data pekerjaan (admin saja)
    public function update(Request $request, $id)
    {
        abort_unless($request->user()->hasRole('admin'), 403, 'Anda tidak memiliki akses untuk aksi ini.');

        $pekerjaan = Pekerjaan::find($id);

        if (!$pekerjaan) {
            return response()->json([
                'success' => false,
                'message' => 'Pekerjaan tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'nama_pekerjaan' => 'required|string|max:255|unique:pekerjaan,nama_pekerjaan,' . $id,
        ]);

        $pekerjaan->update([
            'nama_pekerjaan' => $request->nama_pekerjaan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pekerjaan berhasil diperbarui',
            'data' => $pekerjaan
        ]);
    }

    // Toggle Status Aktif / Nonaktif (admin saja)
    public function toggleStatus(Request $request, $id)
    {
        abort_unless($request->user()->hasRole('admin'), 403, 'Anda tidak memiliki akses untuk aksi ini.');

        $pekerjaan = Pekerjaan::find($id);

        if (!$pekerjaan) {
            return response()->json([
                'success' => false,
                'message' => 'Pekerjaan tidak ditemukan'
            ], 404);
        }

        $pekerjaan->is_active = !$pekerjaan->is_active;
        $pekerjaan->save();

        return response()->json([
            'success' => true,
            'message' => 'Status pekerjaan berhasil diubah',
            'data' => $pekerjaan
        ]);
    }

    // Menghapus data pekerjaan (admin saja)
    public function destroy(Request $request, $id)
    {
        abort_unless($request->user()->hasRole('admin'), 403, 'Anda tidak memiliki akses untuk aksi ini.');

        $pekerjaan = Pekerjaan::find($id);

        if (!$pekerjaan) {
            return response()->json([
                'success' => false,
                'message' => 'Pekerjaan tidak ditemukan'
            ], 404);
        }

        $pekerjaan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pekerjaan berhasil dihapus'
        ]);
    }
}