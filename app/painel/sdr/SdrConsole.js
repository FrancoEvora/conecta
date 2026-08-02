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
  waiting_sdr: "Aguardando SDR",
  ready: "Pronto para humano",
  assigned: "Distribuído",
  not_required: "Sem encaminhamento"
};

function Status({ value }) {
  return <span className={`${styles.status} ${styles[value] || ""}`}>{statusLabel[value] || value || "—"}</span>;
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

  const leads = useMemo(() => (data.leads || []).filter(lead => {
    const matchesFilter = filter === "all" || lead.sdr_status === filter || lead.human_handoff_status === filter;
    const haystack = `${lead.protocol} ${lead.first_name} ${lead.source_product_name_snapshot} ${lead.phone}`.toLowerCase();
    return matchesFilter && haystack.includes(search.toLowerCase());
  }), [data.leads, filter, search]);

  async function reload() {
    setData(await request("sdr_console", { p_limit: 500 }));
  }

  async function simulate(lead) {
    setBusy(lead.id);
    try {
      const result = await request("run_sdr_simulation", { p_connection_id: lead.id });
      setToast(`Simulação concluída: score ${result.score}.`);
      await reload();
      setSelected(current => current?.id === lead.id ? { ...current, ...result, sdr_transcript: result.transcript } : current);
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
      await request("handoff_after_sdr", {
        p_connection_id: lead.id,
        p_mode: assignmentMode,
        p_operator_id: assignmentMode === "manual" ? operatorId : null
      });
      setToast(assignmentMode === "automatic" ? "Lead distribuído automaticamente." : "Lead encaminhado ao responsável selecionado.");
      await reload();
      setSelected(null);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  const summary = data.summary || {};

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <NetworkMark inverse/>
      <span className={styles.sideTitle}>Central SDR</span>
      <nav>
        <button className={styles.active}><Icon name="target"/> Qualificação</button>
        <Link href="/painel"><Icon name="arrow"/> Painel principal</Link>
        <Link href="/painel/catalogo"><Icon name="home"/> Produtos</Link>
      </nav>
      <div className={styles.rule}><Icon name="shield"/><span><b>Regra operacional</b>Nenhum lead é enviado diretamente a um humano. O SDR realiza a triagem antes da distribuição.</span></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}>
        <div><span>OPERAÇÃO COMERCIAL</span><h1>Atendimento preliminar SDR</h1><p>Simulação funcional até a conexão da API definitiva.</p></div>
        <div className={styles.user}><b>{context.display_name}</b><small>Equipe interna</small></div>
      </header>

      <section className={styles.metrics}>
        <article><Icon name="clock"/><span>Aguardando SDR<b>{summary.pending || 0}</b></span></article>
        <article><Icon name="target"/><span>Qualificados<b>{summary.qualified || 0}</b></span></article>
        <article><Icon name="check"/><span>Prontos para humano<b>{summary.ready || 0}</b></span></article>
        <article><Icon name="user"/><span>Distribuídos<b>{summary.assigned || 0}</b></span></article>
      </section>

      <section className={styles.flow}>
        <div><i>1</i><span><b>Lead entra</b>Origem e produto preservados</span></div>
        <div><i>2</i><span><b>SDR atende</b>Perguntas, score e resumo</span></div>
        <div><i>3</i><span><b>Momento adequado</b>Somente qualificados avançam</span></div>
        <div><i>4</i><span><b>Distribuição</b>Automática ou manual</span></div>
      </section>

      <section className={styles.controls}>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar protocolo, nome, telefone ou produto"/>
        <div>{["all","pending","qualified","nurture","ready","assigned"].map(value => <button key={value} className={filter === value ? styles.filterActive : ""} onClick={() => setFilter(value)}>{value === "all" ? "Todos" : statusLabel[value]}</button>)}</div>
      </section>

      <section className={styles.tableCard}>
        <table><thead><tr><th>Lead</th><th>Produto</th><th>SDR</th><th>Score</th><th>Encaminhamento</th><th></th></tr></thead>
          <tbody>{leads.map(lead => <tr key={lead.id}>
            <td><b>{lead.first_name || "Contato"}</b><small>{lead.protocol} · {lead.phone || "sem telefone"}</small></td>
            <td><b>{lead.source_product_name_snapshot || "Produto"}</b><small>{lead.interest_topic}</small></td>
            <td><Status value={lead.sdr_status}/><small>{lead.sdr_summary || "Triagem ainda não executada."}</small></td>
            <td><strong>{lead.sdr_score ?? "—"}</strong></td>
            <td><Status value={lead.human_handoff_status}/><small>{lead.operator_name || "Sem responsável humano"}</small></td>
            <td><div className={styles.actions}><button onClick={() => setSelected(lead)}>Abrir</button>{lead.sdr_status === "pending" && <button className={styles.orange} disabled={busy === lead.id} onClick={() => simulate(lead)}>{busy === lead.id ? "Processando…" : "Simular SDR"}</button>}</div></td>
          </tr>)}</tbody>
        </table>
        {!leads.length && <div className={styles.empty}>Nenhum lead encontrado.</div>}
      </section>
    </main>

    {selected && <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && setSelected(null)}>
      <section className={styles.modal}>
        <header><div><span>{selected.protocol}</span><h2>{selected.first_name || "Lead"}</h2><p>{selected.source_product_name_snapshot}</p></div><button onClick={() => setSelected(null)}>×</button></header>
        <div className={styles.leadSummary}><span><b>Interesse</b>{selected.interest_topic}</span><span><b>Contato preferido</b>{selected.preferred_time}</span><span><b>Score SDR</b>{selected.sdr_score ?? "Não calculado"}</span></div>
        <div className={styles.transcript}>
          <h3>Simulação do atendimento</h3>
          {(selected.sdr_transcript || []).length ? selected.sdr_transcript.map((item,index) => <div key={index} className={item.speaker === "sdr" ? styles.sdrMessage : styles.leadMessage}><b>{item.speaker === "sdr" ? "SDR Rede Conecta" : "Lead"}</b><p>{item.message}</p></div>) : <p className={styles.emptyTranscript}>Execute a simulação para visualizar a conversa preliminar.</p>}
        </div>
        {selected.sdr_status === "pending" && <button className={styles.primary} disabled={busy === selected.id} onClick={() => simulate(selected)}>Executar atendimento SDR simulado</button>}
        {selected.sdr_status === "qualified" && <div className={styles.handoff}>
          <h3>Encaminhamento humano</h3>
          <label><input type="radio" checked={assignmentMode === "automatic"} onChange={() => setAssignmentMode("automatic")}/>Distribuição automática <small>Escolhe o integrante elegível com menor carga ativa.</small></label>
          <label><input type="radio" checked={assignmentMode === "manual"} onChange={() => setAssignmentMode("manual")}/>Distribuição manual <small>A gestão escolhe o responsável.</small></label>
          {assignmentMode === "manual" && <select value={operatorId} onChange={event => setOperatorId(event.target.value)}><option value="">Selecione o responsável</option>{(data.operators || []).map(operator => <option key={operator.id} value={operator.id}>{operator.display_name} · {operator.active_leads} leads ativos</option>)}</select>}
          <button className={styles.primary} disabled={busy === selected.id} onClick={() => handoff(selected)}>{busy === selected.id ? "Distribuindo…" : "Encaminhar para atendimento humano"}</button>
        </div>}
      </section>
    </div>}

    {toast && <div className={styles.toast}>{toast}<button onClick={() => setToast("")}>×</button></div>}
  </div>;
}
