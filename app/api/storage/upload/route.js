import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { publicStorageUrl, rpc, storageUpload } from "@/lib/supabase";
import { applySessionCookies, clearSessionCookies, getValidRouteSession } from "@/lib/session";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const bucketRules = {
  "catalog-media": {
    permissions: ["catalog.edit", "catalog.manage", "materials.manage", "platform.all"],
    extensions: new Set(["jpg", "jpeg", "png", "webp", "pdf", "mp4"]),
    mimes: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"]),
    public: true
  },
  "deal-evidence": {
    permissions: ["deals.manage", "platform.all"],
    extensions: new Set(["jpg", "jpeg", "png", "webp", "pdf"]),
    mimes: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    public: false
  },
  credentials: {
    permissions: ["brokers.manage", "compliance.manage", "platform.all"],
    extensions: new Set(["jpg", "jpeg", "png", "webp", "pdf"]),
    mimes: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    public: false
  }
};

function safePart(value, fallback = "arquivo") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 100) || fallback;
}

function safeFolder(value) {
  const parts = String(value || "geral")
    .split("/")
    .map(part => safePart(part, ""))
    .filter(Boolean)
    .slice(0, 5);
  return parts.length ? parts.join("/") : "geral";
}

function detectedMime(bytes) {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp") return "video/mp4";
  return null;
}

function expectedMimeForExtension(extension) {
  if (["jpg", "jpeg"].includes(extension)) return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "pdf") return "application/pdf";
  if (extension === "mp4") return "video/mp4";
  return null;
}

export async function POST(request) {
  const session = await getValidRouteSession();
  if (!session) {
    return clearSessionCookies(NextResponse.json({ error: "Sessão expirada." }, { status: 401 }));
  }

  try {
    const context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
    const form = await request.formData();
    const file = form.get("file");
    const bucket = String(form.get("bucket") || "");
    const folder = safeFolder(form.get("folder"));
    const rule = bucketRules[bucket];

    if (!(file instanceof File) || !rule) {
      return NextResponse.json({ error: "Arquivo ou destino inválido." }, { status: 400 });
    }

    const permissions = Array.isArray(context.permissions) ? context.permissions : [];
    const permitted = rule.permissions.some(permission => permissions.includes(permission));
    if (context.portal_kind !== "staff" || !permitted) {
      return NextResponse.json({ error: "Você não possui permissão para enviar arquivos neste destino." }, { status: 403 });
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({
        error: "O arquivo preparado deve ter no máximo 4 MB. Imagens maiores são otimizadas automaticamente pelo formulário; para vídeos ou documentos maiores, use uma URL externa."
      }, { status: 400 });
    }

    const safeName = safePart(file.name);
    const extension = safeName.split(".").pop()?.toLowerCase();
    if (!extension || !rule.extensions.has(extension)) {
      return NextResponse.json({ error: "Formato de arquivo não permitido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const signatureMime = detectedMime(buffer);
    const expectedMime = expectedMimeForExtension(extension);
    if (!signatureMime || signatureMime !== expectedMime || !rule.mimes.has(signatureMime)) {
      return NextResponse.json({ error: "O conteúdo do arquivo não corresponde ao formato informado." }, { status: 400 });
    }

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const path = `${context.organization_id}/${folder}/${crypto.randomUUID()}-${safeName}`;
    const uploadFile = new File([buffer], safeName, { type: signatureMime });
    await storageUpload({
      bucket,
      path,
      file: uploadFile,
      accessToken: session.accessToken
    });

    const response = NextResponse.json({
      ok: true,
      bucket,
      path,
      publicUrl: rule.public ? publicStorageUrl(bucket, path) : null,
      mimeType: signatureMime,
      size: file.size,
      sha256
    });
    if (session.refreshedSession) applySessionCookies(response, session.refreshedSession);
    return response;
  } catch (error) {
    const raw = String(error?.message || "Não foi possível enviar o arquivo.");
    const normalized = raw.replaceAll("_", " ");
    const status = /permission|denied|row-level security/i.test(normalized) ? 403 : /invalid|format|size|payload/i.test(normalized) ? 400 : 500;
    const message = /row-level security/i.test(normalized)
      ? "O armazenamento recusou o arquivo por uma regra de segurança. Atualize a página e tente novamente."
      : normalized;
    return NextResponse.json({ error: message }, { status });
  }
}
