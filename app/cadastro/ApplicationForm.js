"use client";
import { useState } from "react";
import { Icon } from "@/components/UI";

export default function ApplicationForm() {
  const [state,setState] = useState({ status:"idle", message:"" });
  async function submit(event) {
    event.preventDefault(); setState({status:"loading",message:""});
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/cadastro", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(form.entries())) });
    const data = await response.json();
    setState(response.ok ? {status:"success",message:"Seu cadastro foi registrado e seguirá para análise."} : {status:"error",message:data.error || "Não foi possível concluir."});
  }
  if (state.status === "success") return <div className="application-form success-panel"><Icon name="check" size={42}/><h2>Cadastro recebido.</h2><p>{state.message}</p><small>A equipe da Rede Conecta entrará em contato após a análise do perfil.</small></div>;
  return <form className="application-form form" onSubmit={submit}><span className="eyebrow">Cadastro preliminar</span><h2>Quero ser um conector</h2><div className="form-grid"><label>Nome completo<input name="fullName" required minLength="2"/></label><label>WhatsApp<input name="phone" required inputMode="tel" minLength="10"/></label><label>E-mail<input name="email" required type="email"/></label><label>Cidade<input name="city" required/></label><label>Estado<input name="state" maxLength="2" placeholder="MG"/></label><label>Ocupação<input name="occupation" placeholder="Empresário, profissional, parceiro…"/></label></div><label>Como é sua rede de contatos?<textarea name="networkProfile" rows="4" placeholder="Conte brevemente em quais cidades, setores ou comunidades você possui relacionamento."/></label><label className="check-row"><input type="checkbox" name="contactConsent" required/><span>Autorizo o contato da Rede Conecta para análise deste cadastro e aceito os termos.</span></label><button className="button button--orange button--block" disabled={state.status === "loading"}>{state.status === "loading" ? "Enviando…" : "Enviar cadastro"}<Icon name="arrow"/></button>{state.message && <p className="form-error">{state.message}</p>}</form>;
}
