"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";

export default function RecoveryForm() {
  const [state, setState] = useState({ status: "idle", message: "" });
  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const email = new FormData(event.currentTarget).get("email");
    const response = await fetch("/api/auth/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json().catch(() => ({}));
    setState({ status: response.ok ? "success" : "error", message: response.ok ? (data.message || "Se o e-mail estiver cadastrado, você receberá um link seguro para criar uma nova senha.") : (data.error || "Não foi possível enviar as instruções agora.") });
  }
  return <form className="login-form form" onSubmit={submit}>
    <NetworkMark/>
    <h2>Vamos recuperar seu acesso</h2>
    <p>Informe o e-mail usado na Rede Conecta. Enviaremos um link seguro e com validade limitada para você criar uma nova senha.</p>
    <label>E-mail<input name="email" type="email" required autoComplete="email" placeholder="voce@empresa.com.br"/></label>
    <button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Enviando…" : "Enviar link de recuperação"}<Icon name="arrow"/></button>
    {state.message && <p className={state.status === "error" ? "form-error" : "legal-note"}>{state.message}</p>}
    <small>Por segurança, não informamos se um endereço está ou não cadastrado na plataforma.</small>
    <Link className="text-link" href="/entrar">Voltar para entrar</Link>
  </form>;
}
