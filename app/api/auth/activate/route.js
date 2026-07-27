import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { authSignUp, rpc } from "@/lib/supabase";
import { applySessionCookies } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const token = String(body.token || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const invitationRows = await rpc("resolve_account_invite", { p_token: token });
    const invitation = Array.isArray(invitationRows) ? invitationRows[0] : invitationRows;
    if (!invitation || invitation.status !== "pending") {
      return NextResponse.json({ error: "Este convite é inválido, já foi utilizado ou expirou." }, { status: 400 });
    }
    if (email !== String(invitation.email || "").toLowerCase()) {
      return NextResponse.json({ error: "O e-mail informado não corresponde ao convite." }, { status: 400 });
    }
    if (String(body.password || "").length < 8 || body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres e as confirmações precisam coincidir." }, { status: 400 });
    }
    if (!body.termsAccepted) {
      return NextResponse.json({ error: "É necessário aceitar os termos de acesso." }, { status: 400 });
    }
    const data = await authSignUp({
      email,
      password: body.password,
      metadata: { signup_kind: "account_invite", account_invite_token: token },
      redirectTo: `${SITE_URL}/entrar?ativado=1`
    });
    const response = NextResponse.json({
      ok: true,
      requiresEmailConfirmation: !data?.access_token,
      message: data?.access_token ? "Acesso ativado com sucesso." : "Acesso criado. Confirme seu e-mail antes de entrar."
    });
    if (data?.access_token) applySessionCookies(response, data);
    return response;
  } catch (error) {
    const message = String(error?.message || "");
    return NextResponse.json({ error: /registered|already/i.test(message) ? "Este e-mail já possui conta. Entre normalmente ou recupere sua senha." : "Não foi possível ativar o convite. Verifique os dados e tente novamente." }, { status: 400 });
  }
}
