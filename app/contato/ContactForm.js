"use client";
import { useState } from "react";
import { Icon } from "@/components/UI";

export default function ContactForm({ initialProfile = "empreendedor" }) {
  const [status,setStatus] = useState("");
  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const subject = encodeURIComponent(`Rede Conecta — interesse como ${data.perfil}`);
    const body = encodeURIComponent(`Nome: ${data.nome}\nEmpresa: ${data.empresa || "-"}\nTelefone: ${data.telefone}\nE-mail: ${data.email}\nPerfil: ${data.perfil}\n\nMensagem:\n${data.mensagem || "Gostaria de conhecer a Rede Conecta."}`);
    window.location.href = `mailto:franco@evoraurbanismo.com.br?subject=${subject}&body=${body}`;
    setStatus("Sua solicitação foi preparada no aplicativo de e-mail.");
  }
  return <form className="contact-card__form" onSubmit={submit}>
    <label>Nome<input name="nome" required autoComplete="name"/></label>
    <label>Empresa<input name="empresa" autoComplete="organization"/></label>
    <label>Telefone / WhatsApp<input name="telefone" required inputMode="tel" autoComplete="tel"/></label>
    <label>E-mail<input name="email" type="email" required autoComplete="email"/></label>
    <label>Quero participar como<select name="perfil" defaultValue={initialProfile}><option value="empreendedor">Empreendedor / incorporador</option><option value="corretor">Corretor / imobiliária</option><option value="parceiro">Parceiro estratégico</option></select></label>
    <label>Mensagem<textarea name="mensagem" placeholder="Conte brevemente o que deseja integrar à Rede Conecta."/></label>
    <button className="button button--orange button--block">Solicitar apresentação <Icon name="arrow"/></button>
    {status && <small>{status}</small>}
  </form>;
}
