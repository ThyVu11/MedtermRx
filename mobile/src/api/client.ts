export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api";

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not configured. Add it to the mobile/.env file.",
  );
}

const buildUrl = (path: string): string => {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

async function getErrorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;

  return body?.error ?? `Request failed: ${res.status}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path));

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return (await res.json()) as T;
}
export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return (await res.json()) as T;
}
