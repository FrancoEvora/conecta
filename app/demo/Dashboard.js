"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ShareComposer from "@/components/ShareComposer";
import { Icon, NetworkMark } from "@/components/UI";

const leads = [
  { name: "Mariana Lima", product: "Solaris Residencial Resort", stage: "Contato", origin: "João Silva", tag: "WhatsApp", time: "Hoje · 18h" },
  { name: "Carlos Souza", product: "Solaris Residencial Resort", stage: "Novo", origin: "Franco", tag: "Indicação", time: "Hoje · 16h" },
  { name: "Beatriz Nunes", product: "Parque das Árvores", stage: "Qualificado", origin: "Ana Martins", tag: "Link", time: "Amanhã · 9h" },
  { name: "Patrícia Gomes", product: "Futura Casa · Lote + Projeto", stage: "Visita", origin: "Rafael", tag: "WhatsApp", time: "27 jul · 10h" },
  { name: "Renato Lima", product: "Solaris Residencial Resort", stage: "Proposta", origin: "Juliana", tag: "Link", time: "30 jul · 14h" },
  { name: "Vinícius Castro", product: "Solaris Residencial Resort", stage: "Fechado", origin: "Franco", tag: "Ganho", time: "Concluído" }
];

const shareProducts = [
  {
    code: "SOLARIS-FRANCO-2026",
    product_name: "Solaris Residencial Resort",
    product_category: "Residencial Resort",
    product_description: "Lotes residenciais a partir de 360 m², com infraestrutura planejada, lazer e integração à natureza.",
    product_service_region: "Monte Carmelo e região",
    campaign_location: "Monte Carmelo · MG",
    campaign_summary: "Conheça o Solaris Residencial Resort: lotes amplos, natureza, lazer e condições facilitadas.",
    connector_display_name: "Franco",
    product_metadata: {
      area_from: "360 m²",
      payment: "Condições facilitadas",
      lifestyle: "Lazer e natureza"
    },
    clicks: 823,
    authorizations: 124
  },
  {
    code: "PARQUE-FRANCO-2026",
    product_name: "Parque das Árvores · Áreas Comerciais",
    product_category: "Áreas comerciais",
    product_description: "Áreas estratégicas para varejo, serviços, saúde, hotelaria e operações regionais.",
    product_service_region: "MG-190 · Monte Carmelo",
    campaign_location: "MG-190 · Monte Carmelo",
    campaign_summary: "Oportunidades comerciais em bairro planejado, com localização estratégica e áreas moduláveis.",
    connector_display_name: "Franco",
    product_metadata: {
      area_from: "1.500 m²",
      payment: "Condições empresariais",
      lifestyle: "Fluxo e centralidade"
    },
    clicks: 542,
    authorizations: 86
  },
  {
    code: "FUTURA-FRANCO-2026",
    product_name: "Futura Casa · Lote + Projeto",
    product_category: "Casa e lote",
    product_description: "Solução integrada para escolha do lote, diagnóstico da família e planejamento da casa.",
    product_service_region: "Monte Carmelo e região",
    campaign_location: "Monte Carmelo · MG",
    campaign_summary: "Do lote ao projeto da casa, em uma jornada orientada e personalizada.",
    connector_display_name: "Franco",
    product_metadata: {
      area_from: "Projeto personalizado",
      payment: "Simulação integrada",
      lifestyle: "Casa pensada para a família"
    },
    clicks: 321,
    authorizations: 54
  }
];

const stages = ["Novo", "Contato", "Qualificado", "Visita", "Proposta", "Fechado"];
const roles = {
  conector: "Painel do Conector",
  comercial: "CRM Comercial",
  empresa: "Gestão da Empresa",
  admin: "Administração da Rede"
};

function Metric({ icon, label, value, note }) {
  return <article className="metric"><div className="icon-box"><Icon name={icon}/></div><span>{label}<b>{value}</b><small>{note}</small></span></article>;
}

function Connector() {
  const [shareProduct, setShareProduct] = useState(null);

  return <>
    <div className="metrics">
      <Metric icon="link" label="Indicações ativas" value="32" note="+12% no mês"/>
      <Metric icon="clock" label="Aguardando autorização" value="14" note="Convites enviados"/>
      <Metric icon="check" label="Negócios concluídos" value="9" note="Origem preservada"/>
      <Metric icon="money" label="Recompensas aprovadas" value="R$ 12.000" note="Extrato auditável"/>
    </div>

    <div className="dashboard-grid">
      <section className="dash-card" style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg,#fff8f1,#fff)", borderColor: "#f0d8c3" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 740 }}>
            <span className="eyebrow">Novo · compartilhamento funcional</span>
            <h2 style={{ margin: "0 0 8px", color: "#071c3a", fontSize: "1.5rem" }}>Escreva sua mensagem e envie um link com prévia oficial.</h2>
            <p style={{ margin: 0, color: "#647188", fontSize: ".82rem" }}>A assinatura de origem e segurança é acrescentada automaticamente. O WhatsApp recebe a mensagem, o link e a pré-visualização do produto.</p>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button className="button button--orange" onClick={() => setShareProduct(shareProducts[0])}><Icon name="link" size={18}/> Preparar envio</button>
            <Link className="button button--light" href="/compartilhar/SOLARIS-FRANCO-2026">Abrir em tela cheia</Link>
          </div>
        </div>
      </section>

      <section className="dash-card dash-card--wide">
        <div className="dash-card__head"><h2>Desempenho dos links</h2><span>Últimos 30 dias</span></div>
        <div className="chart">
          <div className="chart__axis"><span>1.000</span><span>750</span><span>500</span><span>250</span><span>0</span></div>
          <svg viewBox="0 0 800 240" preserveAspectRatio="none">
            <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6500" stopOpacity=".24"/><stop offset="1" stopColor="#ff6500" stopOpacity="0"/></linearGradient></defs>
            <path className="chart__area" d="M0 215 L100 190 L200 166 L300 145 L400 123 L500 96 L600 80 L700 48 L800 34 L800 240 L0 240Z"/>
            <polyline points="0,215 100,190 200,166 300,145 400,123 500,96 600,80 700,48 800,34"/>
            <polyline className="chart__line--orange" points="0,228 100,212 200,197 300,183 400,170 500,148 600,153 700,127 800,109"/>
          </svg>
        </div>
      </section>

      <section className="dash-card">
        <div className="dash-card__head"><h2>Links de produtos</h2></div>
        {shareProducts.map(product => <div className="link-row" key={product.code}>
          <span><b>{product.product_name}</b><small>{product.clicks} cliques · {product.authorizations} autorizações</small></span>
          <button type="button" onClick={() => setShareProduct(product)}>Personalizar</button>
        </div>)}
      </section>

      <section className="dash-card dash-card--wide">
        <div className="dash-card__head"><h2>Minhas indicações</h2></div>
        <div className="table">{leads.slice(0, 5).map((lead, index) => <div className="table__row" key={lead.name}>
          <span className="avatar">{lead.name.split(" ").map(name => name[0]).join("")}</span>
          <span><b>{lead.name}</b><small>{lead.product}</small></span>
          <span className="status">{["Aguardando autorização", "Em atendimento", "Qualificado", "Visita agendada", "Proposta"][index]}</span>
          <span>{lead.time}</span>
        </div>)}</div>
      </section>

      <section className="dash-card">
        <div className="dash-card__head"><h2>Extrato de recompensas</h2></div>
        {["R$ 4.000", "R$ 2.500", "R$ 3.000", "R$ 1.500"].map((value, index) => <div className="reward-row" key={`${value}-${index}`}>
          <span><b>{value}</b><small>{["Solaris", "Parque das Árvores", "Futura Casa", "Solaris"][index]}</small></span>
          <span className="status status--green">{index === 2 ? "Em análise" : "Aprovado"}</span>
        </div>)}
      </section>
    </div>

    {shareProduct && <ShareComposer invitation={shareProduct} code={shareProduct.code} modal onClose={() => setShareProduct(null)}/>}
  </>;
}

function Commercial() {
  const [selected, setSelected] = useState(leads[1]);
  return <>
    <div className="metrics">
      <Metric icon="user" label="Novos leads" value="32" note="+18% na semana"/>
      <Metric icon="clock" label="SLA médio" value="2h 45m" note="Meta: até 3h"/>
      <Metric icon="calendar" label="Visitas agendadas" value="12" note="Próximos 7 dias"/>
      <Metric icon="target" label="Conversão" value="18,5%" note="+3,2 p.p."/>
    </div>
    <div className="kanban-layout">
      <section className="kanban">{stages.map(stage => <div className="kanban__column" key={stage}>
        <header><span>{stage}</span><b>{leads.filter(lead => lead.stage === stage).length}</b></header>
        {leads.filter(lead => lead.stage === stage).map(lead => <button key={lead.name} className={`lead-card ${selected.name === lead.name ? "is-selected" : ""}`} onClick={() => setSelected(lead)}>
          <b>{lead.name}</b><span>{lead.product}</span><small>{lead.tag}</small>
        </button>)}
        <button className="kanban__more">+ Ver mais</button>
      </div>)}</section>
      <aside className="lead-panel">
        <div className="lead-panel__head"><span className="avatar">{selected.name.split(" ").map(name => name[0]).join("")}</span><span><b>{selected.name}</b><small>Lead em atendimento</small></span></div>
        <dl><dt>Produto de origem</dt><dd>{selected.product}</dd><dt>Conector</dt><dd>{selected.origin}</dd><dt>Melhor horário</dt><dd>{selected.time}</dd><dt>Próxima ação</dt><dd>Ligar e qualificar o interesse</dd></dl>
        <div className="origin-lock"><Icon name="shield"/><span><b>Origem protegida</b>O produto e o conector não podem ser substituídos pelo corretor.</span></div>
        <button className="button button--orange button--block">Registrar contato</button>
      </aside>
    </div>
  </>;
}

function Company() {
  return <>
    <div className="metrics">
      <Metric icon="user" label="Conectores ativos" value="184" note="37 ativos no mês"/>
      <Metric icon="link" label="Conexões válidas" value="286" note="67% autorizadas"/>
      <Metric icon="handshake" label="Negócios" value="21" note="R$ 8,4 mi de VGV"/>
      <Metric icon="money" label="Passivo previsto" value="R$ 73.500" note="Por status de venda"/>
    </div>
    <div className="dashboard-grid">
      <section className="dash-card dash-card--wide"><div className="dash-card__head"><h2>Funil por produto de origem</h2><span>Julho de 2026</span></div>
        {[["Solaris", 168, 92, 34, 12], ["Parque das Árvores", 74, 42, 18, 6], ["Futura Casa", 44, 25, 11, 3]].map(row => <div className="funnel-row" key={row[0]}><b>{row[0]}</b>{row.slice(1).map((value, index) => <span key={index}><small>{["Conexões", "Atendidas", "Propostas", "Negócios"][index]}</small><strong>{value}</strong><i style={{ width: `${Math.max(18, value / 1.7)}%` }}/></span>)}</div>)}
      </section>
      <section className="dash-card"><div className="dash-card__head"><h2>Saúde das campanhas</h2></div>{[["Solaris", "Ativa", "R$ 3.500"], ["Parque Comercial", "Ativa", "R$ 5.000"], ["Futura Casa", "Ativa", "R$ 2.500"]].map(row => <div className="reward-row" key={row[0]}><span><b>{row[0]}</b><small>Recompensa {row[2]}</small></span><span className="status status--green">{row[1]}</span></div>)}</section>
      <section className="dash-card dash-card--wide"><div className="dash-card__head"><h2>Indicadores operacionais</h2></div><div className="benefits benefits--dash"><article><h3>22 min</h3><p>Tempo até a distribuição</p></article><article><h3>2h 45m</h3><p>Primeiro contato médio</p></article><article><h3>31%</h3><p>Autorizam alternativas</p></article><article><h3>14%</h3><p>Conversão cruzada</p></article></div></section>
    </div>
  </>;
}

function Admin() {
  return <>
    <div className="metrics">
      <Metric icon="building" label="Empresas" value="4" note="1 em implantação"/>
      <Metric icon="user" label="Usuários" value="247" note="Perfis e permissões"/>
      <Metric icon="shield" label="Integridade" value="98,7%" note="RLS e auditoria"/>
      <Metric icon="money" label="Recompensas" value="R$ 186 mil" note="Ciclo acumulado"/>
    </div>
    <div className="dashboard-grid">
      <section className="dash-card dash-card--wide"><div className="dash-card__head"><h2>Governança da plataforma</h2></div><div className="governance-grid">{[["RLS multiempresa", "Ativa"], ["Consentimentos", "Versionados"], ["Regras de recompensa", "Imutáveis"], ["Auditoria", "Registrada"], ["Backups", "Supabase"], ["Deploy", "Vercel"]].map(row => <article key={row[0]}><Icon name="shield"/><span><b>{row[0]}</b><small>{row[1]}</small></span></article>)}</div></section>
      <section className="dash-card"><div className="dash-card__head"><h2>Fila de análise</h2></div>{[["Cadastros de conector", "12"], ["Credenciais CRECI", "3"], ["Recompensas", "7"], ["Contestações", "1"]].map(row => <div className="link-row" key={row[0]}><span><b>{row[0]}</b><small>Revisão administrativa</small></span><strong>{row[1]}</strong></div>)}</section>
      <section className="dash-card dash-card--wide"><div className="dash-card__head"><h2>Eventos recentes</h2></div><div className="table">{["campaign.published", "connection.created", "lead.assigned", "reward.approved", "payout.scheduled"].map((event, index) => <div className="table__row" key={event}><span className="avatar"><Icon name="check" size={16}/></span><span><b>{event}</b><small>Organização Conecta Futura Casa</small></span><span>há {index + 1} min</span><span className="status status--green">Registrado</span></div>)}</div></section>
    </div>
  </>;
}

export default function Dashboard({ initialRole }) {
  const [role, setRole] = useState(roles[initialRole] ? initialRole : "conector");
  const View = useMemo(() => ({ conector: Connector, comercial: Commercial, empresa: Company, admin: Admin })[role], [role]);

  return <main className="demo">
    <aside className="demo-sidebar">
      <NetworkMark inverse/>
      <nav>{Object.entries(roles).map(([key, label]) => <button className={role === key ? "is-active" : ""} onClick={() => setRole(key)} key={key}><Icon name={key === "conector" ? "link" : key === "comercial" ? "target" : key === "empresa" ? "building" : "shield"}/>{label}</button>)}</nav>
      <div className="demo-sidebar__card"><b>Compartilhamento real</b><span>Convites, prévias e eventos de envio usam links reais. Os indicadores dos demais painéis continuam demonstrativos nesta etapa.</span><Link href="/compartilhar/SOLARIS-FRANCO-2026">Abrir estúdio de envio</Link></div>
    </aside>
    <div className="demo-main">
      <header className="demo-top"><div><span className="eyebrow">Versão funcional · compartilhamento</span><h1>{roles[role]}</h1></div><div className="demo-user"><span className="avatar">FC</span><span><b>Franco</b><small>Administrador</small></span></div></header>
      <View/>
    </div>
  </main>;
}
