"use client";

import { useMemo, useState } from "react";
import styles from "./VisibleSdrConsole.module.css";

export default function DistributionPanel({ lead, operators, onDistribute, busy }) {
  const [mode, setMode] = useState("manual");
  const [operatorId, setOperatorId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [note, setNote] = useState("");
  const eligible = useMemo(() => (operators || []).filter(item => item.status !== "suspended"), [operators]);

  async function submit(event) {
    event.preventDefault();
    if (mode === "manual" && !operatorId) return;
    await onDistribute(lead, { mode, operatorId: mode === "manual" ? operatorId : null, priority, note });
  }

  return <form className={styles.distributionPanel} onSubmit={submit}>
    <div className={styles.distributionTitle}><span>ENCAMINHAMENTO HUMANO</span><h3>Distribuir atendimento</h3><p>O vendedor receberá o contato, o briefing do SDR, a origem protegida e o prazo do primeiro atendimento.</p></div>
    <div className={styles.distributionModes}>
      <label className={mode === "manual" ? styles.modeActive : ""}><input type="radio" checked={mode === "manual"} onChange={() => setMode("manual")}/><span><b>Selecionar vendedor</b><small>Escolha diretamente o responsável.</small></span></label>
      <label className={mode === "automatic" ? styles.modeActive : ""}><input type="radio" checked={mode === "automatic"} onChange={() => setMode("automatic")}/><span><b>Distribuição automática</b><small>Usa elegibilidade e menor carga ativa.</small></span></label>
    </div>
    {mode === "manual" && <label className={styles.field}><span>Vendedor ou especialista responsável</span><select value={operatorId} onChange={event => setOperatorId(event.target.value)} required><option value="">Selecione o profissional</option>{eligible.map(operator => <option key={operator.id} value={operator.id}>{operator.display_name}{operator.professional_type_label ? ` · ${operator.professional_type_label}` : ""}{Number.isFinite(Number(operator.active_load ?? operator.active_leads)) ? ` · ${operator.active_load ?? operator.active_leads} em atendimento` : ""}</option>)}</select>{!eligible.length && <small>Nenhum vendedor elegível foi encontrado. Cadastre o especialista e vincule-o ao produto.</small>}</label>}
    <div className={styles.distributionGrid}><label className={styles.field}><span>Prioridade</span><select value={priority} onChange={event => setPriority(event.target.value)}><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label><label className={styles.field}><span>Observação para o vendedor</span><input value={note} onChange={event => setNote(event.target.value)} placeholder="Ex.: ligar após 17h"/></label></div>
    <button className={styles.primary} disabled={busy || (mode === "manual" && !operatorId)}>{busy ? "Distribuindo…" : mode === "manual" ? "Confirmar distribuição" : "Distribuir automaticamente"}</button>
  </form>;
}
