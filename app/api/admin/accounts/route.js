import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { authAdminUpdateUser, authRecover, rpc } from "@/lib/supabase";
import { applySessionCookies, clearSessionCookies, getValidRouteSession } from "@/lib/session";

function strongPassword(value) {
  return typeof value === "string" && value.length >= 10 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export async function POST(request) {
  const session = await getValidRouteSession();
  if (!session) return clearSessionCookies(NextResponse.json({ error: "Sessão expirada." }, { status: 401 }));

  try {
    const body = await request.json();
    const profileId = String(body.profileId || "");
    const action = String(body.action || "");
    if (!profileId) return NextResponse.json({ error: "Usuário não informado." }, { status: 400 });

    const identity = await rpc("admin_get_account_identity", { p_profile_id: profileId }, { accessToken: session.accessToken });
    if (!identity?.auth_user_id || !identity?.email) {
      return NextResponse.json({ error: "A conta de autenticação deste usuário não foi localizada." }, { status: 400 });
    }

    let message = "Operação concluída.";
    if (action === "set_password") {
      const password = String(body.password || "");
      if (!strongPassword(password)) {
        return NextResponse.json({ error: "A senha temporária deve ter ao menos 10 caracteres, maiúscula, minúscula, número e símbolo." }, { status: 400 });
      }
      await authAdminUpdateUser(identity.auth_user_id, {
        password,
        email_confirm: true,
        ban_duration: "none",
        user_metadata: { force_password_change: true, password_changed_by_admin_at: new Date().toISOString() }
      });
      message = "Senha temporária definida. O usuário poderá entrar imediatamente e deverá substituí-la.";
    } else if (action === "send_recovery") {
      await authRecover(identity.email, `${SITE_URL}/redefinir-senha`);
      message = "E-mail de redefinição solicitado para o usuário.";
    } else if (action === "suspend") {
      await rpc("admin_set_access_status", { p_profile_id: profileId, p_status: "suspended", p_reason: String(body.reason || "Acesso suspenso pela gestão.") }, { accessToken: session.accessToken });
      await authAdminUpdateUser(identity.auth_user_id, { ban_duration: "876000h" });
      message = "Usuário suspenso, inclusive no serviço de autenticação.";
    } else if (action === "reactivate") {
      await authAdminUpdateUser(identity.auth_user_id, { ban_duration: "none", email_confirm: true });
      await rpc("admin_set_access_status", { p_profile_id: profileId, p_status: "active", p_reason: String(body.reason || "Acesso reativado pela gestão.") }, { accessToken: session.accessToken });
      message = "Usuário reativado e liberado para entrar.";
    } else {
      return NextResponse.json({ error: "Ação administrativa inválida." }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true, message });
    if (session.refreshedSession) applySessionCookies(response, session.refreshedSession);
    return response;
  } catch (error) {
    const message = String(error?.message || "Não foi possível concluir a operação.").replaceAll("_", " ");
    const status = /permission|denied/i.test(message) ? 403 : /invalid|required|not found/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
