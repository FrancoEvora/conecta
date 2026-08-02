"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, NetworkMark } from "@/components/UI";
import DistributionPanel from "./DistributionPanel";
import styles from "./VisibleSdrConsole.module.css";

async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, params }) });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) { location.href = "/entrar?next=/painel/sdr"; throw new Error("Sessão expirada."); }
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload.data;
}

const labels = { pending:"Aguardando SDR", in_progress:"SDR em andamento", qualified:"Qualificado", nurture:"Nutrição", disqualified:"Não qualificado", ready:"Pronto para distribuir", assigned:"Distribuído", waiting_sdr:"Aguardando maturidade", not_required:"Sem encaminhamento" };
function Status({ value }) { return <span className={`${styles.status} ${styles[value] || ""}`}>{labels[value] || value || "—"}</span>; }

export default function VisibleSdrConsole({ context, initialData }) {
  const [data, setData] = useState(initialData || { summary:{}, leads:[], operators:[] });
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const leads = useMemo(() => (data.leads || []).filter(lead => {
    const matchFilter = filter === "all" || lead.sdr_status === filter || lead.human_handoff_status === filter;
    const text = `${lead.first_name} ${lead.protocol} ${lead.phone} ${lead.source_product_name_snapshot}`.toLowerCase();
    return matchFilter && text.includes(search.toLowerCase());
  }), [data.leads, filter, search]);

  async function reload() { const next = await request("sdr_console", { p_limit:500 }); setData(next); return next; }

  async function distribute(lead, options) {
    setBusy(lead.id);
    try {
      const result = await request("handoff_after_sdr", { p_connection_id:lead.id, p_mode:options.mode, p_operator_id:options.mode === "manual" ? options.operatorId : null });
      if (options.note || options.priority !== "normal") await request("add_activity", { p_connection_id:lead.id, p_activity_type:"human_handoff", p_title:`Atendimento ${result.reassigned ? "redistribuído" : "distribuído"} · prioridade ${options.priority}`, p_notes:options.note || "Distribuição realizada pela administração.", p_next_action_at:null }).catch(() => null);
      const operator = (data.operators || []).find(item => item.id === result.operator_id);
      setToast(`${result.reassigned ? "Atendimento redistribuído" : "Atendimento distribuído"} para ${operator?.display_name || "o profissional selecionado"}.`);
      await reload(); setSelected(null);
    } catch (error) { setToast(error.message); }
    finally { setBusy(""); }
  }

  function actionLabel(lead) {
    if (lead.human_handoff_status === "assigned") return "Redistribuir";
    return "Distribuir agora";
  }

  const summary = data.summary || {};
  return <div className={styles.shell}>
    <aside className={styles.sidebar}><NetworkMark inverse/><span>Central de Operações</span><nav><button className={styles.active}><Icon name="target"/> Distribuição de atendimentos</button><Link href="/painel"><Icon name="arrow"/> Painel principal</Link><Link href="/painel/acessos"><Icon name="user"/> Vendedores e especialistas</Link></nav><div className={styles.rule}><Icon name="shield"/><p><b>Autonomia administrativa</b>O administrador pode distribuir ou redistribuir qualquer atendimento, antes, durante ou depois do SDR.</p></div></aside>
    <main className={styles.main}>
      <header className={styles.header}><div><span>CENTRAL SDR E ROTEAMENTO</span><h1>Distribuição sempre disponível.</h1><p>O SDR recomenda e qualifica. A gestão mantém autonomia para encaminhar o atendimento a qualquer momento.</p></div><div><b>{context.display_name}</b><small>Equipe interna</small></div></header>
      <section className={styles.metrics}><article><span>Aguardando SDR</span><b>{summary.pending || 0}</b></article><article><span>Prontos para distribuir</span><b>{summary.ready || 0}</b></article><article><span>Distribuídos</span><b>{summary.assigned || 0}</b></article><article><span>Vendedores elegíveis</span><b>{(data.operators || []).length}</b></article></section>
      <section className={styles.help}><Icon name="target"/><div><b>Distribua quando fizer sentido para a operação</b><p>O botão permanece disponível em todos os atendimentos. O status do SDR e o score aparecem como informação de apoio, sem bloquear a decisão administrativa.</p></div></section>
      <section className={styles.controls}><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nome, telefone, protocolo ou produto"/><div>{["all","pending","in_progress","ready","assigned","nurture"].map(value => <button key={value} className={filter===value?styles.filterActive:""} onClick={() => setFilter(value)}>{value==="all"?"Todos":labels[value]}</button>)}</div></section>
      <section className={styles.tableCard}><table><thead><tr><th>Contato</th><th>Produto</th><th>SDR</th><th>Score</th><th>Responsável</th><th>Distribuição</th></tr></thead><tbody>{leads.map(lead => <tr key={lead.id}><td><b>{lead.first_name || "Contato"}</b><small>{lead.protocol} · {lead.phone || "sem telefone"}</small></td><td><b>{lead.source_product_name_snapshot || "Produto"}</b><small>{lead.interest_topic || "Interesse não detalhado"}</small></td><td><Status value={lead.sdr_status}/><small>{lead.sdr_summary || "Triagem ainda não concluída"}</small></td><td><strong>{lead.sdr_score ?? "—"}</strong></td><td><Status value={lead.human_handoff_status}/><small>{lead.operator_name || "Ainda não distribuído"}</small></td><td><button className={styles.distribute} onClick={() => setSelected(lead)}>{actionLabel(lead)}</button></td></tr>)}</tbody></table>{!leads.length && <div className={styles.empty}>Nenhuma oportunidade encontrada.</div>}</section>
    </main>
    {selected && <div className={styles.backdrop} onMouseDown={event => event.target===event.currentTarget && setSelected(null)}><section className={styles.modal}><header><div><span>{selected.protocol}</span><h2>{selected.first_name || "Atendimento"}</h2><p>{selected.source_product_name_snapshot}</p></div><button onClick={() => setSelected(null)}>×</button></header><div className={styles.brief}><article><small>Status SDR</small><Status value={selected.sdr_status}/></article><article><small>Score</small><b>{selected.sdr_score ?? "—"}</b></article><article><small>Responsável atual</small><b>{selected.operator_name || "Não distribuído"}</b></article></div><div className={styles.notice}><h3>{selected.human_handoff_status === "assigned" ? "Redistribuição administrativa" : "Distribuição administrativa"}</h3><p>{selected.sdr_status === "qualified" ? "O SDR concluiu a qualificação. Você pode seguir a recomendação ou escolher outro profissional." : "O SDR ainda não concluiu a qualificação. Mesmo assim, a administração pode encaminhar o atendimento agora."}</p></div><DistributionPanel lead={selected} operators={data.operators || []} onDistribute={distribute} busy={busy===selected.id}/></section></div>}
    {toast && <div className={styles.toast}>{toast}<button onClick={() => setToast("")}>×</button></div>}
  </div>;
}
