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
  const [state, setState] = useState({ status: "idle", message: "" });
  const [cities, setCities] = useState([]);
  const [cityDraft, setCityDraft] = useState("");
  const [segments, setSegments] = useState([]);
  const [channels, setChannels] = useState([]);
  const [profile, setProfile] = useState({ networkSize: "", occupation: "", objective: "" });
  const totalSteps = 4;

  const segmentNames = useMemo(() => segments.map(slug => SEGMENTS.find(item => item[0] === slug)?.[1]).filter(Boolean), [segments]);

  function addCity() {
    const value = cityDraft.trim();
    if (!value || cities.some(item => item.toLowerCase() === value.toLowerCase()) || cities.length >= 8) return;
    setCities([...cities, value]);
    setCityDraft("");
  }

  function next(event) {
    event?.preventDefault();
    if (step === 2 && !segments.length) return setState({ status: "error", message: "Selecione ao menos um mercado em que deseja atuar." });
    if (step === 3 && (!profile.networkSize || !channels.length)) return setState({ status: "error", message: "Informe o tamanho aproximado da rede e ao menos um canal de relacionamento." });
    setState({ status: "idle", message: "" });
    setStep(value => Math.min(totalSteps, value + 1));
    window.scrollTo({ top: 420, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.termsAccepted = form.get("termsAccepted") === "on";
    payload.segments = segments;
    payload.channels = channels;
    payload.cities = cities;
    payload.networkSize = profile.networkSize;
    payload.occupation = profile.occupation || payload.occupation;
    payload.objective = profile.objective;
    payload.networkProfile = [
      segmentNames.length ? `Mercados: ${segmentNames.join(", ")}.` : "",
      cities.length ? `Cidades de relacionamento: ${cities.join(", ")}.` : "",
      profile.networkSize ? `Alcance estimado: ${NETWORK_SIZES.find(item => item[0] === profile.networkSize)?.[1]}.` : "",
      channels.length ? `Canais: ${channels.join(", ")}.` : "",
      profile.objective ? `Objetivo: ${profile.objective}` : ""
    ].filter(Boolean).join(" ");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setState({ status: "error", message: data.error || "Não foi possível concluir o cadastro." });
      return;
    }
    setState({ status: "success", message: data.message });
    if (!data.requiresEmailConfirmation) setTimeout(() => { location.href = "/painel"; }, 1800);
  }

  if (state.status === "success") return <div className={`${styles.form} ${styles.success}`}>
    <div className={styles.successBadge}><Icon name="check" size={36}/></div>
    <h2>Seu perfil comercial foi criado.</h2>
    <p>{state.message}</p>
    <div className={styles.dna}>
      <span>Seu DNA Conecta</span>
      <b>{segmentNames.slice(0,4).join(" · ") || "Perfil em análise"}</b>
      <p>{cities.length ? cities.join(" · ") : "Região informada no cadastro"} · {channels.slice(0,3).join(" · ")}</p>
    </div>
    <small>Após a validação interna, a plataforma poderá recomendar oportunidades alinhadas ao seu perfil.</small>
    <Link className="button button--navy" href="/entrar">Ir para a área de acesso</Link>
  </div>;

  return <form className={styles.form} onSubmit={submit}>
    <header className={styles.formHeader}>
      <div className={styles.progressTop}><b>Crie seu perfil de conector</b><span>Etapa {step} de {totalSteps}</span></div>
      <div className={styles.progress}><i style={{ width: `${step / totalSteps * 100}%` }}/></div>
    </header>

    {step === 1 && <section className={styles.step}>
      <h2 className={styles.stepTitle}>Primeiro, conte quem é você.</h2>
      <p className={styles.stepIntro}>Sua conta é individual. O histórico, os links e as recompensas ficam vinculados ao seu perfil.</p>
      <div className={styles.grid}>
        <label className={styles.field}><span>Nome completo</span><input name="fullName" required minLength="2" autoComplete="name"/></label>
        <label className={styles.field}><span>WhatsApp</span><input name="phone" required inputMode="tel" minLength="10" autoComplete="tel" placeholder="(34) 99999-9999"/></label>
        <label className={styles.field}><span>E-mail</span><input name="email" required type="email" autoComplete="email"/></label>
        <label className={styles.field}><span>Profissão ou atividade</span><input name="occupation" value={profile.occupation} onChange={event => setProfile({...profile, occupation:event.target.value})} placeholder="Empresário, advogado, vendedor…"/></label>
        <label className={styles.field}><span>Cidade principal</span><input name="city" required autoComplete="address-level2"/></label>
        <label className={styles.field}><span>Estado</span><input name="state" required maxLength="2" placeholder="MG" autoComplete="address-level1"/></label>
        <label className={styles.field}><span>Senha</span><input name="password" required type="password" minLength="8" autoComplete="new-password"/></label>
        <label className={styles.field}><span>Confirmar senha</span><input name="confirmPassword" required type="password" minLength="8" autoComplete="new-password"/></label>
      </div>
    </section>}

    {step === 2 && <section className={styles.step}>
      <h2 className={styles.stepTitle}>Em quais mercados você quer atuar?</h2>
      <p className={styles.stepIntro}>Marque todos os segmentos em que possui relacionamento ou deseja receber oportunidades. Você poderá atualizar isso depois.</p>
      <div className={styles.options}>
        {SEGMENTS.map(([slug,name,description]) => <label className={styles.option} key={slug}>
          <input type="checkbox" checked={segments.includes(slug)} onChange={() => setSegments(toggle(segments, slug))}/>
          <span><b>{name}</b><small>{description}</small></span>
        </label>)}
      </div>
    </section>}

    {step === 3 && <section className={styles.step}>
      <h2 className={styles.stepTitle}>Como é a força da sua rede?</h2>
      <p className={styles.stepIntro}>Essas informações ajudam a recomendar campanhas e formatos de compartilhamento mais adequados.</p>
      <div className={styles.grid}>
        <label className={`${styles.field} ${styles.full}`}><span>Tamanho aproximado da sua rede</span><select value={profile.networkSize} onChange={event => setProfile({...profile, networkSize:event.target.value})} required><option value="">Selecione</option>{NETWORK_SIZES.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <div className={`${styles.field} ${styles.full}`}><span>Cidades em que você possui relacionamento</span><div className={styles.cityRow}><input value={cityDraft} onChange={event => setCityDraft(event.target.value)} onKeyDown={event => { if(event.key === "Enter"){ event.preventDefault(); addCity(); } }} placeholder="Digite uma cidade e adicione"/><button type="button" className={styles.back} onClick={addCity}>Adicionar</button></div><div className={styles.tags}>{cities.map(city => <span className={styles.tag} key={city}>{city}<button type="button" onClick={() => setCities(cities.filter(item => item !== city))}>×</button></span>)}</div></div>
        <div className={`${styles.field} ${styles.full}`}><span>Onde você costuma se relacionar e compartilhar?</span><div className={styles.options}>{CHANNELS.map(channel => <label className={styles.option} key={channel}><input type="checkbox" checked={channels.includes(channel)} onChange={() => setChannels(toggle(channels, channel))}/><span><b>{channel}</b><small>Canal de relacionamento</small></span></label>)}</div></div>
        <label className={`${styles.field} ${styles.full}`}><span>O que você espera da Rede Conecta?</span><textarea value={profile.objective} onChange={event => setProfile({...profile, objective:event.target.value})} maxLength="600" placeholder="Ex.: receber oportunidades de imóveis e veículos para compartilhar com empresários da minha região."/></label>
      </div>
    </section>}

    {step === 4 && <section className={styles.step}>
      <h2 className={styles.stepTitle}>Revise seu DNA Conecta.</h2>
      <p className={styles.stepIntro}>Seu perfil será analisado pela equipe antes da liberação das campanhas e dos links rastreáveis.</p>
      <div className={styles.summary}>
        <article className={styles.summaryCard}><span>Mercados selecionados</span><b>{segmentNames.join(" · ")}</b></article>
        <article className={styles.summaryCard}><span>Alcance e canais</span><b>{NETWORK_SIZES.find(item => item[0] === profile.networkSize)?.[1]}</b><p>{channels.join(" · ")}</p></article>
        <article className={styles.summaryCard}><span>Regiões de relacionamento</span><b>{cities.length ? cities.join(" · ") : "Cidade principal informada"}</b></article>
      </div>
      <label className={styles.terms}><input type="checkbox" name="termsAccepted" required/><span>Li e aceito os <Link href="/termos">Termos de Uso</Link>, os <Link href="/termos-conector">Termos do Conector</Link> e a <Link href="/privacidade">Política de Privacidade</Link>.</span></label>
    </section>}

    {state.message && <p className={styles.error}>{state.message}</p>}
    <footer className={styles.actions}>
      {step > 1 && <button type="button" className={styles.back} onClick={() => { setStep(step-1); setState({status:"idle",message:""}); }}>Voltar</button>}
      {step < totalSteps ? <button type="button" className={styles.next} onClick={next}>Continuar</button> : <button className={styles.next} disabled={state.status === "loading"}>{state.status === "loading" ? "Criando seu perfil…" : "Criar conta e enviar para validação"}</button>}
    </footer>
  </form>;
}
