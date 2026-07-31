"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/UI";
import styles from "./cadastro.module.css";

const SEGMENTS = [
  ["imoveis","Imóveis","Lotes, casas, apartamentos e investimentos"],
  ["veiculos","Veículos","Carros, motos, máquinas e mobilidade"],
  ["perfumaria","Perfumaria e beleza","Cosméticos, fragrâncias e bem-estar"],
  ["energia-solar","Energia solar","Soluções residenciais e empresariais"],
  ["agronegocio","Agronegócio","Terras, insumos, máquinas e serviços"],
  ["turismo","Turismo","Viagens, hospedagem e experiências"],
  ["seguros","Seguros","Proteção pessoal e patrimonial"],
  ["consorcios","Consórcios","Imóveis, veículos e serviços"],
  ["saude","Saúde","Clínicas, serviços e soluções de saúde"],
  ["educacao","Educação","Cursos, escolas e capacitação"],
  ["tecnologia","Tecnologia","Software, equipamentos e serviços"],
  ["construcao","Construção","Materiais, projetos e fornecedores"],
  ["moda","Moda","Vestuário, acessórios e marcas"],
  ["investimentos","Investimentos","Oportunidades e ativos selecionados"],
  ["outros","Outros mercados","Outras áreas da sua rede"]
];

const CHANNELS = ["WhatsApp","Instagram","Facebook","LinkedIn","TikTok","Telegram","E-mail","Presencialmente"];
const NETWORK_SIZES = [
  ["up_to_100","Até 100 pessoas"],
  ["100_500","De 100 a 500"],
  ["500_2000","De 500 a 2.000"],
  ["over_2000","Mais de 2.000"]
];

function toggle(list, value) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [identity, setIdentity] = useState({ fullName: "", phone: "", email: "", occupation: "", city: "", state: "", password: "", confirmPassword: "" });
  const [segments, setSegments] = useState([]);
  const [channels, setChannels] = useState([]);
  const [networkSize, setNetworkSize] = useState("");
  const [cities, setCities] = useState([]);
  const [cityDraft, setCityDraft] = useState("");
  const [objective, setObjective] = useState("");
  const totalSteps = 4;

  const segmentNames = useMemo(() => segments.map(slug => SEGMENTS.find(item => item[0] === slug)?.[1]).filter(Boolean), [segments]);
  const setField = (field, value) => setIdentity(current => ({ ...current, [field]: value }));

  function addCity() {
    const value = cityDraft.trim();
    if (!value || cities.some(item => item.toLowerCase() === value.toLowerCase()) || cities.length >= 8) return;
    setCities(current => [...current, value]);
    setCityDraft("");
  }

  function validateStep() {
    if (step === 1) {
      const digits = identity.phone.replace(/\D/g, "");
      if (identity.fullName.trim().length < 2 || !identity.email.includes("@") || digits.length < 10 || !identity.city.trim() || identity.state.trim().length !== 2) return "Informe nome, e-mail, WhatsApp, cidade e estado válidos.";
      if (identity.password.length < 8 || identity.password !== identity.confirmPassword) return "A senha deve ter ao menos 8 caracteres e as confirmações precisam coincidir.";
    }
    if (step === 2 && !segments.length) return "Selecione ao menos um mercado em que deseja atuar.";
    if (step === 3 && (!networkSize || !channels.length)) return "Informe o tamanho aproximado da rede e ao menos um canal de relacionamento.";
    return "";
  }

  function next() {
    const error = validateStep();
    if (error) return setStatus({ type: "error", message: error });
    setStatus({ type: "idle", message: "" });
    setStep(current => Math.min(totalSteps, current + 1));
    window.scrollTo({ top: 360, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("termsAccepted") !== "on") return setStatus({ type: "error", message: "É necessário aceitar os termos e a política de privacidade." });
    setStatus({ type: "loading", message: "" });

    const networkProfile = [
      segmentNames.length ? `Mercados: ${segmentNames.join(", ")}.` : "",
      cities.length ? `Cidades de relacionamento: ${cities.join(", ")}.` : "",
      networkSize ? `Alcance estimado: ${NETWORK_SIZES.find(item => item[0] === networkSize)?.[1]}.` : "",
      channels.length ? `Canais: ${channels.join(", ")}.` : "",
      objective ? `Objetivo: ${objective}` : ""
    ].filter(Boolean).join(" ");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identity, termsAccepted: true, segments, channels, cities, networkSize, objective, networkProfile })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir o cadastro.");
      setStatus({ type: "success", message: data.message || "Cadastro concluído." });
      if (!data.requiresEmailConfirmation) setTimeout(() => { location.href = "/painel"; }, 1800);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  if (status.type === "success") return <div className={`${styles.form} ${styles.success}`}>
    <div className={styles.successBadge}><Icon name="check" size={36}/></div>
    <h2>Seu perfil comercial foi criado.</h2>
    <p>{status.message}</p>
    <div className={styles.dna}><span>Seu DNA Conecta</span><b>{segmentNames.slice(0,4).join(" · ") || "Perfil em análise"}</b><p>{cities.length ? cities.join(" · ") : identity.city} · {channels.slice(0,3).join(" · ")}</p></div>
    <small>Após a validação interna, a plataforma poderá recomendar oportunidades alinhadas ao seu perfil.</small>
    <Link className="button button--navy" href="/entrar">Ir para a área de acesso</Link>
  </div>;

  return <form className={styles.form} onSubmit={submit}>
    <header className={styles.formHeader}><div className={styles.progressTop}><b>Crie seu perfil de conector</b><span>Etapa {step} de {totalSteps}</span></div><div className={styles.progress}><i style={{ width: `${step / totalSteps * 100}%` }}/></div></header>

    {step === 1 && <section className={styles.step}>
      <h2 className={styles.stepTitle}>Primeiro, conte quem é você.</h2>
      <p className={styles.stepIntro}>Sua conta é individual. Seus links, histórico e recompensas ficam vinculados ao seu perfil.</p>
      <div className={styles.grid}>
        <label className={styles.field}><span>Nome completo</span><input value={identity.fullName} onChange={e => setField("fullName", e.target.value)} required autoComplete="name"/></label>
        <label className={styles.field}><span>WhatsApp</span><input value={identity.phone} onChange={e => setField("phone", e.target.value)} required inputMode="tel" placeholder="(34) 99999-9999" autoComplete="tel"/></label>
        <label className={styles.field}><span>E-mail</span><input value={identity.email} onChange={e => setField("email", e.target.value)} required type="email" autoComplete="email"/></label>
        <label className={styles.field}><span>Profissão ou atividade</span><input value={identity.occupation} onChange={e => setField("occupation", e.target.value)} placeholder="Empresário, advogado, vendedor…"/></label>
        <label className={styles.field}><span>Cidade principal</span><input value={identity.city} onChange={e => setField("city", e.target.value)} required autoComplete="address-level2"/></label>
        <label className={styles.field}><span>Estado</span><input value={identity.state} onChange={e => setField("state", e.target.value.toUpperCase())} required maxLength="2" placeholder="MG"/></label>
        <label className={styles.field}><span>Senha</span><input value={identity.password} onChange={e => setField("password", e.target.value)} required type="password" minLength="8" autoComplete="new-password"/></label>
        <label className={styles.field}><span>Confirmar senha</span><input value={identity.confirmPassword} onChange={e => setField("confirmPassword", e.target.value)} required type="password" minLength="8" autoComplete="new-password"/></label>
      </div>
    </section>}

    {step === 2 && <section className={styles.step}><h2 className={styles.stepTitle}>Em quais mercados você quer atuar?</h2><p className={styles.stepIntro}>Marque os segmentos em que possui relacionamento ou deseja receber oportunidades.</p><div className={styles.options}>{SEGMENTS.map(([slug,name,description]) => <label className={styles.option} key={slug}><input type="checkbox" checked={segments.includes(slug)} onChange={() => setSegments(toggle(segments, slug))}/><span><b>{name}</b><small>{description}</small></span></label>)}</div></section>}

    {step === 3 && <section className={styles.step}>
      <h2 className={styles.stepTitle}>Como é a força da sua rede?</h2><p className={styles.stepIntro}>Essas informações ajudam a recomendar campanhas adequadas ao seu perfil.</p>
      <div className={styles.grid}>
        <label className={`${styles.field} ${styles.full}`}><span>Tamanho aproximado da sua rede</span><select value={networkSize} onChange={e => setNetworkSize(e.target.value)} required><option value="">Selecione</option>{NETWORK_SIZES.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <div className={`${styles.field} ${styles.full}`}><span>Cidades em que você possui relacionamento</span><div className={styles.cityRow}><input value={cityDraft} onChange={e => setCityDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCity(); } }} placeholder="Digite uma cidade e adicione"/><button type="button" className={styles.back} onClick={addCity}>Adicionar</button></div><div className={styles.tags}>{cities.map(city => <span className={styles.tag} key={city}>{city}<button type="button" onClick={() => setCities(cities.filter(item => item !== city))}>×</button></span>)}</div></div>
        <div className={`${styles.field} ${styles.full}`}><span>Onde você costuma se relacionar e compartilhar?</span><div className={styles.options}>{CHANNELS.map(channel => <label className={styles.option} key={channel}><input type="checkbox" checked={channels.includes(channel)} onChange={() => setChannels(toggle(channels, channel))}/><span><b>{channel}</b><small>Canal de relacionamento</small></span></label>)}</div></div>
        <label className={`${styles.field} ${styles.full}`}><span>O que você espera da Rede Conecta?</span><textarea value={objective} onChange={e => setObjective(e.target.value)} maxLength="600" placeholder="Ex.: receber oportunidades para compartilhar com empresários da minha região."/></label>
      </div>
    </section>}

    {step === 4 && <section className={styles.step}><h2 className={styles.stepTitle}>Revise seu DNA Conecta.</h2><p className={styles.stepIntro}>Seu perfil será analisado antes da liberação das campanhas e links rastreáveis.</p><div className={styles.summary}><article className={styles.summaryCard}><span>Mercados selecionados</span><b>{segmentNames.join(" · ")}</b></article><article className={styles.summaryCard}><span>Alcance e canais</span><b>{NETWORK_SIZES.find(item => item[0] === networkSize)?.[1]}</b><p>{channels.join(" · ")}</p></article><article className={styles.summaryCard}><span>Regiões de relacionamento</span><b>{cities.length ? cities.join(" · ") : identity.city}</b></article></div><label className={styles.terms}><input type="checkbox" name="termsAccepted" required/><span>Li e aceito os <Link href="/termos">Termos de Uso</Link>, os <Link href="/termos-conector">Termos do Conector</Link> e a <Link href="/privacidade">Política de Privacidade</Link>.</span></label></section>}

    {status.message && <p className={styles.error}>{status.message}</p>}
    <footer className={styles.actions}>{step > 1 && <button type="button" className={styles.back} onClick={() => { setStep(step - 1); setStatus({ type: "idle", message: "" }); }}>Voltar</button>}{step < totalSteps ? <button type="button" className={styles.next} onClick={next}>Continuar</button> : <button className={styles.next} disabled={status.type === "loading"}>{status.type === "loading" ? "Criando seu perfil…" : "Criar conta e enviar para validação"}</button>}</footer>
  </form>;
}
