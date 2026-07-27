"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./CommunicationManager.module.css";

function brazilPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

function manualUrl(item) {
  if (item.channel === "email") return `mailto:${encodeURIComponent(item.recipient)}?subject=${encodeURIComponent(item.subject || "Rede Conecta")}&body=${encodeURIComponent(item.body || "")}`;
  if (item.channel === "whatsapp") return `https://wa.me/${brazilPhone(item.recipient)}?text=${encodeURIComponent(item.body || "")}`;
  return "";
}

function dateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function Status({ value }) {
  const good = ["sent"].includes(value);
  const bad = ["failed","cancelled"].includes(value);
  return <span className={`${styles.status} ${good ? styles.good : bad ? styles.bad : ""}`}>{String(value || "—").replaceAll("_", " ")}</span>;
}

async function rpc(operation, params = {}) {
  const response = await fetch("/api/app/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, params }) });
  const payload = await response.json();
  if (response.status === 401) { location.href = "/entrar?expirado=1"; throw new Error("Sessão expirada."); }
  if (!response.ok) throw new Error(payload.error || "Operação não concluída.");
  return payload.data;
}

export default function CommunicationManager({ initialItems }) {
  const [items, setItems] = useState(initialItems || []);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const visible = useMemo(() => items.filter(item => filter === "all" || item.status === filter), [items, filter]);

  async function reload() {
    setItems(await rpc("notifications", { p_status: null, p_limit: 1000 }) || []);
  }

  async function processQueue() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/notifications/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: 50 }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao processar a fila.");
      const sent = (result.results || []).filter(item => item.status === "sent").length;
      const manual = (result.results || []).filter(item => item.status === "manual_required").length;
      const failed = (result.results || []).filter(item => item.status === "failed").length;
      setMessage(`${result.processed || 0} comunicação(ões) processada(s): ${sent} enviada(s), ${manual} manual(is), ${failed} falha(s).`);
      await reload();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function copy(item) {
    await navigator.clipboard.writeText(`${item.subject ? `${item.subject}\n\n` : ""}${item.body || ""}`);
    setMessage("Conteúdo copiado para a área de transferência.");
  }

  return <div className={styles.shell}>
    <header className={styles.header}><NetworkMark/><div><Link href="/painel">Voltar ao painel</Link><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button></div></header>
    <main className={styles.main}>
      <div className={styles.title}><div><span className="eyebrow">E-mail e WhatsApp</span><h1>Central de comunicações</h1><p>A fila tenta os provedores configurados. Quando uma integração não estiver disponível, o envio manual permanece acessível e auditável.</p></div><button className="button button--orange" disabled={busy} onClick={processQueue}>{busy ? "Processando…" : "Processar fila"}<Icon name="arrow"/></button></div>
      {message && <div className={styles.notice}><Icon name="check" size={18}/>{message}<button onClick={() => setMessage("")}>×</button></div>}
      <div className={styles.filters}>{["all","pending","processing","manual_required","failed","sent","cancelled"].map(item => <button key={item} className={filter === item ? styles.selected : ""} onClick={() => setFilter(item)}>{item === "all" ? "Todos" : item.replaceAll("_", " ")}</button>)}</div>
      <section className={styles.card}><div className={styles.table}><table><thead><tr><th>Canal</th><th>Destinatário</th><th>Modelo</th><th>Conteúdo</th><th>Status</th><th>Tentativas</th><th>Data</th><th>Ações</th></tr></thead><tbody>{visible.map(item => { const url = manualUrl(item); return <tr key={item.id}><td>{item.channel}</td><td><b>{item.recipient}</b><small>{item.subject}</small></td><td>{item.template_code}</td><td><span title={item.body}>{String(item.body || "").slice(0, 95)}{String(item.body || "").length > 95 ? "…" : ""}</span></td><td><Status value={item.status}/>{item.last_error && <small title={item.last_error}>{item.last_error.slice(0, 70)}</small>}</td><td>{item.attempts}</td><td>{dateTime(item.created_at)}</td><td><div className={styles.actions}>{url && ["manual_required","failed","pending"].includes(item.status) && <a href={url} target="_blank" rel="noreferrer">Abrir {item.channel}</a>}<button onClick={() => copy(item)}>Copiar</button></div></td></tr>; })}</tbody></table></div>{!visible.length && <div className={styles.empty}><Icon name="check"/><p>Nenhuma comunicação neste filtro.</p></div>}</section>
    </main>
  </div>;
}
