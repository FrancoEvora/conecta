import { NextResponse } from "next/server";
import { authWithPassword, rpc } from "@/lib/supabase";
import { applySessionCookies } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !body.password) return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    const session = await authWithPassword(email, body.password);
    let context = null;
    try { context = await rpc("get_my_app_context", {}, { accessToken: session.access_token }); } catch (error) {
      return NextResponse.json({ error: "A conta existe, mas o perfil de acesso não foi provisionado corretamente. Contate a administração." }, { status: 403 });
    }
    if (context?.profile_status === "suspended") return NextResponse.json({ error: "Este acesso está suspenso. Contate a Rede Conecta." }, { status: 403 });
    const response = NextResponse.json({ ok: true, context, next: "/painel" });
    applySessionCookies(response, session);
    return response;
  } catch {
    return NextResponse.json({ error: "E-mail ou senha inválidos, ou e-mail ainda não confirmado." }, { status: 401 });
  }
}
