import apiFetch from "../lib/apiFetch"; // Sesuaikan jalur relatif ke folder lib Anda
import { PeminjamType } from "../types/DataAlatUkurTypes";

// Helper untuk mapping data dari backend (nama_peminta -> nama)
const mapResponseItem = (item: any): PeminjamType => ({
  ...item,
  nama: item.nama_peminta || item.nama || "",
});

// di services/pemintaService.ts
export const getPeminta = async () => {
  const response = await apiFetch('/peminta'); // sesuaikan endpoint kamu
  return response.data;
};

export async function createPeminta(values: any): Promise<PeminjamType> {
  const payload = {
    id: values.id || undefined, // Biarkan kosong/undefined jika di-generate otomatis oleh backend
    nama_peminta: values.nama || values.nama_peminta,
    divisi: values.divisi,
    role: values.role,
  };

  const res = await apiFetch<{ status: string; data: any }>("/peminta", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapResponseItem(res.data);
}

export async function updatePeminta(id: string, values: any): Promise<PeminjamType> {
  const payload = {
    nama_peminta: values.nama || values.nama_peminta,
    divisi: values.divisi,
    role: values.role,
  };

  const res = await apiFetch<{ status: string; data: any }>(`/peminta/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapResponseItem(res.data);
}

export async function nonaktifkanPeminta(id: string): Promise<PeminjamType> {
  const res = await apiFetch<{ status: string; data: any }>(`/peminta/${id}`, {
    method: "DELETE",
  });
  return mapResponseItem(res.data);
}

export async function aktifkanPeminta(id: string): Promise<PeminjamType> {
  const res = await apiFetch<{ status: string; data: any }>(`/peminta/${id}/aktifkan`, {
    method: "PATCH",
  });
  return mapResponseItem(res.data);
}

export async function updateRolePeminta(id: string, roleBaru: string): Promise<PeminjamType> {
  const res = await apiFetch<{ status: string; data: any }>(`/peminta/${id}`, {
    method: "PUT",
    body: JSON.stringify({ role: roleBaru }),
  });
  return mapResponseItem(res.data);
}