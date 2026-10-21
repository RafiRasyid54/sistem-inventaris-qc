// Tipe UserRole dihapus karena sistem RBAC sudah tidak digunakan

export interface UserItemType {
  id: string;
  full_name: string;
  username: string;
  email: string | null;
  divisi: string | null;
  avatar_path: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

// Payload form Tambah/Edit
export interface UserFormValues {
  full_name: string;
  username: string;
  password?: string; // wajib diisi saat Tambah, opsional/kosong berarti tidak diganti saat Edit
  email?: string;
  divisi?: string;
}

export interface ResetPasswordValues {
  password_baru: string;
  password_baru_confirmation: string;
}