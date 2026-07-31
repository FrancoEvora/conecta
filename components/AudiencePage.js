import Link from "next/link";
import { Footer, Header, Icon } from "@/components/UI";

const content = {
  conectores: {
    eyebrow: "Para quem conhece pessoas e inspira confiança",
    title: <>Use a sua confiança e credibilidade para <em>ganhar dinheiro.</em></>,
    lead: "Pessoas já confiam na sua opinião e nas suas indicações. Você compartilha oportunidades selecionadas; a Rede Conecta atende, qualifica e conduz a negociação. Você acompanha a evolução e recebe conforme as regras da campanha.",
    primary: ["Quero começar a indicar", "/cadastro"],
    secondary: ["Ver oportunidades", "/oportunidades"],
    promise: "Sua credibilidade origina a oportunidade. Nós operamos. Você acompanha o resultado.",
    benefits: [
      ["link", "Compartilhe em poucos cliques", "Escolha uma oportunidade, personalize a mensagem e envie um link oficial pelo WhatsApp."],
      ["headset", "Não precisa vender", "A equipe da Rede Conecta assume o atendimento, a qualificação, o follow-up e a negociação."],
      ["chart", "Acompanhe tudo", "Veja suas conexões, o avanço das oportunidades e a situação das recompensas no painel."],
      ["money", "Regras transparentes", "Cada campanha informa claramente critérios, etapas e condições aplicáveis."],
    ],
    steps: ["Escolha uma oportunidade", "Compartilhe seu link", "O interessado autoriza", "A Rede Conecta atende", "Você acompanha o resultado"],
    finalTitle: <>Conhece alguém que pode comprar, investir ou construir?</>,
    finalText: "Use a confiança que essa pessoa já deposita em você para apresentar uma oportunidade de forma profissional. A plataforma registra a origem e a equipe comercial cuida do restante."
  },
  empreendedores: {
    eyebrow: "Para loteadoras, incorporadoras e imobiliárias",
    title: <>Transforme redes de relacionamento em <em>vendas rastreáveis.</em></>,
    lead: "A Rede Conecta amplia sua capilaridade comercial, centraliza a operação dos leads e protege a origem das oportunidades — sem entregar o processo a uma rede desorganizada.",
    primary: ["Agendar demonstração", "/contato?perfil=empreendedor"],
    secondary: ["Conhecer a operação", "/#como-funciona"],
    promise: "Mais demanda. Mais governança. Mais visibilidade sobre o que realmente gera venda.",
    benefits: [
      ["target", "Geração de demanda", "Campanhas e produtos distribuídos por uma rede de conectores com origem identificada."],
      ["shield", "Proteção comercial", "Produto, campanha, conector, consentimento e histórico permanecem registrados."],
      ["chart", "Painel executivo", "Acompanhe funil, oportunidades, negócios e desempenho sem operar diretamente o lead."],
      ["building", "Escala organizada", "Opere vários empreendimentos, campanhas, territórios e parceiros dentro do mesmo modelo."],
    ],
    steps: ["Cadastramos o empreendimento", "Criamos campanhas", "A rede gera conexões", "A Conecta opera o CRM", "Você acompanha o ROI"],
    finalTitle: <>Sua operação comercial precisa crescer sem perder o controle.</>,
    finalText: "A Rede Conecta atua como infraestrutura de aquisição, operação e rastreabilidade para o mercado imobiliário."
  },
  corretores: {
    eyebrow: "Para corretores e equipes comerciais",
    title: <>Mais oportunidades, organização e <em>clareza comercial.</em></>,
    lead: "Acesse produtos, campanhas, materiais e informações relevantes dentro de uma operação padronizada, com origem protegida e condução central da Rede Conecta.",
    primary: ["Quero atuar na rede", "/contato?perfil=corretor"],
    secondary: ["Ver oportunidades", "/oportunidades"],
    promise: "Portfólio organizado, regras claras e uma operação comercial com método.",
    benefits: [
      ["home", "Portfólio centralizado", "Produtos, campanhas, diferenciais, condições e materiais em um único ambiente."],
      ["target", "Mais alinhamento", "Entenda o posicionamento de cada produto e a lógica da jornada comercial."],
      ["chart", "Fluxo visível", "Acompanhe as informações relevantes para sua atuação sem ruído operacional."],
      ["handshake", "Rede profissional", "Atue dentro de um modelo estruturado, auditável e orientado a resultados."],
    ],
    steps: ["Cadastro pela gestão", "Vínculo aos produtos", "Acesso a materiais", "Atuação alinhada", "Acompanhamento de desempenho"],
    finalTitle: <>Venda melhor com uma operação mais organizada.</>,
    finalText: "A plataforma reduz improvisos e concentra as informações necessárias para uma atuação comercial consistente."
  }
};

export default function AudiencePage({ audience }) {
  const item = content[audience];
  return <><Header/><main>
    <section className={`commercial-hero commercial-hero--${audience}`}><div className="container commercial-hero__grid"><div><span className="eyebrow">{item.eyebrow}</span><h1>{item.title}</h1><p>{item.lead}</p><div className="button-row"><Link className="button button--orange" href={item.primary[1]}>{item.primary[0]} <Icon name="arrow"/></Link><Link className="button button--light" href={item.secondary[1]}>{item.secondary[0]}</Link></div><div className="commercial-proof"><Icon name="shield"/><span>{item.promise}</span></div></div><div className="commercial-hero__panel"><span>REDE CONECTA</span><strong>Relacionamento com infraestrutura comercial.</strong><p>Originação, atendimento, acompanhamento e proteção da jornada em uma única plataforma.</p><div className="commercial-metrics"><b>01</b><span>origem registrada</span><b>02</b><span>operação centralizada</span><b>03</b><span>resultado acompanhado</span></div></div></div></section>

    <section className="section"><div className="container"><div className="section-heading"><span className="eyebrow">O que você ganha</span><h2>Uma experiência criada para <em>gerar ação e resultado.</em></h2></div><div className="commercial-benefits">{item.benefits.map(([icon,title,text]) => <article key={title}><div className="icon-box"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="section section--soft"><div className="container"><div className="section-heading section-heading--split"><div><span className="eyebrow">Jornada simples</span><h2>Do primeiro passo ao <em>resultado.</em></h2></div><p>A plataforma reduz atrito, orienta a próxima ação e registra os principais eventos da jornada comercial.</p></div><div className="commercial-flow">{item.steps.map((step,index)=><article key={step}><span>{String(index+1).padStart(2,"0")}</span><strong>{step}</strong>{index<item.steps.length-1&&<b>→</b>}</article>)}</div></div></section>

    <section className="section"><div className="container callout commercial-callout"><div><span className="eyebrow">Próximo passo</span><h2>{item.finalTitle}</h2><p>{item.finalText}</p></div><Link className="button button--orange" href={item.primary[1]}>{item.primary[0]} <Icon name="arrow"/></Link></div></section>
  </main><Footer/></>;
}
