import { NextResponse } from "next/server";
import { authAdminCreateConfirmedUser, authWithPassword, rpc } from "@/lib/supabase";
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

    const created = await authAdminCreateConfirmedUser({
      email,
      password: body.password,
      metadata: {
        signup_kind: "account_invite",
        account_invite_token: token,
        account_invite_id: invitation.invite_id,
        target_kind: invitation.target_kind,
        full_name: invitation.display_name,
        email_confirmed_by_backend: true
      }
    });
    const authUserId = created?.id || created?.user?.id;
    if (!authUserId) throw new Error("invited_user_not_created");

    await rpc("provision_invited_member", {
      p_token: token,
      p_auth_user_id: authUserId,
      p_email: email
    });

    const session = await authWithPassword(email, body.password);
    const response = NextResponse.json({
      ok: true,
      requiresEmailConfirmation: false,
      message: invitation.target_kind === "broker"
        ? "Acesso de corretor ativado com sucesso. Você já pode entrar na plataforma."
        : "Acesso ativado com sucesso. Você já pode entrar na plataforma."
    });
    applySessionCookies(response, session);
    return response;
  } catch (error) {
    const message = String(error?.message || "");
    const duplicate = /registered|already|exists|duplicate/i.test(message);
    const missingAdmin = /missing_service_role|configuração administrativa/i.test(message);
    return NextResponse.json({
      error: duplicate
        ? "Este e-mail já possui conta. Entre normalmente ou recupere sua senha."
        : missingAdmin
          ? "A ativação está temporariamente indisponível por configuração interna."
          : "Não foi possível ativar o convite. Verifique os dados e tente novamente."
    }, { status: duplicate ? 409 : missingAdmin ? 503 : 400 });
  }
}
