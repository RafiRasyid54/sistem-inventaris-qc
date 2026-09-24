import apiFetch from "lib/api";
import {
  RiwayatKalibrasiApiResponse,
  RiwayatKalibrasiType,
} from "types/RiwayatTypes";

function formatTanggal(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function mapKalibrasiFromApi(
  item: RiwayatKalibrasiApiResponse
): RiwayatKalibrasiType {
  return {
    id: item.id,
    alatUkurId: item.alat_ukur_id,
    kodeAlat: item.alat_ukur?.kode_alat ?? "-",
    namaAlat: item.alat_ukur?.nama_alat ?? "Alat tidak ditemukan",
    merk: item.alat_ukur?.merk ?? "-",
    tanggalKalibrasi: formatTanggal(item.tanggal_kalibrasi),
    tanggalJatuhTempo: formatTanggal(item.tanggal_jatuh_tempo),
    tanggalJatuhTempoRaw: item.tanggal_jatuh_tempo,
    kondisi: item.kondisi,
    pelaksana: item.pelaksana_kalibrasi ?? "-",
    keterangan: item.keterangan ?? "-",
  };
}

/**
 * Ambil semua riwayat kalibrasi (lintas alat).
 * Butuh RiwayatKalibrasiController@index (lihat catatan di atas).
 */
export async function getRiwayatKalibrasi(): Promise<RiwayatKalibrasiType[]> {
  const response: any = await apiFetch("/riwayat-kalibrasi");

  let dataArray: RiwayatKalibrasiApiResponse[] = [];
  if (Array.isArray(response)) {
    dataArray = response;
  } else if (Array.isArray(response?.data)) {
    dataArray = response.data;
  }

  return dataArray.map(mapKalibrasiFromApi);
}

export interface CreateKalibrasiPayload {
  alatUkurId: string;
  tanggalKalibrasi: string;
  tanggalJatuhTempo?: string;
  kondisi: "Baik" | "RPP" | "RT";
  pelaksanaKalibrasi?: string;
  keterangan?: string;
}

export async function createRiwayatKalibrasi(
  payload: CreateKalibrasiPayload
): Promise<void> {
  await apiFetch("/riwayat-kalibrasi", {
    method: "POST",
    body: JSON.stringify({
      alat_ukur_id: payload.alatUkurId,
      tanggal_kalibrasi: payload.tanggalKalibrasi,
      tanggal_jatuh_tempo: payload.tanggalJatuhTempo || null,
      kondisi: payload.kondisi,
      pelaksana_kalibrasi: payload.pelaksanaKalibrasi || null,
      keterangan: payload.keterangan || null,
    }),
  });
}

/**
 * Status jatuh tempo dihitung di frontend (backend gak nyimpen status,
 * cuma nyimpen tanggal_jatuh_tempo mentah).
 */
export function getStatusKalibrasi(
  tanggalJatuhTempoRaw: string | null
): "berlaku" | "mendekati" | "lewat" | "unknown" {
  if (!tanggalJatuhTempoRaw) return "unknown";
  const now = new Date();
  const due = new Date(tanggalJatuhTempoRaw);
  if (isNaN(due.getTime())) return "unknown";

  const diffDays = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "lewat";
  if (diffDays <= 30) return "mendekati";
  return "berlaku";
}