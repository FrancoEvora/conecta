"use client";

import { Icon } from "@/components/UI";
import styles from "./CatalogConsole.module.css";

export const workflowLabel = {
  draft: "Rascunho",
  in_review: "Em revisão",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
  paused: "Pausado",
  archived: "Arquivado",
  rejected: "Rejeitado",
  expired: "Expirado",
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
  blocked: "Bloqueado",
  unavailable: "Indisponível",
  active: "Ativo",
  planning: "Planejamento"
};

export const tabs = [
  ["products", "Produtos", "home"],
  ["overview", "Visão geral", "chart"],
  ["developments", "Estruturas imobiliárias", "building"],
  ["campaigns", "Campanhas", "target"],
  ["media", "Mídia", "link"],
  ["prices", "Preços", "money"],
  ["inventory", "Estoque", "check"],
  ["revisions", "Histórico", "shield"]
];

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function date(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function money(cents) {
  if (cents === null || cents === undefined || cents === "") return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents) / 100);
}

export function parseJson(text, fallback = {}) {
  const value = String(text || "").trim();
  if (!value) return fallback;
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Informe um objeto JSON válido.");
  return parsed;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }

  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map(value => value.trim());
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

export async function request(operation, params = {}) {
  const response = await fetch("/api/app/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, params })
  });
  const payload = await response.json();
  if (response.status === 401) {
    location.href = "/entrar?next=/painel/catalogo";
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload.data;
}

export function Status({ value }) {
  const good = ["published", "approved", "active", "available"].includes(value);
  const bad = ["archived", "rejected", "expired", "sold", "blocked"].includes(value);
  return <span className={`${styles.status} ${good ? styles.statusGood : bad ? styles.statusBad : ""}`}>{workflowLabel[value] || String(value || "—").replaceAll("_", " ")}</span>;
}

export function Modal({ title, subtitle, children, onClose, wide = false }) {
  return <div className={styles.modalBackdrop} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`${styles.modal} ${wide ? styles.modalWide : ""}`}>
      <header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button onClick={onClose} aria-label="Fechar">×</button></header>
      <div className={styles.modalBody}>{children}</div>
    </section>
  </div>;
}

export function Field({ label, hint, children }) {
  return <label className={styles.field}><span>{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}

export function FormActions({ onClose, label = "Salvar rascunho", busy }) {
  return <div className={styles.formActions}><button type="button" className="button button--light" onClick={onClose}>Cancelar</button><button className="button button--orange" disabled={busy}>{busy ? "Salvando…" : label}</button></div>;
}

export function Metric({ label, value, note, icon }) {
  return <article className={styles.metric}><div><Icon name={icon}/></div><span>{label}<b>{value}</b>{note && <small>{note}</small>}</span></article>;
}

export function EntityActions({ type, item, permissions, onEdit, onRun, onPreflight }) {
  const canEdit = permissions.edit;
  const canSubmit = permissions.submit;
  const canApprove = permissions.approve;
  const canPublish = permissions.publish;
  const status = item.workflow_status || "draft";

  return <div className={styles.actions}>
    {canEdit && !["archived"].includes(status) && <button onClick={() => onEdit(item)}>{status === "published" ? "Editar nova versão" : "Editar"}</button>}
    <button onClick={() => onPreflight(type, item.id)}>Pré-validação</button>
    {canSubmit && status === "draft" && <button className={styles.primaryAction} onClick={() => onRun(type, item, "submit")}>Enviar para revisão</button>}
    {canApprove && status === "in_review" && <><button className={styles.goodAction} onClick={() => onRun(type, item, "approve")}>Aprovar</button><button className={styles.dangerAction} onClick={() => onRun(type, item, "reject")}>Rejeitar</button></>}
    {canPublish && status === "approved" && <><button className={styles.goodAction} onClick={() => onRun(type, item, "publish")}>Publicar</button><button onClick={() => onRun(type, item, "schedule")}>Agendar</button></>}
    {canPublish && status === "published" && <button onClick={() => onRun(type, item, "pause")}>Pausar</button>}
    {canPublish && status === "paused" && <button className={styles.goodAction} onClick={() => onRun(type, item, "publish")}>Republicar</button>}
    {canEdit && status === "draft" && item.published_snapshot && <button onClick={() => onRun(type, item, "restore")}>Descartar rascunho</button>}
    {canPublish && status !== "archived" && <button className={styles.dangerAction} onClick={() => onRun(type, item, "archive")}>Arquivar</button>}
  </div>;
}
