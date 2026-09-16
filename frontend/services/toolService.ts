import apiFetch from "lib/api";
import { AlatukurItemType, AlatukurFormValues } from "types/DataAlatukurTypes";

// Bentuk data mentah persis seperti yang dikirim Laravel (snake_case)
interface AlatukurApiResponse {
  id: string;
  kode_barang: string;
  nama_barang: string;
  merk: string | null;
  type: string | null;
  warna: string | null;
  ukuran: string | null;
  keadaan: string;
  stok: number;
  kategori: string | null;
  sedang_dipinjam: number;
}

// Bentuk payload yang dikirim ke Laravel saat create/update
interface AlatukurApiPayload {
  kode_barang: string;
  nama_barang: string;
  merk: string;
  type: string;
  warna: string;
  ukuran: string;
  keadaan: string;
  stok: number;
  kategori: string;
}

const keadaanToKondisi = (keadaan: string): AlatukurItemType["kondisi"] => {
  return keadaan === "R" ? "Rusak" : "Baik";
};

const kondisiToKeadaan = (kondisi: AlatukurItemType["kondisi"]): string => {
  return kondisi === "Baik" ? "B" : "R";
};

// Ubah 1 objek dari bentuk backend (snake_case) ke bentuk yang dipakai komponen (camelCase)
function mapAlatukurFromApi(item: AlatukurApiResponse): AlatukurItemType {
  return {
    id: item.id,
    kodeBarang: item.kode_barang,
    namaBarang: item.nama_barang,
    merk: item.merk ?? "-",
    tipe: item.type ?? "-",
    warna: item.warna ?? "-",
    ukuran: item.ukuran ?? "-",
    kondisi: keadaanToKondisi(item.keadaan),
    stok: item.stok,
    dipinjam: item.sedang_dipinjam,
    kategori: (item.kategori as AlatukurItemType["kategori"]) ?? "alat_biasa",
  };
}

// Ubah form values (camelCase) ke payload yang dimengerti Laravel (snake_case)
function mapAlatukurToApi(values: AlatukurFormValues): AlatukurApiPayload {
  return {
    kode_barang: values.kodeBarang,
    nama_barang: values.namaBarang,
    merk: values.merk,
    type: values.tipe,
    warna: values.warna,
    ukuran: values.ukuran,
    keadaan: kondisiToKeadaan(values.kondisi),
    stok: values.stok,
    kategori: values.kategori ?? "alat_biasa",
  };
}

function sortByKode(alat ukur: AlatukurItemType[]): AlatukurItemType[] {
  return [...alat ukur].sort((a, b) =>
    b.kodeBarang.localeCompare(a.kodeBarang, undefined, { numeric: true })
  );
}

export async function getAlatukur(): Promise<AlatukurItemType[]> {
  const data: AlatukurApiResponse[] = await apiFetch("/alat ukur");
  return sortByKode(data.map(mapAlatukurFromApi));
}

export async function createAlatukur(values: AlatukurFormValues): Promise<AlatukurItemType> {
  const data: AlatukurApiResponse = await apiFetch("/alat ukur", {
    method: "POST",
    body: JSON.stringify(mapAlatukurToApi(values)),
  });
  return mapAlatukurFromApi(data);
}

export async function updateAlatukur(id: string, values: AlatukurFormValues): Promise<AlatukurItemType> {
  const data: AlatukurApiResponse = await apiFetch(`/alat ukur/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapAlatukurToApi(values)),
  });
  return mapAlatukurFromApi(data);
}

export async function deleteAlatukur(id: string): Promise<void> {
  await apiFetch(`/alat ukur/${id}`, { method: "DELETE" });
}

export async function updateAlatukurKondisi(
  id: string,
  kondisi: "Baik" | "Rusak"
): Promise<void> {
  const keadaan = kondisi === "Rusak" ? "R" : "B";
  await apiFetch(`/alat ukur/${id}`, {
    method: "PUT",
    body: JSON.stringify({ keadaan }),
  });
}

export async function kurangiStokAlatukur(id: string, jumlah: number): Promise<void> {
  await apiFetch(`/alat ukur/${id}/kurangi-stok`, {
    method: "PATCH",
    body: JSON.stringify({ jumlah }),
  });
}