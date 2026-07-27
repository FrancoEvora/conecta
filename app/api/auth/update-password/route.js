import { NextResponse } from "next/server";
import { authUpdateUser } from "@/lib/supabase";
import { applySessionCookies } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.accessToken || String(body.password || "").length < 8 || body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "O link é inválido ou as senhas não atendem aos requisitos." }, { status: 400 });
    }
    await authUpdateUser(body.accessToken, { password: body.password });
    const response = NextResponse.json({ ok: true, message: "Senha atualizada com sucesso." });
    if (body.refreshToken) applySessionCookies(response, { access_token: body.accessToken, refresh_token: body.refreshToken, expires_in: 3600 });
    return response;
  } catch {
    return NextResponse.json({ error: "O link expirou ou não foi possível atualizar a senha. Solicite uma nova recuperação." }, { status: 400 });
  }
}
