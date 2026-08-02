"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./ProfessionalFinanceCenter.module.css";

const tabs = [
  ["overview", "Visão executiva", "chart"],
  ["cashflow", "Fluxo de caixa", "target"],
  ["receivables", "Contas a receber", "clock"],
  ["deals", "DRE por negócio", "check"],
  ["products", "Economia dos produtos", "building"],
  ["specialists", "Comissões comerciais", "user"],
  ["ledger", "Livro financeiro", "money"]
];

const entryLabels = {
  conecta_receivable: "Receita a receber",
  conecta_receipt: "Recebimento Conecta",
  connector_reward: "Recompensa prevista",
  connector_reward_payment: "Recompensa paga",
  specialist_commission: "Comissão prevista",
  specialist_commission_payment: "Comissão paga",
  refund: "Estorno",
  adjustment: "Ajuste"
};

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
}

function date(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function month(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(new Date(`${value}T12:00:00`));
}

function percentFromBasisPoints(value) {
  return `${(Number(value || 0) / 100).toFixed(2)}%`;
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

function Metric({ icon, label, value, note, tone = "default", onClick }) {
  const Tag = onClick ? "button" : "article";
  return <Tag type={onClick ? "button" : undefined} className={`${styles.metric} ${styles[`metric_${tone}`] || ""}`} onClick={onClick}>
    <span><Icon name={icon}/></span>
    <div><small>{label}</small><b>{value}</b><i>{note}</i></div>
    {onClick && <Icon name="arrow" size={16}/>} 
  </Tag>;
}

function Status({ value }) {
  const good = ["paid", "validated", "contracted"].includes(value);
  const warn = ["expected", "due", "scheduled", "contract_pending", "reservation"].includes(value);
  const bad = ["cancelled", "lost"].includes(value);
  return <span className={`${styles.status} ${good ? styles.good : warn ? styles.warn : bad ? styles.bad : ""}`}>{String(value || "—").replaceAll("_", " ")}</span>;
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`${styles.modal} ${wide ? styles.modalWide : ""}`}>
      <header><div><span>CONTROLADORIA REDE CONECTA</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>;
}

function ProductRuleRow({ item, onSaved, setNotice }) {
  const [editing, setEditing] = useState(false);
  const [percent, setPercent] = useState(String(Number(item.conecta_fee_percent || item.conecta_fee_basis_points / 100 || 0)));
  const [days, setDays] = useState(String(item.conecta_fee_payment_days ?? 7));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await request("set_product_financial_rule", {
        p_product_id: item.id || item.product_id,
        p_fee_percent: Number(String(percent).replace(",", ".")),
        p_payment_days: Number(days)
      });
      setEditing(false);
      await onSaved();
      setNotice({ message: `Regra econômica de ${item.name} atualizada.`, error: false });
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally { setBusy(false); }
  }

  return <div className={styles.ruleRow}>
    <span><b>{item.name}</b><small>{item.category} · {item.partner_name || "Rede Conecta"}</small></span>
    <span><small>Receita interna</small>{editing ? <input value={percent} onChange={event => setPercent(event.target.value)} inputMode="decimal"/> : <b>{Number(item.conecta_fee_percent ?? Number(item.conecta_fee_basis_points || 0) / 100).toFixed(2)}%</b>}</span>
    <span><small>Prazo</small>{editing ? <input type="number" min="0" max="365" value={days} onChange={event => setDays(event.target.value)}/> : <b>{item.conecta_fee_payment_days || 0} dias</b>}</span>
    <span><small>Negócios</small><b>{item.closed_deals || 0}</b></span>
    <span><small>VGV</small><b>{money(item.closed_gross_cents)}</b></span>
    <div>{editing ? <><button onClick={save} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button><button className={styles.lightButton} onClick={() => setEditing(false)}>Cancelar</button></> : <button onClick={() => setEditing(true)}>Editar regra</button>}</div>
  </div>;
}

function SpecialistRuleModal({ catalog, rule, onClose, onSaved, setNotice }) {
  const [type, setType] = useState(rule?.commission_type || "percentage");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const percent = Number(String(form.get("percent") || 0).replace(",", "."));
      const fixed = Number(String(form.get("fixed") || 0).replace(",", "."));
      await request("set_specialist_financial_rule", {
        p_profile_id: form.get("profileId"),
        p_product_id: form.get("productId"),
        p_commission_type: type,
        p_basis_points: type === "percentage" ? Math.round(percent * 100) : null,
        p_fixed_cents: type === "fixed" ? Math.round(fixed * 100) : null,
        p_payment_days: Number(form.get("days") || 0),
        p_notes: form.get("notes") || ""
      });
      await onSaved();
      onClose();
      setNotice({ message: "Regra de comissão publicada para o especialista e o produto.", error: false });
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally { setBusy(false); }
  }

  return <Modal title={rule ? "Editar regra de comissão" : "Nova regra de comissão"} subtitle="A regra será exibida na carteira do especialista e fotografada quando a venda for registrada." onClose={onClose}>
    <form className={styles.form} onSubmit={submit}>
      <label>Especialista<select name="profileId" defaultValue={rule?.profile_id || ""} required disabled={Boolean(rule)}><option value="">Selecione</option>{(catalog.specialists || []).map(item => <option value={item.profile_id} key={item.profile_id}>{item.display_name} · {item.professional_type_label}</option>)}</select></label>
      <label>Produto<select name="productId" defaultValue={rule?.product_id || ""} required disabled={Boolean(rule)}><option value="">Selecione</option>{(catalog.products || []).map(item => <option value={item.product_id} key={item.product_id}>{item.name} · {item.category}</option>)}</select></label>
      <label>Forma da comissão<select value={type} onChange={event => setType(event.target.value)}><option value="percentage">Percentual sobre a venda</option><option value="fixed">Valor fixo por negócio</option><option value="not_defined">Ainda não definida</option></select></label>
      {type === "percentage" && <label>Percentual (%)<input name="percent" inputMode="decimal" defaultValue={rule ? Number(rule.commission_basis_points || 0) / 100 : ""} required/></label>}
      {type === "fixed" && <label>Valor fixo (R$)<input name="fixed" type="number" min="0" step="0.01" defaultValue={rule ? Number(rule.commission_fixed_cents || 0) / 100 : ""} required/></label>}
      <label>Prazo previsto para pagamento<input name="days" type="number" min="0" max="365" defaultValue={rule?.commission_payment_days ?? 7} required/></label>
      <label>Condições e observações<textarea name="notes" rows="4" defaultValue={rule?.commission_notes || ""} placeholder="Ex.: pagamento após recebimento integral da taxa da Rede Conecta e validação do contrato."/></label>
      <div className={styles.formWarning}><Icon name="shield"/><span><b>Governança financeira</b>A alteração vale para negócios futuros. Negócios já registrados preservam a regra fotografada no fechamento.</span></div>
      <button disabled={busy}>{busy ? "Salvando…" : "Salvar regra"}</button>
    </form>
  </Modal>;
}

function EntryModal({ deal, onClose, onSaved, setNotice }) {
  const [status, setStatus] = useState("paid");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request("record_financial_entry", {
        p_deal_id: deal.id,
        p_entry_type: form.get("entryType"),
        p_amount_cents: Math.round(Number(String(form.get("amount") || 0).replace(",", ".")) * 100),
        p_status: status,
        p_due_at: status === "paid" ? null : form.get("dueAt") || null,
        p_paid_at: status === "paid" ? (form.get("paidAt") ? new Date(form.get("paidAt")).toISOString() : new Date().toISOString()) : null,
        p_description: form.get("description") || ""
      });
      await onSaved();
      onClose();
      setNotice({ message: "Movimentação registrada com auditoria e atualização das carteiras relacionadas.", error: false });
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally { setBusy(false); }
  }

  return <Modal title="Registrar movimentação" subtitle={`${deal.deal_number || deal.protocol} · ${deal.product_name}`} onClose={onClose}>
    <form className={styles.form} onSubmit={submit}>
      <label>Tipo<select name="entryType"><option value="conecta_receipt">Recebimento da Rede Conecta</option><option value="connector_reward_payment">Pagamento ao conector</option><option value="specialist_commission_payment">Pagamento ao especialista</option><option value="refund">Estorno ou devolução</option><option value="adjustment">Ajuste financeiro</option></select></label>
      <label>Situação<select value={status} onChange={event => setStatus(event.target.value)}><option value="paid">Realizado</option><option value="expected">Previsto</option><option value="scheduled">Programado</option><option value="due">Vencido</option><option value="cancelled">Cancelado</option></select></label>
      <label>Valor (R$)<input name="amount" type="number" min="0" step="0.01" required/></label>
      {status === "paid" ? <label>Data do movimento<input name="paidAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0,16)} required/></label> : <label>Vencimento<input name="dueAt" type="date" required/></label>}
      <label>Descrição<textarea name="description" rows="4" placeholder="Comprovante, banco, referência e observação"/></label>
      <button disabled={busy}>{busy ? "Registrando…" : "Registrar movimento"}</button>
    </form>
  </Modal>;
}

export default function ProfessionalFinanceCenter({ context, initialDashboard, initialProducts, initialSpecialistCatalog }) {
  const today = new Date();
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [data, setData] = useState(initialDashboard || {});
  const [products, setProducts] = useState(initialProducts || []);
  const [specialistCatalog, setSpecialistCatalog] = useState(initialSpecialistCatalog || { summary: {}, specialists: [], products: [], rules: [] });
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [entryDeal, setEntryDeal] = useState(null);
  const [specialistRule, setSpecialistRule] = useState(undefined);
  const [notice, setNotice] = useState({ message: "", error: false });

  const summary = data.summary || {};
  const aging = data.aging || {};
  const cashMargin = Number(summary.conecta_received_cents || 0) - Number(summary.connector_rewards_paid_cents || 0) - Number(summary.specialist_commissions_paid_cents || 0) - Number(summary.refunds_cents || 0);
  const economicMargin = Number(summary.conecta_expected_cents || 0) - Number(summary.connector_rewards_expected_cents || 0) - Number(summary.specialist_commissions_expected_cents || 0);
  const undefinedRules = Number(specialistCatalog.summary?.undefined_rules || 0);

  const openReceivables = useMemo(() => (data.ledger || []).filter(item => item.entry_type === "conecta_receivable" && ["expected", "due", "scheduled"].includes(item.status)), [data.ledger]);

  async function reload() {
    setBusy(true);
    try {
      const [dashboard, productRules, specialistRules] = await Promise.all([
        request("financial_dashboard", { p_from: from, p_to: to }),
        request("product_financial_rules"),
        request("specialist_financial_catalog")
      ]);
      setData(dashboard || {});
      setProducts(productRules || []);
      setSpecialistCatalog(specialistRules || { summary: {}, specialists: [], products: [], rules: [] });
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally { setBusy(false); }
  }

  function go(value) {
    setTab(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <NetworkMark inverse/>
      <span>CONTROLADORIA</span>
      <nav>{tabs.map(([key,label,icon]) => <button type="button" key={key} className={tab === key ? styles.active : ""} onClick={() => go(key)}><Icon name={icon}/><span>{label}</span>{key === "specialists" && undefinedRules > 0 && <i>{undefinedRules}</i>}</button>)}</nav>
      <div className={styles.sideLinks}><Link href="/painel"><Icon name="chart"/> Visão executiva</Link><Link href="/painel/sdr"><Icon name="target"/> Operações comerciais</Link></div>
      <div className={styles.controlRule}><Icon name="shield"/><span><b>Uma fonte econômica</b>Venda, receita, recompensa, comissão, vencimento e pagamento permanecem vinculados ao mesmo negócio.</span></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.header}>
        <div><span>GOVERNANÇA ECONÔMICA</span><h1>{tabs.find(([key]) => key === tab)?.[1]}</h1><p>Contratado, previsto, vencido e realizado são tratados separadamente.</p></div>
        <div className={styles.period}><label>De<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label><label>Até<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label><button onClick={reload} disabled={busy}>{busy ? "Atualizando…" : "Aplicar período"}</button></div>
      </header>

      {notice.message && <div className={`${styles.notice} ${notice.error ? styles.noticeError : ""}`}><Icon name={notice.error ? "shield" : "check"}/><span>{notice.message}</span><button onClick={() => setNotice({ message: "", error: false })}>×</button></div>}

      {tab === "overview" && <>
        <section className={styles.metrics}>
          <Metric icon="check" label="Negócios fechados" value={summary.closed_deals || 0} note={`VGV ${money(summary.closed_gross_cents)}`} onClick={() => go("deals")}/>
          <Metric icon="target" label="Receita contratada" value={money(summary.conecta_expected_cents)} note="participação econômica da Rede Conecta"/>
          <Metric icon="money" label="Receita recebida" value={money(summary.conecta_received_cents)} note="caixa efetivamente conciliado"/>
          <Metric icon="chart" label="Margem econômica" value={money(economicMargin)} note="receita menos recompensas e comissões previstas" tone={economicMargin < 0 ? "danger" : "success"}/>
          <Metric icon="clock" label="Contas a receber" value={money(summary.total_receivables_open_cents)} note={`${money(summary.overdue_receivables_cents)} vencidos`} tone={Number(summary.overdue_receivables_cents) > 0 ? "danger" : "default"} onClick={() => go("receivables")}/>
          <Metric icon="user" label="Comissões previstas" value={money(summary.specialist_commissions_expected_cents)} note={`${money(summary.specialist_commissions_paid_cents)} pagos`} onClick={() => go("specialists")}/>
          <Metric icon="link" label="Recompensas previstas" value={money(summary.connector_rewards_expected_cents)} note={`${money(summary.connector_rewards_paid_cents)} pagos`}/>
          <Metric icon="money" label="Resultado de caixa" value={money(cashMargin)} note="entradas menos saídas realizadas" tone={cashMargin < 0 ? "danger" : "success"}/>
        </section>
        <section className={styles.executiveGrid}>
          <article><span>Eficiência de recebimento</span><b>{summary.conecta_expected_cents ? `${Math.min(100, Number(summary.conecta_received_cents || 0) / Number(summary.conecta_expected_cents) * 100).toFixed(1)}%` : "0,0%"}</b><i>recebido sobre a receita contratada</i></article>
          <article><span>Take rate médio</span><b>{summary.closed_gross_cents ? `${(Number(summary.conecta_expected_cents || 0) / Number(summary.closed_gross_cents) * 100).toFixed(2)}%` : "0,00%"}</b><i>receita interna sobre o VGV</i></article>
          <article className={undefinedRules ? styles.attentionCard : ""}><span>Regras comerciais pendentes</span><b>{undefinedRules}</b><i>{undefinedRules ? "especialistas sem expectativa de ganho definida" : "todas as regras existentes estão definidas"}</i><button onClick={() => go("specialists")}>Revisar regras</button></article>
        </section>
      </>}

      {tab === "cashflow" && <section className={styles.card}><div className={styles.cardHead}><div><span>FLUXO DE CAIXA</span><h2>Realizado e projetado por mês</h2><p>Entradas e saídas são separadas por competência financeira.</p></div></div><div className={styles.cashflowGrid}>{(data.cashflow || []).map(item => {
        const realized = Number(item.inflow_cents || 0) - Number(item.outflow_cents || 0);
        const projected = Number(item.projected_inflow_cents || 0) - Number(item.projected_outflow_cents || 0);
        return <article key={item.period_month}><header><b>{month(item.period_month)}</b><span className={realized < 0 ? styles.negative : styles.positive}>{money(realized)}</span></header><dl><dt>Entradas realizadas</dt><dd>{money(item.inflow_cents)}</dd><dt>Saídas realizadas</dt><dd>{money(item.outflow_cents)}</dd><dt>Entradas projetadas</dt><dd>{money(item.projected_inflow_cents)}</dd><dt>Saídas projetadas</dt><dd>{money(item.projected_outflow_cents)}</dd><dt>Saldo projetado</dt><dd>{money(projected)}</dd></dl></article>;
      })}</div>{!(data.cashflow || []).length && <p className={styles.empty}>Nenhum movimento no período.</p>}</section>}

      {tab === "receivables" && <>
        <section className={styles.aging}><article><span>A vencer</span><b>{money(aging.not_due)}</b></article><article><span>1–30 dias</span><b>{money(aging.days_1_30)}</b></article><article><span>31–60 dias</span><b>{money(aging.days_31_60)}</b></article><article><span>61–90 dias</span><b>{money(aging.days_61_90)}</b></article><article className={styles.overdue}><span>Acima de 90 dias</span><b>{money(aging.over_90)}</b></article></section>
        <section className={styles.card}><div className={styles.cardHead}><div><span>CARTEIRA</span><h2>Receitas abertas</h2></div></div><div className={styles.table}><table><thead><tr><th>Negócio</th><th>Produto</th><th>Status</th><th>Valor</th><th>Vencimento</th><th>Descrição</th></tr></thead><tbody>{openReceivables.map(item => <tr key={item.id}><td><b>{item.deal_number || item.protocol}</b></td><td>{item.product_name}</td><td><Status value={item.status}/></td><td><b>{money(item.amount_cents)}</b></td><td>{date(item.due_at)}</td><td>{item.description}</td></tr>)}</tbody></table></div>{!openReceivables.length && <p className={styles.empty}>Nenhuma receita aberta.</p>}</section>
      </>}

      {tab === "deals" && <section className={styles.card}><div className={styles.cardHead}><div><span>DRE UNITÁRIA</span><h2>Economia de cada negócio</h2><p>Venda, receita interna, recompensa, comissão e margem no mesmo registro.</p></div></div><div className={styles.table}><table><thead><tr><th>Negócio</th><th>Produto</th><th>Conector</th><th>Especialista</th><th>Venda</th><th>Receita Conecta</th><th>Recompensa</th><th>Comissão</th><th>Margem bruta</th><th></th></tr></thead><tbody>{(data.deals || []).map(item => {
        const margin = Number(item.conecta_fee_expected_cents || 0) - Number(item.connector_reward_cents || 0) - Number(item.specialist_commission_cents || 0);
        return <tr key={item.id}><td><b>{item.deal_number || item.protocol}</b><small>{date(item.reference_date)}</small></td><td>{item.product_name}</td><td>{item.connector_name || "—"}</td><td>{item.specialist_name || "—"}</td><td>{money(item.gross_value_cents)}</td><td><b>{money(item.conecta_fee_expected_cents)}</b><small>{percentFromBasisPoints(item.conecta_fee_basis_points)}</small></td><td>{money(item.connector_reward_cents)}</td><td>{money(item.specialist_commission_cents)}</td><td className={margin < 0 ? styles.negative : styles.positive}><b>{money(margin)}</b></td><td><button onClick={() => setEntryDeal(item)}>Movimentar</button></td></tr>;
      })}</tbody></table></div>{!(data.deals || []).length && <p className={styles.empty}>Nenhum negócio no período.</p>}</section>}

      {tab === "products" && <>
        <section className={styles.card}><div className={styles.cardHead}><div><span>RENTABILIDADE</span><h2>Desempenho econômico por produto</h2></div></div><div className={styles.profitGrid}>{(data.product_profitability || []).map(item => <article key={item.id}><header><div><span>{item.category}</span><h3>{item.name}</h3></div><b className={Number(item.gross_margin_cents) < 0 ? styles.negative : styles.positive}>{money(item.gross_margin_cents)}</b></header><dl><dt>Negócios</dt><dd>{item.closed_deals || 0}</dd><dt>VGV</dt><dd>{money(item.gross_value_cents)}</dd><dt>Receita esperada</dt><dd>{money(item.revenue_expected_cents)}</dd><dt>Receita recebida</dt><dd>{money(item.revenue_received_cents)}</dd><dt>Conectores</dt><dd>{money(item.connector_reward_cents)}</dd><dt>Especialistas</dt><dd>{money(item.specialist_commission_cents)}</dd></dl></article>)}</div></section>
        <section className={styles.card}><div className={styles.cardHead}><div><span>REGRAS POR PRODUTO</span><h2>Participação da Rede Conecta</h2><p>A regra é fotografada no fechamento e não muda retroativamente.</p></div></div><div className={styles.rules}>{products.map(item => <ProductRuleRow key={item.id || item.product_id} item={item} onSaved={reload} setNotice={setNotice}/>)}</div></section>
      </>}

      {tab === "specialists" && <section className={styles.card}><div className={styles.cardHead}><div><span>COMISSÕES COMERCIAIS</span><h2>Expectativa de ganho por especialista e produto</h2><p>O profissional vê a regra, a estimativa, o valor validado, a previsão e os pagamentos na própria carteira.</p></div><button onClick={() => setSpecialistRule(null)}>Nova regra</button></div><div className={styles.specialistSummary}><span><small>Especialistas ativos</small><b>{specialistCatalog.summary?.specialists || 0}</b></span><span><small>Vínculos comerciais</small><b>{specialistCatalog.summary?.rules || 0}</b></span><span className={undefinedRules ? styles.pendingBox : ""}><small>Sem regra definida</small><b>{undefinedRules}</b></span></div><div className={styles.table}><table><thead><tr><th>Especialista</th><th>Produto</th><th>Vínculo</th><th>Treinamento</th><th>Regra</th><th>Prazo</th><th>Ativos</th><th>Esperado</th><th>Pago</th><th></th></tr></thead><tbody>{(specialistCatalog.rules || []).map(item => <tr key={item.id}><td><b>{item.specialist_name}</b><small>{String(item.professional_type || "especialista").replaceAll("_", " ")}</small></td><td><b>{item.product_name}</b><small>{item.category}</small></td><td><Status value={item.assignment_status}/></td><td>{item.training_compliant ? "Regular" : "Pendente"}</td><td>{item.commission_type === "percentage" ? percentFromBasisPoints(item.commission_basis_points) : item.commission_type === "fixed" ? money(item.commission_fixed_cents) : <span className={styles.undefined}>A definir</span>}</td><td>{item.commission_payment_days || 0} dias</td><td>{item.active_connections || 0}</td><td>{money(item.commission_expected_cents)}</td><td>{money(item.commission_paid_cents)}</td><td><button onClick={() => setSpecialistRule(item)}>Editar</button></td></tr>)}</tbody></table></div>{!(specialistCatalog.rules || []).length && <p className={styles.empty}>Nenhum vínculo financeiro configurado.</p>}</section>}

      {tab === "ledger" && <section className={styles.card}><div className={styles.cardHead}><div><span>LIVRO FINANCEIRO</span><h2>Expectativas e movimentos confirmados</h2></div></div><div className={styles.table}><table><thead><tr><th>Data</th><th>Negócio</th><th>Produto</th><th>Tipo</th><th>Status</th><th>Valor</th><th>Vencimento</th><th>Descrição</th></tr></thead><tbody>{(data.ledger || []).map(item => <tr key={item.id}><td>{date(item.paid_at || item.created_at)}</td><td>{item.deal_number || item.protocol}</td><td>{item.product_name}</td><td>{entryLabels[item.entry_type] || String(item.entry_type).replaceAll("_", " ")}</td><td><Status value={item.status}/></td><td><b>{money(item.amount_cents)}</b></td><td>{date(item.due_at)}</td><td>{item.description}</td></tr>)}</tbody></table></div>{!(data.ledger || []).length && <p className={styles.empty}>Nenhuma movimentação registrada.</p>}</section>}
    </main>

    {entryDeal && <EntryModal deal={entryDeal} onClose={() => setEntryDeal(null)} onSaved={reload} setNotice={setNotice}/>} 
    {specialistRule !== undefined && <SpecialistRuleModal catalog={specialistCatalog} rule={specialistRule} onClose={() => setSpecialistRule(undefined)} onSaved={reload} setNotice={setNotice}/>} 
  </div>;
}
