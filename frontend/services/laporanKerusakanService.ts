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
  // Menangani format snake_case atau camelCase dari Laravel JSON serialize
  alat_ukur?: {
    kode_alat: string;
    nama_alat: string;
    merk?: string;
    type?: string;
    warna?: string;
    ukuran?: string;
    kategori?: string;
  };
  alatUkur?: {
    kode_alat: string;
    nama_alat: string;
    merk?: string;
    type?: string;
    warna?: string;
    ukuran?: string;
    kategori?: string;
  };
  peminjaman?: {
    area_pekerjaan?: string;
    nama_pekerjaan?: string;
    pekerjaan?: {
      nama_pekerjaan?: string;
    };
    peminta?: {
      nama?: string;
      nama_peminta?: string;
      divisi?: string;
    };
  };
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
  // Ambil data relasi dengan fallback agar anti-error
  const alat = item.alat_ukur || item.alatUkur;
  const peminjaman = item.peminjaman;
  const peminta = peminjaman?.peminta;

  return {
    id: item.id,
    tanggal_pengembalian: formatTanggalJam(item.tanggal),
    
    // PERBAIKAN: Menggunakan kode_alat & nama_alat sesuai database
    kode_barang: alat?.kode_alat ?? "-",
    nama_barang: alat?.nama_alat ?? "-",
    merk: alat?.merk ?? "-",
    tipe: alat?.type ?? "-",
    warna: alat?.warna ?? "-",
    ukuran: alat?.ukuran ?? "-",
    
    jumlah_rusak: item.jumlah,
    
    // PERBAIKAN: Menggunakan nama_peminta
    nama_peminjam: peminta?.nama_peminta ?? peminta?.nama ?? "-",
    divisi: peminta?.divisi ?? "-",
    
    // Menyelaraskan nama pekerjaan
    nama_pekerjaan: peminjaman?.pekerjaan?.nama_pekerjaan ?? peminjaman?.nama_pekerjaan ?? peminjaman?.area_pekerjaan ?? "-",
    area_kerja: peminjaman?.area_pekerjaan ?? "-",
    
    keterangan: item.keterangan ?? "-",
    status: item.status,
    catatan_perbaikan: item.catatan_perbaikan ?? undefined,
    tingkat_kerusakan: item.tingkat_kerusakan ?? undefined,
    perbaikan_ke: item.perbaikan_ke ?? undefined,
    kategori_alat: (alat?.kategori as "mesin" | "alat_biasa" | undefined) ?? "alat_biasa",
  };
}

export async function getLaporanKerusakan(): Promise<LaporanKerusakanType[]> {
  const response: any = await apiFetch("/laporan-kerusakan");
  
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