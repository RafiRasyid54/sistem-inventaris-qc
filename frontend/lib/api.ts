interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Cek apakah request mengirim FormData (untuk upload file)
  const isFormData = options.body instanceof FormData;

  // Buat header dasar
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Hanya set Content-Type JSON jika BUKAN FormData
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // Error jika gagal terhubung sama sekali ke server (CORS / Backend mati)
    throw new Error("Tidak dapat terhubung ke server. Pastikan backend menyala.");
  }

  if (!res.ok) {
    if (res.status === 401 && endpoint !== "/login" && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");

      if (window.location.pathname !== "/signin") {
        window.location.href = "/signin";
      }
      return new Promise<T>(() => {});
    }

    // Ambil teks terlebih dahulu untuk mengantisipasi response berupa HTML (bukan JSON)
    const responseText = await res.text();
    let error: ApiErrorResponse = {};

    try {
      error = JSON.parse(responseText);
    } catch {
      // Jika response dari server berupa HTML (seperti stack trace Laravel 500)
      if (res.status >= 500) {
        // Cetak detail HTML error Laravel ke console browser untuk debugging
        console.error("=== LARAVEL SERVER ERROR 500 (HTML) ===");
        console.error(responseText);
        console.error("=======================================");
        
        throw new Error(`Server Error (${res.status}): Terjadi kesalahan di backend. Cek Console browser (F12) untuk detail.`);
      }
      throw new Error(responseText || `Request gagal: ${res.status}`);
    }

    // Tangani validasi error Laravel (field-specific errors)
    if (error.errors) {
      const firstField = Object.values(error.errors)[0];
      if (firstField && firstField.length > 0) {
        throw new Error(firstField[0]);
      }
    }

    throw new Error(error.message || `Request gagal: ${res.status}`);
  }

  // Tangani respon status 204 (No Content)
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export default apiFetch;