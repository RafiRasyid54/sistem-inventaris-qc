import apiFetch from "lib/api";
import { AlatukurMasukType, AlatukurMasukFormValues } from "types/DataAlatukurTypes";

interface AlatukurMasukApiResponse {
  id: string;
  tanggal: string;
  alat ukur_id: string;
  jumlah_masuk: number;
  keterangan: string | null;
  alat ukur?: {
    id: string;
    kode_barang: string;
    nama_barang: string;
    merk: string | null;
    type: string | null;
    warna: string | null;
    ukuran: string | null;
    stok: number;
  };
  dicatat_oleh?: string | {
    id: string;
    nama?: string;
    name?: string;
    nama_lengkap?: string;
    nama_pegawai?: string;
  };
  dicatatOleh?: {
    id: string;
    nama?: string;
    name?: string;
  };
  dicatat_oleh_rel?: {
    id: string;
    nama?: string;
    name?: string;
  };
}

interface CreateAlatukurMasukPayload {
  tanggal: string;
  alat ukur_id: string;
  jumlah_masuk: number;
  keterangan: string;
  peminta_id: string;
}

interface UpdateAlatukurMasukPayload {
  tanggal?: string;
  jumlah_masuk?: number;
  keterangan?: string;
}

function mapFromApi(item: AlatukurMasukApiResponse): AlatukurMasukType {
  const relasiUser =
    item.dicatatOleh ||
    item.dicatat_oleh_rel ||
    (typeof item.dicatat_oleh === "object" ? item.dicatat_oleh : null);

  return {
    id: item.id,
    tanggal: item.tanggal,
    alat ukur_id: item.alat ukur_id,
    kode_barang: item.alat ukur?.kode_barang ?? "",
    nama_barang: item.alat ukur?.nama_barang ?? "",
    merk: item.alat ukur?.merk ?? "-",
    tipe: item.alat ukur?.type ?? "-",
    warna: item.alat ukur?.warna ?? "-",
    ukuran: item.alat ukur?.ukuran ?? "-",
    jumlah_masuk: item.jumlah_masuk,
    keterangan: item.keterangan ?? "",

    dicatatOleh: relasiUser ? {
      id: relasiUser.id ?? "",
      name: relasiUser.nama ?? relasiUser.name ?? (relasiUser as any).nama_lengkap ?? (relasiUser as any).nama_pegawai ?? "Tidak Diketahui",
    } : undefined,
  };
}

export async function getAlatukurMasuk(): Promise<AlatukurMasukType[]> {
  const data: AlatukurMasukApiResponse[] = await apiFetch("/alat ukur-masuk");
  return data
    .map(mapFromApi)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

export async function createAlatukurMasuk(
  values: AlatukurMasukFormValues & { peminta_id?: string; id_card?: string }
): Promise<AlatukurMasukType> {
  const payload: CreateAlatukurMasukPayload = {
    tanggal: values.tanggal,
    alat ukur_id: values.alat ukur_id,
    jumlah_masuk: values.jumlah_masuk,
    keterangan: values.keterangan,
    peminta_id: values.peminta_id || values.id_card || "",
  };

  const data: AlatukurMasukApiResponse = await apiFetch("/alat ukur-masuk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapFromApi(data);
}

export async function updateAlatukurMasuk(
  id: string,
  values: { tanggal: string; jumlah_masuk: number; keterangan: string }
): Promise<AlatukurMasukType> {
  const payload: UpdateAlatukurMasukPayload = {
    tanggal: values.tanggal,
    jumlah_masuk: values.jumlah_masuk,
    keterangan: values.keterangan,
  };

  const data: AlatukurMasukApiResponse = await apiFetch(`/alat ukur-masuk/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapFromApi(data);
}

export async function deleteAlatukurMasuk(id: string): Promise<void> {
  await apiFetch(`/alat ukur-masuk/${id}`, { method: "DELETE" });
}