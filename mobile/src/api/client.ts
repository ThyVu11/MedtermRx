const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not configured. Add it to the mobile/.env file.",
  );
}

const createApiUrl = (path: string): string =>{
  const normalizedPath =
    path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseApiResponse<T>(
  response: Response,
): Promise<T> {
  const rawBody = await response.text();

  let body: unknown = null;

  try {
    body = rawBody
      ? JSON.parse(rawBody)
      : null;
  } catch {
    // Leave body as null.
  }

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Request failed: ${response.status}`;

    throw new Error(message);
  }

  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const res = await fetch(url);

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => null) as { error?: string } | null;

    throw new Error(
      body?.error ?? `Request failed: ${res.status}`,
    );
  }

  return (await res.json()) as T;
}

export async function apiPost<
  TResponse,
  TBody = unknown,
>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(
    createApiUrl(path),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
  );

    return parseApiResponse<TResponse>(response);
}