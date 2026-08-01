import Link from "next/link";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./home-v2.module.css";

const journey = [
  ["01", "Oportunidade confiável", "A empresa publica um produto, uma campanha e uma regra econômica clara."],
  ["02", "Pessoa certa", "A plataforma recomenda a oportunidade a conectores com maior afinidade de mercado e região."],
  ["03", "Confiança abre a porta", "O conector compartilha porque conhece a pessoa e acredita que a oportunidade pode fazer sentido."],
  ["04", "A Conecta opera", "Autorização, qualificação, atendimento, agenda, proposta e acompanhamento ficam centralizados."],
  ["05", "Receita e recompensa", "Negócio validado: a empresa vende, a Rede Conecta monetiza e o conector recebe conforme a campanha."]
];

const audiences = [
  ["Conector", "Use sua reputação para criar oportunidades sem precisar vender.", "/conectores", "user"],
  ["Empresa", "Ative uma rede comercial distribuída com origem rastreável e operação central.", "/empreendedores", "building"],
  ["Corretor", "Trabalhe com portfólio, prioridade e informação organizada.", "/corretores", "handshake"]
];

const platform = [
  ["Connect", "DNA Comercial, validação e reputação."],
  ["Match", "Afinidade entre pessoas, mercados e oportunidades."],
  ["Operate", "CRM, atendimento, agenda, proposta e negócio."],
  ["Intelligence", "TrustScore, radar, recomendações e prioridades."],
  ["Growth", "Campanhas, links, redes sociais e conversão."],
  ["Capital", "Recompensas, ROI, VGV e conciliação."]
];

export const metadata = {
  title: "Rede Conecta · Transforme confiança em receita",
  description: "Use a sua confiança e credibilidade para ganhar dinheiro conectando pessoas a oportunidades reais, com atendimento e rastreamento pela Rede Conecta."
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
            <span className={styles.kicker}>REDE DE INTELIGÊNCIA COMERCIAL DISTRIBUÍDA</span>
            <h1>Use a sua confiança e credibilidade para <em>ganhar dinheiro.</em></h1>
            <p>Você apresenta pessoas a oportunidades reais. A Rede Conecta qualifica, atende e conduz o negócio. A origem fica registrada e, quando a campanha prevê recompensa e o negócio é validado, você recebe.</p>
            <div className={styles.ctas}><Link href="/cadastro">Criar meu perfil de conector <Icon name="arrow"/></Link><Link href="/empreendedores">Quero vender pela rede</Link></div>
            <div className={styles.proof}><span><Icon name="shield"/>Origem protegida</span><span><Icon name="headset"/>Operação profissional</span><span><Icon name="money"/>Regras transparentes</span></div>
          </div>

          <div className={styles.heroProduct}>
            <div className={styles.productTop}><span>INTELIGÊNCIA CONECTA</span><b>Ao vivo</b></div>
            <div className={styles.matchCard}>
              <div><small>Melhor oportunidade para seu perfil</small><h2>Solaris Residencial</h2><p>Imóveis · famílias · empresários · região de influência</p></div>
              <strong>94%<small>afinidade</small></strong>
            </div>
            <div className={styles.signalGrid}>
              <article><Icon name="user"/><span><small>DNA comercial</small><b>Imóveis + Agro</b></span></article>
              <article><Icon name="shield"/><span><small>TrustScore</small><b>Em evolução</b></span></article>
              <article><Icon name="target"/><span><small>Próxima ação</small><b>Compartilhar</b></span></article>
              <article><Icon name="money"/><span><small>Resultado</small><b>Rastreável</b></span></article>
            </div>
            <div className={styles.aiPrompt}><span>Copiloto</span><p>“Lembrei de você porque este produto combina com o momento que comentou comigo.”</p><button>Preparar abordagem <Icon name="arrow" size={17}/></button></div>
          </div>
        </div>
      </section>

      <section className={styles.definition}>
        <div><span>EM UMA FRASE</span><strong>A Rede Conecta descobre quem tem a confiança certa para abrir a porta de um negócio e organiza todo o caminho até o resultado.</strong></div>
      </section>

      <section className={styles.section} id="como-funciona">
        <div className={styles.container}>
          <div className={styles.heading}><span>COMO O DINHEIRO ACONTECE</span><h2>Confiança só vira receita quando existe <em>processo.</em></h2><p>A tecnologia não remunera um simples envio de link. Ela registra e coordena um ciclo comercial completo.</p></div>
          <div className={styles.journey}>{journey.map(([number,title,text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`}>
        <div className={styles.container}>
          <div className={styles.headingDark}><span>UM NOVO CANAL DE DISTRIBUIÇÃO</span><h2>Não é pirâmide. Não é disparo em massa. Não é venda improvisada.</h2><p>É uma infraestrutura que combina produto confiável, recomendação pessoal, consentimento, operação comercial e rastreabilidade.</p></div>
          <div className={styles.principles}>
            <article><Icon name="shield"/><h3>Qualidade antes de volume</h3><p>Produtos, campanhas e conectores passam por validação.</p></article>
            <article><Icon name="link"/><h3>Origem reconhecida</h3><p>Cada compartilhamento possui trilha própria até o negócio.</p></article>
            <article><Icon name="headset"/><h3>Atendimento central</h3><p>O conector não precisa negociar nem receber documentos.</p></article>
            <article><Icon name="chart"/><h3>Resultado mensurável</h3><p>Empresas acompanham funil, ROI, negócios e VGV.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.heading}><span>TRÊS JORNADAS</span><h2>Cada participante entende claramente <em>o que ganha.</em></h2></div>
          <div className={styles.audienceGrid}>{audiences.map(([title,text,href,icon]) => <Link href={href} key={title}><span><Icon name={icon}/></span><small>PARA</small><h3>{title}</h3><p>{text}</p><b>Conhecer jornada <Icon name="arrow" size={17}/></b></Link>)}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.softSection}`} id="plataforma">
        <div className={styles.container}>
          <div className={styles.platformGrid}>
            <div className={styles.platformCopy}><span>REDE CONECTA 2.0</span><h2>Um sistema operacional para a <em>confiança comercial.</em></h2><p>O software organiza a rede em centros especializados, mas apresenta a cada pessoa apenas a próxima ação relevante.</p><Link href="/entrar">Acessar plataforma <Icon name="arrow"/></Link></div>
            <div className={styles.platformCards}>{platform.map(([title,text],index) => <article key={title}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{title} Center</h3><p>{text}</p></div></article>)}</div>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div><span>SEU RELACIONAMENTO JÁ TEM VALOR</span><h2>Agora ele pode ter infraestrutura, inteligência e resultado.</h2><p>Crie seu perfil, escolha os mercados em que possui credibilidade e descubra oportunidades compatíveis com a sua rede.</p><div className={styles.ctas}><Link href="/cadastro">Começar como conector <Icon name="arrow"/></Link><Link href="/empreendedores">Integrar minha empresa</Link></div></div>
      </section>
    </main>

    <footer className={styles.footer}><div><NetworkMark inverse/><p>Transformamos confiança em oportunidades rastreáveis.</p></div><div><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link><Link href="/entrar">Acessar</Link></div><small>© 2026 Rede Conecta</small></footer>
  </div>;
}
