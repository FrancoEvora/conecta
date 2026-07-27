"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/UI";

export default function ApplicationForm() {
  const [state, setState] = useState({ status: "idle", message: "" });
  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.termsAccepted = form.get("termsAccepted") === "on";
    const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { setState({ status: "error", message: data.error || "Não foi possível concluir o cadastro." }); return; }
    setState({ status: "success", message: data.message });
    if (!data.requiresEmailConfirmation) setTimeout(() => { location.href = "/painel"; }, 1400);
  }
  if (state.status === "success") return <div className="application-form success-panel"><Icon name="check" size={46}/><h2>Conta criada.</h2><p>{state.message}</p><small>Após a validação interna, você receberá a confirmação oficial por e-mail e WhatsApp.</small><Link className="button button--navy" href="/entrar">Ir para a área de acesso</Link></div>;
  return <form className="application-form form" onSubmit={submit}>
    <span className="eyebrow">Cadastro direto do conector</span>
    <h2>Crie sua conta na Rede Conecta</h2>
    <p>Seu acesso começa em análise. A equipe interna valida o cadastro antes de liberar produtos, links e recompensas.</p>
    <div className="form-grid">
      <label>Nome completo<input name="fullName" required minLength="2" autoComplete="name"/></label>
      <label>WhatsApp<input name="phone" required inputMode="tel" minLength="10" autoComplete="tel" placeholder="(34) 99999-9999"/></label>
      <label>E-mail<input name="email" required type="email" autoComplete="email"/></label>
      <label>Cidade<input name="city" required autoComplete="address-level2"/></label>
      <label>Estado<input name="state" required maxLength="2" placeholder="MG" autoComplete="address-level1"/></label>
      <label>Ocupação<input name="occupation" placeholder="Empresário, profissional, parceiro…"/></label>
      <label>Senha<input name="password" required type="password" minLength="8" autoComplete="new-password"/></label>
      <label>Confirmar senha<input name="confirmPassword" required type="password" minLength="8" autoComplete="new-password"/></label>
    </div>
    <label>Como é sua rede de contatos?<textarea name="networkProfile" rows="4" maxLength="1500" placeholder="Conte brevemente em quais cidades, setores ou comunidades você possui relacionamento."/></label>
    <label className="check-row"><input type="checkbox" name="termsAccepted" required/><span>Li e aceito os <Link href="/termos">Termos de Uso</Link>, os <Link href="/termos-conector">Termos do Conector</Link> e a <Link href="/privacidade">Política de Privacidade</Link>.</span></label>
    <button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Criando conta…" : "Criar conta e enviar para análise"}<Icon name="arrow"/></button>
    {state.message && <p className="form-error">{state.message}</p>}
    <small>Não negocie imóveis em nome da Rede Conecta. O conector realiza a conexão; o atendimento e a operação são conduzidos pela equipe interna.</small>
  </form>;
}
