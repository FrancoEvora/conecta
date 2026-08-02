"use client";

import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./ConnectorDashboard.module.css";

const tabs = [
  ["today", "Hoje", "target"],
  ["opportunities", "Oportunidades", "building"],
  ["connections", "Conexões", "link"],
  ["rewards", "Recompensas", "money"],
  ["notifications", "Atualizações", "shield"]
];

const connectionLabels = {
  new: "Recebida",
  assigned: "Distribuída",
  accepted: "Aceita pelo especialista",
  contacted: "Contato iniciado",
  qualified: "Qualificada",
  visit_scheduled: "Visita ou reunião",
  proposal: "Proposta apresentada",
  won: "Venda concluída",
  lost: "Encerrada sem venda",
  cancelled: "Cancelada"
};

const dealLabels = {
  draft: "Negócio em preparação",
  reservation: "Reserva registrada",
  contract_pending: "Contrato em preparação",
  contracted: "Venda informada",
  validated: "Venda validada",
  cancelled: "Venda cancelada",
  lost: "Negócio perdido"
};

const rewardLabels = {
  pending: "Em apuração",
  approved: "Aprovada",
  scheduled: "Pagamento programado",
  paid: "Paga",
  cancelled: "Cancelada"
};

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
}

function date(value, includeTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", includeTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(new Date(value));
}

async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    location.href = "/entrar?next=/painel/conector";
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload.data;
}

function Status({ value, kind = "connection" }) {
  const label = kind === "deal" ? dealLabels[value] : kind === "reward" ? rewardLabels[value] : connectionLabels[value];
  const good = ["won", "validated", "paid", "approved"].includes(value);
  const warn = ["proposal", "contracted", "scheduled", "pending"].includes(value);
  return <span className={`${styles.status} ${good ? styles.good : warn ? styles.warn : ""}`}>{label || String(value || "Em andamento").replaceAll("_", " ")}</span>;
}

function Metric({ label, value, note, icon, onClick }) {
  return <button type="button" className={styles.metric} onClick={onClick}>
    <span className={styles.metricIcon}><Icon name={icon}/></span>
    <span><small>{label}</small><b>{value}</b><i>{note}</i></span>
    <Icon name="arrow" size={16}/>
  </button>;
}

function ConnectionCard({ item }) {
  const [open, setOpen] = useState(false);
  const progress = ["new", "assigned", "accepted", "contacted", "qualified", "visit_scheduled", "proposal", "won"];
  const progressIndex = Math.max(0, progress.indexOf(item.status));
  const percentage = item.status === "won" ? 100 : Math.max(12, Math.round((progressIndex / (progress.length - 1)) * 100));
  const channel = item.origin_social_channel || "Apresentação direta";

  return <article className={styles.connectionCard}>
    <header>
      <div>
        <span className={styles.protocol}>{item.protocol}</span>
        <h3>{item.contact_name || "Contato apresentado"}</h3>
        <p>{item.source_product_name_snapshot}</p>
      </div>
      <Status value={item.status}/>
    </header>

    <div className={styles.progress}><i style={{ width: `${percentage}%` }}/></div>
    <div className={styles.connectionMeta}>
      <span><small>Canal</small><b>{channel}</b></span>
      <span><small>SDR</small><b>{item.sdr_status === "completed" ? `Concluído · score ${item.sdr_score ?? "—"}` : "Em andamento"}</b></span>
      <span><small>Especialista</small><b>{item.specialist_name || "Ainda não encaminhado"}</b></span>
      <span><small>Última atualização</small><b>{date(item.last_activity_at || item.submitted_at, true)}</b></span>
    </div>

    <div className={styles.businessLine}>
      <span><small>Negócio</small><Status value={item.deal_status || "draft"} kind="deal"/></span>
      <span><small>Recompensa</small>{item.reward_amount_cents ? <><b>{money(item.reward_amount_cents)}</b><Status value={item.reward_status} kind="reward"/></> : <b>Ainda não calculada</b>}</span>
      <button type="button" onClick={() => setOpen(value => !value)}>{open ? "Fechar detalhes" : "Ver andamento completo"}</button>
    </div>

    {open && <div className={styles.details}>
      <section>
        <h4>Contato que você apresentou</h4>
        <dl><dt>Nome</dt><dd>{item.contact_name || "—"}</dd><dt>WhatsApp</dt><dd>{item.contact_phone || "—"}</dd><dt>E-mail</dt><dd>{item.contact_email || "—"}</dd><dt>Proteção da origem</dt><dd>Até {date(item.protected_until)}</dd></dl>
      </section>
      <section>
        <h4>Andamento comercial</h4>
        <div className={styles.timeline}>
          {(item.timeline || []).length ? item.timeline.map((event, index) => <div key={`${event.at}-${index}`}><i/><span><b>{connectionLabels[event.to] || event.to}</b><small>{date(event.at, true)}</small>{event.reason && <p>{event.reason}</p>}</span></div>) : <p>Nenhuma movimentação detalhada registrada ainda.</p>}
        </div>
      </section>
      <section className={styles.trustBox}>
        <Icon name="shield" size={22}/>
        <span><b>Sua origem está protegida.</b>O conector de origem não pode ser substituído pelo especialista. Venda informada, validação, recompensa e pagamento ficam registrados na mesma trilha.</span>
      </section>
    </div>}
  </article>;
}

export default function ConnectorDashboard({ context, initialSnapshot }) {
  const [data, setData] = useState(initialSnapshot || {});
  const [active, setActive] = useState("today");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const summary = data.summary || {};
  const connections = data.connections || [];

  const filteredConnections = useMemo(() => connections.filter(item => {
    if (filter === "all") return true;
    if (filter === "active") return !["won", "lost", "cancelled"].includes(item.status);
    if (filter === "won") return item.status === "won";
    if (filter === "reward") return Boolean(item.reward_amount_cents);
    return item.status === filter;
  }), [connections, filter]);

  async function reload() {
    setBusy(true);
    try { setData(await request("connector_snapshot")); }
    finally { setBusy(false); }
  }

  async function markRead(id) {
    await request("connector_mark_notification_read", { p_notification_id: id });
    await reload();
  }

  function go(tab) {
    setActive(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className={styles.shell}>
    <header className={styles.header}>
      <NetworkMark/>
      <div><small>Conector</small><b>{context.display_name}</b></div>
      <button type="button" onClick={reload} disabled={busy}>{busy ? "Atualizando…" : "Atualizar"}</button>
      <button type="button" onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button>
    </header>

    <main className={styles.main}>
      <section className={styles.hero}>
        <span>Origem protegida · acompanhamento transparente</span>
        <h1>Você apresenta pessoas. A Rede Conecta acompanha o negócio até o resultado.</h1>
        <p>Veja quem você apresentou, por qual canal, quem está atendendo, em qual etapa está a negociação e quando uma recompensa for gerada.</p>
      </section>

      <section className={styles.metrics}>
        <Metric label="Conexões" value={summary.connections || 0} note={`${summary.active_connections || 0} em andamento`} icon="link" onClick={() => go("connections")}/>
        <Metric label="Vendas confirmadas" value={summary.won_connections || 0} note="com origem preservada" icon="check" onClick={() => { setFilter("won"); go("connections"); }}/>
        <Metric label="Recompensas em apuração" value={money(summary.potential_rewards_cents)} note="direito econômico em análise" icon="money" onClick={() => go("rewards")}/>
        <Metric label="Recompensas pagas" value={money(summary.paid_rewards_cents)} note="consulte seu extrato" icon="chart" onClick={() => go("rewards")}/>
      </section>

      {active === "today" && <>
        <section className={styles.sectionHead}><div><span>Hoje</span><h2>O que mudou nas suas conexões</h2></div>{summary.unread_notifications > 0 && <b>{summary.unread_notifications} nova(s) atualização(ões)</b>}</section>
        <div className={styles.todayGrid}>
          <section className={styles.panel}><h3>Atualizações recentes</h3>{(data.notifications || []).slice(0, 6).map(item => <button className={styles.notification} key={item.id} onClick={() => markRead(item.id)}><i className={!item.read_at ? styles.unread : ""}/><span><b>{item.title}</b><p>{item.body}</p><small>{date(item.created_at, true)}</small></span></button>)}{!(data.notifications || []).length && <p className={styles.empty}>Nenhuma atualização recente.</p>}</section>
          <section className={styles.panel}><h3>Conexões que merecem atenção</h3>{connections.filter(item => !["won", "lost", "cancelled"].includes(item.status)).slice(0, 5).map(item => <button className={styles.quickConnection} key={item.id} onClick={() => go("connections")}><span><b>{item.contact_name || item.protocol}</b><small>{item.source_product_name_snapshot}</small></span><Status value={item.status}/></button>)}{!connections.length && <p className={styles.empty}>Nenhuma conexão registrada ainda.</p>}</section>
        </div>
      </>}

      {active === "opportunities" && <section><div className={styles.sectionHead}><div><span>Oportunidades</span><h2>Produtos disponíveis para apresentar</h2></div></div><div className={styles.opportunityGrid}>{(data.campaigns || []).map(item => <article className={styles.opportunity} key={item.campaign_id}><span>{item.category}</span><h3>{item.product_name}</h3><p>{item.summary || item.description}</p><div><b>{money(item.reward_amount_cents)}</b><small>recompensa prevista</small></div><button type="button" onClick={async () => { const result = await request("create_invitation", { p_campaign_id: item.campaign_id, p_label: `${item.product_name} · compartilhamento`, p_expires_in_days: 90 }); const row = Array.isArray(result) ? result[0] : result; if (row?.invitation_code) location.href = `/compartilhar/${row.invitation_code}`; }}>Apresentar oportunidade</button></article>)}</div></section>}

      {active === "connections" && <section><div className={styles.sectionHead}><div><span>Minhas conexões</span><h2>Pessoas, canais e andamento completo</h2></div><div className={styles.filters}>{[["all","Todas"],["active","Em andamento"],["proposal","Em proposta"],["won","Vendas"],["reward","Com recompensa"]].map(([value,label]) => <button type="button" key={value} className={filter === value ? styles.activeFilter : ""} onClick={() => setFilter(value)}>{label}</button>)}</div></div><div className={styles.connectionList}>{filteredConnections.map(item => <ConnectionCard item={item} key={item.id}/>)}{!filteredConnections.length && <p className={styles.empty}>Nenhuma conexão nesta categoria.</p>}</div></section>}

      {active === "rewards" && <section><div className={styles.sectionHead}><div><span>Minha carteira</span><h2>Direitos econômicos e pagamentos</h2></div></div><div className={styles.walletSummary}><span><small>Em apuração</small><b>{money(summary.potential_rewards_cents)}</b></span><span><small>Aprovadas</small><b>{money(summary.approved_rewards_cents)}</b></span><span><small>Pagas</small><b>{money(summary.paid_rewards_cents)}</b></span></div><div className={styles.panel}>{(data.rewards || []).map(item => <div className={styles.rewardRow} key={item.id}><span><b>{item.title}</b><small>{item.source_product_name_snapshot} · {item.protocol}</small></span><b>{money(item.amount_cents)}</b><Status value={item.status} kind="reward"/><small>Previsão: {date(item.expected_payment_at)}</small></div>)}{!(data.rewards || []).length && <p className={styles.empty}>Nenhuma recompensa registrada ainda.</p>}</div></section>}

      {active === "notifications" && <section><div className={styles.sectionHead}><div><span>Atualizações</span><h2>Histórico de comunicações da operação</h2></div></div><div className={styles.panel}>{(data.notifications || []).map(item => <button className={styles.notification} key={item.id} onClick={() => markRead(item.id)}><i className={!item.read_at ? styles.unread : ""}/><span><b>{item.title}</b><p>{item.body}</p><small>{date(item.created_at, true)}</small></span></button>)}</div></section>}
    </main>

    <nav className={styles.bottomNav}>{tabs.map(([key,label,icon]) => <button type="button" key={key} className={active === key ? styles.activeTab : ""} onClick={() => go(key)}><Icon name={icon}/><span>{label}</span>{key === "notifications" && summary.unread_notifications > 0 && <i>{summary.unread_notifications}</i>}</button>)}</nav>
  </div>;
}
