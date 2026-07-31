"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/UI";
import styles from "./ShareComposer.module.css";
import socialStyles from "./ShareComposerSocial.module.css";

const MAX_MESSAGE_LENGTH = 600;
const DEFAULT_BASE_URL = "https://conecta-pearl.vercel.app";

const channels = [
  ["whatsapp", "WhatsApp", "W"],
  ["facebook", "Facebook", "f"],
  ["instagram", "Instagram", "◎"],
  ["linkedin", "LinkedIn", "in"],
  ["x", "X", "X"],
  ["telegram", "Telegram", "➤"],
  ["email", "E-mail", "@"],
  ["native", "Outros apps", "↗"]
];

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

async function appRequest(operation, params = {}) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json();
  if (response.status === 401) {
    location.href = `/entrar?next=${encodeURIComponent(location.pathname)}`;
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) throw new Error(payload.error || "Não foi possível preparar o compartilhamento.");
  return payload.data;
}

export default function ShareComposer({ invitation, code, baseUrl = DEFAULT_BASE_URL, hostname: hostnameProp, modal = false, onClose }) {
  const productName = invitation.product_name || invitation.productName || "oportunidade selecionada";
  const connectorName = invitation.connector_display_name || invitation.connectorName || "Rede Conecta";
  const locationLabel = invitation.campaign_location || invitation.location || invitation.product_service_region || "";
  const summary = invitation.campaign_summary || invitation.product_description || "Conheça os detalhes desta oportunidade.";
  const category = invitation.product_category || "Oportunidade imobiliária";
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const inviteUrl = `${normalizedBaseUrl}/convite/${encodeURIComponent(code)}`;
  const previewImageUrl = invitation.product_metadata?.image || `${inviteUrl}/opengraph-image?v=4`;
  const hostname = useMemo(() => {
    if (hostnameProp) return hostnameProp;
    try { return new URL(normalizedBaseUrl).hostname; } catch { return "conecta-pearl.vercel.app"; }
  }, [hostnameProp, normalizedBaseUrl]);

  const templates = useMemo(() => [
    `Olá! Lembrei de você ao conhecer o ${productName}. Acho que pode fazer sentido para o que você procura.`,
    `Quero compartilhar com você uma oportunidade que conheci pela Rede Conecta: ${productName}. Veja com calma e, caso faça sentido, autorize o atendimento.`,
    `Vi esta oportunidade e pensei em você. O ${productName} reúne características interessantes e o link abaixo apresenta as informações oficiais.`
  ], [productName]);

  const [message, setMessage] = useState(templates[0]);
  const [postLabel, setPostLabel] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [status, setStatus] = useState("");
  const [busyChannel, setBusyChannel] = useState("");
  const [lastTrackedUrl, setLastTrackedUrl] = useState("");
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
    const closeOnEscape = event => event.key === "Escape" && onClose?.();
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
  const completeMessage = trackedUrl => [personalMessage, officialMessage, trackedUrl].filter(Boolean).join("\n\n");

  async function createTrackedUrl(channel) {
    const data = await appRequest("create_social_share", {
      p_invite_code: String(code).trim().toUpperCase(),
      p_channel: channel,
      p_post_label: postLabel.trim(),
      p_message_variant: personalMessage === templates[0] ? "suggested" : "custom",
      p_expires_in_days: 90,
      p_metadata: {
        message_length: personalMessage.length,
        personalized: personalMessage !== templates[0],
        source: modal ? "connector_dashboard" : "share_studio",
        product: productName
      }
    });
    const trackedUrl = new URL(data.tracked_path || `/r/${data.public_code}`, normalizedBaseUrl).toString();
    setLastTrackedUrl(trackedUrl);
    return trackedUrl;
  }

  function openPopup(url, popup) {
    if (popup && !popup.closed) popup.location.href = url;
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  async function shareChannel(channel) {
    if (busyChannel) return;
    const popupChannels = new Set(["whatsapp", "facebook", "linkedin", "x", "telegram"]);
    const popup = popupChannels.has(channel) ? window.open("about:blank", "_blank") : null;
    setBusyChannel(channel);
    setStatus("Preparando um link exclusivo e rastreável…");

    try {
      const trackedUrl = await createTrackedUrl(channel);
      const messageWithLink = completeMessage(trackedUrl);
      const title = `${productName} | Rede Conecta`;

      if (channel === "whatsapp") {
        openPopup(`https://wa.me/?text=${encodeURIComponent(messageWithLink)}`, popup);
        setStatus("WhatsApp aberto com um link exclusivo. Cliques e autorizações serão atribuídos a esta publicação.");
      } else if (channel === "facebook") {
        openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackedUrl)}`, popup);
        setStatus("Facebook aberto com a prévia oficial e um link rastreável.");
      } else if (channel === "linkedin") {
        openPopup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(trackedUrl)}`, popup);
        setStatus("LinkedIn aberto com a oportunidade rastreável.");
      } else if (channel === "x") {
        openPopup(`https://twitter.com/intent/tweet?text=${encodeURIComponent(personalMessage)}&url=${encodeURIComponent(trackedUrl)}`, popup);
        setStatus("Publicação preparada para o X com rastreamento individual.");
      } else if (channel === "telegram") {
        openPopup(`https://t.me/share/url?url=${encodeURIComponent(trackedUrl)}&text=${encodeURIComponent(personalMessage)}`, popup);
        setStatus("Telegram aberto com um link rastreável.");
      } else if (channel === "email") {
        location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(messageWithLink)}`;
        setStatus("E-mail preparado com a mensagem e o link rastreável.");
      } else if (channel === "instagram") {
        const caption = `${personalMessage}\n\n${officialMessage}\n\n${trackedUrl}`;
        if (navigator.share) {
          try {
            await navigator.share({ title, text: caption, url: trackedUrl });
            setStatus("Compartilhamento aberto. No Instagram, publique o conteúdo no feed, story ou mensagem direta.");
          } catch (error) {
            if (error?.name !== "AbortError") throw error;
            setStatus("Compartilhamento cancelado.");
          }
        } else {
          await copyText(caption);
          setStatus("Legenda e link copiados. Cole no Instagram, de preferência em story, bio ou mensagem direta.");
        }
      } else if (channel === "native") {
        if (navigator.share) {
          await navigator.share({ title, text: [personalMessage, officialMessage].filter(Boolean).join("\n\n"), url: trackedUrl });
          setStatus("Compartilhamento concluído com rastreamento individual.");
        } else {
          await copyText(messageWithLink);
          setStatus("O compartilhamento nativo não está disponível. A mensagem e o link foram copiados.");
        }
      }
    } catch (error) {
      if (popup && !popup.closed) popup.close();
      setStatus(error?.message || "Não foi possível preparar o compartilhamento.");
    } finally {
      setBusyChannel("");
    }
  }

  async function handleCopy() {
    if (busyChannel) return;
    setBusyChannel("copy");
    setStatus("Gerando um link exclusivo…");
    try {
      const trackedUrl = await createTrackedUrl("copy");
      await copyText(completeMessage(trackedUrl));
      setStatus("Mensagem e link rastreável copiados. Cada acesso será associado a esta publicação.");
    } catch (error) {
      setStatus(error?.message || "Não foi possível copiar automaticamente.");
    } finally {
      setBusyChannel("");
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
        <span className={styles.eyebrow}>Estúdio de distribuição rastreável</span>
        <h2>Publique em suas redes e saiba o que realmente gera resultado.</h2>
        <p>Cada canal recebe um endereço exclusivo. A plataforma mede a jornada do clique até a autorização e o negócio validado.</p>
      </div>
      {modal && <button type="button" className={styles.close} aria-label="Fechar" onClick={onClose}>×</button>}
    </div>

    <div className={styles.productBar}>
      <span className={styles.productBadge}>{category}</span>
      <span><strong>{productName}</strong><small>{locationLabel || "Produto oficial da Rede Conecta"}</small></span>
      <Link href={`/convite/${encodeURIComponent(code)}`} target="_blank">Abrir convite <Icon name="arrow" size={16}/></Link>
    </div>

    <div className={styles.layout}>
      <section className={styles.editor}>
        <div className={socialStyles.labelField}>
          <label htmlFor={`share-label-${code}`}>Identificação interna da publicação <small>opcional</small></label>
          <input id={`share-label-${code}`} value={postLabel} maxLength={160} onChange={event => setPostLabel(event.target.value)} placeholder="Ex.: Story Solaris · empresários de Uberlândia"/>
          <span>Este nome aparece apenas nos seus relatórios.</span>
        </div>

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
              {index === 0 ? "Pessoal" : index === 1 ? "Objetiva" : "Oportunidade"}
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

        <div className={socialStyles.channelSection}>
          <div className={socialStyles.channelHead}>
            <span>Escolha onde publicar</span>
            <Link href="/painel/compartilhamentos">Ver resultados <Icon name="chart" size={16}/></Link>
          </div>
          <div className={socialStyles.socialGrid}>
            {channels.map(([channel, label, mark]) => <button
              type="button"
              key={channel}
              className={`${socialStyles.channelButton} ${socialStyles[channel] || ""}`}
              onClick={() => shareChannel(channel)}
              disabled={Boolean(busyChannel)}
            >
              <i>{busyChannel === channel ? "…" : mark}</i><span>{label}</span>
            </button>)}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={handleCopy} disabled={Boolean(busyChannel)}>
            <Icon name="link" size={19}/> {busyChannel === "copy" ? "Gerando…" : "Copiar mensagem e link rastreável"}
          </button>
        </div>
        <p className={styles.privacyNote}><Icon name="shield" size={16}/> O conteúdo da mensagem permanece no seu aparelho. A Rede Conecta registra canal, campanha, cliques, autorizações e conversões — nunca a sua conversa privada.</p>
        {lastTrackedUrl && <div className={socialStyles.trackedResult}><b>Último link gerado</b><code>{lastTrackedUrl}</code><button type="button" onClick={() => copyText(lastTrackedUrl)}>Copiar somente o link</button></div>}
        <div className={styles.status} role="status" aria-live="polite">{status}</div>
      </section>

      <aside className={styles.preview}>
        <div className={styles.previewTop}>
          <span><i/> Prévia oficial</span>
          <small>Conteúdo + origem + rastreamento</small>
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
          <Icon name="chart" size={21}/>
          <span><b>Do compartilhamento ao negócio</b>Cada link permite acompanhar cliques, visitas à página, autorizações e negócios validados por canal.</span>
        </div>
      </aside>
    </div>
  </div>;

  if (!modal) return composer;
  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Compartilhar ${productName}`} onMouseDown={event => {
    if (event.target === event.currentTarget) onClose?.();
  }}>{composer}</div>;
}
