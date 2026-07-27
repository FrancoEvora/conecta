import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { publicStorageUrl, rpc, storageUpload } from "@/lib/supabase";
import { applySessionCookies, getValidRouteSession } from "@/lib/session";

const buckets = new Set(["catalog-media", "deal-evidence", "credentials"]);
const extensions = new Set(["jpg", "jpeg", "png", "webp", "pdf", "mp4"]);

function safePart(value) {
  return String(value || "arquivo").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

export async function POST(request) {
  const session = await getValidRouteSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const bucket = String(form.get("bucket") || "");
    const folder = safePart(form.get("folder") || "geral");
    if (!(file instanceof File) || !buckets.has(bucket)) return NextResponse.json({ error: "Arquivo ou destino inválido." }, { status: 400 });
    if (file.size <= 0 || file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "O arquivo deve ter no máximo 50 MB." }, { status: 400 });
    const extension = safePart(file.name).split(".").pop()?.toLowerCase();
    if (!extensions.has(extension)) return NextResponse.json({ error: "Formato de arquivo não permitido." }, { status: 400 });
    const context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
    const path = `${context.organization_id}/${folder}/${crypto.randomUUID()}-${safePart(file.name)}`;
    await storageUpload({ bucket, path, file, accessToken: session.accessToken });
    const response = NextResponse.json({ ok: true, bucket, path, publicUrl: bucket === "catalog-media" ? publicStorageUrl(bucket, path) : null });
    if (session.refreshedSession) applySessionCookies(response, session.refreshedSession);
    return response;
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || "Não foi possível enviar o arquivo.") }, { status: 500 });
  }
}
