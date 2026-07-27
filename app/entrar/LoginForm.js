"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";

export default function LoginForm() {
  const search = useSearchParams();
  const [state, setState] = useState({ status: "idle", message: "" });
  const notice = search.get("confirmado") ? "E-mail confirmado. Entre para acompanhar seu cadastro." : search.get("ativado") ? "Acesso ativado. Entre com a senha criada." : search.get("expirado") ? "Sua sessão expirou. Entre novamente." : "";
  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const data = await response.json();
    if (!response.ok) { setState({ status: "error", message: data.error || "Credenciais inválidas." }); return; }
    location.href = search.get("next")?.startsWith("/") ? search.get("next") : "/painel";
  }
  return <form className="login-form form" onSubmit={submit}>
    <NetworkMark/>
    <h2>Entrar na Rede Conecta</h2>
    <p>Área protegida para conectores, equipe interna, corretores e parceiros autorizados.</p>
    {notice && <div className="legal-note" style={{ margin: "0 0 18px" }}>{notice}</div>}
    <label>E-mail<input name="email" type="email" required autoComplete="email"/></label>
    <label>Senha<input name="password" type="password" required minLength="8" autoComplete="current-password"/></label>
    <button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Entrando…" : "Entrar"}<Icon name="arrow"/></button>
    {state.message && <p className="form-error">{state.message}</p>}
    <div className="button-row" style={{ marginTop: 14 }}><Link className="text-link" href="/recuperar">Esqueci minha senha</Link><Link className="text-link" href="/cadastro">Quero ser conector</Link></div>
    <small>A Rede Conecta aplica acesso por função, trilhas de auditoria e separação entre operação interna e painéis de leitura.</small>
  </form>;
}
