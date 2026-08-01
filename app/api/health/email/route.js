import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    transactionalEmailReady: Boolean(process.env.RESEND_API_KEY),
    senderConfigured: Boolean(process.env.EMAIL_FROM),
    provider: process.env.RESEND_API_KEY ? "resend" : "not_configured"
  }, { headers: { "Cache-Control": "no-store" } });
}
