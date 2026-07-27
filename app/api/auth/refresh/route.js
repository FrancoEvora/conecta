import { NextResponse } from "next/server";
import { authRefreshToken } from "@/lib/supabase";
import { ACCESS_COOKIE, REFRESH_COOKIE, applySessionCookies, clearSessionCookies } from "@/lib/session";

function safeNext(value) {
  const next = String(value || "/painel");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/painel";
}

export async function GET(request) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (!refreshToken) return NextResponse.redirect(new URL(`/entrar?next=${encodeURIComponent(next)}`, request.url));
  try {
    const session = await authRefreshToken(refreshToken);
    const response = NextResponse.redirect(new URL(next, request.url));
    applySessionCookies(response, session);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/entrar?expirado=1", request.url));
    clearSessionCookies(response);
    response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }
}
