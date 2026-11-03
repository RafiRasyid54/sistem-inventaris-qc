<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    // Kolom yang aman ditampilkan (password tidak pernah ikut)
    private const SAFE_COLUMNS = [
        'id', 'full_name', 'username', 'email', 'divisi', 'no_hp', 'avatar_path',
        'role', 'is_active', 'must_change_password', 'created_at',
    ];

    // Tolak dengan 403 jika role user yang login tidak termasuk $roles
    private function onlyRoles(Request $request, string ...$roles): void
    {
        abort_unless(
            $request->user()?->hasRole(...$roles),
            403,
            'Anda tidak memiliki akses untuk aksi ini.'
        );
    }

    // GET /api/users (admin saja)
    public function index(Request $request)
    {
        $this->onlyRoles($request, 'admin');

        return response()->json(
            User::select(self::SAFE_COLUMNS)
                ->orderBy('full_name')
                ->get()
        );
    }

    // GET /api/users/{id} (admin saja)
    public function show(Request $request, string $id)
    {
        $this->onlyRoles($request, 'admin');

        $user = User::select(self::SAFE_COLUMNS)->find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        return response()->json($user);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        return response()->json(collect($user)->only(self::SAFE_COLUMNS));
    }

    // Profil sendiri: sengaja TIDAK menerima 'role' agar user tidak bisa menaikkan rolenya sendiri
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'divisi' => 'sometimes|nullable|string|max:255',
            'no_hp' => 'sometimes|nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json($user->only(self::SAFE_COLUMNS));
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password_lama' => 'required|string',
            'password_baru' => 'required|string|min:6|confirmed',
        ], [
            'password_baru.confirmed' => 'Konfirmasi password baru tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (! Hash::check($request->password_lama, $user->password)) {
            return response()->json([
                'errors' => ['password_lama' => ['Password lama tidak sesuai.']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password_baru),
            'must_change_password' => false,
        ]);

        return response()->json(['message' => 'Password berhasil diperbarui']);
    }

    // POST /api/users (admin saja)
    public function store(Request $request)
    {
        $this->onlyRoles($request, 'admin');

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'divisi' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'role' => 'required|in:' . implode(',', User::ROLES),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['password'] = Hash::make($data['password']);
        $data['must_change_password'] = false;
        $data['is_active'] = true;

        $user = User::create($data);

        return response()->json($user->only(self::SAFE_COLUMNS), 201);
    }

    // PUT/PATCH /api/users/{id} (admin saja)
    public function update(Request $request, string $id)
    {
        $this->onlyRoles($request, 'admin');

        $targetUser = User::find($id);

        if (! $targetUser) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $targetUser->id,
            'email' => 'sometimes|nullable|email|unique:users,email,' . $targetUser->id,
            'password' => 'nullable|string|min:6',
            'divisi' => 'sometimes|nullable|string|max:255',
            'no_hp' => 'sometimes|nullable|string|max:20',
            'role' => 'sometimes|required|in:' . implode(',', User::ROLES),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Admin tidak boleh mengubah role akunnya sendiri (cegah kehilangan akses admin)
        if (
            isset($data['role'])
            && $targetUser->id === $request->user()->id
            && $data['role'] !== $targetUser->role
        ) {
            return response()->json([
                'errors' => ['role' => ['Anda tidak dapat mengubah role akun sendiri.']],
            ], 422);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $targetUser->update($data);

        return response()->json($targetUser->only(self::SAFE_COLUMNS));
    }

    // DELETE /api/users/{id} (admin saja)
    public function destroy(Request $request, string $id)
    {
        $this->onlyRoles($request, 'admin');

        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun sendiri.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus']);
    }

    // PATCH /api/users/{id}/aktifkan (admin saja)
    public function activate(Request $request, string $id)
    {
        $this->onlyRoles($request, 'admin');

        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $user->update(['is_active' => true]);

        return response()->json(['message' => 'User berhasil diaktifkan']);
    }

    // PATCH /api/users/{id}/reset-password (admin saja)
    public function resetPassword(Request $request, string $id)
    {
        $this->onlyRoles($request, 'admin');

        $targetUser = User::find($id);

        if (! $targetUser) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'password_baru' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $targetUser->update([
            'password' => Hash::make($request->password_baru),
        ]);

        return response()->json(['message' => 'Password user berhasil direset']);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update(['avatar_path' => $path]);

        return response()->json([
            'avatar_path' => $path,
            'avatar_url' => Storage::disk('public')->url($path),
        ]);
    }
}