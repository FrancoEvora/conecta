"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import PasswordField from "@/components/PasswordField";

export default function LoginForm() {
  const search = useSearchParams();
  const [password, setPassword] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });
  const notice = search.get("confirmado") ? "E-mail confirmado com sucesso. Entre para continuar seu perfil e acompanhar suas oportunidades." : search.get("ativado") ? "Acesso ativado. Entre com a senha criada." : search.get("expirado") ? "Sua sessão expirou por segurança. Entre novamente." : "";
  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const data = await response.json();
    if (!response.ok) { setState({ status: "error", message: data.error || "Não foi possível entrar. Confira seu e-mail e sua senha." }); return; }
    location.href = search.get("next")?.startsWith("/") ? search.get("next") : "/painel";
  }
  return <form className="login-form form" onSubmit={submit}>
    <NetworkMark/>
    <h2>Entrar na Rede Conecta</h2>
    <p>Acesse oportunidades, conexões, resultados e os recursos permitidos para o seu perfil.</p>
    {notice && <div className="legal-note" style={{ margin: "0 0 18px" }}>{notice}</div>}
    <label>E-mail<input name="email" type="email" required autoComplete="email"/></label>
    <PasswordField label="Senha" name="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password"/>
    <button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Entrando…" : "Entrar"}<Icon name="arrow"/></button>
    {state.message && <p className="form-error">{state.message}</p>}
    <div className="button-row" style={{ marginTop: 14 }}><Link className="text-link" href="/recuperar">Problemas para acessar?</Link><Link className="text-link" href="/cadastro">Quero ser conector</Link></div>
    <small>Seu acesso é protegido por permissões, trilhas de auditoria e separação entre os diferentes perfis da plataforma.</small>
  </form>;
}
