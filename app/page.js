import Link from "next/link";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./home-v2.module.css";

const journey = [
  ["01", "Oportunidade confiável", "A empresa publica um produto, uma campanha e regras comerciais claras."],
  ["02", "Apresentação com confiança", "O conector reconhece uma oportunidade e apresenta a pessoa certa, sem precisar vender."],
  ["03", "Qualificação SDR", "A Rede Conecta confirma interesse, necessidade, momento, orçamento e disponibilidade."],
  ["04", "Atendimento no momento certo", "Somente oportunidades qualificadas são distribuídas ao profissional mais adequado."],
  ["05", "Negócio rastreável", "Origem, atendimento, conversão e recompensa permanecem registrados até o resultado."]
];

const audiences = [
  ["Conector", "Você apresenta pessoas. A Rede Conecta qualifica, atende e conduz todo o restante.", "/conectores", "user"],
  ["Empresa", "Transforme relacionamentos em oportunidades qualificadas, com origem protegida e operação central.", "/empreendedores", "building"],
  ["Especialista", "Receba oportunidades no momento adequado, com briefing completo e contexto comercial.", "/corretores", "handshake"]
];

const platform = [
  ["Trust", "Origem protegida, consentimento e regras de atribuição."],
  ["Match", "Afinidade entre pessoas, mercados, regiões e oportunidades."],
  ["SDR", "Qualificação preliminar, score, resumo e recomendação."],
  ["Routing", "Distribuição automática ou manual após a triagem."],
  ["Operate", "Atendimento, agenda, proposta, documentos e negócio."],
  ["Capital", "Recompensas, conciliação, ROI e resultado auditável."]
];

export const metadata = {
  title: "Rede Conecta · Infraestrutura comercial para relações de confiança",
  description: "A Rede Conecta transforma apresentações de confiança em oportunidades qualificadas, distribuídas e rastreáveis até o negócio."
};

export default function HomePage() {
  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <NetworkMark/>
        <nav><Link href="#como-funciona">Como funciona</Link><Link href="#plataforma">Plataforma</Link><Link href="/empreendedores">Para empresas</Link></nav>
        <div className={styles.headerActions}><Link href="/entrar">Entrar</Link><Link href="/cadastro">Começar agora</Link></div>
      </div>
    </header>

    <main>
      <section className={styles.hero}>
        <div className={styles.heroGlow}/>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>INFRAESTRUTURA COMERCIAL DE CONFIANÇA</span>
            <h1>Sua confiança abre portas. A Rede Conecta transforma oportunidades em <em>negócios.</em></h1>
            <p>Você apresenta pessoas a oportunidades que realmente podem fazer sentido. A Rede Conecta confirma o interesse, qualifica o momento, distribui ao profissional adequado e acompanha tudo até o resultado.</p>
            <div className={styles.ctas}><Link href="/cadastro">Criar meu perfil de conector <Icon name="arrow"/></Link><Link href="/empreendedores">Quero vender pela rede</Link></div>
            <div className={styles.proof}><span><Icon name="shield"/>Origem protegida</span><span><Icon name="headset"/>Qualificação SDR</span><span><Icon name="target"/>Distribuição inteligente</span></div>
          </div>

          <div className={styles.heroProduct}>
            <div className={styles.productTop}><span>OPERAÇÃO CONECTA</span><b>Ao vivo</b></div>
            <div className={styles.matchCard}>
              <div><small>Oportunidade em qualificação</small><h2>Solaris Residencial</h2><p>Origem preservada · SDR ativo · atendimento condicionado ao momento</p></div>
              <strong>91<small>score SDR</small></strong>
            </div>
            <div className={styles.signalGrid}>
              <article><Icon name="link"/><span><small>Origem</small><b>Protegida</b></span></article>
              <article><Icon name="headset"/><span><small>Triagem</small><b>Concluída</b></span></article>
              <article><Icon name="target"/><span><small>Próxima ação</small><b>Distribuir</b></span></article>
              <article><Icon name="money"/><span><small>Resultado</small><b>Rastreável</b></span></article>
            </div>
            <div className={styles.aiPrompt}><span>Briefing do SDR</span><p>“Interesse alto, decisão em até 30 dias, precisa de simulação financeira e aceita contato hoje à tarde.”</p><button>Encaminhar ao especialista <Icon name="arrow" size={17}/></button></div>
          </div>
        </div>
      </section>

      <section className={styles.definition}>
        <div><span>EM UMA FRASE</span><strong>Você apresenta pessoas. Nós qualificamos, distribuímos, operamos e protegemos a origem até o negócio.</strong></div>
      </section>

      <section className={styles.section} id="como-funciona">
        <div className={styles.container}>
          <div className={styles.heading}><span>COMO A OPORTUNIDADE AVANÇA</span><h2>Confiança só vira resultado quando existe <em>processo.</em></h2><p>A Rede Conecta não entrega contatos crus. Ela conduz uma jornada comercial com consentimento, qualificação e contexto.</p></div>
          <div className={styles.journey}>{journey.map(([number,title,text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`}>
        <div className={styles.container}>
          <div className={styles.headingDark}><span>MAIS DO QUE UMA PLATAFORMA DE INDICAÇÕES</span><h2>Uma infraestrutura comercial que decide quando e para quem cada oportunidade deve avançar.</h2><p>O conector abre a porta. O SDR protege a experiência. A operação encaminha somente no momento adequado.</p></div>
          <div className={styles.principles}>
            <article><Icon name="shield"/><h3>Origem inviolável</h3><p>Cada oportunidade mantém conector, campanha, produto e trilha de atribuição.</p></article>
            <article><Icon name="headset"/><h3>SDR antes do humano</h3><p>Necessidade, momento e disponibilidade são confirmados antes da distribuição.</p></article>
            <article><Icon name="target"/><h3>Roteamento inteligente</h3><p>Distribuição automática por elegibilidade e capacidade ou escolha manual da gestão.</p></article>
            <article><Icon name="chart"/><h3>Resultado auditável</h3><p>Atendimento, conversão, negócio e recompensa ficam conciliados na mesma operação.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.heading}><span>TRÊS JORNADAS</span><h2>Cada participante recebe apenas <em>a próxima ação relevante.</em></h2></div>
          <div className={styles.audienceGrid}>{audiences.map(([title,text,href,icon]) => <Link href={href} key={title}><span><Icon name={icon}/></span><small>PARA</small><h3>{title}</h3><p>{text}</p><b>Conhecer jornada <Icon name="arrow" size={17}/></b></Link>)}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.softSection}`} id="plataforma">
        <div className={styles.container}>
          <div className={styles.platformGrid}>
            <div className={styles.platformCopy}><span>REDE CONECTA</span><h2>O sistema operacional da <em>confiança comercial.</em></h2><p>Da apresentação inicial à distribuição humana, cada etapa tem regras, evidências e responsabilidade definida.</p><Link href="/entrar">Acessar plataforma <Icon name="arrow"/></Link></div>
            <div className={styles.platformCards}>{platform.map(([title,text],index) => <article key={title}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{title} Center</h3><p>{text}</p></div></article>)}</div>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div><span>VOCÊ NÃO PRECISA VENDER</span><h2>Você apresenta a pessoa certa. A Rede Conecta conduz todo o restante.</h2><p>Crie seu perfil, escolha os mercados em que possui credibilidade e apresente oportunidades com origem protegida.</p><div className={styles.ctas}><Link href="/cadastro">Começar como conector <Icon name="arrow"/></Link><Link href="/empreendedores">Integrar minha empresa</Link></div></div>
      </section>
    </main>

    <footer className={styles.footer}><div><NetworkMark inverse/><p>Confiança convertida em oportunidades qualificadas e negócios rastreáveis.</p></div><div><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link><Link href="/entrar">Acessar</Link></div><small>© 2026 Rede Conecta</small></footer>
  </div>;
}
