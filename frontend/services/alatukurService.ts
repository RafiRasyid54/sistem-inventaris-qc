import apiFetch from "../lib/api"; // Sesuaikan jalur lib/api relatif terhadap folder services/
import { AlatUkur, AlatUkurFormValues } from "../types/DataAlatUkurTypes";

export async function getSemuaAlatUkur(): Promise<AlatUkur[]> {
  return apiFetch<AlatUkur[]>("/alat-ukur");
}

export async function createAlatUkur(data: AlatUkurFormValues): Promise<AlatUkur> {
  return apiFetch<AlatUkur>("/alat-ukur", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAlatUkur(id: string, data: AlatUkurFormValues): Promise<AlatUkur> {
  return apiFetch<AlatUkur>(`/alat-ukur/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAlatUkur(id: string): Promise<void> {
  return apiFetch<void>(`/alat-ukur/${id}`, {
    method: "DELETE",
  });
}