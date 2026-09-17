export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8001/api";

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  console.log("API URL:", `${baseUrl}${endpoint}`);
  console.log("TOKEN:", token);

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(
      errorData.message || `HTTP Error ${res.status}`
    );
  }

  return res.json();
}

export default apiFetch;