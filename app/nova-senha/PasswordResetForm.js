"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";

export default function PasswordResetForm() {
  const [tokens, setTokens] = useState({ accessToken: "", refreshToken: "" });
  const [state, setState] = useState({ status: "idle", message: "" });
  useEffect(() => {
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    setTokens({ accessToken: params.get("access_token") || "", refreshToken: params.get("refresh_token") || "" });
  }, []);
  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/update-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, password: form.get("password"), confirmPassword: form.get("confirmPassword") }) });
    const data = await response.json();
    if (!response.ok) { setState({ status: "error", message: data.error }); return; }
    setState({ status: "success", message: data.message });
    setTimeout(() => { location.href = "/painel"; }, 1200);
  }
  if (!tokens.accessToken) return <div className="login-form"><NetworkMark/><h2>Link de recuperação</h2><p>Abra esta página pelo link completo enviado ao seu e-mail. Links expirados precisam ser solicitados novamente.</p><Link className="button button--orange button--block" href="/recuperar">Solicitar novo link</Link></div>;
  return <form className="login-form form" onSubmit={submit}><NetworkMark/><h2>Defina uma nova senha</h2><p>Use ao menos 8 caracteres e não reutilize senhas de outros serviços.</p><label>Nova senha<input name="password" type="password" required minLength="8" autoComplete="new-password"/></label><label>Confirmar senha<input name="confirmPassword" type="password" required minLength="8" autoComplete="new-password"/></label><button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Atualizando…" : "Atualizar senha"}<Icon name="arrow"/></button>{state.message && <p className={state.status === "error" ? "form-error" : "legal-note"}>{state.message}</p>}</form>;
}
