import Link from "next/link";
import { Footer, Header, Icon, ProductCard } from "@/components/UI";
import { fallbackProducts } from "@/lib/config";
import { rpc } from "@/lib/supabase";

async function getProducts() {
  try { const data = await rpc("list_public_products"); return Array.isArray(data) && data.length ? data : fallbackProducts; }
  catch { return fallbackProducts; }
}

const audiences = [
  ["conectores", "user", "Para conectores", "Conhece alguém que pode comprar, investir ou construir? Faça a conexão. Nós cuidamos do atendimento.", "Suas conexões podem virar negócios e recompensas."],
  ["empreendedores", "building", "Para empreendedores", "Amplie sua rede comercial sem perder a origem dos leads, o controle da operação ou a visão dos resultados.", "Transforme relacionamento em vendas rastreáveis."],
  ["corretores", "handshake", "Para corretores", "Atue com portfólio, campanhas e informações organizadas dentro de uma operação comercial com método.", "Mais oportunidades. Menos improviso."],
];

export default async function HomePage() {
  const products = await getProducts();
  return <><Header/><main>
    <section className="hero hero--commercial"><div className="container hero__grid"><div className="hero__copy"><span className="eyebrow">Infraestrutura comercial para o mercado imobiliário</span><h1>Relacionamentos podem gerar vendas. <em>A Rede Conecta organiza todo o caminho.</em></h1><p>Conectores originam oportunidades. A Rede Conecta atende, qualifica e conduz o processo. Empreendedores e corretores acompanham o que importa. A origem do negócio permanece registrada.</p><div className="button-row"><Link href="/conectores" className="button button--orange">Quero fazer uma conexão <Icon name="arrow"/></Link><Link href="/empreendedores" className="button button--navy">Quero gerar mais vendas</Link></div><div className="hero__trust"><span><Icon name="shield" size={18}/> Origem preservada</span><span><Icon name="headset" size={18}/> Operação centralizada</span><span><Icon name="chart" size={18}/> Resultado acompanhado</span></div></div><div className="hero__visual hero__visual--commercial"><div className="hero__badge"><b>O que é a Rede Conecta?</b><span>A infraestrutura que transforma relacionamento em oportunidade imobiliária rastreável — da indicação ao resultado.</span></div></div></div></section>

    <section className="commercial-definition"><div className="container"><span>EM UMA FRASE</span><strong>A Rede Conecta é um canal comercial estruturado que une pessoas, produtos imobiliários e operação de vendas em uma única plataforma.</strong></div></section>

    <section className="section"><div className="container"><div className="section-heading section-heading--split"><div><span className="eyebrow">Três públicos. Um só processo.</span><h2>Cada pessoa entende rapidamente <em>o que ganha.</em></h2></div><p>A plataforma oferece jornadas diferentes para quem indica, para quem vende e para quem oferece o produto.</p></div><div className="audience-grid">{audiences.map(([slug,icon,title,text,promise])=><Link key={slug} href={`/${slug}`} className="audience-card"><div className="icon-box"><Icon name={icon}/></div><small>{title}</small><h3>{promise}</h3><p>{text}</p><span>Conhecer esta jornada <Icon name="arrow" size={18}/></span></Link>)}</div></div></section>

    <section className="section section--soft" id="como-funciona"><div className="container"><div className="section-heading"><span className="eyebrow">Do contato ao contrato</span><h2>Uma jornada comercial <em>simples, rápida e rastreável.</em></h2></div><div className="commercial-timeline"><article><span>01</span><h3>A oportunidade é compartilhada</h3><p>O conector escolhe um produto e envia um link oficial com mensagem personalizada.</p></article><article><span>02</span><h3>O interessado autoriza</h3><p>A pessoa conhece a oportunidade e decide se deseja receber atendimento.</p></article><article><span>03</span><h3>A Rede Conecta opera</h3><p>Qualificação, follow-up, agenda, proposta e evolução ficam sob condução central.</p></article><article><span>04</span><h3>Todos acompanham</h3><p>Cada perfil visualiza o que lhe interessa, sem perder governança ou proteção da origem.</p></article></div></div></section>

    <section className="section section--navy"><div className="container"><div className="section-heading section-heading--inverse section-heading--split"><div><span className="eyebrow">Oportunidades reais</span><h2>Produtos preparados para <em>gerar ação.</em></h2></div><Link href="/oportunidades" className="button button--white">Ver todas as oportunidades</Link></div><div className="product-grid">{products.slice(0,3).map((product,index)=><ProductCard key={product.product_slug} product={product} featured={index===0}/>)}</div></div></section>

    <section className="section"><div className="container callout commercial-callout"><div><span className="eyebrow">A próxima venda pode começar por uma conexão</span><h2>Escolha como deseja participar da <em>Rede Conecta.</em></h2><p>Indique oportunidades, integre seu empreendimento ou atue dentro de uma operação comercial mais organizada.</p></div><div className="button-row"><Link href="/conectores" className="button button--orange">Sou conector</Link><Link href="/empreendedores" className="button button--navy">Sou empreendedor</Link></div></div></section>
  </main><Footer/></>;
}
