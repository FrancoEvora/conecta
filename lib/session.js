import { cookies } from "next/headers";
import { authGetUser, authRefreshToken } from "@/lib/supabase";

export const ACCESS_COOKIE = "rc_access_token";
export const REFRESH_COOKIE = "rc_refresh_token";

const secure = process.env.NODE_ENV === "production";

export function applySessionCookies(response, session) {
  if (!session?.access_token) return response;
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(60, Number(session.expires_in || 3600) - 30)
  });
  if (session.refresh_token) {
    response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30
    });
  }
  return response;
}

export function clearSessionCookies(response) {
  response.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

export async function readSessionTokens() {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value || "",
    refreshToken: store.get(REFRESH_COOKIE)?.value || ""
  };
}

export async function getServerUser() {
  const tokens = await readSessionTokens();
  if (!tokens.accessToken) return { user: null, ...tokens, needsRefresh: Boolean(tokens.refreshToken) };
  try {
    const user = await authGetUser(tokens.accessToken);
    return { user, ...tokens, needsRefresh: false };
  } catch {
    return { user: null, ...tokens, needsRefresh: Boolean(tokens.refreshToken) };
  }
}

export async function getValidRouteSession() {
  const tokens = await readSessionTokens();
  if (tokens.accessToken) {
    try {
      const user = await authGetUser(tokens.accessToken);
      return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, refreshedSession: null };
    } catch {}
  }
  if (!tokens.refreshToken) return null;
  try {
    const refreshedSession = await authRefreshToken(tokens.refreshToken);
    const user = await authGetUser(refreshedSession.access_token);
    return { user, accessToken: refreshedSession.access_token, refreshToken: refreshedSession.refresh_token, refreshedSession };
  } catch {
    return null;
  }
}
