import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { authVerifyOtp } from "@/lib/supabase";
import { applySessionCookies } from "@/lib/session";

const ALLOWED_TYPES = new Set(["signup", "email", "invite", "magiclink", "recovery", "email_change"]);

export async function GET(request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash") || "";
  const type = url.searchParams.get("type") || "";
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next") : "/entrar?confirmado=1";

  if (!tokenHash || !ALLOWED_TYPES.has(type)) {
    return NextResponse.redirect(`${SITE_URL}/confirmar-email?erro=link-invalido`);
  }

  try {
    const session = await authVerifyOtp({ tokenHash, type });
    const response = NextResponse.redirect(`${SITE_URL}${next}`);
    applySessionCookies(response, session);
    return response;
  } catch {
    return NextResponse.redirect(`${SITE_URL}/confirmar-email?erro=link-expirado`);
  }
}
