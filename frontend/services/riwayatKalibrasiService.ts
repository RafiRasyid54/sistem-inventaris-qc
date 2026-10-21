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
    fileSertifikatUrl: item.file_sertifikat_url ?? null,
  };
}

/**
 * Ambil semua riwayat kalibrasi (lintas alat).
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
  fileSertifikat?: File;
}

export async function createRiwayatKalibrasi(
  payload: CreateKalibrasiPayload
): Promise<void> {
  // Pakai FormData karena ada file. Jangan set header Content-Type manual,
  // browser akan mengisi boundary multipart-nya sendiri.
  const fd = new FormData();
  fd.append("alat_ukur_id", payload.alatUkurId);
  fd.append("tanggal_kalibrasi", payload.tanggalKalibrasi);
  if (payload.tanggalJatuhTempo) {
    fd.append("tanggal_jatuh_tempo", payload.tanggalJatuhTempo);
  }
  fd.append("kondisi", payload.kondisi);
  if (payload.pelaksanaKalibrasi) {
    fd.append("pelaksana_kalibrasi", payload.pelaksanaKalibrasi);
  }
  if (payload.keterangan) {
    fd.append("keterangan", payload.keterangan);
  }
  if (payload.fileSertifikat) {
    fd.append("file_sertifikat", payload.fileSertifikat);
  }

  await apiFetch("/riwayat-kalibrasi", {
    method: "POST",
    body: fd,
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