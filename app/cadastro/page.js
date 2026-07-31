import { Footer, Header, Icon, NetworkMark } from "@/components/UI";
import ApplicationForm from "./ApplicationForm";
import styles from "./cadastro.module.css";

export const metadata = {
  title: "Quero ser conector",
  description: "Escolha os mercados em que deseja atuar e crie seu perfil comercial na Rede Conecta."
};

export default function ApplicationPage() {
  return <div className={styles.page}>
    <div className={styles.desktopOnly}><Header/></div>
    <div className={styles.mobileBrand}><NetworkMark/></div>
    <main>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <span className={styles.eyebrow}>Faça parte da Rede Conecta</span>
            <h1>Suas conexões podem virar <em>negócios e recompensas.</em></h1>
            <p>Escolha os mercados em que você possui relacionamento. A Rede Conecta encontra oportunidades compatíveis, conduz o atendimento e preserva a origem de cada conexão.</p>
          </div>
          <aside className={styles.heroCard}>
            <strong>Você conecta. A Rede Conecta faz o restante.</strong>
            <p>Uma única conta para descobrir, compartilhar e acompanhar oportunidades em diferentes mercados.</p>
            <div className={styles.flow}>
              <span><i>1</i>Escolha seus segmentos</span>
              <span><i>2</i>Receba campanhas alinhadas</span>
              <span><i>3</i>Compartilhe links rastreáveis</span>
              <span><i>4</i>Acompanhe os resultados</span>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`container ${styles.layout}`}>
          <aside className={styles.aside}>
            <article className={styles.asideCard}><Icon name="target"/><b>Oportunidades sob medida</b><p>Seu perfil ajuda a plataforma a recomendar campanhas compatíveis com seus mercados e sua região.</p></article>
            <article className={styles.asideCard}><Icon name="link"/><b>Compartilhamento rastreável</b><p>Cada link identifica a campanha, o canal e a origem da conexão, inclusive nas redes sociais.</p></article>
            <article className={styles.asideCard}><Icon name="headset"/><b>Operação centralizada</b><p>Você aproxima as pessoas. A equipe da Rede Conecta atende, qualifica e conduz o negócio.</p></article>
            <article className={styles.asideCard}><Icon name="shield"/><b>Validação e segurança</b><p>Todos os perfis passam por análise antes de acessar produtos, campanhas e recompensas.</p></article>
          </aside>
          <ApplicationForm/>
        </div>
      </section>
    </main>
    <Footer/>
  </div>;
}
