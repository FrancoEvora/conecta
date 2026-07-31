import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/supabase";

const allowedEvents = new Set(["landing", "authorization"]);

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function safeDomain(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 255);
  } catch {
    return "";
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const publicCode = String(body.publicCode || "").trim();
    const eventType = String(body.eventType || "").trim();
    const sessionId = String(body.sessionId || "").trim();
    const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

    if (!allowedEvents.has(eventType) || !/^[A-Za-z0-9_-]{16,64}$/.test(publicCode) || sessionId.length < 16 || sessionId.length > 160) {
      return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "unknown";
    const referrer = request.headers.get("referer") || "";
    const data = await rpc("register_social_share_event", {
      p_public_code: publicCode,
      p_event_type: eventType,
      p_session_hash: sha(sessionId),
      p_user_agent_hash: sha(userAgent),
      p_referrer_domain: safeDomain(referrer),
      p_metadata: metadata
    });

    return NextResponse.json({ ok: true, eventId: data });
  } catch (error) {
    const message = String(error?.message || "Não foi possível registrar o evento.");
    const status = /invalid/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message.replaceAll("_", " ") }, { status });
  }
}
