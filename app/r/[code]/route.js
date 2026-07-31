import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { rpc } from "@/lib/supabase";

const BOT_PATTERN = /(facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|whatsapp|slackbot|discordbot|googlebot|bingbot|pinterest|crawler|spider|preview)/i;

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hmac(value) {
  const secret = process.env.CONNECTION_HASH_SECRET || process.env.VERCEL_DEPLOYMENT_ID || "rede-conecta-social-2026";
  return crypto.createHmac("sha256", secret).update(String(value)).digest("hex");
}

function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function siteUrl(path = "") {
  return new URL(path, SITE_URL).toString();
}

function referrerDomain(request) {
  try {
    return new URL(request.headers.get("referer") || "").hostname.toLowerCase();
  } catch {
    return "";
  }
}

async function register(publicCode, eventType, sessionHash, userAgent, request, metadata = {}) {
  try {
    await rpc("register_social_share_event", {
      p_public_code: publicCode,
      p_event_type: eventType,
      p_session_hash: sessionHash,
      p_user_agent_hash: sha(userAgent || "unknown"),
      p_referrer_domain: referrerDomain(request),
      p_metadata: metadata
    });
  } catch {
    // O redirecionamento nunca deve falhar por indisponibilidade momentânea do analytics.
  }
}

export async function GET(request, { params }) {
  const { code } = await params;
  const publicCode = String(code || "").trim();
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(publicCode)) {
    return NextResponse.redirect(siteUrl("/oportunidades"), 302);
  }

  let share;
  try {
    share = await rpc("resolve_social_share_link", { p_public_code: publicCode });
  } catch {
    share = null;
  }
  if (!share?.invitation_code) {
    return NextResponse.redirect(siteUrl("/oportunidades?link=expirado"), 302);
  }

  const userAgent = request.headers.get("user-agent") || "unknown";
  const isBot = BOT_PATTERN.test(userAgent);
  const target = new URL(share.target_path, SITE_URL);
  target.searchParams.set("sc", publicCode);
  target.searchParams.set("utm_source", share.utm_source || "rede_conecta");
  target.searchParams.set("utm_medium", share.utm_medium || "social");
  target.searchParams.set("utm_campaign", share.utm_campaign || "campanha");
  target.searchParams.set("utm_content", share.utm_content || publicCode.slice(0, 8));
  target.searchParams.set("utm_channel", share.channel || "other");

  if (isBot) {
    const hourBucket = new Date().toISOString().slice(0, 13);
    await register(publicCode, "preview", hmac(`${publicCode}:${userAgent}:${hourBucket}`), userAgent, request, { channel: share.channel });

    const title = `${share.connector_name} conectou você ao ${share.product_name}`;
    const description = share.campaign_summary || share.product_description || "Conheça esta oportunidade na Rede Conecta.";
    const image = share.image_url || siteUrl(`/convite/${encodeURIComponent(share.invitation_code)}/opengraph-image?v=4`);
    const canonical = siteUrl(`/r/${encodeURIComponent(publicCode)}`);
    const page = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${html(title)} | Rede Conecta</title>
<meta name="description" content="${html(description)}">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Rede Conecta"><meta property="og:url" content="${html(canonical)}">
<meta property="og:title" content="${html(title)} | Rede Conecta">
<meta property="og:description" content="${html(description)}">
<meta property="og:image" content="${html(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${html(title)} | Rede Conecta">
<meta name="twitter:description" content="${html(description)}"><meta name="twitter:image" content="${html(image)}">
<link rel="canonical" href="${html(canonical)}"><meta name="robots" content="noindex,nofollow">
</head><body><p><a href="${html(target.toString())}">Abrir oportunidade na Rede Conecta</a></p></body></html>`;
    return new NextResponse(page, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=300",
        "x-robots-tag": "noindex, nofollow"
      }
    });
  }

  const existingSession = request.cookies.get("rc_social_sid")?.value;
  const sessionId = existingSession && /^[a-f0-9-]{20,80}$/i.test(existingSession)
    ? existingSession
    : crypto.randomUUID();
  await register(publicCode, "click", sha(sessionId), userAgent, request, { channel: share.channel, path: request.nextUrl.pathname });

  const response = NextResponse.redirect(target, 302);
  if (!existingSession) {
    response.cookies.set("rc_social_sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }
  response.headers.set("cache-control", "private, no-store");
  return response;
}
