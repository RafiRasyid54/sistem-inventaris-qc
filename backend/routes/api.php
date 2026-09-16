<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Controller Imports ---
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AlatUkurController; 
use App\Http\Controllers\Api\PeminjamanController;
use App\Http\Controllers\Api\RiwayatKalibrasiController; // Tambahan untuk Kalibrasi
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RolePermissionController;

// ==========================================
// 1. ROUTE PUBLIK (Tanpa Auth)
// ==========================================
Route::post('/login', [AuthController::class, 'login']);

// ==========================================
// 2. ROUTE TERLINDUNG (WAJIB LOGIN & CEK HAK AKSES)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // ------------------------------------------
    // A. GENERAL (Bisa diakses siapapun yang login)
    // ------------------------------------------
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('roles', 'permissions');
        $user->all_permissions = $user->getAllPermissions()->pluck('name');
        return $user;
    });

    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::patch('/profile', [UserController::class, 'updateProfile']);
    Route::post('/profile/photo', [UserController::class, 'uploadPhoto']);
    Route::patch('/profile/password', [UserController::class, 'changePassword']);

    // ------------------------------------------
    // B. MODUL ALAT UKUR & KALIBRASI
    // ------------------------------------------
    Route::middleware('permission:view_inventaris')->group(function () {
        Route::apiResource('alat-ukur', AlatUkurController::class)->only(['index', 'show']);
        
        // --- RIWAYAT KALIBRASI ---
        // Mengambil semua riwayat kalibrasi dari satu alat ukur tertentu
        Route::get('/alat-ukur/{alat_ukur_id}/riwayat-kalibrasi', [RiwayatKalibrasiController::class, 'getByAlatUkur']);
    });

    Route::middleware('permission:manage_inventaris')->group(function () {
        Route::apiResource('alat-ukur', AlatUkurController::class)->except(['index', 'show']);
        
        // Menambah/merubah riwayat kalibrasi
        Route::apiResource('riwayat-kalibrasi', RiwayatKalibrasiController::class)->except(['index', 'show']);
    });

    // ------------------------------------------
    // C. MODUL TRANSAKSI (Peminjaman & Pengembalian)
    // ------------------------------------------
    // Rute Scan Peminjaman
    Route::post('/peminjaman/scan', [PeminjamanController::class, 'scan']);
    Route::get('/peminjaman/antrean', [PeminjamanController::class, 'antrean']);
    Route::patch('/peminjaman/cart/{id}', [PeminjamanController::class, 'updateCartItem']);
    Route::delete('/peminjaman/cart/{id}', [PeminjamanController::class, 'removeCartItem']);

    // Riwayat Peminjaman (Aktif/Belum Kembali)
    Route::middleware('permission:view_riwayat')->group(function () {
        Route::get('/peminjaman/belum-kembali', [PeminjamanController::class, 'belumKembali']);
    });

    Route::middleware('permission:view_transaksi|view_riwayat')->group(function () {
        Route::apiResource('peminjaman', PeminjamanController::class)->only(['index', 'show']);
    });

    // Proses Peminjaman dan Pengembalian
    Route::middleware('permission:process_transaksi')->group(function () {
        Route::post('/peminjaman/proses', [PeminjamanController::class, 'prosesPeminjaman']);
        Route::patch('/peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);
    });

    Route::middleware('permission:manage_transaksi')->group(function () {
        Route::apiResource('peminjaman', PeminjamanController::class)->except(['index', 'show', 'store']);
    });

    // ------------------------------------------
    // D. MODUL ADMINISTRASI
    // ------------------------------------------
    Route::middleware('permission:view_users')->group(function () {
        Route::apiResource('users', UserController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:manage_users')->group(function () {
        Route::apiResource('users', UserController::class)->except(['index', 'show']);
        Route::patch('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('/users/{id}/aktifkan', [UserController::class, 'activate']);
        Route::get('/roles', [RolePermissionController::class, 'index']);
    });

    Route::middleware('role:Super Admin')->group(function () {
        Route::get('/permissions/matrix', [RolePermissionController::class, 'getMatrix']);
        Route::put('/permissions/matrix', [RolePermissionController::class, 'updateMatrix']);
        Route::post('/roles', [RolePermissionController::class, 'store']);
        Route::patch('/roles/{id}/color', [RolePermissionController::class, 'updateColor']);
        Route::delete('/roles/{id}', [RolePermissionController::class, 'destroy']);
        Route::get('/roles/{id}/permissions', [RolePermissionController::class, 'getRolePermissions']);
        Route::put('/roles/{id}/permissions', [RolePermissionController::class, 'updateRolePermissions']);
    });

});