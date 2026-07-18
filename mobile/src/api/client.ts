export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(
  /\/+$/,
  "",
);

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not configured. Add it to the mobile/.env file.",
  );
}

export async function apiGet<T>(path: string): Promise<T> {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  console.log("API_BASE_URL =", API_BASE_URL);
  console.log("path =", path);
  console.log("url =", url);

  const res = await fetch(url);

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}
