"use client";

import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./FinancialDashboard.module.css";

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
}

function date(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    location.href = "/entrar?next=/painel/financeiro";
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload.data;
}

function Metric({ label, value, note, icon, danger = false }) {
  return <article className={`${styles.metric} ${danger ? styles.dangerMetric : ""}`}>
    <span><Icon name={icon}/></span>
    <div><small>{label}</small><b>{value}</b><i>{note}</i></div>
  </article>;
}

function ProductRule({ product, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [percent, setPercent] = useState(String(product.conecta_fee_percent ?? 0));
  const [days, setDays] = useState(String(product.conecta_fee_payment_days ?? 7));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await request("set_product_financial_rule", {
        p_product_id: product.id,
        p_fee_percent: Number(String(percent).replace(",", ".")),
        p_payment_days: Number(days)
      });
      setEditing(false);
      await onSaved();
    } finally { setBusy(false); }
  }

  return <div className={styles.productRule}>
    <span><b>{product.name}</b><small>{product.category} · {product.partner_name || "Rede Conecta"}</small></span>
    <span><small>Ganho interno</small>{editing ? <input value={percent} onChange={event => setPercent(event.target.value)}/> : <b>{Number(product.conecta_fee_percent || 0).toFixed(2)}%</b>}</span>
    <span><small>Prazo esperado</small>{editing ? <input type="number" min="0" max="365" value={days} onChange={event => setDays(event.target.value)}/> : <b>{product.conecta_fee_payment_days || 0} dias</b>}</span>
    <span><small>Vendas</small><b>{product.closed_deals || 0}</b></span>
    <span><small>VGV fechado</small><b>{money(product.closed_gross_cents)}</b></span>
    <div>{editing ? <><button onClick={save} disabled={busy}>{busy ? "Salvando…" : "Salvar regra"}</button><button onClick={() => setEditing(false)}>Cancelar</button></> : <button onClick={() => setEditing(true)}>Editar percentual</button>}</div>
  </div>;
}

export default function FinancialDashboard({ context, initialDashboard, initialProducts }) {
  const today = new Date();
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [data, setData] = useState(initialDashboard || {});
  const [products, setProducts] = useState(initialProducts || []);
  const [tab, setTab] = useState("summary");
  const [busy, setBusy] = useState(false);
  const [entryDeal, setEntryDeal] = useState(null);
  const summary = data.summary || {};

  const margin = useMemo(() => Number(summary.conecta_received_cents || 0) - Number(summary.connector_rewards_paid_cents || 0) - Number(summary.specialist_commissions_paid_cents || 0), [summary]);

  async function reload() {
    setBusy(true);
    try {
      const [dashboard, productRules] = await Promise.all([
        request("financial_dashboard", { p_from: from, p_to: to }),
        request("product_financial_rules")
      ]);
      setData(dashboard || {});
      setProducts(productRules || []);
    } finally { setBusy(false); }
  }

  async function recordEntry(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request("record_financial_entry", {
        p_deal_id: entryDeal.id,
        p_entry_type: form.get("entry_type"),
        p_amount_cents: Math.round(Number(String(form.get("amount") || 0).replace(",", ".")) * 100),
        p_status: "paid",
        p_due_at: null,
        p_paid_at: form.get("paid_at") ? new Date(form.get("paid_at")).toISOString() : new Date().toISOString(),
        p_description: form.get("description") || ""
      });
      setEntryDeal(null);
      await reload();
    } finally { setBusy(false); }
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <NetworkMark inverse/>
      <span>Centro financeiro</span>
      {[ ["summary","Visão geral","chart"], ["deals","Negócios","check"], ["products","Regras por produto","building"], ["ledger","Movimentações","money"] ].map(([key,label,icon]) => <button className={tab === key ? styles.active : ""} key={key} onClick={() => setTab(key)}><Icon name={icon}/><span>{label}</span></button>)}
      <button onClick={() => location.href = "/painel/operacao"}><Icon name="arrow"/><span>Voltar à operação</span></button>
    </aside>

    <main className={styles.main}>
      <header className={styles.header}>
        <div><span>Governança econômica</span><h1>Receitas, comissões e expectativas</h1><p>Cada negócio preserva origem, percentual da Rede Conecta e obrigações financeiras.</p></div>
        <div className={styles.period}><label>De<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label><label>Até<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label><button onClick={reload} disabled={busy}>{busy ? "Atualizando…" : "Aplicar período"}</button></div>
      </header>

      {tab === "summary" && <>
        <section className={styles.metrics}>
          <Metric label="Negócios fechados" value={summary.closed_deals || 0} note={`VGV ${money(summary.closed_gross_cents)}`} icon="check"/>
          <Metric label="Receita esperada Conecta" value={money(summary.conecta_expected_cents)} note="calculada pelas regras dos produtos" icon="target"/>
          <Metric label="Receita recebida" value={money(summary.conecta_received_cents)} note="valores efetivamente conciliados" icon="money"/>
          <Metric label="A receber em 30 dias" value={money(summary.next_30_days_receivables_cents)} note="previsão de entrada" icon="chart"/>
          <Metric label="Recompensas previstas" value={money(summary.connector_rewards_expected_cents)} note="direitos dos conectores" icon="link"/>
          <Metric label="Recompensas pagas" value={money(summary.connector_rewards_paid_cents)} note="saída financeira confirmada" icon="money"/>
          <Metric label="Comissões pagas" value={money(summary.specialist_commissions_paid_cents)} note="corretores e vendedores" icon="user"/>
          <Metric label="Recebíveis vencidos" value={money(summary.overdue_receivables_cents)} note="exigem cobrança ou conciliação" icon="shield" danger={Number(summary.overdue_receivables_cents) > 0}/>
        </section>
        <section className={styles.executive}><div><span>Resultado de caixa no período</span><b>{money(margin)}</b><small>Receitas recebidas menos recompensas e comissões pagas</small></div><div><span>Conversão econômica</span><b>{summary.closed_gross_cents ? `${((Number(summary.conecta_expected_cents || 0) / Number(summary.closed_gross_cents)) * 100).toFixed(2)}%` : "0,00%"}</b><small>receita interna esperada sobre o VGV fechado</small></div><div><span>Eficiência de recebimento</span><b>{summary.conecta_expected_cents ? `${Math.min(100, (Number(summary.conecta_received_cents || 0) / Number(summary.conecta_expected_cents)) * 100).toFixed(1)}%` : "0,0%"}</b><small>recebido em relação ao esperado</small></div></section>
      </>}

      {tab === "deals" && <section className={styles.card}><div className={styles.cardHead}><div><span>Negócios por período</span><h2>Fechamento e obrigações financeiras</h2></div></div><div className={styles.table}><table><thead><tr><th>Negócio</th><th>Produto</th><th>Conector</th><th>Especialista</th><th>Valor</th><th>Conecta</th><th>Recebido</th><th>Recompensa</th><th>Vencimento</th><th></th></tr></thead><tbody>{(data.deals || []).map(item => <tr key={item.id}><td><b>{item.deal_number || item.protocol}</b><small>{date(item.reference_date)}</small></td><td>{item.product_name}</td><td>{item.connector_name || "—"}</td><td>{item.specialist_name || "—"}</td><td>{money(item.gross_value_cents)}</td><td><b>{money(item.conecta_fee_expected_cents)}</b><small>{Number(item.conecta_fee_basis_points || 0)/100}%</small></td><td>{money(item.conecta_fee_received_cents)}</td><td>{money(item.connector_reward_cents)}</td><td>{date(item.conecta_fee_due_at)}</td><td><button onClick={() => setEntryDeal(item)}>Registrar movimento</button></td></tr>)}</tbody></table></div></section>}

      {tab === "products" && <section className={styles.card}><div className={styles.cardHead}><div><span>Regra econômica por produto</span><h2>Percentual interno da Rede Conecta</h2><p>O percentual é fotografado no fechamento do negócio, impedindo alterações retroativas.</p></div></div><div className={styles.rules}>{products.map(product => <ProductRule product={product} key={product.id} onSaved={reload}/>)}</div></section>}

      {tab === "ledger" && <section className={styles.card}><div className={styles.cardHead}><div><span>Livro financeiro</span><h2>Expectativas e movimentos confirmados</h2></div></div><div className={styles.table}><table><thead><tr><th>Data</th><th>Negócio</th><th>Produto</th><th>Tipo</th><th>Status</th><th>Valor</th><th>Vencimento</th><th>Descrição</th></tr></thead><tbody>{(data.ledger || []).map(item => <tr key={item.id}><td>{date(item.paid_at || item.created_at)}</td><td>{item.deal_number || item.protocol}</td><td>{item.product_name}</td><td>{String(item.entry_type).replaceAll("_", " ")}</td><td>{item.status}</td><td><b>{money(item.amount_cents)}</b></td><td>{date(item.due_at)}</td><td>{item.description}</td></tr>)}</tbody></table></div></section>}
    </main>

    {entryDeal && <div className={styles.modalBackdrop} onMouseDown={event => event.target === event.currentTarget && setEntryDeal(null)}><form className={styles.modal} onSubmit={recordEntry}><header><div><span>Negócio {entryDeal.deal_number || entryDeal.protocol}</span><h2>Registrar movimentação</h2></div><button type="button" onClick={() => setEntryDeal(null)}>×</button></header><label>Tipo<select name="entry_type"><option value="conecta_receipt">Recebimento da Rede Conecta</option><option value="connector_reward_payment">Pagamento ao conector</option><option value="specialist_commission_payment">Pagamento de comissão ao especialista</option><option value="refund">Estorno ou devolução</option><option value="adjustment">Ajuste financeiro</option></select></label><label>Valor (R$)<input name="amount" type="number" min="0" step="0.01" required/></label><label>Data<input name="paid_at" type="datetime-local" defaultValue={new Date().toISOString().slice(0,16)} required/></label><label>Descrição<textarea name="description" rows="3" placeholder="Comprovante, referência ou observação"/></label><button disabled={busy}>{busy ? "Registrando…" : "Registrar com auditoria"}</button></form></div>}
  </div>;
}
