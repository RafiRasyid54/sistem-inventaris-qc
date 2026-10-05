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
  tanggal_pinjam: string;      // Disesuaikan dengan database Laravel
  tanggal_kembali: string | null;
  jumlah?: number;

  alat_ukur?: {
    id: string;
    kode_alat: string;         // Kolom asli tabel alat_ukur
    nama_alat: string;         // Kolom asli tabel alat_ukur
    merk?: string;
    type?: string;
    warna?: string;
    ukuran?: string;
  };

  peminta?: {
    id?: string;
    nama?: string;
    nama_peminta?: string;     // Menyesuaikan kolom database Laravel
    divisi?: string;
    kategori?: string;         // TAMBAHAN: Agar TS mengenali kategori
  };

  pekerjaan?: {
    nama_pekerjaan?: string;
  };

  area_pekerjaan?: string;
  spesifikasi?: string;
  keterangan?: string;
}

// Payload untuk membuat peminjaman langsung
interface CreatePeminjamanPayload {
  tanggal_pinjam?: string;
  alat_ukur_id: string;
  peminta_id: string;
  pekerjaan_id: string;
  keterangan?: string;
}

// ============================================================
// UTILS
// ============================================================

/**
 * Mengubah ISO date menjadi:
 * DD Mon YYYY, HH:mm
 * Diamankan dari nilai null, undefined, atau string kosong.
 */
function formatTanggalJam(isoString: string | null | undefined): string {
  if (!isoString) return "-";

  const d = new Date(isoString);

  if (isNaN(d.getTime())) {
    return "-";
  }

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

  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");

  if (!day || !month || !year) return "-";

  return `${day} ${month} ${year}, ${hour}:${minute}`;
}

/**
 * Membuat nomor transaksi berdasarkan tanggal dan nama peminjam.
 */
function buildNomorTransaksi(
  tanggalIso: string,
  pemintaNama: string
): string {
  const timestamp = new Date(tanggalIso).getTime() || Date.now();

  const pemintaCode = (pemintaNama || "USER")
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
  // Mengambil nama peminjam dengan fallback yang aman dari nama_peminta atau nama
  const namaPeminjam = item.peminta?.nama_peminta ?? item.peminta?.nama ?? "-";

  return {
    id: item.id,
    peminjamanId: item.id, // <--- PERBAIKAN: Suntikkan peminjamanId di sini!

    // ID alat ukur
    alatUkurId: item.alat_ukur?.id ?? "-",

    // Informasi waktu (Menggunakan tanggal_pinjam)
    tanggal: formatTanggalJam(item.tanggal_pinjam),

    // Informasi alat ukur (Mapping ke kode_alat & nama_alat)
    kodeBarang: item.alat_ukur?.kode_alat ?? "-",
    namaBarang: item.alat_ukur?.nama_alat ?? "Alat Tidak Ditemukan",
    merk: item.alat_ukur?.merk ?? "-",
    tipe: item.alat_ukur?.type ?? "-",
    warna: item.alat_ukur?.warna ?? "-",
    ukuran: item.alat_ukur?.ukuran ?? "-",

    // Jumlah
    jumlah: item.jumlah ?? 1,

    // ID peminjam
    peminjamId: item.peminta?.id ?? "",

    // Informasi peminjam
    namaPeminjam: namaPeminjam,
    divisi: item.peminta?.divisi ?? "-",

    // Informasi pekerjaan
    namaPekerjaan: item.pekerjaan?.nama_pekerjaan ?? item.area_pekerjaan ?? "-",
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
  const namaPeminjam = item.peminta?.nama_peminta ?? item.peminta?.nama ?? "-";
  const namaPekerjaan = item.pekerjaan?.nama_pekerjaan ?? "-";

  return {
    id: item.id,

    // Nomor transaksi
    nomor_transaksi: buildNomorTransaksi(
      item.tanggal_pinjam,
      namaPeminjam
    ),

    // Tanggal
    tanggal_pinjam: formatTanggalJam(item.tanggal_pinjam),

    tanggal_kembali: item.tanggal_kembali
      ? formatTanggalJam(item.tanggal_kembali)
      : "-",

    // Informasi alat ukur
    kode_barang: item.alat_ukur?.kode_alat ?? "-",
    nama_barang: item.alat_ukur?.nama_alat ?? "-",
    merk: item.alat_ukur?.merk ?? "-",
    tipe: item.alat_ukur?.type ?? "-",
    warna: item.alat_ukur?.warna ?? "-",
    ukuran: item.alat_ukur?.ukuran ?? "-",

    // Jumlah
    jumlah: item.jumlah ?? 1,

    // Informasi peminjam
    namaPeminjam: namaPeminjam,
    nama_peminjam: namaPeminjam,
    divisi: item.peminta?.divisi ?? "-",
    
    // 👇 PERBAIKAN: Masukkan kategori ke mapping riwayat 👇
    kategori: item.peminta?.kategori ?? "Internal",

    // Informasi pekerjaan
    namaPekerjaan: namaPekerjaan,
    nama_pekerjaan: namaPekerjaan,

    areaKerja: item.area_pekerjaan ?? "-",
    area_kerja: item.area_pekerjaan ?? "-",

    spesifikasi: item.spesifikasi ?? "-",
    keterangan: item.keterangan ?? "-",
  } as RiwayatPeminjamanType; // Cast tipe jika interface belum diupdate
}

// ============================================================
// PEMINJAMAN AKTIF
// ============================================================

/**
 * Mengambil semua peminjaman yang masih aktif / belum dikembalikan.
 * Memanggil endpoint khusus /peminjaman/belum-kembali sesuai controller.
 */
export const getPeminjamanAktif = async () => {
  const response: any = await apiFetch("/peminjaman/belum-kembali");
  
  const data = response.data || response.result || [];

  return data.map((item: any) => ({
    id: item.id,
    alatUkurId: item.alat_ukur_id,
    kodeBarang: item.alat_ukur?.kode_alat || item.alatUkur?.kode_alat || "-",
    namaBarang: item.alat_ukur?.nama_alat || item.alatUkur?.nama_alat || "-",
    peminjamId: item.peminta_id,
    namaPeminjam: item.peminta?.nama_peminta || "-",
    tanggalPinjam: item.tanggal_pinjam,
    jumlah: item.jumlah ?? 1,
    status: item.status || "dipinjam",
    kategori: item.peminta?.kategori || "Internal",
    keterangan: item.keterangan || null,
  }));
};

// ============================================================
// RIWAYAT PEMINJAMAN
// ============================================================

/**
 * Mengambil semua peminjaman (riwayat keseluruhan).
 */
export async function getRiwayatPeminjaman(): Promise<
  RiwayatPeminjamanType[]
> {
  const response: any = await apiFetch("/peminjaman");

  let dataArray: PeminjamanIndexApiResponse[] = [];
  if (Array.isArray(response)) {
    dataArray = response;
  } else if (Array.isArray(response?.data)) {
    dataArray = response.data;
  } else if (Array.isArray(response?.result)) {
    dataArray = response.result;
  }

  return dataArray
    .filter((item) => item && item.tanggal_kembali !== null)
    .sort((a, b) => {
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
 */
export async function tandaiDikembalikan(
  id: string,
  catatanPengembalian?: string
): Promise<void> {
  await apiFetch(`/peminjaman/${id}/kembali`, {
    method: "PATCH",
    body: JSON.stringify({
      catatan_pengembalian: catatanPengembalian ?? null,
    }),
  });
}

// ============================================================
// PROSES PEMINJAMAN / SCAN
// ============================================================

export interface ProsesPeminjamanParams {
  kodeAlat: string;
  pemintaId: string;
  pekerjaanId: string | number; // Harus berupa ID dari tabel pekerjaan
  keterangan?: string;
}

export async function prosesPeminjamanApi(
  params: ProsesPeminjamanParams
): Promise<void> {
  await apiFetch("/peminjaman/proses", {
    method: "POST",
    body: JSON.stringify({
      kode_alat: params.kodeAlat,
      peminta_id: params.pemintaId,
      pekerjaan_id: params.pekerjaanId, // Sesuai dengan validasi backend
      keterangan: params.keterangan,
    }),
  });
}