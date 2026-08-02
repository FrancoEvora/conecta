"use client";

import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./FinancialDashboard.module.css";

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
}
function date(value) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "—"; }
function month(value) { return value ? new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(new Date(value)) : "—"; }
async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, params }) });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) { location.href = "/entrar?next=/painel/financeiro"; throw new Error("Sessão expirada."); }
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload.data;
}

function Metric({ label, value, note, icon, danger = false }) {
  return <article className={`${styles.metric} ${danger ? styles.dangerMetric : ""}`}><span><Icon name={icon}/></span><div><small>{label}</small><b>{value}</b><i>{note}</i></div></article>;
}

function ProductRule({ product, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [percent, setPercent] = useState(String(product.conecta_fee_percent ?? 0));
  const [days, setDays] = useState(String(product.conecta_fee_payment_days ?? 7));
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await request("set_product_financial_rule", { p_product_id: product.id, p_fee_percent: Number(String(percent).replace(",", ".")), p_payment_days: Number(days) });
      setEditing(false); await onSaved();
    } finally { setBusy(false); }
  }
  return <div className={styles.productRule}>
    <span><b>{product.name}</b><small>{product.category} · {product.partner_name || "Rede Conecta"}</small></span>
    <span><small>Ganho interno</small>{editing ? <input value={percent} onChange={event => setPercent(event.target.value)}/> : <b>{Number(product.conecta_fee_percent || 0).toFixed(2)}%</b>}</span>
    <span><small>Prazo esperado</small>{editing ? <input type="number" min="0" max="365" value={days} onChange={event => setDays(event.target.value)}/> : <b>{product.conecta_fee_payment_days || 0} dias</b>}</span>
    <span><small>Vendas</small><b>{product.closed_deals || 0}</b></span>
    <span><small>VGV fechado</small><b>{money(product.closed_gross_cents)}</b></span>
    <div>{editing ? <><button onClick={save} disabled={busy}>{busy ? "Salvando…" : "Salvar regra"}</button><button onClick={() => setEditing(false)}>Cancelar</button></> : <button onClick={() => setEditing(true)}>Editar regra</button>}</div>
  </div>;
}

function Cashflow({ rows }) {
  const max = Math.max(1, ...rows.flatMap(row => [Number(row.inflow_cents || 0), Number(row.outflow_cents || 0), Number(row.projected_inflow_cents || 0), Number(row.projected_outflow_cents || 0)]));
  return <section className={styles.card}><div className={styles.cardHead}><div><span>Fluxo de caixa</span><h2>Realizado e projetado</h2><p>Entradas, saídas e compromissos agrupados por mês.</p></div></div><div className={styles.cashflow}>{rows.map(row => <article key={row.period_month}><header><b>{month(row.period_month)}</b><small>Saldo realizado {money(Number(row.inflow_cents)-Number(row.outflow_cents))}</small></header><div className={styles.bars}><span style={{width:`${Number(row.inflow_cents||0)/max*100}%`}}><i>Entradas {money(row.inflow_cents)}</i></span><span style={{width:`${Number(row.outflow_cents||0)/max*100}%`}}><i>Saídas {money(row.outflow_cents)}</i></span><span style={{width:`${Number(row.projected_inflow_cents||0)/max*100}%`}}><i>Previsto a receber {money(row.projected_inflow_cents)}</i></span><span style={{width:`${Number(row.projected_outflow_cents||0)/max*100}%`}}><i>Previsto a pagar {money(row.projected_outflow_cents)}</i></span></div></article>)}</div></section>;
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
  const cashResult = useMemo(() => Number(summary.conecta_received_cents || 0)-Number(summary.connector_rewards_paid_cents || 0)-Number(summary.specialist_commissions_paid_cents || 0)-Number(summary.refunds_cents || 0)+Number(summary.adjustments_cents || 0), [summary]);
  const expectedMargin = useMemo(() => Number(summary.conecta_expected_cents || 0)-Number(summary.connector_rewards_expected_cents || 0)-Number(summary.specialist_commissions_expected_cents || 0), [summary]);

  async function reload() {
    setBusy(true);
    try {
      const [dashboard, productRules] = await Promise.all([request("financial_dashboard", { p_from: from, p_to: to }), request("product_financial_rules")]);
      setData(dashboard || {}); setProducts(productRules || []);
    } finally { setBusy(false); }
  }

  async function recordEntry(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true);
    try {
      await request("record_financial_entry", { p_deal_id: entryDeal.id, p_entry_type: form.get("entry_type"), p_amount_cents: Math.round(Number(String(form.get("amount") || 0).replace(",", "."))*100), p_status: form.get("status"), p_due_at: form.get("due_at") || null, p_paid_at: form.get("paid_at") ? new Date(form.get("paid_at")).toISOString() : null, p_description: form.get("description") || "" });
      setEntryDeal(null); await reload();
    } finally { setBusy(false); }
  }

  const tabs = [["summary","Visão executiva","chart"],["cashflow","Fluxo de caixa","money"],["aging","Contas a receber","shield"],["profitability","Rentabilidade","target"],["deals","Negócios","check"],["products","Regras por produto","building"],["ledger","Livro financeiro","link"]];
  return <div className={styles.shell}>
    <aside className={styles.sidebar}><NetworkMark inverse/><span>Controladoria Conecta</span>{tabs.map(([key,label,icon]) => <button className={tab===key?styles.active:""} key={key} onClick={() => setTab(key)}><Icon name={icon}/><span>{label}</span></button>)}<button onClick={() => location.href="/painel/operacao"}><Icon name="arrow"/><span>Voltar à operação</span></button></aside>
    <main className={styles.main}>
      <header className={styles.header}><div><span>CONTROLADORIA COMERCIAL E FINANCEIRA</span><h1>Resultado, caixa, obrigações e rentabilidade.</h1><p>Visão integrada dos negócios fechados, receitas da Rede Conecta, comissões, bônus e recebíveis.</p></div><div className={styles.period}><label>De<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label><label>Até<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label><button onClick={reload} disabled={busy}>{busy?"Atualizando…":"Aplicar período"}</button></div></header>

      {tab==="summary" && <><section className={styles.metrics}>
        <Metric label="Negócios fechados" value={summary.closed_deals||0} note={`VGV ${money(summary.closed_gross_cents)}`} icon="check"/>
        <Metric label="Receita contratada" value={money(summary.conecta_expected_cents)} note="receita interna esperada" icon="target"/>
        <Metric label="Receita recebida" value={money(summary.conecta_received_cents)} note="caixa efetivamente conciliado" icon="money"/>
        <Metric label="Resultado de caixa" value={money(cashResult)} note="entradas menos pagamentos e estornos" icon="chart"/>
        <Metric label="Contas a receber" value={money(summary.total_receivables_open_cents)} note={`${money(summary.overdue_receivables_cents)} vencidos`} icon="shield" danger={Number(summary.overdue_receivables_cents)>0}/>
        <Metric label="Contas a pagar" value={money(summary.total_payables_open_cents)} note="bônus e comissões em aberto" icon="user"/>
        <Metric label="Margem bruta esperada" value={money(expectedMargin)} note="receita menos bônus e comissões" icon="chart"/>
        <Metric label="Próximos 30 dias" value={money(summary.next_30_days_receivables_cents)} note="entradas previstas" icon="money"/>
      </section><section className={styles.executive}><div><span>Taxa interna sobre VGV</span><b>{summary.closed_gross_cents?`${(Number(summary.conecta_expected_cents||0)/Number(summary.closed_gross_cents)*100).toFixed(2)}%`:"0,00%"}</b><small>receita contratada sobre negócios fechados</small></div><div><span>Eficiência de recebimento</span><b>{summary.conecta_expected_cents?`${Math.min(100,Number(summary.conecta_received_cents||0)/Number(summary.conecta_expected_cents)*100).toFixed(1)}%`:"0,0%"}</b><small>recebido sobre contratado</small></div><div><span>Margem esperada</span><b>{summary.conecta_expected_cents?`${(expectedMargin/Number(summary.conecta_expected_cents)*100).toFixed(1)}%`:"0,0%"}</b><small>após bônus e comissões previstas</small></div></section><Cashflow rows={data.cashflow||[]}/></>}

      {tab==="cashflow" && <Cashflow rows={data.cashflow||[]}/>} 
      {tab==="aging" && <section className={styles.card}><div className={styles.cardHead}><div><span>Contas a receber</span><h2>Envelhecimento da carteira</h2><p>Concentração dos recebíveis por faixa de atraso.</p></div></div><div className={styles.aging}>{[["A vencer",data.aging?.not_due],["1 a 30 dias",data.aging?.days_1_30],["31 a 60 dias",data.aging?.days_31_60],["61 a 90 dias",data.aging?.days_61_90],["Acima de 90 dias",data.aging?.over_90]].map(([label,value],index)=><article className={index===4?styles.overdue:""} key={label}><small>{label}</small><b>{money(value)}</b></article>)}</div></section>}
      {tab==="profitability" && <section className={styles.card}><div className={styles.cardHead}><div><span>Rentabilidade por produto</span><h2>Margem comercial e econômica</h2><p>Receita esperada menos recompensa do conector e comissão do especialista.</p></div></div><div className={styles.table}><table><thead><tr><th>Produto</th><th>Negócios</th><th>VGV</th><th>Receita esperada</th><th>Recebido</th><th>Bônus</th><th>Comissões</th><th>Margem bruta</th></tr></thead><tbody>{(data.product_profitability||[]).map(item=><tr key={item.id}><td><b>{item.name}</b><small>{item.category}</small></td><td>{item.closed_deals}</td><td>{money(item.gross_value_cents)}</td><td>{money(item.revenue_expected_cents)}</td><td>{money(item.revenue_received_cents)}</td><td>{money(item.connector_reward_cents)}</td><td>{money(item.specialist_commission_cents)}</td><td><b>{money(item.gross_margin_cents)}</b></td></tr>)}</tbody></table></div></section>}
      {tab==="deals" && <section className={styles.card}><div className={styles.cardHead}><div><span>Negócios por período</span><h2>DRE individual de cada operação</h2></div></div><div className={styles.table}><table><thead><tr><th>Negócio</th><th>Produto</th><th>Conector</th><th>Especialista</th><th>Valor</th><th>Receita Conecta</th><th>Recebido</th><th>Bônus</th><th>Comissão</th><th></th></tr></thead><tbody>{(data.deals||[]).map(item=><tr key={item.id}><td><b>{item.deal_number||item.protocol}</b><small>{date(item.reference_date)}</small></td><td>{item.product_name}</td><td>{item.connector_name||"—"}</td><td>{item.specialist_name||"—"}</td><td>{money(item.gross_value_cents)}</td><td><b>{money(item.conecta_fee_expected_cents)}</b><small>{Number(item.conecta_fee_basis_points||0)/100}%</small></td><td>{money(item.conecta_fee_received_cents)}</td><td>{money(item.connector_reward_cents)}</td><td>{money(item.specialist_commission_cents)}</td><td><button onClick={()=>setEntryDeal(item)}>Movimentar</button></td></tr>)}</tbody></table></div></section>}
      {tab==="products" && <section className={styles.card}><div className={styles.cardHead}><div><span>Política econômica por produto</span><h2>Percentual e prazo de recebimento</h2><p>A regra é fotografada no fechamento e não altera negócios anteriores.</p></div></div><div className={styles.rules}>{products.map(product=><ProductRule product={product} key={product.id} onSaved={reload}/>)}</div></section>}
      {tab==="ledger" && <section className={styles.card}><div className={styles.cardHead}><div><span>Livro financeiro</span><h2>Expectativas, vencimentos e movimentos realizados</h2></div></div><div className={styles.table}><table><thead><tr><th>Data</th><th>Negócio</th><th>Produto</th><th>Tipo</th><th>Status</th><th>Valor</th><th>Vencimento</th><th>Descrição</th></tr></thead><tbody>{(data.ledger||[]).map(item=><tr key={item.id}><td>{date(item.paid_at||item.created_at)}</td><td>{item.deal_number||item.protocol}</td><td>{item.product_name}</td><td>{String(item.entry_type).replaceAll("_"," ")}</td><td>{item.status}</td><td><b>{money(item.amount_cents)}</b></td><td>{date(item.due_at)}</td><td>{item.description}</td></tr>)}</tbody></table></div></section>}
    </main>

    {entryDeal && <div className={styles.modalBackdrop} onMouseDown={event=>event.target===event.currentTarget&&setEntryDeal(null)}><form className={styles.modal} onSubmit={recordEntry}><header><div><span>Negócio {entryDeal.deal_number||entryDeal.protocol}</span><h2>Registrar movimentação</h2></div><button type="button" onClick={()=>setEntryDeal(null)}>×</button></header><label>Tipo<select name="entry_type"><option value="conecta_receipt">Recebimento da Rede Conecta</option><option value="connector_reward_payment">Pagamento ao conector</option><option value="specialist_commission_payment">Pagamento ao especialista</option><option value="refund">Estorno ou devolução</option><option value="adjustment">Ajuste financeiro</option></select></label><label>Status<select name="status"><option value="paid">Pago/recebido</option><option value="scheduled">Programado</option><option value="due">Vencido</option><option value="expected">Previsto</option></select></label><label>Valor (R$)<input name="amount" type="number" min="0" step="0.01" required/></label><label>Vencimento<input name="due_at" type="date"/></label><label>Data de pagamento<input name="paid_at" type="datetime-local" defaultValue={new Date().toISOString().slice(0,16)}/></label><label>Descrição<textarea name="description" rows="3" placeholder="Comprovante, referência ou observação"/></label><button disabled={busy}>{busy?"Registrando…":"Registrar com auditoria"}</button></form></div>}
  </div>;
}
