import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { POLICY_VERSION } from "@/lib/config";
import { rpc } from "@/lib/supabase";

function sha(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
function hmac(value) { return crypto.createHmac("sha256", process.env.CONNECTION_HASH_SECRET || process.env.VERCEL_DEPLOYMENT_ID || "rede-conecta-mvp-2026").update(String(value)).digest("hex"); }
function phone(value) { return String(value || "").replace(/\D/g, ""); }

export async function POST(request) {
  try {
    const body = await request.json();
    const cleanPhone = phone(body.phone);
    if (!body.contactConsent || String(body.firstName || "").trim().length < 2 || cleanPhone.length < 10 || !body.code || !body.campaignSlug) {
      return NextResponse.json({ error: "Preencha nome, WhatsApp e autorização para contato." }, { status: 400 });
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    const fingerprint = hmac(`${body.campaignSlug}:${cleanPhone}:${String(body.email || "").trim().toLowerCase()}`);
    const data = await rpc("submit_product_interest", {
      p_invite_code: String(body.code).trim().toUpperCase(),
      p_campaign_slug: String(body.campaignSlug).trim(),
      p_first_name: String(body.firstName).trim(),
      p_phone: cleanPhone,
      p_email: String(body.email || "").trim() || null,
      p_preferred_time: String(body.preferredTime || "A combinar").trim(),
      p_interest: String(body.interest || "Quero conhecer o produto").trim(),
      p_contact_consent: true,
      p_marketing_consent: Boolean(body.marketingConsent),
      p_policy_version: POLICY_VERSION,
      p_ip_hmac: hmac(ip),
      p_user_agent_hash: sha(ua),
      p_contact_fingerprint: fingerprint,
      p_alternative_discovery_authorized: Boolean(body.alternativeDiscoveryAuthorized),
      p_product_rejection_reason: body.alternativeDiscoveryAuthorized ? String(body.productRejectionReason || "Produto de origem não aderente ao interesse atual.").trim() : null
    });
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, connectionId: result?.connection_id, protocol: result?.protocol });
  } catch (error) {
    console.error("interest_submission", error);
    return NextResponse.json({ error: "Não foi possível registrar agora. Revise os dados e tente novamente." }, { status: 500 });
  }
}
