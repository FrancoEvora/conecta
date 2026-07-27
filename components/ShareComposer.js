"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/UI";
import styles from "./ShareComposer.module.css";

const MAX_MESSAGE_LENGTH = 600;
const DEFAULT_BASE_URL = "https://conecta-pearl.vercel.app";

function getSessionId() {
  const key = "conecta-share-session";
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
  }
  return value;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export default function ShareComposer({ invitation, code, baseUrl = DEFAULT_BASE_URL, modal = false, onClose }) {
  const productName = invitation.product_name || invitation.productName || "oportunidade selecionada";
  const connectorName = invitation.connector_display_name || invitation.connectorName || "Rede Conecta";
  const location = invitation.campaign_location || invitation.location || invitation.product_service_region || "";
  const summary = invitation.campaign_summary || invitation.product_description || "Conheça os detalhes desta oportunidade.";
  const category = invitation.product_category || "Oportunidade imobiliária";
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const inviteUrl = `${normalizedBaseUrl}/convite/${encodeURIComponent(code)}`;
  const previewImageUrl = `${inviteUrl}/opengraph-image?v=3`;
  const hostname = useMemo(() => {
    try { return new URL(normalizedBaseUrl).hostname; } catch { return "conecta-pearl.vercel.app"; }
  }, [normalizedBaseUrl]);

  const templates = useMemo(() => [
    `Olá! Lembrei de você ao conhecer o ${productName}. Acho que pode fazer sentido para o que você procura.`,
    `Quero compartilhar com você uma oportunidade que conheci pela Rede Conecta: ${productName}. Veja com calma e, caso faça sentido, autorize o atendimento.`,
    `Vi esta oportunidade e pensei em você. O ${productName} reúne características interessantes e o link abaixo apresenta as informações oficiais.`
  ], [productName]);

  const [message, setMessage] = useState(templates[0]);
  const [draftReady, setDraftReady] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const draftKey = `conecta-share-draft:${code}`;

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved && saved.length <= MAX_MESSAGE_LENGTH) setMessage(saved);
    setDraftReady(true);
  }, [draftKey]);

  useEffect(() => {
    if (draftReady) localStorage.setItem(draftKey, message);
  }, [draftKey, draftReady, message]);

  useEffect(() => {
    if (!modal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = event => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modal, onClose]);

  const officialMessage = useMemo(() => [
    "🔒 Convite oficial da Rede Conecta",
    `Enviado por: ${connectorName}`,
    `Produto de origem: ${productName}`,
    "O atendimento só começa se você autorizar no próprio link.",
    `Confira o domínio: ${hostname}. A Rede Conecta não solicita pagamento por este convite.`
  ].join("\n"), [connectorName, hostname, productName]);

  const personalMessage = message.trim();
  const completeMessage = [personalMessage, officialMessage, inviteUrl].filter(Boolean).join("\n\n");

  async function registerShare(channel) {
    try {
      await fetch("/api/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          eventType: "share",
          sessionId: getSessionId(),
          metadata: {
            channel,
            messageLength: personalMessage.length,
            personalized: personalMessage !== templates[0],
            source: modal ? "connector_dashboard" : "share_studio",
            product: productName
          }
        })
      });
    } catch {
      // O compartilhamento continua disponível mesmo se a telemetria falhar.
    }
  }

  async function handleCopy() {
    setBusy(true);
    try {
      await copyText(completeMessage);
      await registerShare("copy");
      setStatus("Mensagem e link copiados. Agora é só colar na conversa.");
    } catch {
      setStatus("Não foi possível copiar automaticamente. Selecione a mensagem e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function handleWhatsApp() {
    void registerShare("whatsapp");
    const url = `https://wa.me/?text=${encodeURIComponent(completeMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("O WhatsApp foi aberto com a mensagem, o aviso oficial e o link.");
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      await handleCopy();
      setStatus("O compartilhamento nativo não está disponível neste aparelho. A mensagem foi copiada.");
      return;
    }

    setBusy(true);
    try {
      await navigator.share({
        title: `${productName} | Rede Conecta`,
        text: [personalMessage, officialMessage].filter(Boolean).join("\n\n"),
        url: inviteUrl
      });
      await registerShare("native");
      setStatus("Compartilhamento concluído.");
    } catch (error) {
      if (error?.name !== "AbortError") setStatus("O compartilhamento não foi concluído.");
    } finally {
      setBusy(false);
    }
  }

  function resetMessage() {
    setMessage(templates[0]);
    setStatus("Mensagem sugerida restaurada.");
  }

  const composer = <div className={`${styles.composer} ${modal ? styles.modalCard : ""}`}>
    <div className={styles.header}>
      <div className={styles.headerIcon}><Icon name="link" size={28}/></div>
      <div>
        <span className={styles.eyebrow}>Estúdio de compartilhamento</span>
        <h2>Personalize a mensagem antes de enviar.</h2>
        <p>O texto pessoal é livre. A identificação da origem e o aviso de segurança acompanham o link automaticamente.</p>
      </div>
      {modal && <button type="button" className={styles.close} aria-label="Fechar" onClick={onClose}>×</button>}
    </div>

    <div className={styles.productBar}>
      <span className={styles.productBadge}>{category}</span>
      <span><strong>{productName}</strong><small>{location || "Produto oficial da Rede Conecta"}</small></span>
      <Link href={`/convite/${encodeURIComponent(code)}`} target="_blank">Abrir convite <Icon name="arrow" size={16}/></Link>
    </div>

    <div className={styles.layout}>
      <section className={styles.editor}>
        <div className={styles.fieldHeader}>
          <label htmlFor={`share-message-${code}`}>Mensagem personalizada</label>
          <span className={message.length >= MAX_MESSAGE_LENGTH ? styles.limit : ""}>{message.length}/{MAX_MESSAGE_LENGTH}</span>
        </div>
        <textarea
          id={`share-message-${code}`}
          value={message}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={7}
          onChange={event => setMessage(event.target.value)}
          placeholder="Escreva uma mensagem pessoal para acompanhar o convite."
        />

        <div className={styles.templates} aria-label="Sugestões de mensagem">
          <span>Sugestões rápidas</span>
          <div>
            {templates.map((template, index) => <button type="button" key={template} onClick={() => setMessage(template)} className={message === template ? styles.activeTemplate : ""}>
              {index === 0 ? "Próxima" : index === 1 ? "Objetiva" : "Investimento"}
            </button>)}
            <button type="button" onClick={resetMessage}>Restaurar</button>
          </div>
        </div>

        <div className={styles.officialBlock}>
          <div className={styles.lockIcon}><Icon name="shield" size={23}/></div>
          <div>
            <span>Assinatura oficial · não editável</span>
            <pre>{officialMessage}</pre>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.whatsappButton} onClick={handleWhatsApp} disabled={busy}>
            <span className={styles.whatsappDot}>W</span> Enviar no WhatsApp
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleNativeShare} disabled={busy}>
            <Icon name="arrow" size={19}/> Compartilhar
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleCopy} disabled={busy}>
            <Icon name="link" size={19}/> Copiar mensagem e link
          </button>
        </div>
        <p className={styles.privacyNote}><Icon name="shield" size={16}/> A mensagem personalizada fica neste aparelho. A plataforma registra apenas o canal e o tamanho do texto para medir o desempenho, sem armazenar o conteúdo.</p>
        <div className={styles.status} role="status" aria-live="polite">{status}</div>
      </section>

      <aside className={styles.preview}>
        <div className={styles.previewTop}>
          <span><i/> Prévia do envio</span>
          <small>Mensagem + link verificado</small>
        </div>
        <div className={styles.chatBackground}>
          <div className={styles.messageBubble}>
            {personalMessage && <p>{personalMessage}</p>}
            <div className={styles.securityBubble}>
              <Icon name="shield" size={17}/>
              <span><b>Origem e segurança confirmadas</b>Enviado por {connectorName}. Contato somente após autorização.</span>
            </div>
            <div className={styles.linkPreview}>
              <img src={previewImageUrl} alt={`Prévia oficial de ${productName}`}/>
              <div>
                <small>{hostname}</small>
                <strong>{connectorName} conectou você ao {productName}</strong>
                <p>{summary}</p>
              </div>
            </div>
            <time>agora ✓✓</time>
          </div>
        </div>
        <div className={styles.verified}>
          <Icon name="shield" size={21}/>
          <span><b>Prévia oficial do conteúdo</b>O WhatsApp e outros aplicativos usam os metadados do link para mostrar esta identificação antes da abertura.</span>
        </div>
      </aside>
    </div>
  </div>;

  if (!modal) return composer;

  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Compartilhar ${productName}`} onMouseDown={event => {
    if (event.target === event.currentTarget) onClose?.();
  }}>
    {composer}
  </div>;
}
