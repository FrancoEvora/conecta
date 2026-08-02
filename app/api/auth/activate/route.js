import { NextResponse } from "next/server";
import { authAdminCreateConfirmedUser, authAdminUpdateUser, authWithPassword, rpc } from "@/lib/supabase";
import { applySessionCookies } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const token = String(body.token || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const invitation = await rpc("resolve_account_invite_v2", { p_token: token });

    if (!invitation || ["expired", "revoked"].includes(invitation.status)) {
      return NextResponse.json({ error: "Este convite não está mais disponível. Solicite um novo convite à gestão." }, { status: 400 });
    }
    if (email !== String(invitation.email || "").toLowerCase()) {
      return NextResponse.json({ error: "O e-mail informado não corresponde ao convite." }, { status: 400 });
    }
    if (password.length < 8 || password !== body.confirmPassword) {
      return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres e as confirmações precisam coincidir." }, { status: 400 });
    }
    if (!body.termsAccepted) {
      return NextResponse.json({ error: "É necessário aceitar os termos de acesso." }, { status: 400 });
    }

    let authUserId = invitation.auth_user_id || null;

    if (!authUserId) {
      const created = await authAdminCreateConfirmedUser({
        email,
        password,
        metadata: {
          signup_kind: "account_invite",
          account_invite_token: token,
          account_invite_id: invitation.invite_id,
          target_kind: invitation.target_kind,
          full_name: invitation.display_name,
          email_confirmed_by_backend: true
        }
      });
      authUserId = created?.id || created?.user?.id;
      if (!authUserId) throw new Error("invited_user_not_created");
    } else {
      await authAdminUpdateUser(authUserId, {
        password,
        email_confirm: true,
        ban_duration: "none",
        user_metadata: {
          signup_kind: "account_invite",
          account_invite_id: invitation.invite_id,
          target_kind: invitation.target_kind,
          full_name: invitation.display_name,
          activation_recovered: invitation.status === "accepted"
        }
      });
    }

    await rpc("complete_account_invite_activation", {
      p_token: token,
      p_auth_user_id: authUserId,
      p_email: email
    });

    let session = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        session = await authWithPassword(email, password);
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
      }
    }

    const response = NextResponse.json({
      ok: true,
      requiresEmailConfirmation: false,
      message: invitation.status === "accepted"
        ? "Acesso recuperado e senha atualizada. Você já pode usar a plataforma."
        : invitation.target_kind === "broker"
          ? "Acesso de especialista comercial ativado com sucesso."
          : "Acesso ativado com sucesso."
    });
    applySessionCookies(response, session);
    return response;
  } catch (error) {
    const message = String(error?.message || "");
    const missingAdmin = /missing_service_role|configuração administrativa/i.test(message);
    const unavailable = /invite_not_found|invite_not_available/i.test(message);
    return NextResponse.json({
      error: missingAdmin
        ? "A ativação está temporariamente indisponível por configuração interna."
        : unavailable
          ? "Este convite não está mais disponível. Solicite um novo convite à gestão."
          : "Não foi possível concluir a ativação. A conta não foi perdida; tente novamente ou solicite a redefinição da senha."
    }, { status: missingAdmin ? 503 : 400 });
  }
}
