import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { authRecover } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized.includes("@")) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    await authRecover(normalized, `${SITE_URL}/nova-senha`);
    return NextResponse.json({ ok: true, message: "Caso exista uma conta, enviaremos as instruções de recuperação por e-mail." });
  } catch {
    return NextResponse.json({ ok: true, message: "Caso exista uma conta, enviaremos as instruções de recuperação por e-mail." });
  }
}
