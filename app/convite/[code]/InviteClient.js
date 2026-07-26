"use client";
import { useEffect, useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";

function sessionId() {
  const key = "conecta-session";
  let value = sessionStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); sessionStorage.setItem(key, value); }
  return value;
}

export default function InviteClient({ invitation, code }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [protocol, setProtocol] = useState("");
  const [alternative, setAlternative] = useState(false);
  const [alternativeReason, setAlternativeReason] = useState("");
  const features = invitation.product_metadata?.features || ["Produto selecionado", "Atendimento especializado", "Condições sob consulta", "Acompanhamento pela plataforma"];
  const detailCards = useMemo(() => [
    ["building", invitation.product_metadata?.area_from || invitation.product_category, "Produto apresentado com informações oficiais."],
    ["money", invitation.product_metadata?.payment || "Condições facilitadas", "Simulação e condições conduzidas pela equipe responsável."],
    ["home", invitation.product_metadata?.lifestyle || "Qualidade e propósito", invitation.product_description],
    ["target", invitation.product_metadata?.location || invitation.campaign_location, invitation.product_service_region]
  ], [invitation]);

  useEffect(() => {
    fetch("/api/evento", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ code, eventType:"view", sessionId:sessionId(), metadata:{ path:location.pathname } }) }).catch(()=>{});
  }, [code]);

  async function submit(event) {
    event.preventDefault(); setStatus("loading"); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.code = code; payload.campaignSlug = invitation.campaign_slug; payload.contactConsent = true;
    payload.marketingConsent = form.get("marketingConsent") === "on";
    payload.alternativeDiscoveryAuthorized = alternative;
    payload.productRejectionReason = alternativeReason;
    const response = await fetch("/api/interesse", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Não foi possível registrar sua autorização."); setStatus("error"); return; }
    setProtocol(data.protocol); setStatus("success");
    fetch("/api/evento", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ code, eventType:"form_submitted", sessionId:sessionId(), metadata:{ alternative } }) }).catch(()=>{});
  }

  return <>
    <section className="section invite-details"><div className="container invite-layout"><div><div className="detail-grid">{detailCards.map(([icon,title,text]) => <article key={title}><div className="icon-box"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p></article>)}</div><div className="how-card"><span className="eyebrow">Como funciona</span><div className="mini-steps"><article><b>01</b><Icon name="building"/><span><strong>Conheça o produto</strong>Você recebe primeiro as informações desta oportunidade.</span></article><article><b>02</b><Icon name="shield"/><span><strong>Autorize o contato</strong>Você escolhe o melhor horário e dá o consentimento.</span></article><article><b>03</b><Icon name="headset"/><span><strong>Receba atendimento</strong>Um especialista interno apresenta os próximos passos.</span></article></div></div><div className="feature-strip">{features.map(item => <span key={item}><Icon name="check" size={17}/>{item}</span>)}</div></div>
      <aside className="authorization-card"><div className="authorization-card__head"><Icon name="shield"/><span><strong>Autorize seu atendimento</strong><small>Somente sobre {invitation.product_name}.</small></span></div>{status === "success" ? <div className="success-state"><div className="success-state__icon"><Icon name="check" size={38}/></div><h3>Autorização registrada.</h3><p>Nossa equipe recebeu sua solicitação e seguirá o horário informado.</p><code>{protocol}</code><small>Guarde este protocolo para acompanhar seu atendimento.</small></div> : <form onSubmit={submit} className="form"><label>Nome completo<input name="firstName" minLength="2" required placeholder="Como devemos chamar você?"/></label><label>WhatsApp<input name="phone" inputMode="tel" minLength="10" required placeholder="(34) 99999-9999"/></label><label>E-mail <small>opcional</small><input name="email" type="email" placeholder="voce@email.com"/></label><label>Melhor horário<select name="preferredTime" required defaultValue=""><option value="" disabled>Selecione uma opção</option><option>Manhã · 8h às 12h</option><option>Tarde · 12h às 18h</option><option>Noite · após 18h</option></select></label><label>O que deseja saber?<select name="interest" required defaultValue={invitation.interest_options?.[0]}>{(invitation.interest_options || ["Quero conhecer o produto"]).map(item => <option key={item}>{item}</option>)}</select></label><label className="check-row"><input type="checkbox" name="marketingConsent"/><span>Aceito receber novidades desta campanha.</span></label><button disabled={status === "loading"} className="button button--orange button--block">{status === "loading" ? "Registrando…" : "Autorizar meu atendimento"}<Icon name="arrow"/></button>{error && <p className="form-error">{error}</p>}<p className="form-security"><Icon name="shield" size={16}/> Seus dados serão usados para este atendimento, conforme a Política de Privacidade.</p></form>}
      <div className="alternative-box"><span><b>Este produto não atende?</b>O especialista só investigará outras necessidades após sua autorização.</span><button type="button" className={`toggle ${alternative ? "is-on" : ""}`} onClick={()=>setAlternative(v=>!v)} aria-pressed={alternative}><i/></button>{alternative && <label className="alternative-reason">O que não se encaixou?<textarea name="reasonOutside" form="none" value={alternativeReason} placeholder="Preço, localização, metragem, finalidade…" onChange={(event)=>setAlternativeReason(event.target.value)}/></label>}</div></aside></div></section>
    <footer className="invite-footer"><div className="container"><NetworkMark inverse/><span>Consentimento específico · Origem preservada · Atendimento por especialista</span></div></footer>
  </>;
}
