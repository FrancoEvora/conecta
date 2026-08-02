"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import PasswordField from "@/components/PasswordField";

export default function ActivationForm({ invitation, token }) {
  const [state, setState] = useState({ status: "idle", message: "" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        email: invitation.email,
        password,
        confirmPassword,
        termsAccepted: form.get("termsAccepted") === "on"
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState({ status: "error", message: data.error || "Não foi possível ativar o acesso." });
      return;
    }
    setState({ status: "success", message: data.message });
    setTimeout(() => { location.href = "/painel"; }, 1000);
  }

  if (state.status === "success") return <div className="login-form success-panel"><Icon name="check" size={46}/><h2>Acesso liberado.</h2><p>{state.message}</p><Link className="button button--navy" href="/painel">Abrir plataforma</Link></div>;

  const profileLabel = invitation.target_kind === "staff"
    ? "integrante da equipe interna"
    : invitation.target_kind === "broker"
      ? "especialista comercial"
      : "usuário parceiro";

  return <form className="login-form form" onSubmit={submit}>
    <NetworkMark/>
    <span className="eyebrow">{invitation.status === "accepted" ? "Recuperação de acesso" : "Convite de acesso"}</span>
    <h2>{invitation.status === "accepted" ? "Defina novamente sua senha" : "Ative sua conta"}</h2>
    <p><b>{invitation.display_name}</b>, este acesso está configurado como <b>{profileLabel}</b>{invitation.partner_name ? ` vinculado a ${invitation.partner_name}` : ""}.</p>
    {invitation.status === "accepted" && <div className="form-notice">Sua conta já foi criada. Este mesmo convite agora permite recuperar a ativação e definir uma nova senha com segurança.</div>}
    <label>E-mail<input value={invitation.email} readOnly/></label>
    <PasswordField label="Nova senha" name="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" showStrength/>
    <PasswordField label="Confirmar senha" name="confirmPassword" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" confirmValue={password}/>
    <label className="check-row"><input type="checkbox" name="termsAccepted" required/><span>Li e aceito os <Link href="/termos">Termos de Uso</Link> e as regras de acesso aplicáveis ao meu perfil.</span></label>
    <button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Liberando acesso…" : invitation.status === "accepted" ? "Redefinir senha e entrar" : "Ativar acesso"}<Icon name="arrow"/></button>
    {state.message && <p className="form-error">{state.message}</p>}
    <small>O link é pessoal e intransferível. Após a ativação, ele permanece utilizável apenas para recuperar uma ativação incompleta.</small>
  </form>;
}
