import Link from "next/link";
import { Footer, Header, Icon, ProductCard } from "@/components/UI";
import { fallbackProducts } from "@/lib/config";
import { rpc } from "@/lib/supabase";

async function getProducts() {
  try { const data = await rpc("list_public_products"); return Array.isArray(data) && data.length ? data : fallbackProducts; }
  catch { return fallbackProducts; }
}

const benefits = [
  ["handshake", "Mais negócios para você", "Compartilhe produtos selecionados e amplie o alcance das oportunidades."],
  ["target", "Especialistas qualificados", "A equipe interna assume o atendimento, a qualificação e a negociação."],
  ["shield", "Segurança no processo", "Consentimento, atribuição, status e histórico registrados na plataforma."],
  ["money", "Ganhos por indicação", "Recompensas vinculadas às regras vigentes de cada campanha."],
  ["chart", "Acompanhamento", "Visualize o andamento das conexões sem expor dados privados do comprador."],
  ["home", "Produtos de qualidade", "Empreendimentos e oportunidades publicados por empresas parceiras."]
];

export default async function HomePage() {
  const products = await getProducts();
  return <><Header/><main>
    <section className="hero"><div className="container hero__grid"><div className="hero__copy"><span className="eyebrow">Rede de oportunidades imobiliárias</span><h1>Conecte pessoas às <em>oportunidades certas</em> no mercado imobiliário.</h1><p>A Rede Conecta une quem conhece bons contatos a produtos específicos. Você compartilha o link, nossa equipe atende e a plataforma preserva a origem de cada negócio.</p><div className="button-row"><Link href="/cadastro" className="button button--navy"><Icon name="link"/> Quero fazer parte</Link><Link href="/convite/SOLARIS-FRANCO-2026" className="button button--light">Ver convite real</Link></div><div className="hero__trust"><span><Icon name="shield" size={18}/> Consentimento registrado</span><span><Icon name="chart" size={18}/> Acompanhamento transparente</span></div></div><div className="hero__visual"><div className="hero__badge"><b>Produto primeiro</b><span>O conectado chega por uma oportunidade específica.</span></div></div></div></section>

    <section className="section section--soft" id="como-funciona"><div className="container"><div className="section-heading section-heading--split"><div><span className="eyebrow">Jornada comercial correta</span><h2>A conexão começa por um <em>produto específico.</em></h2></div><p>Somente quando o produto de origem não fizer sentido, o especialista solicita autorização para investigar outras necessidades — sem apagar quem criou a conexão.</p></div>
      <div className="steps"><article><span>01</span><Icon name="link"/><h3>Você indica</h3><p>Escolhe o produto e compartilha um link individualizado com quem conhece.</p></article><b className="steps__arrow">→</b><article><span>02</span><Icon name="headset"/><h3>Nós atendemos</h3><p>O conectado autoriza o contato e recebe atendimento sobre aquele produto.</p></article><b className="steps__arrow">→</b><article><span>03</span><Icon name="handshake"/><h3>Negócio fechado</h3><p>A origem, a campanha e a recompensa permanecem registradas até a conclusão.</p></article></div>
    </div></section>

    <section className="section"><div className="container"><div className="section-heading"><span className="eyebrow">Por que participar</span><h2>Vantagens de fazer parte da <em>Rede Conecta</em></h2></div><div className="benefits">{benefits.map(([icon,title,text]) => <article key={title}><div className="icon-box"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="section section--navy"><div className="container"><div className="section-heading section-heading--inverse section-heading--split"><div><span className="eyebrow">Oportunidades ativas</span><h2>Produtos prontos para <em>compartilhar.</em></h2></div><Link href="/oportunidades" className="button button--white">Ver catálogo completo</Link></div><div className="product-grid">{products.slice(0,3).map((product,index) => <ProductCard key={product.product_slug} product={product} featured={index===0}/>)}</div></div></section>

    <section className="section"><div className="container callout"><div><span className="eyebrow">Conexões com método</span><h2>Suas conexões podem virar <em>negócios e recompensas.</em></h2><p>Cadastre-se, conheça as campanhas disponíveis e use os materiais oficiais para compartilhar cada produto.</p></div><Link href="/cadastro" className="button button--orange">Cadastre-se agora <Icon name="arrow"/></Link></div></section>
  </main><Footer/></>;
}
