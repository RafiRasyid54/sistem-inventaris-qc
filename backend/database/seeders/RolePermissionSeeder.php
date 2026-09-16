<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view_dashboard',
            'manage_alat_ukur',
            'manage_kalibrasi',
            'manage_pekerjaan',
            'manage_peminta',
            'manage_transaksi',
            'manage_users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $roleSuperAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $roleAdminQC = Role::firstOrCreate(['name' => 'Admin QC', 'guard_name' => 'web']);
        $roleInventoryMan = Role::firstOrCreate(['name' => 'Inventory Man', 'guard_name' => 'web']);

        // --- INVENTORY MAN ---
        $roleInventoryMan->syncPermissions([
            'view_dashboard',
            'manage_transaksi',
        ]);

        // --- ADMIN QC ---
        $roleAdminQC->syncPermissions([
            'view_dashboard',
            'manage_alat_ukur',
            'manage_kalibrasi',
            'manage_pekerjaan',
            'manage_peminta',
            'manage_transaksi',
        ]);

        // --- SUPER ADMIN (Daftar manual agar aman dari race condition database) ---
        $roleSuperAdmin->syncPermissions([
            'view_dashboard',
            'manage_alat_ukur',
            'manage_kalibrasi',
            'manage_pekerjaan',
            'manage_peminta',
            'manage_transaksi',
            'manage_users',
        ]);
    }
}