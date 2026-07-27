import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";

export async function POST() {
  return clearSessionCookies(NextResponse.json({ ok: true }));
}

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/entrar", request.url));
  return clearSessionCookies(response);
}
