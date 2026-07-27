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
    const data = await response.json();
    setState({ status: response.ok ? "success" : "error", message: data.message || data.error });
  }
  return <form className="login-form form" onSubmit={submit}><NetworkMark/><h2>Recuperar senha</h2><p>Enviaremos um link de recuperação ao e-mail cadastrado.</p><label>E-mail<input name="email" type="email" required autoComplete="email"/></label><button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Enviando…" : "Enviar instruções"}<Icon name="arrow"/></button>{state.message && <p className={state.status === "error" ? "form-error" : "legal-note"}>{state.message}</p>}<Link className="text-link" href="/entrar">Voltar para entrar</Link></form>;
}
