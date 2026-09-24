// ------------------------------------------------------------------
// Riwayat Peminjaman Alatukur
// ------------------------------------------------------------------
export interface RiwayatPeminjamanType {
  id: string;
  nomor_transaksi: string;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah: number;
  nama_peminjam: string;
  divisi: string;
  nama_pekerjaan: string;
  area_kerja: string;
  keterangan: string;

  // dipakai export PDF / Excel
  [key: string]: unknown;
}

// Form edit hanya mengubah 3 field
export interface RiwayatPeminjamanFormValues {
  jumlah: number;
  nama_pekerjaan: string;
  area_kerja: string;
  keterangan: string;
}

// ------------------------------------------------------------------
// Riwayat Consumable Keluar
// ------------------------------------------------------------------
export interface RiwayatConsumableKeluarType {
  id: string;
  nomor_transaksi: string;
  tanggal_pengambilan: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  er_e: string;
  ukuran: string;
  jumlah: number;
  nama_peminta: string;
  divisi: string;
  nama_pekerjaan: string;
  area_kerja: string;
  keterangan: string;

  [key: string]: unknown;
}

export interface RiwayatConsumableKeluarFormValues {
  jumlah: number;
  nama_pekerjaan: string;
  area_kerja: string;
  keterangan: string;
}

// ------------------------------------------------------------------
// Filter bersama
// ------------------------------------------------------------------
export interface PeriodeFilterValue {
  dari: string;
  sampai: string;
}

export interface RiwayatKalibrasiApiResponse {
  id: string;
  alat_ukur_id: string;
  tanggal_kalibrasi: string;
  tanggal_jatuh_tempo: string | null;
  kondisi: "Baik" | "RPP" | "RT";
  pelaksana_kalibrasi?: string | null;
  keterangan?: string | null;
  alat_ukur?: {
    id: string;
    kode_alat: string;
    nama_alat: string;
    merk?: string;
  };
}

export interface RiwayatKalibrasiType {
  id: string;
  alatUkurId: string;
  kodeAlat: string;
  namaAlat: string;
  merk: string;
  tanggalKalibrasi: string;
  tanggalJatuhTempo: string;
  tanggalJatuhTempoRaw: string | null;
  kondisi: "Baik" | "RPP" | "RT";
  pelaksana: string;
  keterangan: string;
}