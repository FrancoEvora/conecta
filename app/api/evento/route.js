import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/supabase";

const ALLOWED_EVENTS = new Set(["view", "cta_click", "form_started", "form_submitted", "alternative_interest", "share"]);
const ALLOWED_CHANNELS = new Set(["copy", "whatsapp", "native", "other"]);

function cleanMetadata(eventType, metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  if (eventType !== "share") return {
    path: String(metadata.path || "").slice(0, 240),
    alternative: Boolean(metadata.alternative),
    source: String(metadata.source || "public_invitation").slice(0, 60)
  };

  const channel = ALLOWED_CHANNELS.has(metadata.channel) ? metadata.channel : "other";
  return {
    channel,
    messageLength: Math.max(0, Math.min(600, Number(metadata.messageLength) || 0)),
    personalized: Boolean(metadata.personalized),
    source: String(metadata.source || "share_studio").slice(0, 60),
    product: String(metadata.product || "").slice(0, 160)
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const eventType = String(body.eventType || "");
    if (!body.code || !body.sessionId || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await rpc("register_public_link_event", {
      p_invite_code: String(body.code).trim().toUpperCase(),
      p_event_type: eventType,
      p_session_hash: crypto.createHash("sha256").update(String(body.sessionId)).digest("hex"),
      p_metadata: cleanMetadata(eventType, body.metadata)
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
