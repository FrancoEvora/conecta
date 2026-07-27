import Link from "next/link";

const INVITATION_CODES = { solaris: "SOLARIS-FRANCO-2026", "parque-comercial": "PARQUE-FRANCO-2026", "futura-casa": "FUTURA-FRANCO-2026" };

export function NetworkMark({ inverse = false, compact = false }) {
  const gradient = inverse ? "nodeInv" : "node";
  return <Link href="/" className={`brand ${inverse ? "brand--inverse" : ""}`} aria-label="Rede Conecta"><svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id={gradient}><stop offset="0" stopColor="#ffb14a"/><stop offset="1" stopColor="#f45a00"/></radialGradient></defs><g stroke="#f45a00" strokeWidth="4" strokeLinecap="round"><path d="M32 32V11M32 32L12 22M32 32L52 22M32 32L17 49M32 32L47 49"/></g><g fill={`url(#${gradient})`}><circle cx="32" cy="32" r="13"/><circle cx="32" cy="8" r="6"/><circle cx="9" cy="20" r="6"/><circle cx="55" cy="20" r="6"/><circle cx="14" cy="52" r="6"/><circle cx="50" cy="52" r="6"/></g></svg>{!compact && <span className="brand__copy"><strong><span>REDE</span> CONECTA</strong><small>Conectando <b>Pessoas</b> e Negócios</small></span>}</Link>;
}

export function Icon({ name, size = 24 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19c0 1.1-.9 2-2 2h-3"/><rect x="3" y="13" width="4" height="6" rx="2"/><rect x="17" y="13" width="4" height="6" rx="2"/></>,
    handshake: <><path d="M8 12l2-2a2.8 2.8 0 0 1 4 0l2 2"/><path d="M3 9l4-4 4 3M21 9l-4-4-3 3"/><path d="M6 12l5 5a2 2 0 0 0 3 0l4-4"/></>,
    shield: <><path d="M12 3l8 4v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V7l8-4z"/><path d="M9 12l2 2 4-4"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="M3 8l6-5 5 4 7-5"/></>,
    money: <><circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.9-.7-2-1-3.3-1-1.8 0-3 .8-3 2s1.1 1.8 3.2 2.3c2.2.5 3.4 1.2 3.4 2.7 0 1.4-1.4 2.5-3.6 2.5-1.5 0-2.8-.4-3.8-1.2M12 5v14"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    building: <><path d="M4 21V5l8-3v19M12 8h8v13M2 21h20"/><path d="M7 7h2M7 11h2M7 15h2M15 11h2M15 15h2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="M16 8l5-5M18 3h3v3"/></>,
    home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>,
    arrow: <path d="M5 12h14M14 7l5 5-5 5"/>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>
  };
  return <svg {...common}>{paths[name] || paths.check}</svg>;
}

export function Header({ minimal = false }) {
  return <header className="site-header"><div className="container header__inner"><NetworkMark/>{!minimal && <nav className="header__nav" aria-label="Principal"><Link href="/">Início</Link><Link href="/#como-funciona">Como funciona</Link><Link href="/oportunidades">Oportunidades</Link><Link href="/entrar">Plataforma</Link></nav>}<div className="header__actions"><Link href="/entrar" className="text-link">Entrar</Link><Link href="/cadastro" className="button button--orange">Quero ser conector</Link></div></div></header>;
}

export function Footer() {
  return <footer className="footer"><div className="container footer__grid"><div><NetworkMark inverse/><p>Conectamos pessoas a produtos específicos, preservamos a origem e conduzimos a operação com controle e transparência.</p></div><div><strong>Plataforma</strong><Link href="/#como-funciona">Como funciona</Link><Link href="/oportunidades">Oportunidades</Link><Link href="/entrar">Acessar painel</Link></div><div><strong>Governança</strong><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos de uso</Link><Link href="/termos-conector">Termos do conector</Link><Link href="/termos-parceiros">Termos dos parceiros</Link></div><div><strong>Rede Conecta</strong><Link href="/cadastro">Quero ser conector</Link><Link href="/entrar">Acessar plataforma</Link><span>Operação centralizada · origem preservada</span></div></div><div className="container footer__bottom"><span>© 2026 Rede Conecta.</span><span>Conectando Pessoas e Negócios.</span></div></footer>;
}

export function ProductCard({ product, featured = false }) {
  const meta = product.product_metadata || {};
  const invitationCode = product.invitation_code || INVITATION_CODES[product.product_slug];
  const productHref = invitationCode ? `/convite/${encodeURIComponent(invitationCode)}` : "/cadastro";
  return <article className={`product-card ${featured ? "product-card--featured" : ""}`}><div className="product-card__image" style={{ backgroundImage: `linear-gradient(180deg,transparent 45%,rgba(7,28,58,.74)),url('${meta.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82"}')` }}><span>{product.product_category}</span></div><div className="product-card__body"><small>{product.campaign_location || meta.location}</small><h3>{product.product_name}</h3><p>{product.product_description}</p><ul>{(meta.features || []).slice(0,3).map(item => <li key={item}><Icon name="check" size={16}/>{item}</li>)}</ul><div className="product-card__footer"><span><b>{meta.area_from || "Oportunidade selecionada"}</b><small>{meta.payment || "Condições sob consulta"}</small></span><Link className="button button--navy" href={productHref}>Conhecer <Icon name="arrow" size={18}/></Link></div></div></article>;
}
