<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Controller Imports ---
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AlatUkurController;
use App\Http\Controllers\Api\PeminjamanController;
use App\Http\Controllers\Api\RiwayatKalibrasiController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\DashboardController;

// ==========================================
// 1. ROUTE PUBLIK
// ==========================================

Route::post('/login', [AuthController::class, 'login']);


// ==========================================
// 2. ROUTE TEST AUTH SANCTUM
// ==========================================
// HANYA UNTUK DEBUGGING
// Hapus route ini setelah masalah Sanctum selesai.

Route::get('/test-auth', function (Request $request) {
    return response()->json([
        'authenticated' => $request->user() !== null,
        'user' => $request->user(),
        'token_received' => $request->bearerToken() !== null,
        'token_prefix' => $request->bearerToken()
            ? substr($request->bearerToken(), 0, 3) . '...'
            : null,
    ]);
});


// ==========================================
// 3. ROUTE TERLINDUNG
// WAJIB MENGGUNAKAN TOKEN SANCTUM
// ==========================================

Route::middleware('auth:sanctum')->group(function () {

    // ==========================================
    // A. GENERAL
    // ==========================================

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // User yang sedang login
    Route::get('/user', function (Request $request) {

        $user = $request->user();

        $roles = method_exists($user, 'getRoleNames')
            ? $user->getRoleNames()->map(
                fn ($role) => ['name' => $role]
            )
            : [];

        $permissions = method_exists($user, 'getAllPermissions')
            ? $user->getAllPermissions()->pluck('name')
            : [];

        return response()->json([
            'id' => $user->id,
            'name' => $user->name ?? $user->full_name ?? null,
            'email' => $user->email,
            'roles' => $roles,
            'all_permissions' => $permissions,
        ]);
    });


    // ==========================================
    // B. PROFILE
    // ==========================================

    Route::get('/profile', [UserController::class, 'profile']);

    Route::put('/profile', [UserController::class, 'updateProfile']);

    Route::patch('/profile', [UserController::class, 'updateProfile']);

    Route::post('/profile/photo', [UserController::class, 'uploadPhoto']);

    Route::patch('/profile/password', [UserController::class, 'changePassword']);


    // ==========================================
    // C. MODUL ALAT UKUR & KALIBRASI
    // ==========================================

    Route::apiResource(
        'alat-ukur',
        AlatUkurController::class
    );

    // Riwayat kalibrasi berdasarkan alat ukur
    Route::get(
        '/alat-ukur/{alat_ukur_id}/riwayat-kalibrasi',
        [RiwayatKalibrasiController::class, 'getByAlatUkur']
    );

    // CRUD riwayat kalibrasi
    Route::apiResource(
        'riwayat-kalibrasi',
        RiwayatKalibrasiController::class
    );


    // ==========================================
    // D. MODUL TRANSAKSI
    // PEMINJAMAN & PENGEMBALIAN
    // ==========================================

    // Scan alat ukur
    Route::post(
        '/peminjaman/scan',
        [PeminjamanController::class, 'scan']
    );

    // Antrean peminjaman
    Route::get(
        '/peminjaman/antrean',
        [PeminjamanController::class, 'antrean']
    );

    // Update item cart
    Route::patch(
        '/peminjaman/cart/{id}',
        [PeminjamanController::class, 'updateCartItem']
    );

    // Hapus item cart
    Route::delete(
        '/peminjaman/cart/{id}',
        [PeminjamanController::class, 'removeCartItem']
    );

    // Alat yang belum dikembalikan
    Route::get(
        '/peminjaman/belum-kembali',
        [PeminjamanController::class, 'belumKembali']
    );

    // Proses peminjaman
    Route::post(
        '/peminjaman/proses',
        [PeminjamanController::class, 'prosesPeminjaman']
    );

    // Pengembalian alat
    Route::patch(
        '/peminjaman/{id}/kembali',
        [PeminjamanController::class, 'kembali']
    );

    // CRUD peminjaman
    Route::apiResource(
        'peminjaman',
        PeminjamanController::class
    );


    // ==========================================
    // E. MODUL ADMINISTRASI USER
    // ==========================================

    // CRUD user
    Route::apiResource(
        'users',
        UserController::class
    );

    // Reset password
    Route::patch(
        '/users/{id}/reset-password',
        [UserController::class, 'resetPassword']
    );

    // Aktifkan user
    Route::patch(
        '/users/{id}/aktifkan',
        [UserController::class, 'activate']
    );


    // ==========================================
    // F. MODUL ROLE & PERMISSION
    // ==========================================

    // Daftar roles
    Route::get(
        '/roles',
        [RolePermissionController::class, 'index']
    );

    // Matrix permission
    Route::get(
        '/permissions/matrix',
        [RolePermissionController::class, 'getMatrix']
    );

    Route::put(
        '/permissions/matrix',
        [RolePermissionController::class, 'updateMatrix']
    );

    // CRUD role
    Route::post(
        '/roles',
        [RolePermissionController::class, 'store']
    );

    Route::patch(
        '/roles/{id}/color',
        [RolePermissionController::class, 'updateColor']
    );

    Route::delete(
        '/roles/{id}',
        [RolePermissionController::class, 'destroy']
    );

    // Permission berdasarkan role
    Route::get(
        '/roles/{id}/permissions',
        [RolePermissionController::class, 'getRolePermissions']
    );

    Route::put(
        '/roles/{id}/permissions',
        [RolePermissionController::class, 'updateRolePermissions']
    );


    // ==========================================
    // G. MODUL DASHBOARD
    // ==========================================

    Route::get(
        '/dashboard/summary',
        [DashboardController::class, 'summary']
    );

    Route::get(
        '/dashboard/kalibrasi-mendekati',
        [DashboardController::class, 'kalibrasiMendekati']
    );

    Route::get(
        '/dashboard/telat-kembali',
        [DashboardController::class, 'telatKembali']
    );

    Route::get(
        '/dashboard/alat-terpopuler',
        [DashboardController::class, 'alatTerpopuler']
    );

    Route::get(
        '/dashboard/aktivitas-terbaru',
        [DashboardController::class, 'aktivitasTerbaru']
    );

    Route::get(
        '/dashboard/tren-peminjaman',
        [DashboardController::class, 'trenPeminjaman']
    );
});
