import apiFetch from "lib/api";
import {
  DashboardSummary,
  TelatKembaliItem,
  AlatTerpopulerItem,
  KerusakanSummary,
  AktivitasItem,
  TrenPeminjamanItem,
  KalibrasiMendekatiItem,
} from "types/DashboardTypes";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export async function getTelatKembali(): Promise<TelatKembaliItem[]> {
  const response = await apiFetch<any>("/dashboard/telat-kembali");
  // Pastikan mengambil properti array-nya jika dibungkus, atau berikan fallback [] jika kosong
  return response.data ?? response ?? [];
}

export async function getAlatTerpopuler(): Promise<AlatTerpopulerItem[]> {
  const response = await apiFetch<any>("/dashboard/alat-terpopuler");
  return response.data ?? response ?? [];
}

export async function getKerusakanSummary(): Promise<KerusakanSummary> {
  return apiFetch<KerusakanSummary>("/dashboard/kerusakan-summary");
}

export async function getAktivitasTerbaru(): Promise<AktivitasItem[]> {
  return apiFetch<AktivitasItem[]>("/dashboard/aktivitas-terbaru");
}

export async function getTrenPeminjaman(): Promise<TrenPeminjamanItem[]> {
  return apiFetch<TrenPeminjamanItem[]>("/dashboard/tren-peminjaman");
}

export async function getKalibrasiMendekati(): Promise<KalibrasiMendekatiItem[]> {
  // Jika backend membungkus respons dalam objek { data: [...] }, sesuaikan penanganan di bawah
  const response = await apiFetch<any>("/dashboard/kalibrasi-mendekati");
  return response.data ?? response;
}