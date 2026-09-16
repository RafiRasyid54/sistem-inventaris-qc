<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class, // Komentari dulu sementara
            PemintaSeeder::class,
            AlatUkurSeeder::class,
            PekerjaanSeeder::class,
            PeminjamanSeeder::class,
        ]);
    }
}