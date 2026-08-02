"use client";

import { useState } from "react";
import ShareComposer from "@/components/ShareComposer";
import { Icon } from "@/components/UI";

async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Não foi possível preparar a publicação.");
  return payload.data;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export default function ShareStudioExperience({ invitation, code, baseUrl, hostname }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const productName = invitation.product_name || "Oportunidade Rede Conecta";
  const connectorName = invitation.connector_display_name || "Rede Conecta";

  async function prepareInstagramPost() {
    if (busy) return;
    setBusy(true);
    setStatus("Criando a arte e o link rastreável…");
    try {
      const data = await request("create_social_share", {
        p_invite_code: String(code).trim().toUpperCase(),
        p_channel: "instagram_post",
        p_post_label: `Post Instagram · ${productName}`,
        p_message_variant: "instagram_feed",
        p_expires_in_days: 90,
        p_metadata: { format: "feed_square", product: productName, source: "share_studio" }
      });
      const trackedUrl = new URL(data.tracked_path || `/r/${data.public_code}`, baseUrl).toString();
      const caption = `Conheça ${productName}.\n\n${connectorName} compartilhou esta oportunidade pela Rede Conecta. Acesse o link oficial para ver os detalhes e autorizar o atendimento:\n${trackedUrl}\n\n#RedeConecta #Oportunidades`;
      const imageUrl = `${String(baseUrl).replace(/\/+$/, "")}/convite/${encodeURIComponent(code)}/instagram-post`;
      const imageResponse = await fetch(imageUrl, { cache: "no-store" });
      if (!imageResponse.ok) throw new Error("Não foi possível gerar a arte do produto.");
      const blob = await imageResponse.blob();
      const file = new File([blob], `rede-conecta-${String(code).toLowerCase()}.png`, { type: blob.type || "image/png" });

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({ files: [file], title: productName, text: caption });
          setStatus("Arte e legenda abertas no compartilhamento do aparelho. Escolha o Instagram e publique no feed.");
          return;
        } catch (error) {
          if (error?.name === "AbortError") {
            setStatus("Publicação cancelada. A arte continua disponível para nova tentativa.");
            return;
          }
          throw error;
        }
      }

      await copyText(caption);
      const download = document.createElement("a");
      download.href = URL.createObjectURL(blob);
      download.download = file.name;
      document.body.appendChild(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(download.href), 1500);
      setStatus("Arte baixada e legenda copiada. Abra o Instagram, crie uma publicação e cole a legenda.");
    } catch (error) {
      setStatus(error?.message || "Não foi possível preparar o post.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <section style={{ marginBottom: 18, padding: 22, border: "1px solid #e0e5eb", borderRadius: 20, background: "linear-gradient(135deg,#fff8f2,#fff)", display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
      <div>
        <span style={{ display: "block", color: "#ff6500", fontSize: 11, fontWeight: 900, letterSpacing: ".12em" }}>PUBLICAÇÃO NO FEED</span>
        <h2 style={{ margin: "7px 0", color: "#071c3a", fontSize: 25 }}>Crie um post com a imagem principal do produto.</h2>
        <p style={{ margin: 0, color: "#657187", lineHeight: 1.55 }}>A plataforma gera uma arte quadrada, uma legenda pronta e um link exclusivo para medir cliques, autorizações e negócios originados pela publicação.</p>
      </div>
      <button type="button" onClick={prepareInstagramPost} disabled={busy} style={{ minHeight: 48, padding: "0 18px", border: 0, borderRadius: 13, background: "linear-gradient(135deg,#ff6500,#e94d00)", color: "white", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <Icon name="chart" size={19}/>{busy ? "Preparando…" : "Criar post para Instagram"}
      </button>
    </section>
    {status && <div role="status" style={{ margin: "-5px 0 18px", padding: "12px 14px", borderRadius: 12, background: "#071c3a", color: "white", fontSize: 13 }}>{status}</div>}
    <ShareComposer invitation={invitation} code={code} baseUrl={baseUrl} hostname={hostname}/>
  </>;
}
