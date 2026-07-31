"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./SocialAnalytics.module.css";

const labels = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  telegram: "Telegram",
  email: "E-mail",
  native: "Outros apps",
  copy: "Link copiado",
  other: "Outros"
};

function number(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function date(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function rate(a, b) {
  if (!Number(b)) return "0%";
  return `${((Number(a || 0) / Number(b)) * 100).toFixed(1).replace(".", ",")}%`;
}

function Metric({ label, value, note, icon }) {
  return <article className={styles.metric}><div><Icon name={icon}/></div><span>{label}<b>{number(value)}</b>{note && <small>{note}</small>}</span></article>;
}

export default function SocialAnalytics({ context, initialData, mode }) {
  const [data, setData] = useState(initialData || {});
  const [loading, setLoading] = useState(false);
  const summary = data.summary || {};
  const channels = data.channels || [];
  const links = mode === "connector" ? data.links || [] : data.recent_links || [];

  async function reload() {
    setLoading(true);
    try {
      const response = await fetch("/api/app/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: mode === "connector" ? "connector_social_analytics" : "admin_social_analytics", params: {} })
      });
      const payload = await response.json();
      if (response.ok) setData(payload.data || {});
      if (response.status === 401) location.href = "/entrar?next=/painel/compartilhamentos";
    } finally {
      setLoading(false);
    }
  }

  return <div className={styles.shell}>
    <header className={styles.header}>
      <NetworkMark/>
      <nav><Link href="/painel">Painel</Link><Link href="/oportunidades">Oportunidades</Link><button onClick={reload} disabled={loading}>{loading ? "Atualizando…" : "Atualizar"}</button><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button></nav>
    </header>

    <main className={styles.main}>
      <section className={styles.hero}>
        <div><span className="eyebrow">Distribuição rastreável</span><h1>{mode === "connector" ? "Descubra quais publicações realmente geram oportunidades." : "Visão completa da distribuição social da Rede Conecta."}</h1><p>Do link criado ao negócio validado: cada etapa fica associada ao conector, produto, campanha e canal, sem armazenar conversas privadas.</p></div>
        <div className={styles.heroCard}><Icon name="shield" size={28}/><span><b>Origem preservada</b>Os links rastreáveis não expõem dados pessoais. Eles identificam apenas a origem comercial e os eventos necessários para medir desempenho.</span></div>
      </section>

      <section className={styles.metrics}>
        {mode === "staff" && <Metric label="Conectores distribuindo" value={summary.connectors} note="Com ao menos um link social" icon="user"/>}
        <Metric label="Links rastreáveis" value={summary.share_links} note="Publicações e compartilhamentos" icon="link"/>
        <Metric label="Cliques" value={summary.clicks} note={`${rate(summary.landings, summary.clicks)} chegaram à página`} icon="chart"/>
        <Metric label="Autorizações" value={summary.authorizations} note={`${rate(summary.authorizations, summary.landings)} dos acessos`} icon="shield"/>
        <Metric label="Negócios validados" value={summary.conversions} note={`${rate(summary.conversions, summary.authorizations)} das autorizações`} icon="money"/>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardHead}><div><span className="eyebrow">Desempenho por canal</span><h2>Onde a rede converte melhor</h2></div></div>
          <div className={styles.channelList}>{channels.length ? channels.map(item => {
            const max = Math.max(1, ...channels.map(channel => Number(channel.clicks || 0)));
            return <div className={styles.channel} key={item.channel}><div><b>{labels[item.channel] || item.channel}</b><small>{number(item.links)} links</small></div><div className={styles.bar}><i style={{ width: `${Math.max(4, Number(item.clicks || 0) / max * 100)}%` }}/></div><span><b>{number(item.clicks)}</b> cliques<small>{number(item.authorizations)} autorizações · {number(item.conversions)} negócios</small></span></div>;
          }) : <p className={styles.empty}>Ainda não há compartilhamentos rastreáveis.</p>}</div>
        </article>

        <article className={`${styles.card} ${styles.funnel}`}>
          <span className="eyebrow">Funil social</span><h2>Do compartilhamento ao resultado</h2>
          <div><span><i>1</i><b>{number(summary.share_links)}</b><small>Links criados</small></span><span><i>2</i><b>{number(summary.clicks)}</b><small>Cliques</small></span><span><i>3</i><b>{number(summary.landings)}</b><small>Acessos à oportunidade</small></span><span><i>4</i><b>{number(summary.authorizations)}</b><small>Autorizações</small></span><span><i>5</i><b>{number(summary.conversions)}</b><small>Negócios validados</small></span></div>
        </article>
      </section>

      {mode === "staff" && <section className={styles.card}>
        <div className={styles.cardHead}><div><span className="eyebrow">Rede de conectores</span><h2>Originação por conector</h2></div></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Conector</th><th>Links</th><th>Cliques</th><th>Acessos</th><th>Autorizações</th><th>Negócios</th><th>Conversão</th></tr></thead><tbody>{(data.connectors || []).map(item => <tr key={item.connector_profile_id}><td><b>{item.connector_name}</b></td><td>{number(item.links)}</td><td>{number(item.clicks)}</td><td>{number(item.landings)}</td><td>{number(item.authorizations)}</td><td>{number(item.conversions)}</td><td>{rate(item.authorizations, item.clicks)}</td></tr>)}</tbody></table></div>
      </section>}

      <section className={styles.card}>
        <div className={styles.cardHead}><div><span className="eyebrow">Links individuais</span><h2>Publicações rastreáveis</h2></div>{mode === "connector" && <Link className="button button--orange" href="/oportunidades">Compartilhar nova oportunidade</Link>}</div>
        <div className={styles.tableWrap}><table><thead><tr>{mode === "staff" && <th>Conector</th>}<th>Produto</th><th>Canal</th><th>Identificação</th><th>Criado em</th><th>Cliques</th><th>Autorizações</th><th>Negócios</th><th>Link</th></tr></thead><tbody>{links.map(item => <tr key={item.id}>{mode === "staff" && <td><b>{item.connector_name}</b></td>}<td><b>{item.product_name_snapshot || "Produto"}</b><small>{item.campaign_title_snapshot || ""}</small></td><td>{labels[item.channel] || item.channel}</td><td>{item.post_label || "Sem identificação"}</td><td>{date(item.created_at)}</td><td>{number(item.clicks)}</td><td>{number(item.authorizations)}</td><td>{number(item.conversions)}</td><td><Link target="_blank" href={`/r/${item.public_code}`}>Abrir</Link></td></tr>)}</tbody></table></div>
        {!links.length && <p className={styles.empty}>Nenhum link social foi criado até o momento.</p>}
      </section>
    </main>
  </div>;
}
