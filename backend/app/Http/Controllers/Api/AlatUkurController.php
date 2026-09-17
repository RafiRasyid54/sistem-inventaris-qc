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
     *
     * Menampilkan semua data alat ukur
     * beserta status ketersediaannya.
     */
    public function index()
{
    $alatUkur = AlatUkur::orderBy('kode_alat')->get();

    return response()->json([
        'status' => 'success',
        'data' => $alatUkur,
    ]);
}

    /**
     * POST /api/alat-ukur
     *
     * Tambah data alat ukur baru.
     */
    public function store(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'kode_alat' => [
                'required',
                'string',
                'unique:alat_ukur,kode_alat',
            ],

            'nama_alat' => [
                'required',
                'string',
            ],

            'merk' => [
                'nullable',
                'string',
            ],

            'sn' => [
                'nullable',
                'string',
            ],

            'spesifikasi' => [
                'nullable',
                'string',
            ],

            'kondisi' => [
                'required',
                'in:Baik,RPP,RT',
            ],

            'tanggal_kalibrasi_terakhir' => [
                'nullable',
                'date',
            ],

            'tanggal_kalibrasi_selanjutnya' => [
                'nullable',
                'date',
            ],

            'keterangan' => [
                'nullable',
                'string',
            ],
        ]);

        if ($validated->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validated->errors(),
            ], 422);
        }

        try {
            $alat = AlatUkur::create(
                $validated->validated()
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Alat ukur baru berhasil didaftarkan.',
                'data' => $alat,
            ], 201);

        } catch (\Throwable $e) {

            \Log::error('Gagal menambahkan alat ukur', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan alat ukur.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    /**
     * GET /api/alat-ukur/{id}
     *
     * Menampilkan detail alat ukur.
     */
    public function show($id)
    {
        try {

            $alat = AlatUkur::with([
                'peminjaman.peminta',
                'riwayatKalibrasi',
            ])->find($id);

            if (!$alat) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Alat Ukur tidak ditemukan.',
                ], 404);
            }

            $sedangDipinjam = null;

            try {
                $sedangDipinjam = $alat
                    ->peminjaman()
                    ->whereNull('tanggal_kembali')
                    ->first();
            } catch (\Throwable $e) {
                $sedangDipinjam = null;
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'detail_alat' => $alat,

                    'status_saat_ini' =>
                        $sedangDipinjam
                            ? 'Sedang Dipinjam'
                            : 'Tersedia',
                ],
            ], 200);

        } catch (\Throwable $e) {

            \Log::error('Gagal mengambil detail alat ukur', [
                'id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil detail alat ukur.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    /**
     * PUT/PATCH /api/alat-ukur/{id}
     *
     * Edit data alat ukur.
     */
    public function update(Request $request, $id)
    {
        $alat = AlatUkur::find($id);

        if (!$alat) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alat Ukur tidak ditemukan.',
            ], 404);
        }

        $validated = Validator::make($request->all(), [

            'kode_alat' => [
                'sometimes',
                'string',
                Rule::unique(
                    'alat_ukur',
                    'kode_alat'
                )->ignore($id),
            ],

            'nama_alat' => [
                'sometimes',
                'string',
            ],

            'merk' => [
                'nullable',
                'string',
            ],

            'sn' => [
                'nullable',
                'string',
            ],

            'spesifikasi' => [
                'nullable',
                'string',
            ],

            'kondisi' => [
                'sometimes',
                'in:Baik,RPP,RT',
            ],

            'tanggal_kalibrasi_terakhir' => [
                'nullable',
                'date',
            ],

            'tanggal_kalibrasi_selanjutnya' => [
                'nullable',
                'date',
            ],

            'keterangan' => [
                'nullable',
                'string',
            ],
        ]);

        if ($validated->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validated->errors(),
            ], 422);
        }

        try {

            $alat->update(
                $validated->validated()
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Data Alat Ukur berhasil diperbarui.',
                'data' => $alat->fresh(),
            ], 200);

        } catch (\Throwable $e) {

            \Log::error('Gagal memperbarui alat ukur', [
                'id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui data alat ukur.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    /**
     * DELETE /api/alat-ukur/{id}
     *
     * Hapus alat ukur.
     */
    public function destroy($id)
    {
        $alat = AlatUkur::find($id);

        if (!$alat) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alat Ukur tidak ditemukan.',
            ], 404);
        }

        try {

            $alat->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Alat Ukur berhasil dihapus secara permanen.',
            ], 200);

        } catch (\Throwable $e) {

            \Log::error('Gagal menghapus alat ukur', [
                'id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus alat ukur.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }
}