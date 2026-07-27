import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

function buildHeaders(accessToken, extra = {}, includeJson = true) {
  return {
    apikey: SUPABASE_KEY,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...extra
  };
}

export async function supabaseRequest(path, options = {}) {
  const { method = "GET", body, accessToken, headers = {}, cache = "no-store", includeJson = true } = options;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: buildHeaders(accessToken, headers, includeJson),
    body: body === undefined ? undefined : includeJson ? JSON.stringify(body) : body,
    cache
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.error_description || data?.msg || data?.hint || `Falha na plataforma (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export function rpc(name, params = {}, options = {}) {
  return supabaseRequest(`/rest/v1/rpc/${name}`, { method: "POST", body: params, accessToken: options.accessToken });
}

export function authWithPassword(email, password) {
  return supabaseRequest("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
}

export function authRefreshToken(refreshToken) {
  return supabaseRequest("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: refreshToken } });
}

export function authSignUp({ email, password, metadata = {}, redirectTo }) {
  const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
  return supabaseRequest(`/auth/v1/signup${query}`, { method: "POST", body: { email, password, data: metadata } });
}

export function authGetUser(accessToken) {
  return supabaseRequest("/auth/v1/user", { accessToken });
}

export function authRecover(email, redirectTo) {
  const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
  return supabaseRequest(`/auth/v1/recover${query}`, { method: "POST", body: { email } });
}

export function authUpdateUser(accessToken, payload) {
  return supabaseRequest("/auth/v1/user", { method: "PUT", body: payload, accessToken });
}

export async function storageUpload({ bucket, path, file, accessToken, upsert = false }) {
  return supabaseRequest(`/storage/v1/object/${bucket}/${path}`, {
    method: "POST", body: file, accessToken, includeJson: false,
    headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": upsert ? "true" : "false" }
  });
}

export function publicStorageUrl(bucket, path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
