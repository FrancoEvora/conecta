"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import PasswordField, { passwordRules } from "@/components/PasswordField";

export default function PasswordResetForm() {
  const [tokens, setTokens] = useState({ accessToken: "", refreshToken: "" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });
  useEffect(() => {
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    setTokens({ accessToken: params.get("access_token") || "", refreshToken: params.get("refresh_token") || "" });
  }, []);
  async function submit(event) {
    event.preventDefault();
    const rules = passwordRules(password);
    if (!Object.values(rules).every(Boolean)) return setState({ status: "error", message: "Crie uma senha com 8 caracteres, letra maiúscula, minúscula, número e símbolo." });
    if (password !== confirmPassword) return setState({ status: "error", message: "As senhas precisam coincidir." });
    setState({ status: "loading", message: "" });
    const response = await fetch("/api/auth/update-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, password, confirmPassword }) });
    const data = await response.json();
    if (!response.ok) { setState({ status: "error", message: data.error || "Não foi possível atualizar sua senha." }); return; }
    setState({ status: "success", message: data.message || "Senha atualizada com sucesso." });
    setTimeout(() => { location.href = "/painel"; }, 1400);
  }
  if (!tokens.accessToken) return <div className="login-form"><NetworkMark/><h2>Este link não está mais disponível</h2><p>Abra esta página pelo link completo enviado ao seu e-mail. Por segurança, links expirados ou já utilizados precisam ser solicitados novamente.</p><Link className="button button--orange button--block" href="/recuperar">Solicitar novo link</Link></div>;
  return <form className="login-form form" onSubmit={submit}><NetworkMark/><h2>Crie sua nova senha</h2><p>Escolha uma senha exclusiva e segura para proteger sua conta e o histórico das suas conexões.</p><PasswordField label="Nova senha" name="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" showStrength/><PasswordField label="Confirmar nova senha" name="confirmPassword" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" confirmValue={password}/><button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Atualizando…" : "Atualizar senha"}<Icon name="arrow"/></button>{state.message && <p className={state.status === "error" ? "form-error" : "legal-note"}>{state.message}</p>}</form>;
}
