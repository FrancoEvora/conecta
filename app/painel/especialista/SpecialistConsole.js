"use client";

import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./SpecialistConsole.module.css";

const tabs = [
  ["today", "Hoje", "target"],
  ["pipeline", "Pipeline", "chart"],
  ["earnings", "Ganhos", "money"],
  ["products", "Produtos", "building"],
  ["profile", "Meu perfil", "user"]
];

const stageLabels = {
  new: "Novo",
  assigned: "Novo atendimento",
  accepted: "Aceito",
  contacted: "Contato iniciado",
  qualified: "Qualificado",
  visit_scheduled: "Visita ou reunião",
  proposal: "Proposta",
  won: "Venda validada",
  lost: "Perdido",
  cancelled: "Cancelado"
};

const dealLabels = {
  draft: "Em preparação",
  reservation: "Reserva",
  contract_pending: "Contrato em preparação",
  contracted: "Venda informada",
  validated: "Venda validada",
  cancelled: "Cancelada",
  lost: "Perdida"
};

const commissionLabels = {
  not_defined: "A definir pela gestão",
  percentage: "Percentual sobre a venda",
  fixed: "Valor fixo por negócio"
};

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
}

function date(value, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(new Date(value));
}

async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    location.href = "/entrar?next=/painel/especialista";
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload.data;
}

function Status({ value, kind = "connection" }) {
  const text = kind === "deal" ? dealLabels[value] : stageLabels[value];
  const good = ["won", "validated", "paid", "enabled"].includes(value);
  const warn = ["proposal", "contracted", "pending_training", "assigned"].includes(value);
  const bad = ["lost", "cancelled", "revoked", "paused"].includes(value);
  return <span className={`${styles.status} ${good ? styles.good : warn ? styles.warn : bad ? styles.bad : ""}`}>{text || String(value || "—").replaceAll("_", " ")}</span>;
}

function Metric({ icon, label, value, note, onClick }) {
  const Tag = onClick ? "button" : "article";
  return <Tag type={onClick ? "button" : undefined} onClick={onClick} className={styles.metric}>
    <span><Icon name={icon}/></span>
    <div><small>{label}</small><b>{value}</b><i>{note}</i></div>
    {onClick && <Icon name="arrow" size={16}/>} 
  </Tag>;
}

function RuleText({ item, compact = false }) {
  if (!item || item.commission_type === "not_defined" || !item.commission_type) {
    return <span className={styles.pendingRule}><b>Comissão a definir</b>{!compact && <small>A gestão ainda não publicou a regra deste produto.</small>}</span>;
  }
  if (item.commission_type === "fixed") {
    return <span><b>{money(item.commission_fixed_cents)}</b>{!compact && <small>por negócio validado · pagamento em até {item.commission_payment_days || 0} dias</small>}</span>;
  }
  return <span><b>{(Number(item.commission_basis_points || 0) / 100).toFixed(2)}%</b>{!compact && <small>sobre o valor validado · pagamento em até {item.commission_payment_days || 0} dias</small>}</span>;
}

function EstimatedCommission({ item }) {
  if (item.specialist_commission_cents > 0) return <b>{money(item.specialist_commission_cents)}</b>;
  if (item.commission_estimate_min_cents || item.commission_estimate_max_cents) {
    const min = Number(item.commission_estimate_min_cents || item.commission_estimate_max_cents || 0);
    const max = Number(item.commission_estimate_max_cents || min);
    return <b>{min === max ? money(min) : `${money(min)} a ${money(max)}`}</b>;
  }
  return <b>A calcular</b>;
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  return <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`${styles.modal} ${wide ? styles.modalWide : ""}`}>
      <header><div><span>REDE CONECTA</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>;
}

function PipelineCard({ item, onOpen }) {
  const overdue = item.next_action_at && new Date(item.next_action_at) < new Date() && !["won", "lost", "cancelled"].includes(item.status);
  return <article className={`${styles.pipelineCard} ${overdue ? styles.overdue : ""}`}>
    <header>
      <div><span>{item.protocol}</span><h3>{item.contact_name || "Contato"}</h3><p>{item.product_name || item.source_product_name_snapshot}</p></div>
      <Status value={item.status}/>
    </header>
    <div className={styles.pipelineMeta}>
      <span><small>Origem</small><b>{item.connector_name || "Rede Conecta"}</b></span>
      <span><small>SDR</small><b>{item.sdr_score != null ? `Score ${item.sdr_score}` : "Ainda não concluído"}</b></span>
      <span><small>Próxima ação</small><b>{item.next_action_at ? date(item.next_action_at, true) : "Definir no atendimento"}</b></span>
      <span><small>Comissão estimada</small><EstimatedCommission item={item}/></span>
    </div>
    {item.sdr_summary && <p className={styles.sdrSummary}>{item.sdr_summary}</p>}
    <footer>
      <span>{item.deal_status && <Status value={item.deal_status} kind="deal"/>}</span>
      <button type="button" onClick={() => onOpen(item)}>{item.status === "assigned" ? "Aceitar e abrir" : "Abrir atendimento"}<Icon name="arrow" size={16}/></button>
    </footer>
  </article>;
}

function PipelineBoard({ rows, onOpen }) {
  const columns = [
    ["assigned", "Novos"],
    ["contacted", "Em contato"],
    ["qualified", "Qualificados"],
    ["visit_scheduled", "Visitas"],
    ["proposal", "Propostas"],
    ["won", "Concluídos"]
  ];
  return <div className={styles.board}>{columns.map(([key, label]) => {
    const items = rows.filter(item => key === "contacted" ? ["accepted", "contacted"].includes(item.status) : item.status === key);
    return <section key={key} className={styles.boardColumn}><header><b>{label}</b><span>{items.length}</span></header><div>{items.map(item => <PipelineCard item={item} onOpen={onOpen} key={item.id}/>)}{!items.length && <p>Nenhum atendimento.</p>}</div></section>;
  })}</div>;
}

export default function SpecialistConsole({ context, initialSnapshot }) {
  const [data, setData] = useState(initialSnapshot || {});
  const [active, setActive] = useState("today");
  const [selected, setSelected] = useState(null);
  const [stageModal, setStageModal] = useState(null);
  const [saleModal, setSaleModal] = useState(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState({ message: "", error: false });
  const [filter, setFilter] = useState("all");
  const specialist = data.specialist || {};
  const summary = data.summary || {};
  const pipeline = data.pipeline || [];

  const filteredPipeline = useMemo(() => pipeline.filter(item => {
    if (filter === "all") return true;
    if (filter === "open") return !["won", "lost", "cancelled"].includes(item.status);
    if (filter === "attention") return item.next_action_at && new Date(item.next_action_at) < new Date() && !["won", "lost", "cancelled"].includes(item.status);
    return item.status === filter;
  }), [pipeline, filter]);

  async function reload() {
    const snapshot = await request("specialist_snapshot");
    setData(snapshot || {});
    return snapshot || {};
  }

  async function execute(key, callback) {
    setBusy(key);
    setNotice({ message: "", error: false });
    try { await callback(); }
    catch (error) { setNotice({ message: error.message, error: true }); }
    finally { setBusy(""); }
  }

  function openConnection(item) {
    setSelected(item);
    if (item.status === "assigned") {
      execute(item.id, async () => {
        await request("specialist_accept_connection", { p_connection_id: item.id });
        const next = await reload();
        setSelected((next.pipeline || []).find(row => row.id === item.id) || item);
        setNotice({ message: "Atendimento aceito. O conector recebeu a atualização.", error: false });
      });
    }
  }

  function saveStage(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    execute(stageModal.id, async () => {
      await request("specialist_update_stage", {
        p_connection_id: stageModal.id,
        p_to_status: form.get("stage"),
        p_note: form.get("note") || "",
        p_next_action_at: form.get("nextAction") ? new Date(form.get("nextAction")).toISOString() : null
      });
      setStageModal(null);
      setSelected(null);
      await reload();
      setNotice({ message: "Etapa atualizada e registrada na linha do tempo.", error: false });
    });
  }

  function reportSale(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    execute(saleModal.id, async () => {
      const gross = Math.round(Number(String(form.get("grossValue") || 0).replace(",", ".")) * 100);
      await request("specialist_report_sale", {
        p_connection_id: saleModal.id,
        p_payload: {
          product_id: saleModal.destination_product_id || saleModal.source_product_id || "",
          deal_number: form.get("dealNumber") || "",
          unit_reference: form.get("unitReference") || "",
          gross_value_cents: gross,
          contract_signed_at: form.get("contractDate") ? new Date(form.get("contractDate")).toISOString() : new Date().toISOString(),
          evidence_reference: form.get("evidenceReference") || "",
          notes: form.get("notes") || ""
        }
      });
      setSaleModal(null);
      setSelected(null);
      await reload();
      setNotice({ message: "Venda informada. A Rede Conecta fará a validação antes da confirmação definitiva.", error: false });
    });
  }

  async function markRead(id) {
    await request("specialist_mark_notification_read", { p_notification_id: id });
    await reload();
  }

  function go(tab) {
    setActive(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <NetworkMark inverse/>
      <div className={styles.identity}><span>{specialist.professional_type_label || "Especialista comercial"}</span><b>{specialist.display_name || context.display_name}</b></div>
      <nav>{tabs.map(([key, label, icon]) => <button type="button" key={key} className={active === key ? styles.active : ""} onClick={() => go(key)}><Icon name={icon}/><span>{label}</span>{key === "today" && summary.unread_notifications > 0 && <i>{summary.unread_notifications}</i>}</button>)}</nav>
      <div className={styles.protection}><Icon name="shield"/><span><b>Origem preservada</b>Você opera o atendimento. O conector de origem, o histórico, a venda e a comissão ficam registrados pela Rede Conecta.</span></div>
      <button className={styles.logout} onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}>
        <div><span>OPERAÇÃO COMERCIAL</span><h1>{tabs.find(([key]) => key === active)?.[1]}</h1><p>Atendimentos atribuídos, próximos passos, vendas e ganhos em uma única jornada.</p></div>
        <button type="button" onClick={() => execute("reload", reload)} disabled={busy === "reload"}>{busy === "reload" ? "Atualizando…" : "Atualizar"}</button>
      </header>

      {notice.message && <div className={`${styles.notice} ${notice.error ? styles.noticeError : ""}`}><Icon name={notice.error ? "shield" : "check"}/><span>{notice.message}</span><button onClick={() => setNotice({ message: "", error: false })}>×</button></div>}

      {active === "today" && <>
        <section className={styles.hero}>
          <div><span>SUA PRIORIDADE AGORA</span><h2>{summary.new_assignments > 0 ? `${summary.new_assignments} novo(s) atendimento(s) aguardam aceite.` : summary.overdue_actions > 0 ? `${summary.overdue_actions} atendimento(s) estão com ação vencida.` : "Sua carteira está organizada."}</h2><p>Abra cada atendimento para consultar o contato, o briefing do SDR, a origem e a expectativa de ganho.</p><button onClick={() => go("pipeline")}>Abrir pipeline <Icon name="arrow"/></button></div>
          <div><small>Ganhos já pagos</small><strong>{money(summary.commission_paid_cents)}</strong><span>{money(summary.commission_open_cents)} a receber</span></div>
        </section>
        <section className={styles.metrics}>
          <Metric icon="user" label="Novos atendimentos" value={summary.new_assignments || 0} note="aguardando aceite" onClick={() => { setFilter("assigned"); go("pipeline"); }}/>
          <Metric icon="target" label="Pipeline ativo" value={summary.active_pipeline || 0} note={`${summary.overdue_actions || 0} ação(ões) vencida(s)`} onClick={() => { setFilter("open"); go("pipeline"); }}/>
          <Metric icon="chart" label="Propostas" value={summary.proposals || 0} note="negociações avançadas" onClick={() => { setFilter("proposal"); go("pipeline"); }}/>
          <Metric icon="money" label="Comissão esperada" value={money(summary.commission_expected_cents)} note="sujeita à validação" onClick={() => go("earnings")}/>
        </section>
        <div className={styles.twoColumns}>
          <section className={styles.panel}><header><div><span>ATENDIMENTOS</span><h2>Próximas ações</h2></div><button onClick={() => go("pipeline")}>Ver todos</button></header>{pipeline.filter(item => !["won", "lost", "cancelled"].includes(item.status)).slice(0, 5).map(item => <button className={styles.quickRow} key={item.id} onClick={() => openConnection(item)}><span><b>{item.contact_name || "Contato"}</b><small>{item.product_name}</small></span><Status value={item.status}/><i>{item.next_action_at ? date(item.next_action_at, true) : "Abrir"}</i></button>)}{!pipeline.length && <p className={styles.empty}>Nenhum atendimento atribuído.</p>}</section>
          <section className={styles.panel}><header><div><span>ATUALIZAÇÕES</span><h2>Notificações</h2></div></header>{(data.notifications || []).slice(0, 6).map(item => <button className={styles.notification} key={item.id} onClick={() => markRead(item.id)}><i className={!item.read_at ? styles.unread : ""}/><span><b>{item.title}</b><p>{item.body}</p><small>{date(item.created_at, true)}</small></span></button>)}{!(data.notifications || []).length && <p className={styles.empty}>Nenhuma atualização.</p>}</section>
        </div>
      </>}

      {active === "pipeline" && <>
        <section className={styles.sectionHead}><div><span>CARTEIRA OPERACIONAL</span><h2>Todos os atendimentos atribuídos</h2><p>A distribuição administrativa aparece aqui imediatamente, mesmo quando o SDR ainda não foi concluído.</p></div><div>{[["all","Todos"],["open","Em andamento"],["assigned","Novos"],["proposal","Propostas"],["attention","Ação vencida"],["won","Concluídos"]].map(([value,label]) => <button key={value} className={filter === value ? styles.filterActive : ""} onClick={() => setFilter(value)}>{label}</button>)}</div></section>
        <PipelineBoard rows={filteredPipeline} onOpen={openConnection}/>
      </>}

      {active === "earnings" && <>
        <section className={styles.metrics}>
          <Metric icon="money" label="Esperado" value={money(summary.commission_expected_cents)} note="negócios informados ou validados"/>
          <Metric icon="clock" label="A receber" value={money(summary.commission_open_cents)} note="previsto, devido ou programado"/>
          <Metric icon="check" label="Pago" value={money(summary.commission_paid_cents)} note="movimentos conciliados"/>
          <Metric icon="chart" label="Vendas" value={money(summary.sales_value_cents)} note={`${summary.won || 0} negócio(s) validado(s)`}/>
        </section>
        <section className={styles.panel}><header><div><span>EXTRATO</span><h2>Comissões por negócio</h2></div></header><div className={styles.table}><table><thead><tr><th>Negócio</th><th>Produto</th><th>Situação</th><th>Venda</th><th>Comissão</th><th>Pago</th><th>Previsão</th></tr></thead><tbody>{(data.commissions || []).map(item => <tr key={item.id}><td><b>{item.deal_number || item.protocol}</b><small>{date(item.reference_date)}</small></td><td>{item.product_name}</td><td><Status value={item.deal_status} kind="deal"/></td><td>{money(item.gross_value_cents)}</td><td><b>{money(item.specialist_commission_cents)}</b></td><td>{money(item.paid_ledger_cents || item.specialist_commission_paid_cents)}</td><td>{date(item.specialist_commission_due_at)}</td></tr>)}</tbody></table></div>{!(data.commissions || []).length && <p className={styles.empty}>Nenhuma comissão registrada ainda.</p>}</section>
      </>}

      {active === "products" && <>
        <section className={styles.sectionHead}><div><span>PORTFÓLIO AUTORIZADO</span><h2>Produtos, treinamento e regras de ganho</h2><p>A comissão é definida pela gestão e fotografada no fechamento para impedir alterações retroativas.</p></div></section>
        <div className={styles.productGrid}>{(data.products || []).map(item => <article className={styles.productCard} key={item.product_id}><header><Status value={item.assignment_status}/><span>{item.category}</span></header><h3>{item.product_name}</h3><p>{item.service_region || "Atendimento conforme distribuição"}</p><dl><dt>Treinamento</dt><dd>{item.training_compliant ? "Regular" : "Pendente"}</dd><dt>Em atendimento</dt><dd>{item.active_connections || 0}</dd><dt>Concluídos</dt><dd>{item.won_connections || 0}</dd></dl><div className={styles.ruleBox}><small>Regra de comissão</small><RuleText item={item}/></div></article>)}</div>{!(data.products || []).length && <p className={styles.empty}>Nenhum produto vinculado. Um vínculo pode ser criado automaticamente quando a gestão distribuir um atendimento.</p>}
      </>}

      {active === "profile" && <>
        <section className={styles.sectionHead}><div><span>IDENTIDADE PROFISSIONAL</span><h2>{specialist.display_name}</h2><p>Seu perfil profissional não concede permissões administrativas; ele define sua atuação comercial.</p></div></section>
        <div className={styles.profileGrid}>
          <article className={styles.profileCard}><h3>Credenciamento</h3><dl><dt>Atuação</dt><dd>{specialist.professional_type_label}</dd><dt>Credencial</dt><dd>{specialist.credential_number ? `${specialist.credential_type || "Registro"} ${specialist.credential_state || ""} ${specialist.credential_number}` : "Não exigida para esta atividade"}</dd><dt>Empresa</dt><dd>{specialist.partner_name || "Rede Conecta"}</dd><dt>Capacidade diária</dt><dd>{specialist.capacity_per_day || "Não definida"}</dd></dl></article>
          <article className={styles.profileCard}><h3>Regiões de atuação</h3><div className={styles.tags}>{(specialist.service_regions || []).length ? specialist.service_regions.map(region => <span key={region}>{region}</span>) : <small>Nenhuma região específica cadastrada.</small>}</div><div className={styles.securityBox}><Icon name="shield"/><span><b>Operação auditável</b>Contatos, mudanças de etapa, venda informada, validação e pagamentos ficam vinculados à mesma oportunidade.</span></div></article>
        </div>
      </>}
    </main>

    <nav className={styles.bottomNav}>{tabs.map(([key,label,icon]) => <button type="button" key={key} className={active === key ? styles.bottomActive : ""} onClick={() => go(key)}><Icon name={icon}/><span>{label}</span>{key === "today" && summary.unread_notifications > 0 && <i>{summary.unread_notifications}</i>}</button>)}</nav>

    {selected && <Modal title={selected.contact_name || "Atendimento"} subtitle={`${selected.protocol} · ${selected.product_name}`} onClose={() => setSelected(null)} wide>
      <div className={styles.detailGrid}>
        <section><h3>Contato autorizado</h3><dl><dt>WhatsApp</dt><dd>{selected.contact_phone || "—"}</dd><dt>E-mail</dt><dd>{selected.contact_email || "—"}</dd><dt>Preferência</dt><dd>{selected.preferred_time || "A combinar"}</dd><dt>Origem</dt><dd>{selected.connector_name || "Rede Conecta"}</dd></dl></section>
        <section><h3>Briefing SDR</h3><p>{selected.sdr_summary || "O SDR ainda não concluiu a triagem. O atendimento foi distribuído por decisão administrativa."}</p><dl><dt>Score</dt><dd>{selected.sdr_score ?? "—"}</dd><dt>Necessidade</dt><dd>{selected.sdr_qualification?.primary_need || selected.interest_topic || "—"}</dd><dt>Objeção</dt><dd>{selected.sdr_qualification?.main_objection || "—"}</dd></dl></section>
        <section><h3>Expectativa financeira</h3><RuleText item={selected}/><dl><dt>Estimativa atual</dt><dd><EstimatedCommission item={selected}/></dd><dt>Venda informada</dt><dd>{selected.gross_value_cents ? money(selected.gross_value_cents) : "Ainda não"}</dd><dt>Comissão paga</dt><dd>{money(selected.specialist_commission_paid_cents)}</dd></dl></section>
      </div>
      <div className={styles.timeline}><h3>Linha do tempo</h3>{(selected.timeline || []).map((event,index) => <div key={`${event.at}-${index}`}><i/><span><b>{stageLabels[event.to] || event.to}</b><small>{date(event.at, true)}</small>{event.note && <p>{event.note}</p>}</span></div>)}</div>
      <div className={styles.modalActions}><button onClick={() => setStageModal(selected)}>Atualizar etapa</button><button className={styles.saleButton} onClick={() => setSaleModal(selected)}>Informar venda</button></div>
    </Modal>}

    {stageModal && <Modal title="Atualizar etapa" subtitle={`${stageModal.contact_name} · ${stageModal.product_name}`} onClose={() => setStageModal(null)}>
      <form className={styles.form} onSubmit={saveStage}><label>Nova etapa<select name="stage" defaultValue={stageModal.status === "assigned" ? "contacted" : stageModal.status}><option value="accepted">Aceito</option><option value="contacted">Contato iniciado</option><option value="qualified">Qualificado</option><option value="visit_scheduled">Visita ou reunião</option><option value="proposal">Proposta</option><option value="lost">Encerrar sem venda</option></select></label><label>Próxima ação<input name="nextAction" type="datetime-local"/></label><label>Registro do atendimento<textarea name="note" rows="4" placeholder="Resumo objetivo, objeção, combinado e próximo passo"/></label><button disabled={busy === stageModal.id}>{busy === stageModal.id ? "Salvando…" : "Salvar e atualizar a operação"}</button></form>
    </Modal>}

    {saleModal && <Modal title="Informar venda" subtitle="A venda será enviada para validação da Rede Conecta." onClose={() => setSaleModal(null)}>
      <form className={styles.form} onSubmit={reportSale}><label>Valor total da venda (R$)<input name="grossValue" type="number" min="0.01" step="0.01" required/></label><label>Número da proposta ou contrato<input name="dealNumber" required/></label><label>Unidade, veículo ou item<input name="unitReference" placeholder="Ex.: Lote 14D, Corolla placa final 7"/></label><label>Data da contratação<input name="contractDate" type="datetime-local" defaultValue={new Date().toISOString().slice(0,16)}/></label><label>Referência da evidência<input name="evidenceReference" placeholder="Número do contrato, pasta ou documento"/></label><label>Observações<textarea name="notes" rows="4" placeholder="Condição comercial e informações necessárias à validação"/></label><div className={styles.saleWarning}><Icon name="shield"/><span><b>Venda informada não é venda validada.</b>A gestão confere o negócio, preserva a origem e confirma a comissão segundo a regra fotografada.</span></div><button disabled={busy === saleModal.id}>{busy === saleModal.id ? "Enviando…" : "Registrar venda para validação"}</button></form>
    </Modal>}
  </div>;
}
