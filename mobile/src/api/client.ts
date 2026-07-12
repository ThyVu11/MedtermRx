//   (find it with `ipconfig getifaddr en0` on Mac, or `ipconfig` on Windows)
const LAN_IP = process.env.LAN_IP || "localhost";
export const API_BASE_URL = `http://${LAN_IP}:3000/api`;

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
