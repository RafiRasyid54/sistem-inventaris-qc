// frontend/hooks/usePermissions.ts
import { useState, useEffect } from 'react';

export function usePermission(permissionName?: string): boolean {
  // Untuk saat ini di-set true agar fitur tambah/edit/hapus (canManage) bisa diakses.
  // Nanti bisa disesuaikan dengan role/auth user dari backend jika sudah ada.
  return true;
}