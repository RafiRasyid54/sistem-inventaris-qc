// ============================================================
// ALAT UKUR
// ============================================================

export interface AlatUkur {
  id?: string;
  no?: number;

  nama_alat: string;
  merk: string;
  sn: string;
  spesifikasi: string;

  kode_mekanik?: string;
  kode_elektrik?: string;
  kode_sipil?: string;

  kalibrasi?: string;
  rencana_kalibrasi?: string;

  kondisi?: string;
  keterangan?: string;
  kategori?: string;
  lokasi?: string;

  status_kalibrasi?: string;
  kode_alat?: string;
}

// ============================================================
// RIWAYAT KALIBRASI
// ============================================================

export interface RiwayatKalibrasi {
  id: string | number;
  tanggal_kalibrasi: string;
  hasil?: string;
  keterangan: string;
}

// ============================================================
// FORM ALAT UKUR
// ============================================================

export type AlatUkurFormValues = Partial<AlatUkur>;

// ============================================================
// CART PEMINJAMAN
// ============================================================

export interface CartItemType {
  alatUkurId: string;
  kodeAlat: string;
  namaAlat: string;
  jumlah: number;
}

// ============================================================
// FORM PEMINJAMAN
// ============================================================

export interface LoanFormValues {
  peminjamId: string;
  namaPeminjam: string;
  tanggalPeminjaman: string;
  divisi: string;

  areaKerja: string;
  spesifikasi: string;
  keterangan: string;

  namaPekerjaan?: string;
  dicatatOleh?: string;
}

// ============================================================
// ITEM PEMINJAMAN AKTIF
// ============================================================

export interface PeminjamanAktifItemType {
  id: string;

  alatUkurId: string;

  tanggal: string;

  kodeBarang: string;
  namaBarang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;

  jumlah: number;

  peminjamId: string;
  namaPeminjam: string;
  divisi: string;

  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi: string;
  keterangan: string;
}

// ============================================================
// TRANSAKSI PEMINJAMAN
// ============================================================

export interface TransaksiPeminjamanItem {
  alatUkurId: string;
  kodeAlat: string;
  namaAlat: string;
  kondisiSaatDipinjam: string;
}

export interface TransaksiPeminjamanType {
  id: string;

  tanggalPeminjaman: string;

  namaPeminjam: string;
  divisi: string;

  areaKerja: string;

  status: string;

  items: TransaksiPeminjamanItem[];
}

// ============================================================
// PENGEMBALIAN
// ============================================================

export interface PengembalianItemInput {
  alatUkurId: string;
  kondisi: string;
}