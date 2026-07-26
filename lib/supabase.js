import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

function headers(accessToken) {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
}

export async function rpc(name, params = {}, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: headers(options.accessToken),
    body: JSON.stringify(params),
    cache: "no-store"
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.error_description || data?.hint || "Falha ao consultar a plataforma.";
    throw new Error(message);
  }
  return data;
}

export async function authWithPassword(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error_description || data?.msg || "Não foi possível entrar.");
  return data;
}
