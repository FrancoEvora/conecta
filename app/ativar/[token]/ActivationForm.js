"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";

export default function ActivationForm({ invitation, token }) {
  const [state, setState] = useState({ status: "idle", message: "" });
  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.token = token;
    payload.email = invitation.email;
    payload.termsAccepted = form.get("termsAccepted") === "on";
    const response = await fetch("/api/auth/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { setState({ status: "error", message: data.error || "Não foi possível ativar o acesso." }); return; }
    setState({ status: "success", message: data.message });
    if (!data.requiresEmailConfirmation) setTimeout(() => { location.href = "/painel"; }, 1200);
  }
  if (state.status === "success") return <div className="login-form success-panel"><Icon name="check" size={46}/><h2>Acesso criado.</h2><p>{state.message}</p><Link className="button button--navy" href="/entrar">Entrar na plataforma</Link></div>;
  return <form className="login-form form" onSubmit={submit}>
    <NetworkMark/>
    <span className="eyebrow">Convite de acesso</span>
    <h2>Ative sua conta</h2>
    <p><b>{invitation.display_name}</b>, este convite concede acesso como <b>{invitation.target_kind === "staff" ? "equipe interna" : invitation.target_kind === "broker" ? "corretor" : "parceiro"}</b>{invitation.partner_name ? ` vinculado a ${invitation.partner_name}` : ""}.</p>
    <label>E-mail<input value={invitation.email} readOnly/></label>
    <label>Nova senha<input name="password" type="password" required minLength="8" autoComplete="new-password"/></label>
    <label>Confirmar senha<input name="confirmPassword" type="password" required minLength="8" autoComplete="new-password"/></label>
    <label className="check-row"><input type="checkbox" name="termsAccepted" required/><span>Li e aceito os <Link href="/termos">Termos de Uso</Link> e as regras de acesso aplicáveis ao meu perfil.</span></label>
    <button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Ativando…" : "Ativar acesso"}<Icon name="arrow"/></button>
    {state.message && <p className="form-error">{state.message}</p>}
    <small>Este link é pessoal, intransferível e somente pode ser utilizado uma vez.</small>
  </form>;
}
