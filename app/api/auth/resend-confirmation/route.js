import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { authResendSignup } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    await authResendSignup(normalized, `${SITE_URL}/entrar?confirmado=1`);
    return NextResponse.json({ ok: true, message: "Se o cadastro estiver aguardando confirmação, um novo e-mail será enviado. Verifique também spam e promoções." });
  } catch {
    return NextResponse.json({ ok: true, message: "Se o cadastro estiver aguardando confirmação, um novo e-mail será enviado. Verifique também spam e promoções." });
  }
}
