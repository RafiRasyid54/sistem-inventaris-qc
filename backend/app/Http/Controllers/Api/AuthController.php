<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Username atau password salah'], 401);
        }

        // Cek status aktif akun
        if (isset($user->is_active) && ! $user->is_active) {
            return response()->json(['message' => 'Akun Anda telah dinonaktifkan. Hubungi Admin.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Ambil relasi roles dan permissions dengan pengaman method_exists
        if (method_exists($user, 'load')) {
            $user->load('roles');
        }
        
        $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : [];
        $allPermissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : [];

        return response()->json([
            'user' => $user,
            'token' => $token,
            'must_change_password' => $user->must_change_password ?? false,
            'roles' => $roles,
            'all_permissions' => $allPermissions,
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user() && $request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }
        
        return response()->json(['message' => 'Logout berhasil']);
    }
}