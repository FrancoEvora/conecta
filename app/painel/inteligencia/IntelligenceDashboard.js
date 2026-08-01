"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./inteligencia.module.css";

const SEGMENT_ALIASES = {
  imoveis: ["imóvel", "imoveis", "lote", "casa", "apartamento", "condomínio", "residencial", "comercial"],
  veiculos: ["veículo", "veiculos", "carro", "moto", "máquina", "caminhão"],
  agronegocio: ["agro", "agronegócio", "fazenda", "rural", "máquina agrícola"],
  energia: ["energia", "solar", "fotovoltaica"],
  beleza: ["perfume", "perfumaria", "beleza", "cosmético"],
  financeiro: ["consórcio", "seguro", "crédito", "investimento"]
};

function words(value) { return String(value || "").toLowerCase(); }
function number(value) { return Number(value || 0); }
function array(value) { return Array.isArray(value) ? value : []; }

function inferSegments(context, snapshot) {
  const metadata = context?.metadata || context?.profile_metadata || {};
  const candidates = [metadata.connector_segments, context?.connector_segments, snapshot?.segments, snapshot?.profile?.segments];
  return [...new Set(candidates.flatMap(array).map(words).filter(Boolean))];
}

function affinity(product, segments) {
  const text = words([product.product_name, product.product_slug, product.category, product.summary, product.description, product.development_name, product.city].filter(Boolean).join(" "));
  let score = 42;
  let reasons = [];
  for (const segment of segments) {
    const aliases = SEGMENT_ALIASES[segment] || [segment.replaceAll("-", " ")];
    if (aliases.some(alias => text.includes(alias))) { score += 35; reasons.push("combina com seus mercados"); break; }
  }
  if (product.city && text.includes(words(contextCity(product)))) { score += 5; }
  if (product.reward_amount_cents || product.reward_cents) { score += 7; reasons.push("possui recompensa ativa"); }
  if (product.campaign_title || product.campaign_slug) { score += 6; reasons.push("campanha pronta para compartilhar"); }
  return { score: Math.min(97, score), reasons: reasons.length ? reasons : ["oportunidade disponível para sua rede"] };
}

function contextCity(product) { return product.city || product.development_city || ""; }

function calculateTrust(snapshot) {
  const links = number(snapshot.links_created || snapshot.share_links || snapshot.total_links);
  const clicks = number(snapshot.clicks || snapshot.total_clicks);
  const consents = number(snapshot.authorizations || snapshot.consents || snapshot.total_authorizations);
  const deals = number(snapshot.validated_deals || snapshot.won_connections || snapshot.total_deals);
  const base = 58;
  const score = Math.min(99, base + Math.min(12, links) + Math.min(10, Math.round(clicks / 3)) + Math.min(12, consents * 2) + Math.min(15, deals * 5));
  return { score, links, clicks, consents, deals };
}

function grade(score) { return score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : "Em construção"; }

export default function IntelligenceDashboard({ context, products, snapshot }) {
  const [selected, setSelected] = useState(null);
  const [audience, setAudience] = useState("");
  const segments = useMemo(() => inferSegments(context, snapshot), [context, snapshot]);
  const trust = useMemo(() => calculateTrust(snapshot), [snapshot]);
  const recommendations = useMemo(() => products.map(product => ({ ...product, match: affinity(product, segments) })).sort((a,b) => b.match.score - a.match.score).slice(0, 6), [products, segments]);
  const name = context?.display_name || "Conector";

  function message(product) {
    const who = audience.trim() || "você";
    return `Olá! Lembrei de ${who} ao conhecer ${product.product_name || product.name || "esta oportunidade"}. Achei que pode fazer sentido pela proposta e pelo momento. Veja os detalhes com tranquilidade; a Rede Conecta cuida do atendimento profissional.`;
  }

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/painel" className={styles.brand}><NetworkMark/><span><b>REDE CONECTA</b><small>Inteligência comercial distribuída</small></span></Link><Link href="/painel" className={styles.back}>Voltar ao painel</Link></header>

    <section className={styles.hero}>
      <div><span className={styles.eyebrow}>TRANSFORMAMOS CONFIANÇA EM RECEITA</span><h1>Boa noite, {name.split(" ")[0]}.</h1><p>Estas são as oportunidades com maior afinidade com seu perfil. A plataforma ajuda a decidir <b>o que compartilhar, com quem e por quê.</b></p></div>
      <div className={styles.trust}><span>TrustScore</span><strong>{trust.score}</strong><b>{grade(trust.score)}</b><small>Índice explicável, baseado em atividade e qualidade das conexões.</small></div>
    </section>

    <section className={styles.metrics}>
      <article><Icon name="link"/><span><b>{trust.links}</b>links criados</span></article>
      <article><Icon name="target"/><span><b>{trust.clicks}</b>interações</span></article>
      <article><Icon name="shield"/><span><b>{trust.consents}</b>autorizações</span></article>
      <article><Icon name="money"/><span><b>{trust.deals}</b>negócios validados</span></article>
    </section>

    <section className={styles.sectionHead}><div><span className={styles.eyebrow}>MATCH INTELIGENTE</span><h2>Oportunidades recomendadas para você</h2></div><p>{segments.length ? `Perfil identificado: ${segments.slice(0,4).join(" · ")}` : "Complete seu DNA Conecta para melhorar as recomendações."}</p></section>

    <section className={styles.grid}>
      {recommendations.map((product, index) => <article className={styles.card} key={product.product_slug || product.id || index}>
        <div className={styles.match}><span>{product.match.score}%</span><small>afinidade</small></div>
        <span className={styles.rank}>Recomendação {index + 1}</span>
        <h3>{product.product_name || product.name || "Oportunidade"}</h3>
        <p>{product.summary || product.description || "Produto selecionado pela Rede Conecta para distribuição profissional."}</p>
        <ul>{product.match.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
        <div className={styles.actions}><button onClick={() => setSelected(product)}>Preparar abordagem</button>{product.invite_code && <Link href={`/compartilhar/${product.invite_code}`}>Compartilhar</Link>}</div>
      </article>)}
      {!recommendations.length && <div className={styles.empty}>Ainda não existem produtos publicados compatíveis com o seu perfil.</div>}
    </section>

    <section className={styles.radar}>
      <div><span className={styles.eyebrow}>RADAR DE CONFIANÇA</span><h2>Quem da sua rede pode precisar de uma oportunidade agora?</h2><p>Procure acontecimentos reais, não contatos aleatórios: mudança de cidade, expansão da empresa, construção, investimento, troca de veículo ou redução de custos.</p></div>
      <div className={styles.prompts}>{["Empresários em expansão","Famílias pensando em construir","Produtores rurais investindo","Pessoas buscando patrimônio","Empresas reduzindo custos"].map(item => <button key={item} onClick={() => setAudience(item)}>{item}</button>)}</div>
    </section>

    {selected && <div className={styles.modal} onMouseDown={event => event.target === event.currentTarget && setSelected(null)}><div className={styles.modalBox}><button className={styles.close} onClick={() => setSelected(null)}>×</button><span className={styles.eyebrow}>COPILOTO COMERCIAL</span><h2>{selected.product_name || selected.name}</h2><label>Para quem você pensou?<input value={audience} onChange={event => setAudience(event.target.value)} placeholder="Ex.: Carlos, empresário de Uberlândia"/></label><label>Mensagem sugerida<textarea readOnly value={message(selected)}/></label><div className={styles.modalActions}><button onClick={() => navigator.clipboard.writeText(message(selected))}>Copiar mensagem</button>{selected.invite_code && <Link href={`/compartilhar/${selected.invite_code}`}>Gerar link rastreável</Link>}</div><small>A mensagem é uma sugestão. Compartilhe apenas quando houver relação legítima e respeite a privacidade da pessoa.</small></div></div>}
  </main>;
}
