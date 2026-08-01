import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ORGANIZATION_SLUG, POLICY_VERSION } from "@/lib/config";
import { authAdminCreateConfirmedUser, authWithPassword, rpc } from "@/lib/supabase";
import { applySessionCookies } from "@/lib/session";
import { connectorApplicationReceivedEmail, sendTransactionalEmail } from "@/lib/transactional-email";

const ALLOWED_SEGMENTS = new Set(["imoveis","veiculos","perfumaria","energia-solar","agronegocio","turismo","seguros","consorcios","saude","educacao","tecnologia","construcao","moda","investimentos","outros"]);
const ALLOWED_CHANNELS = new Set(["WhatsApp","Instagram","Facebook","LinkedIn","TikTok","Telegram","E-mail","Presencialmente"]);
const ALLOWED_NETWORK_SIZES = new Set(["up_to_100","100_500","500_2000","over_2000"]);

function phone(value) { return String(value || "").replace(/\D/g, ""); }
function clean(value, limit = 500) { return String(value || "").trim().slice(0, limit); }
function cleanList(value, allowed, limit = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => clean(item, 80)).filter(item => allowed ? allowed.has(item) : item.length >= 2))].slice(0, limit);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const cleanPhone = phone(body.phone);
    const email = clean(body.email, 160).toLowerCase();
    const fullName = clean(body.fullName, 80);
    const segments = cleanList(body.segments, ALLOWED_SEGMENTS, 15);
    const channels = cleanList(body.channels, ALLOWED_CHANNELS, 8);
    const cities = cleanList(body.cities, null, 8);
    const networkSize = ALLOWED_NETWORK_SIZES.has(body.networkSize) ? body.networkSize : "";

    if (fullName.length < 2 || !email.includes("@") || cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ error: "Informe nome, e-mail e WhatsApp válidos." }, { status: 400 });
    }
    if (!segments.length || !channels.length || !networkSize) {
      return NextResponse.json({ error: "Selecione seus mercados, o alcance da rede e ao menos um canal de relacionamento." }, { status: 400 });
    }
    if (String(body.password || "").length < 8 || body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres e as confirmações precisam coincidir." }, { status: 400 });
    }
    if (!body.termsAccepted) {
      return NextResponse.json({ error: "É necessário aceitar os termos e a política de privacidade." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const metadata = {
      signup_kind: "connector",
      organization_slug: ORGANIZATION_SLUG,
      full_name: fullName,
      phone: cleanPhone,
      city: clean(body.city, 100),
      state: clean(body.state, 2).toUpperCase(),
      occupation: clean(body.occupation, 120),
      network_profile: clean(body.networkProfile, 1500),
      connector_segments: segments,
      connector_channels: channels,
      connector_cities: cities,
      connector_network_size: networkSize,
      connector_objective: clean(body.objective, 600),
      commercial_profile_version: "connector-dna-2026-07-31",
      terms_version: POLICY_VERSION,
      signup_ip_hash: crypto.createHash("sha256").update(ip).digest("hex"),
      email_validation_mode: "internal_validation_temporary",
      email_confirmed_by_backend: true
    };

    await authAdminCreateConfirmedUser({ email, password: body.password, metadata });
    const session = await authWithPassword(email, body.password);

    let context = null;
    if (session?.access_token) {
      try { context = await rpc("get_my_app_context", {}, { accessToken: session.access_token }); } catch {}
    }

    let welcomeEmail = { sent: false, reason: "not_attempted" };
    try {
      const message = connectorApplicationReceivedEmail({ fullName });
      welcomeEmail = await sendTransactionalEmail({ to: email, ...message });
    } catch (emailError) {
      console.error("connector_welcome_email_failed", { message: emailError?.message || "unknown", emailDomain: email.split("@")[1] || "unknown" });
      welcomeEmail = { sent: false, reason: "provider_error" };
    }

    const response = NextResponse.json({
      ok: true,
      requiresEmailConfirmation: false,
      status: context?.profile_status || "invited",
      welcomeEmailQueued: welcomeEmail.sent === true,
      message: welcomeEmail.sent
        ? "Conta criada. Enviamos um e-mail de boas-vindas e seu perfil seguirá para validação interna da Rede Conecta."
        : "Conta criada. Você já pode acessar a plataforma; seu perfil seguirá para validação interna da Rede Conecta."
    });
    applySessionCookies(response, session);
    return response;
  } catch (error) {
    const message = String(error?.message || "");
    const duplicate = /already|registered|exists|duplicate/i.test(message);
    const missingAdminKey = error?.code === "missing_service_role" || /configuração administrativa/i.test(message);

    return NextResponse.json({
      error: duplicate
        ? "Este e-mail já possui cadastro. Use a área de acesso ou recupere sua senha."
        : missingAdminKey
          ? "O cadastro está temporariamente indisponível por configuração interna. A equipe técnica já foi avisada."
          : "Não foi possível criar sua conta agora. Revise os dados e tente novamente."
    }, { status: duplicate ? 409 : missingAdminKey ? 503 : 500 });
  }
}
