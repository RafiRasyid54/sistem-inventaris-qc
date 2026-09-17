import apiFetch from "lib/api";
import {
  CartItemType,
  PeminjamanAktifItemType,
} from "types/DataAlatUkurTypes";
import { RiwayatPeminjamanType } from "types/RiwayatTypes";

// ============================================================
// INTERFACES
// ============================================================

export interface PeminjamanIndexApiResponse {
  id: string;
  tanggal: string;
  tanggal_kembali: string | null;
  jumlah: number;

  nama_pekerjaan: string;

  area_pekerjaan?: string;
  spesifikasi?: string;
  keterangan?: string;

  alat_ukur?: {
    id: string;
    kode_barang: string;
    nama_barang: string;
    merk: string;
    type: string;
    warna: string;
    ukuran: string;
  };

  peminta?: {
    id?: string;
    nama: string;
    divisi: string;
  };

  // Backup jika backend mengembalikan peminta_id secara langsung
  peminta_id?: string;
}

// Payload untuk membuat peminjaman langsung
interface CreatePeminjamanPayload {
  tanggal: string;
  alat_ukur_id: string;
  peminta_id: string;
  jumlah: number;
  area_pekerjaan: string;
  nama_pekerjaan: string;
  spesifikasi?: string;
  keterangan?: string;
  dicatat_oleh: string;
}

// ============================================================
// UTILS
// ============================================================

/**
 * Mengubah ISO date menjadi:
 * DD Mon YYYY, HH:mm
 *
 * Contoh:
 * 17 Sep 2026, 08:30
 */
function formatTanggalJam(isoString: string): string {
  const d = new Date(isoString);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("day")} ${get("month")} ${get("year")}, ${get(
    "hour"
  )}:${get("minute")}`;
}

/**
 * Membuat nomor transaksi berdasarkan tanggal dan nama peminjam.
 *
 * Contoh:
 * TRX-1758067200000-RAFI
 */
function buildNomorTransaksi(
  tanggalIso: string,
  pemintaNama: string
): string {
  const timestamp = new Date(tanggalIso).getTime();

  const pemintaCode = pemintaNama
    .replace(/\s+/g, "")
    .slice(0, 4)
    .toUpperCase();

  return `TRX-${timestamp}-${pemintaCode}`;
}

// ============================================================
// MAPPER
// ============================================================

/**
 * Mapping response API -> data yang digunakan halaman peminjaman aktif
 */
function mapPeminjamanFromApi(
  item: PeminjamanIndexApiResponse
): PeminjamanAktifItemType {
  return {
    id: item.id,

    // ID alat ukur
    alatUkurId: item.alat_ukur?.id ?? "-",

    // Informasi waktu
    tanggal: formatTanggalJam(item.tanggal),

    // Informasi alat ukur
    kodeBarang: item.alat_ukur?.kode_barang ?? "-",
    namaBarang: item.alat_ukur?.nama_barang ?? "-",
    merk: item.alat_ukur?.merk ?? "-",
    tipe: item.alat_ukur?.type ?? "-",
    warna: item.alat_ukur?.warna ?? "-",
    ukuran: item.alat_ukur?.ukuran ?? "-",

    // Jumlah
    jumlah: item.jumlah,

    // ID peminjam
    //
    // Prioritas:
    // 1. peminta_id dari response
    // 2. peminta.id dari relasi
    // 3. string kosong
    //
    // Ini digunakan untuk pengecekan RFID.
    peminjamId:
      item.peminta_id ||
      item.peminta?.id ||
      "",

    // Informasi peminjam
    namaPeminjam: item.peminta?.nama ?? "-",
    divisi: item.peminta?.divisi ?? "-",

    // Informasi pekerjaan
    namaPekerjaan: item.nama_pekerjaan ?? "-",
    areaKerja: item.area_pekerjaan ?? "-",
    spesifikasi: item.spesifikasi ?? "-",
    keterangan: item.keterangan ?? "-",
  };
}

/**
 * Mapping response API -> data riwayat peminjaman
 */
function mapRiwayatFromApi(
  item: PeminjamanIndexApiResponse
): RiwayatPeminjamanType {
  const namaPeminjam = item.peminta?.nama ?? "-";

  return {
    id: item.id,

    // Nomor transaksi
    nomor_transaksi: buildNomorTransaksi(
      item.tanggal,
      namaPeminjam
    ),

    // Tanggal
    tanggal_pinjam: formatTanggalJam(item.tanggal),

    tanggal_kembali: item.tanggal_kembali
      ? formatTanggalJam(item.tanggal_kembali)
      : "-",

    // Informasi alat ukur
    kode_barang: item.alat_ukur?.kode_barang ?? "-",
    nama_barang: item.alat_ukur?.nama_barang ?? "-",
    merk: item.alat_ukur?.merk ?? "-",
    tipe: item.alat_ukur?.type ?? "-",
    warna: item.alat_ukur?.warna ?? "-",
    ukuran: item.alat_ukur?.ukuran ?? "-",

    // Jumlah
    jumlah: item.jumlah,

    // Informasi peminjam
    namaPeminjam: namaPeminjam,
    nama_peminjam: namaPeminjam,
    divisi: item.peminta?.divisi ?? "-",

    // Informasi pekerjaan
    namaPekerjaan: item.nama_pekerjaan ?? "-",
    nama_pekerjaan: item.nama_pekerjaan ?? "-",

    areaKerja: item.area_pekerjaan ?? "-",
    area_kerja: item.area_pekerjaan ?? "-",

    spesifikasi: item.spesifikasi ?? "-",
    keterangan: item.keterangan ?? "-",
  };
}

// ============================================================
// PEMINJAMAN
// ============================================================

/**
 * Submit peminjaman langsung.
 *
 * Digunakan ketika cartItems sudah tersedia
 * dan setiap item dikirim satu per satu ke API.
 */
export async function submitPeminjaman(
  cartItems: CartItemType[],
  pemintaId: string,
  areaKerja: string,
  namaPekerjaan: string,
  dicatatOleh: string,
  spesifikasi?: string,
  keterangan?: string
): Promise<void> {
  const tanggal = new Date().toISOString();

  for (const item of cartItems) {
    const payload: CreatePeminjamanPayload = {
      tanggal,

      // PERBAIKAN:
      // sebelumnya "alat ukur_id"
      alat_ukur_id: item.alatUkurId,

      peminta_id: pemintaId,
      jumlah: item.jumlah,

      area_pekerjaan: areaKerja,
      nama_pekerjaan: namaPekerjaan,

      spesifikasi,
      keterangan,

      dicatat_oleh: dicatatOleh,
    };

    await apiFetch("/peminjaman", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

// ============================================================
// PEMINJAMAN AKTIF
// ============================================================

/**
 * Mengambil semua peminjaman yang masih aktif /
 * belum dikembalikan.
 */
export async function getPeminjamanAktif(): Promise<
  PeminjamanAktifItemType[]
> {
  const data: PeminjamanIndexApiResponse[] =
    await apiFetch("/peminjaman");

  return data
    .filter((item) => item.tanggal_kembali === null)
    .map(mapPeminjamanFromApi);
}

// ============================================================
// RIWAYAT PEMINJAMAN
// ============================================================

/**
 * Mengambil semua peminjaman yang sudah dikembalikan.
 */
export async function getRiwayatPeminjaman(): Promise<
  RiwayatPeminjamanType[]
> {
  const data: PeminjamanIndexApiResponse[] =
    await apiFetch("/peminjaman");

  return data
    .filter((item) => item.tanggal_kembali !== null)
    .sort((a, b) => {
      // Urutkan tanggal kembali terbaru terlebih dahulu
      const dateA = new Date(
        a.tanggal_kembali as string
      ).getTime();

      const dateB = new Date(
        b.tanggal_kembali as string
      ).getTime();

      return dateB - dateA;
    })
    .map(mapRiwayatFromApi);
}

// ============================================================
// PENGEMBALIAN
// ============================================================

/**
 * Menandai peminjaman sebagai sudah dikembalikan.
 *
 * jumlahDikembalikan bersifat optional karena backend
 * mungkin sudah memiliki default.
 */
export async function tandaiDikembalikan(
  id: string,
  jumlahDikembalikan?: number
): Promise<void> {
  await apiFetch(`/peminjaman/${id}/kembali`, {
    method: "PATCH",
    body: JSON.stringify({
      jumlah_dikembalikan: jumlahDikembalikan,
    }),
  });
}

// ============================================================
// CART / TEMPORARY_CART
// FLOW BARU
// ============================================================

export interface AntreanItemResponse {
  id: string | number;

  alat_ukur_id: string;

  nama_barang: string;
  kode_barang: string;

  qty: number;
  max_jumlah: number;
}

// ============================================================
// SCAN ALAT UKUR
// ============================================================

/**
 * Scan alat ukur dan masukkan ke temporary cart.
 *
 * Endpoint:
 * POST /peminjaman/scan
 *
 * Body:
 * {
 *   alat_ukur_id: "...",
 *   jumlah: 1
 * }
 */
export async function scanAlatukur(
  alatUkurId: string,
  jumlah = 1
): Promise<{
  message: string;
  qty: number;
}> {
  return apiFetch("/peminjaman/scan", {
    method: "POST",

    body: JSON.stringify({
      alat_ukur_id: alatUkurId,
      jumlah,
    }),
  });
}

// ============================================================
// FETCH ANTREAN / CART
// ============================================================

/**
 * Mengambil isi temporary cart / antrean.
 *
 * Response API diasumsikan:
 *
 * {
 *   data: [...]
 * }
 */
export async function fetchAntrean(): Promise<
  AntreanItemResponse[]
> {
  const res = (await apiFetch(
    "/peminjaman/antrean"
  )) as {
    data: AntreanItemResponse[];
  };

  return res.data || [];
}

// ============================================================
// UPDATE CART
// ============================================================

/**
 * Mengubah jumlah item di cart.
 *
 * Endpoint:
 * PATCH /peminjaman/cart/{cartId}
 */
export async function updateCartItem(
  cartId: string | number,
  qty: number
): Promise<void> {
  await apiFetch(`/peminjaman/cart/${cartId}`, {
    method: "PATCH",

    body: JSON.stringify({
      qty,
    }),
  });
}

// ============================================================
// REMOVE CART
// ============================================================

/**
 * Menghapus item dari cart.
 *
 * Endpoint:
 * DELETE /peminjaman/cart/{cartId}
 */
export async function removeCartItem(
  cartId: string | number
): Promise<void> {
  await apiFetch(`/peminjaman/cart/${cartId}`, {
    method: "DELETE",
  });
}

// ============================================================
// PROSES PEMINJAMAN
// ============================================================

export interface ProsesPeminjamanParams {
  pemintaId: string;
  dicatatOleh: string;
  namaPekerjaan: string;

  areaKerja?: string;
  spesifikasi?: string;
  keterangan?: string;
}

/**
 * Memproses semua item yang ada di temporary cart
 * menjadi transaksi peminjaman.
 *
 * Endpoint:
 * POST /peminjaman/proses
 */
export async function prosesPeminjamanApi(
  params: ProsesPeminjamanParams
): Promise<void> {
  await apiFetch("/peminjaman/proses", {
    method: "POST",

    body: JSON.stringify({
      peminta_id: params.pemintaId,

      dicatat_oleh: params.dicatatOleh,

      nama_pekerjaan: params.namaPekerjaan,

      area_pekerjaan: params.areaKerja,

      spesifikasi: params.spesifikasi,

      keterangan: params.keterangan,
    }),
  });
}