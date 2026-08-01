"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";

export default function ConfirmationForm() {
  const search = useSearchParams();
  const [state, setState] = useState({ status: "idle", message: "" });
  const errorCode = search.get("erro");
  const initialMessage = errorCode === "link-expirado"
    ? "Este link expirou ou já foi utilizado. Solicite um novo e-mail abaixo."
    : errorCode === "link-invalido"
      ? "O link recebido está incompleto. Solicite um novo e-mail de confirmação."
      : "Enviamos um link ao endereço usado no cadastro. Ele pode levar alguns minutos para chegar.";

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const email = new FormData(event.currentTarget).get("email");
    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setState({ status: response.ok ? "success" : "error", message: data.message || data.error });
    } catch {
      setState({ status: "error", message: "Não foi possível solicitar o reenvio agora." });
    }
  }

  return <form className="login-form form" onSubmit={submit}>
    <NetworkMark/>
    <h2>Confirme seu e-mail</h2>
    <p>{initialMessage}</p>
    <div className="legal-note" style={{ margin: "0 0 18px" }}>Confira também as pastas <strong>Spam</strong>, <strong>Lixo eletrônico</strong> e <strong>Promoções</strong>. Use sempre o e-mail mais recente.</div>
    <label>E-mail cadastrado<input name="email" type="email" required autoComplete="email" placeholder="seuemail@exemplo.com"/></label>
    <button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Solicitando…" : "Reenviar confirmação"}<Icon name="arrow"/></button>
    {state.message && <p className={state.status === "error" ? "form-error" : "legal-note"}>{state.message}</p>}
    <div className="button-row" style={{ marginTop: 14 }}><Link className="text-link" href="/entrar">Já confirmei meu e-mail</Link><Link className="text-link" href="/cadastro">Refazer cadastro</Link></div>
  </form>;
}
