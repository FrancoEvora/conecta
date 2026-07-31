import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ORGANIZATION_SLUG, POLICY_VERSION, SITE_URL } from "@/lib/config";
import { authSignUp, rpc } from "@/lib/supabase";
import { applySessionCookies } from "@/lib/session";

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
      signup_ip_hash: crypto.createHash("sha256").update(ip).digest("hex")
    };

    const data = await authSignUp({
      email,
      password: body.password,
      metadata,
      redirectTo: `${SITE_URL}/entrar?confirmado=1`
    });

    let context = null;
    if (data?.access_token) {
      try { context = await rpc("get_my_app_context", {}, { accessToken: data.access_token }); } catch {}
    }

    const response = NextResponse.json({
      ok: true,
      requiresEmailConfirmation: !data?.access_token,
      status: context?.profile_status || "invited",
      message: data?.access_token
        ? "Conta criada. Seu perfil comercial seguirá para validação da Rede Conecta."
        : "Conta criada. Confirme seu e-mail para concluir o cadastro; a equipe fará a validação do seu perfil em seguida."
    });
    if (data?.access_token) applySessionCookies(response, data);
    return response;
  } catch (error) {
    const message = String(error?.message || "");
    const duplicate = /already|registered|exists|duplicate/i.test(message);
    return NextResponse.json({ error: duplicate ? "Este e-mail já possui cadastro. Use a área de acesso ou recupere sua senha." : "Não foi possível criar sua conta agora. Revise os dados e tente novamente." }, { status: duplicate ? 409 : 500 });
  }
}
