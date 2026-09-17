export interface OrderAlatUkurStatusCount {
  belum_dibeli: number;
  on_progres: number;
  sudah_dibeli: number;
  ditolak: number;
}

export interface DashboardSummary {
  total_alat_ukur: number;
  sedang_dipinjam: number;
  total_peminta_aktif: number;
  total_pekerjaan_aktif: number;
  peringatan_kalibrasi: number;
  order_alat_ukur_status?: OrderAlatUkurStatusCount; // belum ada di controller, lihat catatan di bawah
}

export interface KalibrasiMendekatiItem {
  id: string | number;
  nama_alat: string;
  kode_alat?: string;
  sn: string;
  rencana_kalibrasi?: string;
  tanggal_kalibrasi_selanjutnya?: string; // Tambahkan ini agar cocok dengan DashboardManager.tsx
  lokasi?: string;
}

export interface TelatKembaliItem {
  id: number;
  kode_alat: string;
  nama_alat: string;
  nama_peminjam: string;
  tanggal_pinjam: string;
  hari_terlambat: number;
}

export interface AlatTerpopulerItem {
  kode_alat: string;
  nama_alat: string;
  merk?: string | null;
  sn?: string | null;
  total_dipinjam: number;
}

export interface AktivitasItem {
  jenis: "peminjaman" | "pengembalian";
  deskripsi: string;
  waktu: string;
}

export interface TrenPeminjamanItem {
  tanggal: string;
  total: number;
}

export interface KerusakanSummary {
  bulan_ini: number;
  total_semua: number;
  sedang_diperbaiki: number;
  sudah_diperbaiki: number;
  rusak_permanen: number;
}

