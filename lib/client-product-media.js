"use client";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024;
const MAX_SOURCE_IMAGE_BYTES = 30 * 1024 * 1024;

function safeBaseName(name) {
  return String(name || "imagem")
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "imagem";
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Não foi possível otimizar a imagem.")), type, quality);
  });
}

async function loadImage(file) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw(context, width, height) {
        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();
      }
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
      element.src = url;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw(context, width, height) {
        context.drawImage(image, 0, 0, width, height);
      }
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareCatalogFile(file) {
  if (!(file instanceof File)) throw new Error("Arquivo inválido.");

  if (!IMAGE_TYPES.has(file.type)) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("Vídeos e documentos devem ter no máximo 4 MB. Para arquivos maiores, use uma URL externa.");
    }
    return { file, width: null, height: null, optimized: false };
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("A imagem original deve ter no máximo 30 MB.");
  }

  const source = await loadImage(file);
  const maxDimension = 2400;
  const initialScale = Math.min(1, maxDimension / Math.max(source.width, source.height));
  let width = Math.max(1, Math.round(source.width * initialScale));
  let height = Math.max(1, Math.round(source.height * initialScale));
  let quality = 0.9;
  let blob = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    source.draw(context, width, height);

    try {
      blob = await canvasBlob(canvas, "image/webp", quality);
    } catch {
      blob = await canvasBlob(canvas, "image/jpeg", quality);
    }

    if (blob.size <= MAX_UPLOAD_BYTES) break;
    quality = Math.max(0.58, quality - 0.08);
    width = Math.max(720, Math.round(width * 0.88));
    height = Math.max(720, Math.round(height * 0.88));
  }

  if (!blob || blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Não foi possível reduzir a imagem para o limite seguro de envio.");
  }

  const type = blob.type || "image/webp";
  const extension = type === "image/jpeg" ? "jpg" : "webp";
  const prepared = new File([blob], `${safeBaseName(file.name)}.${extension}`, {
    type,
    lastModified: Date.now()
  });

  return {
    file: prepared,
    width,
    height,
    optimized: prepared.size < file.size || prepared.type !== file.type
  };
}

async function postRpc(operation, params) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Não foi possível registrar a mídia.");
  return payload.data;
}

export async function uploadProductMedia({
  productId,
  file,
  usageScope = "gallery",
  mediaType,
  title = "",
  altText = "",
  sortOrder = 0,
  campaignId = "",
  metadata = {}
}) {
  if (!productId) throw new Error("Salve o produto antes de enviar a mídia.");
  const prepared = await prepareCatalogFile(file);
  const uploadForm = new FormData();
  uploadForm.append("file", prepared.file);
  uploadForm.append("bucket", "catalog-media");
  uploadForm.append("folder", `produtos/${productId}`);

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: uploadForm
  });
  const upload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(upload.error || "Não foi possível enviar o arquivo.");

  const inferredType = mediaType || (
    prepared.file.type.startsWith("image/")
      ? "image"
      : prepared.file.type === "video/mp4"
        ? "video"
        : "document"
  );

  const media = await postRpc("upsert_product_media", {
    p_media_id: null,
    p_payload: {
      product_id: productId,
      campaign_id: campaignId || "",
      media_type: inferredType,
      usage_scope: usageScope,
      title: title || prepared.file.name,
      alt_text: altText || title || prepared.file.name,
      sort_order: Number(sortOrder) || 0,
      storage_path: upload.path,
      public_url: upload.publicUrl,
      mime_type: upload.mimeType,
      file_size_bytes: upload.size,
      width_pixels: prepared.width || "",
      height_pixels: prepared.height || "",
      metadata: {
        ...metadata,
        sha256: upload.sha256,
        original_name: file.name,
        optimized: prepared.optimized
      }
    }
  });

  return { media, upload, prepared };
}

export async function registerExternalProductMedia({
  mediaId = null,
  productId,
  campaignId = "",
  mediaType = "image",
  usageScope = "gallery",
  title = "",
  altText = "",
  sortOrder = 0,
  publicUrl,
  metadata = {}
}) {
  if (!productId || !publicUrl) throw new Error("Informe o produto e uma URL válida.");
  return postRpc("upsert_product_media", {
    p_media_id: mediaId,
    p_payload: {
      product_id: productId,
      campaign_id: campaignId || "",
      media_type: mediaType,
      usage_scope: usageScope,
      title,
      alt_text: altText,
      sort_order: Number(sortOrder) || 0,
      storage_path: "",
      public_url: publicUrl,
      mime_type: "",
      file_size_bytes: "",
      width_pixels: "",
      height_pixels: "",
      metadata
    }
  });
}
