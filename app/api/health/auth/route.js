import { NextResponse } from "next/server";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    adminSignupReady: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    confirmationMode: SUPABASE_SERVICE_ROLE_KEY ? "backend_confirmed" : "provider_confirmation"
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
