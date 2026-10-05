import apiFetch from "../lib/apiFetch"; // Sesuaikan jalur relatif ke folder lib Anda
import { PeminjamType } from "../types/DataAlatUkurTypes";

// Helper untuk mapping data dari backend (nama_peminta -> nama)
const mapResponseItem = (item: any): PeminjamType => ({
  ...item,
  // Memastikan field nama terisi untuk kompatibilitas UI lama, 
  // namun tetap mempertahankan field baru.
  nama: item.nama_peminta || item.nama || "",
});

export const getPeminta = async () => {
  const response = await apiFetch('/peminta');
  return response.data;
};

export async function createPeminta(values: any): Promise<PeminjamType> {
  const payload = {
    // ID di-generate oleh backend, jadi tidak perlu dikirim. 
    // Kita kirimkan rfid_uid, kategori, dan instansi_vendor
    rfid_uid: values.rfid_uid || null,
    kategori: values.kategori,
    instansi_vendor: values.instansi_vendor || null,
    nama_peminta: values.nama_peminta || values.nama,
    divisi: values.divisi || null,
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
    rfid_uid: values.rfid_uid || null,
    kategori: values.kategori,
    instansi_vendor: values.instansi_vendor || null,
    nama_peminta: values.nama_peminta || values.nama,
    divisi: values.divisi || null,
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