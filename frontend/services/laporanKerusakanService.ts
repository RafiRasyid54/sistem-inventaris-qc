import apiFetch from "lib/api";
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

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

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  
  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");

  if (!day || !month || !year) return "-";

  return `${day} ${month} ${year}, ${hour}:${minute}`;
}

interface LaporanKerusakanApiResponse {
  id: string;
  tanggal: string;
  alat_ukur_id: string;
  peminjaman_id: string | null;
  jumlah: number;
  keterangan: string | null;
  status: "bisa_diperbaiki" | "rusak_permanen" | "selesai_diperbaiki";
  catatan_perbaikan: string | null;
  tingkat_kerusakan: "ringan" | "berat" | null;
  perbaikan_ke: number | null;
  dilaporkan_oleh: string;
  alat_ukur: {
    kode_barang: string;
    nama_barang: string;
    merk: string | null;
    type: string | null;
    warna: string | null;
    ukuran: string | null;
    kategori: string | null;
  } | null;
  peminjaman: {
    area_pekerjaan: string | null;
    nama_pekerjaan: string | null;
    peminta: {
      nama: string;
      divisi: string | null;
    } | null;
  } | null;
}

interface CreateLaporanKerusakanPayload {
  tanggal: string;
  alat_ukur_id: string;
  peminjaman_id: string;
  jumlah: number;
  keterangan: string;
  status: "bisa_diperbaiki" | "rusak_permanen";
  dilaporkan_oleh: string;
}

function mapLaporanFromApi(item: LaporanKerusakanApiResponse): LaporanKerusakanType {
  return {
    id: item.id,
    tanggal_pengembalian: formatTanggalJam(item.tanggal),
    kode_barang: item.alat_ukur?.kode_barang ?? "-",
    nama_barang: item.alat_ukur?.nama_barang ?? "-",
    merk: item.alat_ukur?.merk ?? "-",
    tipe: item.alat_ukur?.type ?? "-",
    warna: item.alat_ukur?.warna ?? "-",
    ukuran: item.alat_ukur?.ukuran ?? "-",
    jumlah_rusak: item.jumlah,
    nama_peminjam: item.peminjaman?.peminta?.nama ?? "-",
    divisi: item.peminjaman?.peminta?.divisi ?? "-",
    nama_pekerjaan: item.peminjaman?.nama_pekerjaan ?? "-",
    area_kerja: item.peminjaman?.area_pekerjaan ?? "-",
    keterangan: item.keterangan ?? "-",
    status: item.status,
    catatan_perbaikan: item.catatan_perbaikan ?? undefined,
    tingkat_kerusakan: item.tingkat_kerusakan ?? undefined,
    perbaikan_ke: item.perbaikan_ke ?? undefined,
    kategori_alat: (item.alat_ukur?.kategori as "mesin" | "alat_biasa" | undefined) ?? "alat_biasa",
  };
}

export async function getLaporanKerusakan(): Promise<LaporanKerusakanType[]> {
  const response: any = await apiFetch("/laporan-kerusakan");
  
  // Normalisasi response data jika dibungkus di dalam objek paginasi (misal: { data: [...] })
  let dataArray: LaporanKerusakanApiResponse[] = [];
  if (Array.isArray(response)) {
    dataArray = response;
  } else if (Array.isArray(response?.data)) {
    dataArray = response.data;
  } else if (Array.isArray(response?.result)) {
    dataArray = response.result;
  }

  return dataArray.filter(Boolean).map(mapLaporanFromApi);
}

export async function createLaporanKerusakan(
  payload: CreateLaporanKerusakanPayload
): Promise<void> {
  await apiFetch("/laporan-kerusakan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function repairLaporanKerusakan(
  id: string,
  catatanPerbaikan?: string,
  tingkatKerusakan?: "ringan" | "berat"
): Promise<void> {
  await apiFetch(`/laporan-kerusakan/${id}/repair`, {
    method: "PATCH",
    body: JSON.stringify({
      catatan_perbaikan: catatanPerbaikan ?? null,
      tingkat_kerusakan: tingkatKerusakan ?? null,
    }),
  });
}

export async function tandaiPermanenLaporanKerusakan(id: string): Promise<void> {
  await apiFetch(`/laporan-kerusakan/${id}/tandai-permanen`, { method: "PATCH" });
}