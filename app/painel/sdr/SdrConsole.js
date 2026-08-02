"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./SdrConsole.module.css";

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

const statusLabel = {
  pending: "Aguardando SDR",
  in_progress: "Em atendimento",
  qualified: "Qualificado",
  nurture: "Nutrição",
  disqualified: "Não qualificado",
  completed: "Concluído",
  waiting_sdr: "Aguardando maturidade",
  ready: "Pronto para humano",
  assigned: "Distribuído",
  not_required: "Sem encaminhamento"
};

const labelMap = {
  hot: "Interesse alto",
  warm: "Interesse moderado",
  cold: "Interesse inicial",
  immediate: "Imediato",
  up_to_30_days: "Até 30 dias",
  up_to_90_days: "Até 90 dias",
  exploring: "Explorando",
  defined: "Orçamento definido",
  needs_simulation: "Precisa de simulação",
  researching: "Pesquisando",
  decision_maker: "Decisor",
  shared: "Decisão compartilhada",
  researcher: "Levantando informações"
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

function Status({ value }) {
  return <span className={`${styles.status} ${styles[value] || ""}`}>{statusLabel[value] || value || "—"}</span>;
}

function Field({ label, children }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}

export default function SdrConsole({ context, initialData }) {
  const [data, setData] = useState(initialData || { summary: {}, leads: [], operators: [] });
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [assignmentMode, setAssignmentMode] = useState("automatic");
  const [operatorId, setOperatorId] = useState("");
  const [answers, setAnswers] = useState(defaultAnswers);

  const leads = useMemo(() => (data.leads || []).filter(lead => {
    const matchesFilter = filter === "all" || lead.sdr_status === filter || lead.human_handoff_status === filter;
    const haystack = `${lead.protocol} ${lead.first_name} ${lead.source_product_name_snapshot} ${lead.phone}`.toLowerCase();
    return matchesFilter && haystack.includes(search.toLowerCase());
  }), [data.leads, filter, search]);

  async function reload() {
    const next = await request("sdr_console", { p_limit: 500 });
    setData(next);
    return next;
  }

  function openLead(lead) {
    setSelected(lead);
    setOperatorId("");
    setAssignmentMode("automatic");
    setAnswers({
      ...defaultAnswers,
      primary_need: lead.interest_topic || "",
      main_objection: ""
    });
  }

  async function simulate(lead) {
    setBusy(lead.id);
    try {
      const result = await request("run_sdr_simulation", {
        p_connection_id: lead.id,
        p_answers: answers
      });
      setToast(`Qualificação concluída: score ${result.score}/100 · ${statusLabel[result.sdr_status]}.`);
      const next = await reload();
      const updated = (next.leads || []).find(item => item.id === lead.id);
      setSelected(updated || { ...lead, ...result, sdr_score: result.score, sdr_transcript: result.transcript, sdr_qualification: result.qualification, sdr_recommendation: result.recommendation });
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  async function handoff(lead) {
    if (assignmentMode === "manual" && !operatorId) {
      setToast("Selecione o responsável pelo atendimento humano.");
      return;
    }
    setBusy(lead.id);
    try {
      const result = await request("handoff_after_sdr", {
        p_connection_id: lead.id,
        p_mode: assignmentMode,
        p_operator_id: assignmentMode === "manual" ? operatorId : null
      });
      const operator = (data.operators || []).find(item => item.id === result.operator_id);
      setToast(`Oportunidade encaminhada para ${operator?.display_name || "o responsável selecionado"}.`);
      await reload();
      setSelected(null);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  const summary = data.summary || {};
  const qualification = selected?.sdr_qualification || {};
  const recommendation = selected?.sdr_recommendation || {};

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <NetworkMark inverse/>
      <span className={styles.sideTitle}>Central de Operações</span>
      <nav>
        <button className={styles.active}><Icon name="target"/> SDR e qualificação</button>
        <Link href="/painel"><Icon name="arrow"/> Painel principal</Link>
        <Link href="/painel/catalogo"><Icon name="home"/> Produtos</Link>
      </nav>
      <div className={styles.rule}><Icon name="shield"/><span><b>Regra de proteção</b>Nenhuma oportunidade chega diretamente ao vendedor. A Rede Conecta qualifica, registra o contexto e só então distribui.</span></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}>
        <div><span>INFRAESTRUTURA COMERCIAL</span><h1>Qualificação antes da distribuição</h1><p>Simulação operacional preparada para futura integração com WhatsApp e IA.</p></div>
        <div className={styles.user}><b>{context.display_name}</b><small>Equipe interna</small></div>
      </header>

      <section className={styles.metrics}>
        <article><Icon name="clock"/><span>Aguardando SDR<b>{summary.pending || 0}</b></span></article>
        <article><Icon name="target"/><span>Qualificados<b>{summary.qualified || 0}</b></span></article>
        <article><Icon name="check"/><span>Prontos para humano<b>{summary.ready || 0}</b></span></article>
        <article><Icon name="chart"/><span>Score médio<b>{summary.average_score || 0}</b></span></article>
      </section>

      <section className={styles.flow}>
        <div><i>1</i><span><b>Origem protegida</b>Produto, campanha e conector preservados</span></div>
        <div><i>2</i><span><b>SDR qualifica</b>Necessidade, momento, orçamento e decisão</span></div>
        <div><i>3</i><span><b>Recomendação</b>Score, resumo e próxima ação</span></div>
        <div><i>4</i><span><b>Roteamento</b>Automático ou manual no momento adequado</span></div>
      </section>

      <section className={styles.controls}>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar protocolo, nome, telefone ou produto"/>
        <div>{["all","pending","qualified","nurture","ready","assigned"].map(value => <button key={value} className={filter === value ? styles.filterActive : ""} onClick={() => setFilter(value)}>{value === "all" ? "Todos" : statusLabel[value]}</button>)}</div>
      </section>

      <section className={styles.tableCard}>
        <table><thead><tr><th>Oportunidade</th><th>Produto</th><th>SDR</th><th>Score</th><th>Próxima etapa</th><th></th></tr></thead>
          <tbody>{leads.map(lead => <tr key={lead.id}>
            <td><b>{lead.first_name || "Contato"}</b><small>{lead.protocol} · {lead.phone || "sem telefone"}</small></td>
            <td><b>{lead.source_product_name_snapshot || "Produto"}</b><small>{lead.interest_topic || "Interesse ainda não detalhado"}</small></td>
            <td><Status value={lead.sdr_status}/><small>{lead.sdr_summary || "Triagem ainda não executada."}</small></td>
            <td><strong>{lead.sdr_score ?? "—"}</strong></td>
            <td><Status value={lead.human_handoff_status}/><small>{lead.operator_name || (lead.next_action_at ? `Retomar em ${new Date(lead.next_action_at).toLocaleDateString("pt-BR")}` : "Sem responsável humano")}</small></td>
            <td><div className={styles.actions}><button onClick={() => openLead(lead)}>Abrir operação</button></div></td>
          </tr>)}</tbody>
        </table>
        {!leads.length && <div className={styles.empty}>Nenhuma oportunidade encontrada.</div>}
      </section>
    </main>

    {selected && <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && setSelected(null)}>
      <section className={styles.modal}>
        <header><div><span>{selected.protocol}</span><h2>{selected.first_name || "Oportunidade"}</h2><p>{selected.source_product_name_snapshot}</p></div><button onClick={() => setSelected(null)}>×</button></header>

        <div className={styles.leadSummary}><span><b>Interesse informado</b>{selected.interest_topic || "Não informado"}</span><span><b>Contato preferido</b>{selected.preferred_time || "A combinar"}</span><span><b>Score SDR</b>{selected.sdr_score ?? "Não calculado"}</span></div>

        {selected.sdr_status === "pending" && <section className={styles.qualificationForm}>
          <div className={styles.sectionHeading}><span>SIMULAÇÃO SDR</span><h3>Defina as respostas que o potencial comprador daria.</h3><p>Esses dados simulam a conversa e permitem testar score, resumo e distribuição sem API externa.</p></div>
          <div className={styles.formGrid}>
            <Field label="Nível de interesse"><select value={answers.interest_level} onChange={event => setAnswers(current => ({ ...current, interest_level: event.target.value }))}><option value="hot">Alto · quer avançar</option><option value="warm">Moderado · quer avaliar</option><option value="cold">Inicial · apenas conhecendo</option></select></Field>
            <Field label="Momento de decisão"><select value={answers.purchase_horizon} onChange={event => setAnswers(current => ({ ...current, purchase_horizon: event.target.value }))}><option value="immediate">Imediato</option><option value="up_to_30_days">Até 30 dias</option><option value="up_to_90_days">Até 90 dias</option><option value="exploring">Ainda explorando</option></select></Field>
            <Field label="Preparação financeira"><select value={answers.budget_readiness} onChange={event => setAnswers(current => ({ ...current, budget_readiness: event.target.value }))}><option value="defined">Orçamento definido</option><option value="needs_simulation">Precisa de simulação</option><option value="researching">Ainda pesquisando</option></select></Field>
            <Field label="Papel na decisão"><select value={answers.decision_role} onChange={event => setAnswers(current => ({ ...current, decision_role: event.target.value }))}><option value="decision_maker">É o decisor</option><option value="shared">Decisão compartilhada</option><option value="researcher">Está levantando informações</option></select></Field>
            <Field label="Necessidade principal"><textarea value={answers.primary_need} onChange={event => setAnswers(current => ({ ...current, primary_need: event.target.value }))} placeholder="O que a pessoa deseja resolver?"/></Field>
            <Field label="Objeção principal"><textarea value={answers.main_objection} onChange={event => setAnswers(current => ({ ...current, main_objection: event.target.value }))} placeholder="Preço, prazo, confiança, localização…"/></Field>
          </div>
          <label className={styles.checkbox}><input type="checkbox" checked={answers.contact_ready} onChange={event => setAnswers(current => ({ ...current, contact_ready: event.target.checked }))}/><span>A pessoa aceita conversar com um especialista quando a qualificação terminar.</span></label>
          <button className={styles.primary} disabled={busy === selected.id} onClick={() => simulate(selected)}>{busy === selected.id ? "Processando…" : "Executar qualificação SDR simulada"}</button>
        </section>}

        {selected.sdr_status !== "pending" && <>
          <section className={styles.intelligence}>
            <div className={styles.sectionHeading}><span>INTELIGÊNCIA DA TRIAGEM</span><h3>Briefing pronto para a próxima decisão.</h3></div>
            <div className={styles.intelligenceGrid}>
              <article><small>Interesse</small><b>{labelMap[qualification.interest_level] || "—"}</b></article>
              <article><small>Momento</small><b>{labelMap[qualification.purchase_horizon] || "—"}</b></article>
              <article><small>Preparação</small><b>{labelMap[qualification.budget_readiness] || "—"}</b></article>
              <article><small>Decisão</small><b>{labelMap[qualification.decision_role] || "—"}</b></article>
            </div>
            <div className={styles.recommendation}><Icon name={recommendation.action === "handoff" ? "check" : "target"}/><span><small>Recomendação do SDR</small><b>{recommendation.reason || selected.sdr_summary}</b><p>{recommendation.next_step || recommendation.briefing?.objection || ""}</p></span></div>
          </section>

          <div className={styles.transcript}>
            <h3>Conversa simulada</h3>
            {(selected.sdr_transcript || []).map((item,index) => <div key={index} className={item.speaker === "sdr" ? styles.sdrMessage : styles.leadMessage}><b>{item.speaker === "sdr" ? "SDR Rede Conecta" : "Potencial comprador"}</b><p>{item.message}</p></div>)}
          </div>
        </>}

        {selected.sdr_status === "qualified" && selected.human_handoff_status === "ready" && <div className={styles.handoff}>
          <h3>Distribuição após o SDR</h3>
          <p>O profissional receberá o briefing completo e não deverá repetir a triagem.</p>
          <label><input type="radio" checked={assignmentMode === "automatic"} onChange={() => setAssignmentMode("automatic")}/><span><b>Automática</b><small>Prioriza profissional elegível com menor carga ativa.</small></span></label>
          <label><input type="radio" checked={assignmentMode === "manual"} onChange={() => setAssignmentMode("manual")}/><span><b>Manual</b><small>A gestão escolhe o responsável específico.</small></span></label>
          {assignmentMode === "manual" && <select value={operatorId} onChange={event => setOperatorId(event.target.value)}><option value="">Selecione o responsável</option>{(data.operators || []).map(operator => <option key={operator.id} value={operator.id}>{operator.display_name} · {operator.role} · {operator.active_leads} ativos</option>)}</select>}
          <button className={styles.primary} disabled={busy === selected.id} onClick={() => handoff(selected)}>{busy === selected.id ? "Distribuindo…" : "Confirmar encaminhamento humano"}</button>
        </div>}
      </section>
    </div>}

    {toast && <div className={styles.toast}>{toast}<button onClick={() => setToast("")}>×</button></div>}
  </div>;
}
