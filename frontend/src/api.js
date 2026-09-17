const BASE = import.meta.env.VITE_API_URL;

export const getToken = () => localStorage.getItem("access");

export function saveSession({ access, refresh, username, school }) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("username", username);
  localStorage.setItem("school", school ?? "");
}

export const clearSession = () => localStorage.clear();

export async function api(path, { method, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method: method ?? (body !== undefined ? "POST" : "GET"),
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    clearSession();
    window.location.href = "/login";
    return;
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data
      ? Object.values(data).flat().join(" ")
      : `Algo salió mal (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
