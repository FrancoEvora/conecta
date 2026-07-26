import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.code || !body.eventType || !body.sessionId) return NextResponse.json({ ok:false }, { status:400 });
    await rpc("register_public_link_event", {
      p_invite_code: String(body.code).trim().toUpperCase(),
      p_event_type: body.eventType,
      p_session_hash: crypto.createHash("sha256").update(String(body.sessionId)).digest("hex"),
      p_metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {}
    });
    return NextResponse.json({ ok:true });
  } catch { return NextResponse.json({ ok:false }, { status:202 }); }
}
