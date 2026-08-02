"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./UnifiedOpportunityConsole.module.css";

const statusLabel = {
  pending: "Aguardando SDR",
  in_progress: "SDR em andamento",
  qualified: "Qualificado",
  nurture: "Nutrição",
  disqualified: "Não qualificado",
  completed: "Concluído",
  waiting_sdr: "Aguardando SDR",
  ready: "Pronto para distribuir",
  assigned: "Distribuído",
  not_required: "Sem encaminhamento"
};

const defaultAnswers = {
  interest_level: "warm",
  purchase_horizon: "up_to_90_days",
  budget_readiness: "needs_simulation",
  decision_role: "shared",
  contact_ready: true,
  primary_need: "",
  main_objection: ""
};

async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    location.href = "/entrar?next=/painel/sdr";
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload.data;
}

function Status({ value }) {
  const good = ["qualified", "assigned"].includes(value);
  const warn = ["pending", "in_progress", "nurture", "waiting_sdr", "ready"].includes(value);
  const bad = ["disqualified"].includes(value);
  return <span className={`${styles.status} ${good ? styles.good : warn ? styles.warn : bad ? styles.bad : ""}`}>{statusLabel[value] || String(value || "—").replaceAll("_", " ")}</span>;
}

function Field({ label, children }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  return <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`${styles.modal} ${wide ? styles.modalWide : ""}`}>
      <header><div><span>OPERAÇÃO REDE CONECTA</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>;
}

function AssignmentForm({ lead, operators, onSubmit, busy }) {
  const [mode, setMode] = useState("manual");
  const [operatorId, setOperatorId] = useState(lead.assigned_operator_id || "");
  const [priority, setPriority] = useState("normal");
  const [note, setNote] = useState("");

  function submit(event) {
    event.preventDefault();
    if (mode === "manual" && !operatorId) return;
    onSubmit({ mode, operatorId: mode === "manual" ? operatorId : null, priority, note });
  }

  return <form className={styles.assignmentForm} onSubmit={submit}>
    <div className={styles.assignmentIntro}><Icon name="target"/><span><b>{lead.assigned_operator_id ? "Redistribuir atendimento" : "Distribuir atendimento"}</b>A administração pode encaminhar a oportunidade em qualquer etapa. O SDR permanece disponível como apoio.</span></div>
    <div className={styles.modeGrid}>
      <label className={mode === "manual" ? styles.modeActive : ""}><input type="radio" checked={mode === "manual"} onChange={() => setMode("manual")}/><span><b>Escolha manual</b><small>Selecione o vendedor ou especialista.</small></span></label>
      <label className={mode === "automatic" ? styles.modeActive : ""}><input type="radio" checked={mode === "automatic"} onChange={() => setMode("automatic")}/><span><b>Distribuição automática</b><small>Considera produto, elegibilidade e carga ativa.</small></span></label>
    </div>
    {mode === "manual" && <Field label="Responsável comercial"><select value={operatorId} onChange={event => setOperatorId(event.target.value)} required><option value="">Selecione o profissional</option>{(operators || []).map(operator => <option value={operator.id} key={operator.id}>{operator.display_name}{operator.professional_type_label ? ` · ${operator.professional_type_label}` : ""} · {operator.active_leads || 0} ativo(s)</option>)}</select></Field>}
    <div className={styles.formGrid}><Field label="Prioridade"><select value={priority} onChange={event => setPriority(event.target.value)}><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></Field><Field label="Orientação ao responsável"><input value={note} onChange={event => setNote(event.target.value)} placeholder="Ex.: contato após 17h; confirmar documentação"/></Field></div>
    <button className={styles.primary} disabled={busy || (mode === "manual" && !operatorId)}>{busy ? "Distribuindo…" : lead.assigned_operator_id ? "Confirmar redistribuição" : "Confirmar distribuição"}</button>
  </form>;
}

export default function UnifiedOpportunityConsole({ context, initialData }) {
  const [data, setData] = useState(initialData || { summary: {}, leads: [], operators: [] });
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [answers, setAnswers] = useState(defaultAnswers);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState({ message: "", error: false });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const leads = useMemo(() => (data.leads || []).filter(lead => {
    const filterOk = filter === "all" || lead.sdr_status === filter || lead.human_handoff_status === filter;
    const text = `${lead.first_name} ${lead.protocol} ${lead.phone} ${lead.source_product_name_snapshot} ${lead.operator_name || ""}`.toLowerCase();
    return filterOk && text.includes(search.toLowerCase());
  }), [data.leads, filter, search]);

  async function reload() {
    const next = await request("sdr_console", { p_limit: 500 });
    setData(next || {});
    return next || {};
  }

  function openSdr(lead) {
    setSelected(lead);
    setModalMode("sdr");
    setAnswers({
      ...defaultAnswers,
      interest_level: lead.sdr_qualification?.interest_level || defaultAnswers.interest_level,
      purchase_horizon: lead.sdr_qualification?.purchase_horizon || defaultAnswers.purchase_horizon,
      budget_readiness: lead.sdr_qualification?.budget_readiness || defaultAnswers.budget_readiness,
      decision_role: lead.sdr_qualification?.decision_role || defaultAnswers.decision_role,
      contact_ready: lead.sdr_qualification?.contact_ready ?? true,
      primary_need: lead.sdr_qualification?.primary_need || lead.interest_topic || "",
      main_objection: lead.sdr_qualification?.main_objection || ""
    });
  }

  function openDistribution(lead) {
    setSelected(lead);
    setModalMode("distribution");
  }

  function primaryLabel(lead) {
    if (lead.sdr_status === "pending") return "Iniciar SDR";
    if (lead.sdr_status === "in_progress") return "Continuar SDR";
    if (lead.sdr_status === "nurture") return "Retomar SDR";
    if (lead.sdr_status === "qualified") return "Ver briefing SDR";
    return "Abrir SDR";
  }

  async function simulate() {
    setBusy(selected.id);
    setNotice({ message: "", error: false });
    try {
      const result = await request("run_sdr_simulation", { p_connection_id: selected.id, p_answers: answers });
      const next = await reload();
      const updated = (next.leads || []).find(item => item.id === selected.id) || { ...selected, ...result };
      setSelected(updated);
      setNotice({ message: `SDR concluído com score ${result.score}/100. A recomendação foi registrada sem bloquear a distribuição administrativa.`, error: false });
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally { setBusy(""); }
  }

  async function distribute(options) {
    setBusy(selected.id);
    setNotice({ message: "", error: false });
    try {
      const result = await request("handoff_after_sdr", {
        p_connection_id: selected.id,
        p_mode: options.mode,
        p_operator_id: options.mode === "manual" ? options.operatorId : null
      });
      if (options.note || options.priority !== "normal") {
        await request("add_activity", {
          p_connection_id: selected.id,
          p_activity_type: "human_handoff",
          p_title: `Distribuição administrativa · prioridade ${options.priority}`,
          p_notes: options.note || "Distribuição registrada pela Central de Oportunidades.",
          p_next_action_at: null
        }).catch(() => null);
      }
      await reload();
      setSelected(null);
      setModalMode("");
      setNotice({ message: `Atendimento ${result.reassigned ? "redistribuído" : "distribuído"} para ${result.operator_name || "o profissional selecionado"}.`, error: false });
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally { setBusy(""); }
  }

  const summary = data.summary || {};

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <NetworkMark inverse/>
      <span>CENTRAL DE OPORTUNIDADES</span>
      <nav><button className={styles.active}><Icon name="target"/> SDR e distribuição</button><Link href="/painel"><Icon name="chart"/> Visão executiva</Link><Link href="/painel/acessos"><Icon name="user"/> Vendedores e especialistas</Link><Link href="/painel/financeiro"><Icon name="money"/> Controladoria</Link></nav>
      <div className={styles.rule}><Icon name="shield"/><span><b>Duas decisões independentes</b>O SDR qualifica e recomenda. A administração distribui ou redistribui a qualquer momento.</span></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.header}><div><span>OPERAÇÃO COMERCIAL UNIFICADA</span><h1>Qualifique e distribua sem perder o contexto.</h1><p>Cada linha mantém duas ações visíveis: a próxima ação do SDR e a decisão administrativa de encaminhamento.</p></div><div><b>{context.display_name}</b><small>Equipe interna</small></div></header>

      {notice.message && <div className={`${styles.notice} ${notice.error ? styles.noticeError : ""}`}><Icon name={notice.error ? "shield" : "check"}/><span>{notice.message}</span><button onClick={() => setNotice({ message: "", error: false })}>×</button></div>}

      <section className={styles.metrics}><article><span>Aguardando SDR</span><b>{summary.pending || 0}</b></article><article><span>Em qualificação</span><b>{summary.in_progress || 0}</b></article><article><span>Prontos para distribuir</span><b>{summary.ready || 0}</b></article><article><span>Distribuídos</span><b>{summary.assigned || 0}</b></article><article><span>Vendedores elegíveis</span><b>{(data.operators || []).length}</b></article></section>

      <section className={styles.explainer}><div><i>1</i><span><b>SDR</b>Iniciar, continuar, retomar e consultar briefing.</span></div><div><i>2</i><span><b>Distribuição</b>Disponível sempre, manual ou automática.</span></div><div><i>3</i><span><b>Carteira do vendedor</b>O atendimento aparece imediatamente após a atribuição.</span></div><div><i>4</i><span><b>Auditoria</b>Origem, responsável anterior, novo responsável e contexto ficam registrados.</span></div></section>

      <section className={styles.controls}><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nome, telefone, protocolo, produto ou responsável"/><div>{[["all","Todos"],["pending","Aguardando SDR"],["in_progress","SDR em andamento"],["nurture","Nutrição"],["qualified","Qualificados"],["assigned","Distribuídos"]].map(([value,label]) => <button key={value} className={filter === value ? styles.filterActive : ""} onClick={() => setFilter(value)}>{label}</button>)}</div></section>

      <section className={styles.tableCard}><table><thead><tr><th>Contato</th><th>Produto</th><th>SDR</th><th>Score</th><th>Responsável</th><th>Ação SDR</th><th>Distribuição</th></tr></thead><tbody>{leads.map(lead => <tr key={lead.id}>
        <td><b>{lead.first_name || "Contato"}</b><small>{lead.protocol} · {lead.phone || "sem telefone"}</small></td>
        <td><b>{lead.source_product_name_snapshot || "Produto"}</b><small>{lead.interest_topic || "Interesse não detalhado"}</small></td>
        <td><Status value={lead.sdr_status}/><small>{lead.sdr_summary || "Triagem ainda não concluída."}</small></td>
        <td><strong>{lead.sdr_score ?? "—"}</strong></td>
        <td><Status value={lead.human_handoff_status}/><small>{lead.operator_name || "Ainda não distribuído"}</small></td>
        <td><button className={styles.sdrButton} onClick={() => openSdr(lead)}>{primaryLabel(lead)}</button></td>
        <td><button className={styles.distributeButton} onClick={() => openDistribution(lead)}>{lead.assigned_operator_id ? "Redistribuir" : "Distribuir agora"}</button></td>
      </tr>)}</tbody></table>{!leads.length && <div className={styles.empty}>Nenhuma oportunidade encontrada.</div>}</section>
    </main>

    {selected && modalMode === "sdr" && <Modal title={`${primaryLabel(selected)} · ${selected.first_name || "Contato"}`} subtitle={`${selected.protocol} · ${selected.source_product_name_snapshot}`} onClose={() => { setSelected(null); setModalMode(""); }} wide>
      <div className={styles.sdrLayout}><section><div className={styles.sectionTitle}><span>SIMULAÇÃO SDR</span><h3>Registre a qualificação preliminar.</h3><p>Este simulador será substituído pela API de atendimento sem alterar o fluxo da operação.</p></div><div className={styles.formGrid}><Field label="Interesse"><select value={answers.interest_level} onChange={event => setAnswers(current => ({ ...current, interest_level: event.target.value }))}><option value="hot">Alto · quer avançar</option><option value="warm">Moderado · quer avaliar</option><option value="cold">Inicial · apenas conhecendo</option></select></Field><Field label="Momento"><select value={answers.purchase_horizon} onChange={event => setAnswers(current => ({ ...current, purchase_horizon: event.target.value }))}><option value="immediate">Imediato</option><option value="up_to_30_days">Até 30 dias</option><option value="up_to_90_days">Até 90 dias</option><option value="exploring">Explorando</option></select></Field><Field label="Preparação financeira"><select value={answers.budget_readiness} onChange={event => setAnswers(current => ({ ...current, budget_readiness: event.target.value }))}><option value="defined">Orçamento definido</option><option value="needs_simulation">Precisa de simulação</option><option value="researching">Pesquisando</option></select></Field><Field label="Papel na decisão"><select value={answers.decision_role} onChange={event => setAnswers(current => ({ ...current, decision_role: event.target.value }))}><option value="decision_maker">Decisor</option><option value="shared">Decisão compartilhada</option><option value="researcher">Levantando informações</option></select></Field><Field label="Necessidade"><textarea value={answers.primary_need} onChange={event => setAnswers(current => ({ ...current, primary_need: event.target.value }))}/></Field><Field label="Objeção"><textarea value={answers.main_objection} onChange={event => setAnswers(current => ({ ...current, main_objection: event.target.value }))}/></Field></div><label className={styles.checkbox}><input type="checkbox" checked={answers.contact_ready} onChange={event => setAnswers(current => ({ ...current, contact_ready: event.target.checked }))}/><span>A pessoa aceita atendimento humano quando for oportuno.</span></label><button className={styles.primary} onClick={simulate} disabled={busy === selected.id}>{busy === selected.id ? "Processando…" : "Executar qualificação SDR"}</button></section><aside><div className={styles.briefing}><small>Score</small><strong>{selected.sdr_score ?? "—"}</strong><Status value={selected.sdr_status}/><p>{selected.sdr_summary || "A qualificação ainda não produziu um briefing."}</p></div>{(selected.sdr_transcript || []).length > 0 && <div className={styles.transcript}><h3>Conversa simulada</h3>{selected.sdr_transcript.map((item,index) => <div key={index}><b>{item.speaker === "sdr" ? "SDR" : "Contato"}</b><p>{item.message}</p></div>)}</div>}<button className={styles.secondaryAction} onClick={() => setModalMode("distribution")}>{selected.assigned_operator_id ? "Redistribuir agora" : "Distribuir sem aguardar o SDR"}</button></aside></div>
    </Modal>}

    {selected && modalMode === "distribution" && <Modal title={selected.assigned_operator_id ? "Redistribuir atendimento" : "Distribuir atendimento"} subtitle={`${selected.first_name || "Contato"} · ${selected.source_product_name_snapshot}`} onClose={() => { setSelected(null); setModalMode(""); }}><AssignmentForm lead={selected} operators={data.operators || []} onSubmit={distribute} busy={busy === selected.id}/><button className={styles.backToSdr} onClick={() => setModalMode("sdr")}>Abrir SDR desta oportunidade</button></Modal>}
  </div>;
}
