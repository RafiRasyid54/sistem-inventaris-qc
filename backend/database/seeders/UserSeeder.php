<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Gunakan DB Query Builder murni agar tidak memicu trait/observer model yang bikin putus koneksi Supabase
        DB::table('users')->insert([
            'id' => (string) Str::uuid(),
            'full_name' => 'Admin Alat Ukur',
            'username' => 'adminqc',
            'email' => 'adminqc@test.com',
            'password' => Hash::make('password'),
            'role' => 'Admin QC',
            'divisi' => 'Quality Control',
            'must_change_password' => false,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}