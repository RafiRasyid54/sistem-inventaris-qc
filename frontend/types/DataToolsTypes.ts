export type AlatukurCondition = "Baik" | "Rusak";
export type AlatukurKategori = "mesin" | "alat_biasa" | "perkakas_mesin";

export interface AlatukurItemType {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  kondisi: AlatukurCondition;
  stok: number;
  dipinjam: number;
  kategori?: AlatukurKategori;
}

export type AlatukurFormValues = Omit<AlatukurItemType, "id">;

// ------------------------------------------------------------------
// Alatukur Masuk (riwayat alat masuk)
// ------------------------------------------------------------------
export interface AlatukurMasukType {
  id: string;
  tanggal: string;
  alat ukur_id: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah_masuk: number;
  keterangan: string;
  dicatatOleh?: {
    id: string;
    name: string;
  };
}

export interface AlatukurMasukFormValues {
  tanggal: string;
  alat ukur_id: string;
  kode_barang: string;
  nama_barang: string;
  merk: string;
  tipe: string;
  warna: string;
  ukuran: string;
  jumlah_masuk: number;
  keterangan: string;
  id_card?: string;
}
// ------------------------------------------------------------------
// Keranjang Peminjaman
// ------------------------------------------------------------------
export interface CartItemType {
  alat ukurId: string;
  cartId?: string | number; // id baris di temporary_cart, dipakai untuk update/hapus
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  maxJumlah: number;
}

// ------------------------------------------------------------------
// Data Peminjam
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// Data Peminjam
// ------------------------------------------------------------------
export interface PeminjamType {
  id: string;
  nama: string;
  divisi: string;
  rfid_uid?: string | null;
  aktif: boolean;
  role?: "user" | "inventory man"; // <--- Tambahkan baris ini
}

// ------------------------------------------------------------------
// Form Peminjaman
// ------------------------------------------------------------------
export interface LoanFormValues {
  tanggalPeminjaman: string;
  peminjamId: string;
  namaPeminjam: string;
  divisi: string;
  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi?: string;
  keterangan?: string;
}

// ------------------------------------------------------------------
// Transaksi Peminjaman
// ------------------------------------------------------------------
export type TransaksiStatus = "Sedang Dipinjam" | "Selesai";

export interface TransaksiPeminjamanItemType {
  alat ukurId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  kondisiSaatDipinjam: AlatukurCondition;
}


export interface TransaksiPeminjamanType {
  id: string;
  tanggalPeminjaman: string;
  namaPeminjam: string;
  divisi: string;
  areaKerja: string;
  items: TransaksiPeminjamanItemType[];
  status: TransaksiStatus;
}

// ------------------------------------------------------------------
// Form Pengembalian
// ------------------------------------------------------------------
export interface PengembalianItemInput {
  alat ukurId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  kondisi: AlatukurCondition;
  catatan: string;
}

// ------------------------------------------------------------------
// Riwayat Kerusakan (dipakai reducer prosesPengembalian di inventoryAlatukurSlice)
// ------------------------------------------------------------------
export interface KerusakanHistoryType {
  id: string;
  tanggal: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  kondisi: AlatukurCondition;
  catatan: string;
  namaPeminjam: string;
  divisi: string;
}

// ------------------------------------------------------------------
// Peminjaman Aktif
// ------------------------------------------------------------------
export interface PeminjamanAktifItemType {
  id: string;
  alat ukurId: string;
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