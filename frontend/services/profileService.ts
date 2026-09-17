import apiFetch from "lib/api";

// Bentuk data mentah dari Laravel (snake_case)
interface UserApiResponse {
  id: string;
  full_name: string;
  email: string;
  role: string;
  divisi: string | null;
  no_hp: string | null;
  avatar_path: string | null;
}

// Bentuk yang dipakai komponen (camelCase, cocok dengan ProfileData di ProfileManager.tsx)
export interface ProfileApiData {
  id: string;
  namaLengkap: string;
  role: string;
  divisi: string;
  avatarPath: string | null;
}

export interface UpdateProfilePayload {
  namaLengkap: string;
  divisi: string;
}

export interface ChangePasswordPayload {
  passwordLama: string;
  passwordBaru: string;
  konfirmasiPasswordBaru: string;
}

function mapProfileFromApi(item: UserApiResponse): ProfileApiData {
  return {
    id: item.id,
    namaLengkap: item.full_name,
    role: item.role,
    divisi: item.divisi ?? "-",
    avatarPath: item.avatar_path,
  };
}

// Variabel untuk mencegah request ganda (deduplication)
let profilePromise: Promise<ProfileApiData> | null = null;

export async function getProfile(forceRefresh = false): Promise<ProfileApiData> {
  // Jika sedang ada request yang berjalan dan tidak dipaksa refresh, gunakan promise yang sama
  if (profilePromise && !forceRefresh) {
    return profilePromise;
  }

  profilePromise = (async () => {
    try {
      const data: UserApiResponse = await apiFetch("/profile");
      return mapProfileFromApi(data);
    } finally {
      // Reset cache promise setelah selesai agar bisa di-fetch ulang jika diperlukan nanti
      setTimeout(() => {
        profilePromise = null;
      }, 5000); // Cache aktif selama 5 detik untuk mencegah spam request
    }
  })();

  return profilePromise;
}

export async function updateProfile(values: UpdateProfilePayload): Promise<ProfileApiData> {
  const data: UserApiResponse = await apiFetch("/profile", {
    method: "PUT",
    body: JSON.stringify({
      full_name: values.namaLengkap,
      divisi: values.divisi,
    }),
  });
  profilePromise = null; // Reset cache saat data diubah
  return mapProfileFromApi(data);
}

export async function changePassword(values: ChangePasswordPayload): Promise<void> {
  await apiFetch("/profile/password", {
    method: "PATCH",
    body: JSON.stringify({
      password_lama: values.passwordLama,
      password_baru: values.passwordBaru,
      password_baru_confirmation: values.konfirmasiPasswordBaru,
    }),
  });
}

export async function uploadAvatar(file: File): Promise<{ avatar_path: string; avatar_url: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/profile/photo`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Gagal mengunggah foto profil");
  }

  profilePromise = null; // Reset cache saat avatar diubah
  return res.json();
}