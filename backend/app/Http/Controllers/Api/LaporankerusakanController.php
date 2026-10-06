<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LaporanKerusakanAlatUkur;
use App\Models\AlatUkur;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LaporanKerusakanController extends Controller
{
    public function index()
    {
        return response()->json(
            LaporanKerusakanAlatUkur::with(['alatUkur', 'dilaporkanOleh', 'peminjaman.peminta'])
                ->orderBy('tanggal', 'desc')
                ->get()
        );
    }

    public function show(string $id)
    {
        $data = LaporanKerusakanAlatUkur::with(['alatUkur', 'dilaporkanOleh'])->find($id);

        if (! $data) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    // POST /api/laporan-kerusakan
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'alat_ukur_id' => 'required|uuid|exists:alat_ukur,id', 
            'peminjaman_id' => 'nullable|uuid|exists:peminjaman,id',
            'jumlah' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
            'status' => 'required|in:bisa_diperbaiki,rusak_permanen',
            'dilaporkan_oleh' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        try {
            $laporan = DB::transaction(function () use ($data) {
                $data['id'] = (string) Str::uuid();
                return LaporanKerusakanAlatUkur::create($data); 
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($laporan, 201);
    }

    // PUT/PATCH /api/laporan-kerusakan/{id}
    public function update(Request $request, string $id)
    {
        $laporan = LaporanKerusakanAlatUkur::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'sometimes|required|date',
            'jumlah' => 'sometimes|required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        try {
            $laporan = DB::transaction(function () use ($laporan, $data) {
                // Logika cek stok dihapus karena setiap alat ukur adalah unit unik
                $laporan->update($data);
                return $laporan;
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($laporan->load('alatUkur'));
    }

    // DELETE 
    public function destroy(string $id)
    {
        $laporan = LaporanKerusakanAlatUkur::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($laporan) {
            // Logika pengembalian stok dihapus
            $laporan->delete();
        });

        return response()->json(['message' => 'Laporan kerusakan berhasil dihapus']);
    }

    // PATCH /api/laporan-kerusakan/{id}/repair
    public function repair(Request $request, string $id)
    {
        $laporan = LaporanKerusakanAlatUkur::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        if ($laporan->status !== 'bisa_diperbaiki') {
            return response()->json([
                'message' => 'Laporan dengan status Rusak Permanen tidak bisa diproses repair.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'catatan_perbaikan' => 'nullable|string',
            'tingkat_kerusakan' => 'nullable|in:ringan,berat',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validatedRepair = $validator->validated();
        $catatanPerbaikan = $validatedRepair['catatan_perbaikan'] ?? null;
        $tingkatKerusakan = $validatedRepair['tingkat_kerusakan'] ?? null;

        $laporan = DB::transaction(function () use ($laporan, $catatanPerbaikan, $tingkatKerusakan) {
            
            $alatUkur = AlatUkur::find($laporan->alat_ukur_id);

            if ($alatUkur) {
                // Set flag wajib kalibrasi (tanpa menambah stok)
                $alatUkur->kondisi = 'Baik'; 
                $alatUkur->tanggal_kalibrasi_terakhir = null; 
                $alatUkur->tanggal_kalibrasi_selanjutnya = null;
                $alatUkur->keterangan = "Baru diperbaiki (" . now()->format('Y-m-d') . "). WAJIB KALIBRASI ULANG sebelum dipinjam. Catatan: " . $catatanPerbaikan;
                
                $alatUkur->save();
            }

            $perbaikanKe = null;
            if ($tingkatKerusakan !== 'ringan') {
                $perbaikanKe = LaporanKerusakanAlatUkur::where('alat_ukur_id', $laporan->alat_ukur_id)
                    ->where('status', 'selesai_diperbaiki')
                    ->where(function ($q) {
                        $q->whereNull('tingkat_kerusakan')->orWhere('tingkat_kerusakan', 'berat');
                    })
                    ->count() + 1;
            }

            $laporan->update([
                'status' => 'selesai_diperbaiki',
                'tanggal_diperbaiki' => now(),
                'catatan_perbaikan' => $catatanPerbaikan,
                'tingkat_kerusakan' => $tingkatKerusakan,
                'perbaikan_ke' => $perbaikanKe,
            ]);

            return $laporan;
        });

        return response()->json([
            'message' => 'Alat berhasil ditandai selesai diperbaiki dan di-flag wajib kalibrasi.',
            'data' => $laporan->load('alatUkur'),
        ]);
    }

    // PATCH /api/laporan-kerusakan/{id}/tandai-permanen
    public function tandaiPermanen(string $id)
    {
        $laporan = LaporanKerusakanAlatUkur::find($id);

        if (! $laporan) {
            return response()->json(['message' => 'Data laporan kerusakan tidak ditemukan'], 404);
        }

        if ($laporan->status !== 'bisa_diperbaiki') {
            return response()->json([
                'message' => 'Laporan ini sudah berstatus Rusak Permanen.',
            ], 422);
        }

        $laporan->update(['status' => 'rusak_permanen']);

        return response()->json([
            'message' => 'Laporan berhasil ditandai sebagai Rusak Permanen.',
            'data' => $laporan->load('alatUkur'),
        ]);
    }
}