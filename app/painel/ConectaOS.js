"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./ConectaOS.module.css";

const SEGMENT_ALIASES = {
  imoveis: ["imóvel", "imoveis", "lote", "casa", "apartamento", "condomínio", "residencial", "comercial"],
  veiculos: ["veículo", "veiculos", "carro", "moto", "caminhão", "máquina"],
  agronegocio: ["agro", "agronegócio", "fazenda", "rural", "produtor"],
  "energia-solar": ["energia", "solar", "fotovoltaica"],
  perfumaria: ["perfume", "perfumaria", "beleza", "cosmético"],
  consorcios: ["consórcio", "carta de crédito"],
  seguros: ["seguro", "proteção"],
  investimentos: ["investimento", "patrimônio", "renda"]
};

const ROLE_LABELS = {
  staff: "Equipe Rede Conecta",
  connector: "Conector",
  partner: "Empreendedor parceiro",
  broker: "Corretor credenciado",
  pending: "Cadastro em validação"
};

const NAVIGATION = {
  connector: [
    ["today", "Hoje", "target"],
    ["opportunities", "Oportunidades", "building"],
    ["activity", "Conexões", "link"],
    ["wallet", "Recompensas", "money"],
    ["profile", "Meu DNA", "user"]
  ],
  staff: [
    ["today", "Visão executiva", "chart"],
    ["centers", "Centros", "menu"],
    ["priorities", "Prioridades", "target"],
    ["intelligence", "Inteligência", "shield"],
    ["governance", "Governança", "user"]
  ],
  partner: [
    ["today", "Visão executiva", "chart"],
    ["performance", "Resultados", "money"],
    ["developments", "Portfólio", "building"],
    ["governance", "Governança", "shield"]
  ],
  broker: [
    ["today", "Hoje", "target"],
    ["portfolio", "Produtos", "building"],
    ["pipeline", "Pipeline", "chart"],
    ["profile", "Meu perfil", "user"]
  ]
};

const STAFF_CENTERS = [
  ["Connect Center", "Conectores, validação, DNA comercial e reputação.", "/painel/operacao", "user"],
  ["Opportunity Center", "Produtos, estruturas, campanhas, preço, estoque e mídia.", "/painel/catalogo", "building"],
  ["Intelligence Center", "Afinidade, TrustScore, recomendações e radar comercial.", "/painel/inteligencia", "target"],
  ["Growth Center", "Distribuição, campanhas, links e desempenho por canal.", "/painel/compartilhamentos", "link"],
  ["Communication Center", "E-mail, WhatsApp, modelos, filas e acompanhamento.", "/painel/comunicacoes", "headset"],
  ["Governance Center", "Usuários, papéis, permissões, convites e auditoria.", "/painel/acessos", "shield"],
  ["Finance Center", "Recompensas, programação de pagamento e conciliação.", "/painel/operacao", "money"],
  ["Operations Center", "CRM, agenda, negócios, parceiros e corretores.", "/painel/operacao", "chart"]
];

function asNumber(value) { return Number(value || 0); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function money(cents) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(asNumber(cents) / 100); }
function date(value) { if (!value) return "—"; return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)); }
function firstName(value) { return String(value || "").trim().split(/\s+/)[0] || "Conector"; }
function lower(value) { return String(value || "").toLowerCase(); }

function profileMetadata(context) {
  return context?.profile_metadata || context?.metadata || context?.user_metadata || {};
}

function normalizeOpportunity(item) {
  const meta = item?.product_metadata || item?.metadata || {};
  return {
    id: item?.product_id || item?.id || item?.campaign_id || item?.product_slug,
    name: item?.product_name || item?.name || "Oportunidade",
    slug: item?.product_slug || item?.slug || "",
    category: item?.product_category || item?.category || "Oportunidade",
    description: item?.product_description || item?.description || item?.summary || "Oportunidade selecionada pela Rede Conecta.",
    location: item?.campaign_location || item?.location || item?.city || meta?.location || "Atendimento pela Rede Conecta",
    reward: asNumber(item?.reward_amount_cents || item?.reward_cents || item?.referral_bonus_cents),
    campaignId: item?.campaign_id || null,
    invitationCode: item?.invitation_code || item?.invite_code || item?.public_code || null,
    image: meta?.image || item?.image || "",
    raw: item
  };
}

function connectorSegments(context, snapshot) {
  const meta = profileMetadata(context);
  const values = [meta.connector_segments, context?.connector_segments, snapshot?.segments, snapshot?.profile?.segments];
  return [...new Set(values.flatMap(asArray).map(lower).filter(Boolean))];
}

function affinity(opportunity, segments, context) {
  const text = lower([opportunity.name, opportunity.category, opportunity.description, opportunity.location].join(" "));
  let score = 44;
  const reasons = [];
  for (const segment of segments) {
    const aliases = SEGMENT_ALIASES[segment] || [segment.replaceAll("-", " ")];
    if (aliases.some(alias => text.includes(alias))) {
      score += 34;
      reasons.push("combina com seu DNA comercial");
      break;
    }
  }
  const city = lower(profileMetadata(context)?.city || context?.city);
  if (city && text.includes(city)) { score += 8; reasons.push("atua na sua região"); }
  if (opportunity.campaignId) { score += 7; reasons.push("campanha pronta"); }
  if (opportunity.reward > 0) { score += 7; reasons.push("recompensa definida"); }
  return { score: Math.min(98, score), reasons: reasons.length ? reasons : ["disponível para sua rede"] };
}

function trustData(snapshot) {
  const summary = snapshot?.summary || snapshot || {};
  const links = asNumber(summary.links || summary.links_created || summary.share_links || snapshot?.links?.length);
  const connections = asNumber(summary.connections || summary.total_connections || snapshot?.connections?.length);
  const won = asNumber(summary.won_connections || summary.validated_deals || summary.total_deals);
  const paid = asNumber(summary.paid_rewards_cents || summary.paid_cents);
  const score = Math.min(99, 52 + Math.min(12, links * 2) + Math.min(18, connections * 2) + Math.min(17, won * 6));
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : "Em construção";
  return { score, grade, links, connections, won, paid };
}

function Status({ value }) {
  const good = ["active", "approved", "paid", "validated", "won", "completed", "published"].includes(value);
  const bad = ["rejected", "cancelled", "lost", "suspended", "critical"].includes(value);
  return <span className={`${styles.status} ${good ? styles.statusGood : bad ? styles.statusBad : ""}`}>{String(value || "—").replaceAll("_", " ")}</span>;
}

function Metric({ icon, label, value, note }) {
  return <article className={styles.metric}>
    <span className={styles.metricIcon}><Icon name={icon}/></span>
    <span><small>{label}</small><strong>{value}</strong>{note && <em>{note}</em>}</span>
  </article>;
}

function Empty({ children }) {
  return <div className={styles.empty}><Icon name="target"/><b>Nada por aqui ainda.</b><p>{children}</p></div>;
}

function OpportunityCard({ opportunity, match, onShare, busy }) {
  const background = opportunity.image
    ? { backgroundImage: `linear-gradient(180deg,rgba(7,28,58,.04),rgba(7,28,58,.78)),url('${opportunity.image}')` }
    : undefined;
  return <article className={styles.opportunity}>
    <div className={styles.opportunityVisual} style={background}>
      <span>{opportunity.category}</span>
      <b>{match.score}% <small>afinidade</small></b>
    </div>
    <div className={styles.opportunityBody}>
      <small>{opportunity.location}</small>
      <h3>{opportunity.name}</h3>
      <p>{opportunity.description}</p>
      <div className={styles.reasonRow}>{match.reasons.slice(0, 2).map(reason => <span key={reason}>{reason}</span>)}</div>
      <div className={styles.rewardRow}>
        <span><small>Recompensa da campanha</small><b>{opportunity.reward ? money(opportunity.reward) : "Conforme regras"}</b></span>
        {opportunity.campaignId
          ? <button disabled={busy} onClick={() => onShare(opportunity)}>{busy ? "Preparando…" : "Compartilhar"}<Icon name="arrow" size={17}/></button>
          : <Link href="/oportunidades">Conhecer<Icon name="arrow" size={17}/></Link>}
      </div>
    </div>
  </article>;
}

function ConnectorExperience({ active, context, snapshot, opportunities, matches, onShare, busy }) {
  const trust = trustData(snapshot);
  const summary = snapshot?.summary || {};
  const top = opportunities[0];

  if (active === "opportunities") return <>
    <SectionTitle eyebrow="Match inteligente" title="Oportunidades recomendadas" text="A ordem considera os mercados escolhidos, campanhas disponíveis e sinais do seu perfil."/>
    <div className={styles.opportunityGrid}>{opportunities.map(item => <OpportunityCard key={item.id} opportunity={item} match={matches[item.id]} onShare={onShare} busy={busy === item.id}/>)}</div>
    {!opportunities.length && <Empty>Assim que novas campanhas forem publicadas, elas aparecerão aqui.</Empty>}
  </>;

  if (active === "activity") return <>
    <SectionTitle eyebrow="Origem protegida" title="Suas conexões em andamento" text="Você acompanha a evolução sem precisar operar a venda."/>
    <div className={styles.listCard}>{asArray(snapshot?.connections).map(item => <article className={styles.listRow} key={item.protocol || item.id}>
      <span className={styles.rowIcon}><Icon name="link"/></span>
      <span><b>{item.source_product_name_snapshot || item.product_name || "Oportunidade"}</b><small>{item.protocol || "Protocolo protegido"} · início {date(item.submitted_at)}</small></span>
      <Status value={item.status}/>
    </article>)}{!asArray(snapshot?.connections).length && <Empty>Seu primeiro compartilhamento dará início a este histórico.</Empty>}</div>
  </>;

  if (active === "wallet") return <>
    <SectionTitle eyebrow="Capital" title="Recompensas e resultados" text="Valores são liberados somente conforme as regras e a validação de cada campanha."/>
    <div className={styles.metricsGrid}>
      <Metric icon="money" label="Total pago" value={money(summary.paid_rewards_cents)} note="recompensas concluídas"/>
      <Metric icon="clock" label="Em análise" value={money(summary.pending_rewards_cents)} note="sujeito à validação"/>
      <Metric icon="check" label="Negócios concluídos" value={summary.won_connections || 0} note="origem reconhecida"/>
    </div>
    <div className={styles.listCard}>{asArray(snapshot?.rewards).map(item => <article className={styles.listRow} key={item.id}>
      <span className={styles.rowIcon}><Icon name="money"/></span>
      <span><b>{item.source_product_name_snapshot || item.product_name || "Recompensa"}</b><small>{item.protocol || "Origem registrada"}</small></span>
      <strong>{money(item.amount_cents)}</strong><Status value={item.status}/>
    </article>)}{!asArray(snapshot?.rewards).length && <Empty>As recompensas elegíveis aparecerão depois da validação dos negócios.</Empty>}</div>
  </>;

  if (active === "profile") {
    const meta = profileMetadata(context);
    const segments = asArray(meta.connector_segments || context?.connector_segments);
    const channels = asArray(meta.connector_channels);
    const cities = asArray(meta.connector_cities);
    return <>
      <SectionTitle eyebrow="Seu ativo" title="DNA Comercial e TrustScore" text="A plataforma usa apenas dados declarados e resultados internos para melhorar recomendações — não acessa sua agenda nem suas conversas."/>
      <div className={styles.profileGrid}>
        <article className={styles.trustCard}><span>TrustScore operacional</span><strong>{trust.score}</strong><b>{trust.grade}</b><p>Índice de atividade e qualidade dentro da Rede Conecta. Não é uma avaliação pessoal ou financeira.</p></article>
        <article className={styles.profileCard}><h3>Mercados</h3><div className={styles.tagCloud}>{segments.length ? segments.map(item => <span key={item}>{item.replaceAll("-", " ")}</span>) : <small>Complete seus segmentos.</small>}</div><h3>Cidades</h3><div className={styles.tagCloud}>{cities.length ? cities.map(item => <span key={item}>{item}</span>) : <small>Cidade principal do cadastro.</small>}</div><h3>Canais</h3><div className={styles.tagCloud}>{channels.length ? channels.map(item => <span key={item}>{item}</span>) : <small>Não informado.</small>}</div></article>
      </div>
    </>;
  }

  return <>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}>SUA PRÓXIMA AÇÃO</span><h1>Use sua confiança para abrir a porta certa.</h1><p>A Rede Conecta indica onde existe maior afinidade, prepara a abordagem e conduz o atendimento profissional.</p>{top && <div className={styles.heroActions}><button onClick={() => onShare(top)} disabled={busy === top.id}>Compartilhar recomendação principal<Icon name="arrow"/></button><Link href="/painel/inteligencia">Abrir copiloto comercial</Link></div>}</div>
      <div className={styles.heroMatch}>{top ? <><span>Melhor oportunidade agora</span><strong>{matches[top.id]?.score || 0}%</strong><b>{top.name}</b><small>{matches[top.id]?.reasons?.join(" · ")}</small></> : <><span>Radar</span><strong>—</strong><b>Aguardando campanhas</b></>}</div>
    </section>
    <div className={styles.metricsGrid}>
      <Metric icon="shield" label="TrustScore" value={`${trust.score} · ${trust.grade}`} note="atividade e qualidade"/>
      <Metric icon="link" label="Links ativos" value={summary.links || 0} note="prontos para compartilhar"/>
      <Metric icon="target" label="Conexões" value={summary.connections || 0} note="com origem registrada"/>
      <Metric icon="money" label="Recompensas pagas" value={money(summary.paid_rewards_cents)} note="negócios validados"/>
    </div>
    <section className={styles.todayGrid}>
      <article className={styles.priorityCard}><span className={styles.eyebrow}>RADAR DE CONFIANÇA</span><h2>Pense em situações, não em listas de contatos.</h2><p>Quem está expandindo a empresa, construindo, investindo, trocando de veículo ou buscando reduzir custos?</p><div className={styles.promptGrid}>{["Empresários em expansão", "Famílias planejando construir", "Produtores rurais investindo", "Pessoas formando patrimônio"].map(item => <span key={item}>{item}</span>)}</div></article>
      <article className={styles.nextCard}><span className={styles.eyebrow}>COMO O DINHEIRO ACONTECE</span><ol><li><b>1</b>Você identifica uma oportunidade legítima.</li><li><b>2</b>Compartilha um link rastreável.</li><li><b>3</b>A Rede Conecta conduz o atendimento.</li><li><b>4</b>Negócio validado, a recompensa segue as regras.</li></ol></article>
    </section>
    <SectionTitle eyebrow="Recomendadas para você" title="Oportunidades com maior afinidade" text="Menos catálogo. Mais direção comercial." action={<button onClick={() => location.hash = "opportunities"}>Ver todas</button>}/>
    <div className={styles.opportunityGrid}>{opportunities.slice(0, 3).map(item => <OpportunityCard key={item.id} opportunity={item} match={matches[item.id]} onShare={onShare} busy={busy === item.id}/>)}</div>
  </>;
}

function StaffExperience({ active, snapshot }) {
  const d = snapshot || {};
  if (active === "centers") return <>
    <SectionTitle eyebrow="Arquitetura operacional" title="Centros da Rede Conecta" text="Cada centro concentra uma responsabilidade clara, com acesso controlado por permissão."/>
    <div className={styles.centerGrid}>{STAFF_CENTERS.map(([title, text, href, icon]) => <Link className={styles.centerCard} href={href} key={title}><span><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p><b>Abrir centro <Icon name="arrow" size={17}/></b></Link>)}</div>
  </>;

  if (active === "priorities") return <>
    <SectionTitle eyebrow="Execução" title="Prioridades operacionais" text="O sistema organiza o que exige ação imediata antes de mostrar relatórios extensos."/>
    <div className={styles.priorityList}>
      <Priority title="Conectores aguardando validação" value={d.pending_connectors || 0} href="/painel/operacao" urgent={d.pending_connectors > 0}/>
      <Priority title="Tarefas comerciais vencidas" value={d.overdue_tasks || 0} href="/painel/operacao" urgent={d.overdue_tasks > 0}/>
      <Priority title="Comunicações na fila" value={d.notification_backlog || 0} href="/painel/comunicacoes" urgent={d.notification_backlog > 10}/>
      <Priority title="Alertas de conciliação" value={d.open_circumvention_alerts || 0} href="/painel/operacao" urgent={d.open_circumvention_alerts > 0}/>
      <Priority title="Recompensas pendentes" value={money(d.pending_rewards_cents)} href="/painel/operacao"/>
    </div>
  </>;

  if (active === "intelligence") return <>
    <section className={styles.intelligenceHero}><span className={styles.eyebrow}>INTELLIGENCE CENTER</span><h1>Quem deve apresentar qual oportunidade, em que momento?</h1><p>O núcleo de inteligência combina campanhas, perfis, regiões e resultados para orientar distribuição comercial.</p><Link href="/painel/inteligencia">Abrir Inteligência Conecta <Icon name="arrow"/></Link></section>
    <div className={styles.centerGrid}>{[
      ["Afinidade", "Compatibilidade entre o DNA do conector e a oportunidade."],
      ["TrustScore", "Índice explicável de atividade e qualidade interna."],
      ["Radar", "Sinais de demanda e momentos de abordagem."],
      ["Copiloto", "Mensagens e próximos passos orientados por contexto."]
    ].map(([title, text]) => <article className={styles.centerCard} key={title}><span><Icon name="target"/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
  </>;

  if (active === "governance") return <>
    <SectionTitle eyebrow="Controle" title="Governança, identidade e segurança" text="Acesso individual, segregação de funções, auditoria e proteção da origem comercial."/>
    <div className={styles.centerGrid}>
      <Link className={styles.centerCard} href="/painel/acessos"><span><Icon name="user"/></span><h3>Identidade e acessos</h3><p>Usuários, papéis, permissões, convites e suspensão.</p><b>Gerenciar <Icon name="arrow" size={17}/></b></Link>
      <Link className={styles.centerCard} href="/painel/catalogo"><span><Icon name="shield"/></span><h3>Governança editorial</h3><p>Rascunho, revisão, aprovação e publicação do catálogo.</p><b>Ver catálogo <Icon name="arrow" size={17}/></b></Link>
      <Link className={styles.centerCard} href="/painel/operacao"><span><Icon name="chart"/></span><h3>Auditoria operacional</h3><p>Eventos, CRM, conciliação e histórico da operação.</p><b>Abrir operação <Icon name="arrow" size={17}/></b></Link>
    </div>
  </>;

  return <>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}>REDE CONECTA 2.0</span><h1>A operação começa pelo que precisa acontecer hoje.</h1><p>Uma visão executiva para transformar confiança em demanda, demanda em atendimento e atendimento em receita.</p><div className={styles.heroActions}><Link className={styles.primaryLink} href="/painel/operacao">Abrir operação<Icon name="arrow"/></Link><Link href="/painel/inteligencia">Ver inteligência</Link></div></div>
      <div className={styles.executivePulse}><span>Pulso da operação</span><strong>{d.open_connections || 0}</strong><b>leads em andamento</b><small>{d.overdue_tasks || 0} tarefas vencidas · {d.open_deals || 0} negócios abertos</small></div>
    </section>
    <div className={styles.metricsGrid}>
      <Metric icon="user" label="Aguardando validação" value={d.pending_connectors || 0} note="novos conectores"/>
      <Metric icon="link" label="Conectores ativos" value={d.active_connectors || 0} note="aptos a distribuir"/>
      <Metric icon="target" label="Leads em andamento" value={d.open_connections || 0} note={`${d.overdue_tasks || 0} tarefas vencidas`}/>
      <Metric icon="money" label="VGV validado" value={money(d.validated_vgv_cents)} note={`${d.open_deals || 0} negócios abertos`}/>
    </div>
    <section className={styles.todayGrid}>
      <article className={styles.priorityCard}><span className={styles.eyebrow}>PRIORIDADES</span><h2>O que exige atenção agora</h2><div className={styles.compactPriorities}><span><b>{d.pending_connectors || 0}</b>cadastros para análise</span><span><b>{d.overdue_tasks || 0}</b>tarefas vencidas</span><span><b>{d.notification_backlog || 0}</b>comunicações pendentes</span><span><b>{d.open_circumvention_alerts || 0}</b>alertas de conciliação</span></div></article>
      <article className={styles.nextCard}><span className={styles.eyebrow}>MODELO ECONÔMICO</span><h2>Receita nasce do ciclo completo.</h2><ol><li><b>1</b>Produto confiável e campanha clara.</li><li><b>2</b>Distribuição pela pessoa certa.</li><li><b>3</b>Atendimento central e rápido.</li><li><b>4</b>Conversão, conciliação e remuneração.</li></ol></article>
    </section>
    <SectionTitle eyebrow="Acesso rápido" title="Centros operacionais" text="A arquitetura deixa claro onde cada trabalho acontece."/>
    <div className={styles.centerGrid}>{STAFF_CENTERS.slice(0, 4).map(([title, text, href, icon]) => <Link className={styles.centerCard} href={href} key={title}><span><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p><b>Abrir <Icon name="arrow" size={17}/></b></Link>)}</div>
  </>;
}

function PartnerExperience({ active, snapshot }) {
  const partner = snapshot?.partner || {};
  const summary = snapshot?.summary || {};
  if (active === "developments") return <>
    <SectionTitle eyebrow="Portfólio" title="Empreendimentos e produtos vinculados" text="A Rede Conecta mantém a condução central, enquanto o parceiro acompanha o desempenho."/>
    <div className={styles.listCard}>{asArray(snapshot?.developments).map(item => <article className={styles.listRow} key={item.id}><span className={styles.rowIcon}><Icon name="building"/></span><span><b>{item.name}</b><small>{item.city} · {item.state} · {item.product_count || 0} produtos</small></span><Status value={item.status}/></article>)}{!asArray(snapshot?.developments).length && <Empty>Nenhum empreendimento vinculado.</Empty>}</div>
  </>;
  if (active === "performance") return <>
    <SectionTitle eyebrow="Resultado" title="Retorno da rede comercial" text="Indicadores executivos sem exposição indevida de dados pessoais."/>
    <div className={styles.metricsGrid}><Metric icon="shield" label="Conexões protegidas" value={summary.protected_connections || 0}/><Metric icon="target" label="Em andamento" value={summary.open_connections || 0}/><Metric icon="check" label="Negócios validados" value={summary.validated_deals || 0}/><Metric icon="money" label="VGV validado" value={money(summary.validated_vgv_cents)}/></div>
    <Pipeline rows={snapshot?.pipeline}/>
  </>;
  if (active === "governance") return <>
    <SectionTitle eyebrow="Proteção" title="Governança da parceria" text="A origem dos negócios, a janela de proteção e a conciliação permanecem registradas."/>
    <div className={styles.profileGrid}><article className={styles.profileCard}><h3>{partner.name || "Parceiro"}</h3><dl><dt>Status</dt><dd><Status value={partner.status}/></dd><dt>Contrato</dt><dd><Status value={partner.contract_status}/></dd><dt>Janela de proteção</dt><dd>{partner.attribution_window_days || 0} dias</dd><dt>Reconciliação</dt><dd>{partner.reconciliation_required ? "Obrigatória" : "Não obrigatória"}</dd></dl></article><article className={styles.trustCard}><span>Princípio central</span><strong><Icon name="shield" size={40}/></strong><b>Origem preservada</b><p>O painel não expõe conversas privadas, documentos ou anotações internas da operação.</p></article></div>
  </>;
  return <>
    <section className={styles.hero}><div className={styles.heroCopy}><span className={styles.eyebrow}>PARTNER CENTER</span><h1>Veja quanto a rede está produzindo para {partner.name || "seu negócio"}.</h1><p>Demanda, evolução comercial e VGV acompanhados sem retirar da Rede Conecta a governança da operação.</p></div><div className={styles.executivePulse}><span>VGV validado</span><strong>{money(summary.validated_vgv_cents)}</strong><b>{summary.validated_deals || 0} negócios</b></div></section>
    <div className={styles.metricsGrid}><Metric icon="shield" label="Conexões protegidas" value={summary.protected_connections || 0}/><Metric icon="target" label="Em andamento" value={summary.open_connections || 0}/><Metric icon="check" label="Negócios validados" value={summary.validated_deals || 0}/><Metric icon="money" label="VGV validado" value={money(summary.validated_vgv_cents)}/></div>
    <Pipeline rows={snapshot?.pipeline}/>
  </>;
}

function BrokerExperience({ active, snapshot }) {
  const broker = snapshot?.broker || {};
  const products = asArray(snapshot?.products);
  const stages = snapshot?.stage_totals || {};
  if (active === "portfolio") return <>
    <SectionTitle eyebrow="Opportunity Center" title="Produtos vinculados ao seu perfil" text="Informações comerciais organizadas e alinhadas à operação central."/>
    <div className={styles.centerGrid}>{products.map(item => <article className={styles.centerCard} key={item.product_id}><span><Icon name="building"/></span><h3>{item.product_name}</h3><p>{item.category} · {item.service_region}</p><div className={styles.cardStats}><b>{item.campaign_count || 0} campanhas</b><b>{item.open_connections || 0} em andamento</b></div></article>)}{!products.length && <Empty>Nenhum produto vinculado.</Empty>}</div>
  </>;
  if (active === "pipeline") return <><SectionTitle eyebrow="Execução" title="Pipeline de leitura" text="Oportunidades resumidas para orientar sua atuação dentro das regras da rede."/><div className={styles.metricsGrid}><Metric icon="user" label="Novos" value={stages.new || 0}/><Metric icon="target" label="Qualificados" value={stages.qualified || 0}/><Metric icon="chart" label="Propostas" value={stages.proposal || 0}/><Metric icon="check" label="Concluídos" value={stages.won || 0}/></div></>;
  if (active === "profile") return <><SectionTitle eyebrow="Perfil profissional" title={broker.display_name || "Corretor credenciado"} text="Dados de credenciamento e escopo de atuação."/><div className={styles.profileGrid}><article className={styles.profileCard}><dl><dt>CRECI</dt><dd>{broker.creci_state} {broker.creci_number}</dd><dt>Status</dt><dd><Status value={broker.status}/></dd><dt>Produtos vinculados</dt><dd>{products.length}</dd></dl></article></div></>;
  return <>
    <section className={styles.hero}><div className={styles.heroCopy}><span className={styles.eyebrow}>BROKER CENTER</span><h1>Hoje, sua prioridade é agir sobre o que já está mais próximo da decisão.</h1><p>Portfólio, campanhas e visão do pipeline em uma experiência mais direta e organizada.</p><div className={styles.heroActions}><Link className={styles.primaryLink} href="/painel/operacao">Abrir operação<Icon name="arrow"/></Link></div></div><div className={styles.executivePulse}><span>Em proposta</span><strong>{stages.proposal || 0}</strong><b>oportunidades</b></div></section>
    <div className={styles.metricsGrid}><Metric icon="building" label="Produtos" value={products.length}/><Metric icon="user" label="Novos" value={stages.new || 0}/><Metric icon="target" label="Em proposta" value={stages.proposal || 0}/><Metric icon="check" label="Concluídos" value={stages.won || 0}/></div>
    <div className={styles.centerGrid}>{products.slice(0, 4).map(item => <article className={styles.centerCard} key={item.product_id}><span><Icon name="building"/></span><h3>{item.product_name}</h3><p>{item.category} · {item.service_region}</p><div className={styles.cardStats}><b>{item.open_connections || 0} em andamento</b><b>{item.won_connections || 0} concluídos</b></div></article>)}</div>
  </>;
}

function SectionTitle({ eyebrow, title, text, action }) {
  return <div className={styles.sectionTitle}><div><span className={styles.eyebrow}>{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>{action}</div>;
}

function Priority({ title, value, href, urgent = false }) {
  return <Link className={`${styles.priorityRow} ${urgent ? styles.priorityUrgent : ""}`} href={href}><span><b>{title}</b><small>{urgent ? "Ação recomendada agora" : "Acompanhar"}</small></span><strong>{value}</strong><Icon name="arrow"/></Link>;
}

function Pipeline({ rows }) {
  const data = asArray(rows);
  return <section className={styles.listCard}><div className={styles.listHeader}><span className={styles.eyebrow}>PIPELINE PROTEGIDO</span><h2>Negócios em evolução</h2></div>{data.slice(0, 12).map(item => <article className={styles.listRow} key={item.protocol}><span className={styles.rowIcon}><Icon name="target"/></span><span><b>{item.source_product_name_snapshot || "Oportunidade"}</b><small>{item.protocol} · proteção até {date(item.protected_until)}</small></span><Status value={item.deal_status || item.status}/><strong>{item.gross_value_cents ? money(item.gross_value_cents) : "—"}</strong></article>)}{!data.length && <Empty>A operação ainda não possui negócios vinculados a este painel.</Empty>}</section>;
}

export default function ConectaOS({ context, snapshot, products }) {
  const role = context?.portal_kind || "pending";
  const navigation = NAVIGATION[role] || [];
  const [active, setActive] = useState(navigation[0]?.[0] || "today");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const segments = useMemo(() => connectorSegments(context, snapshot), [context, snapshot]);
  const opportunities = useMemo(() => {
    const source = role === "connector" && asArray(snapshot?.campaigns).length ? snapshot.campaigns : products;
    return source.map(normalizeOpportunity).filter(item => item.id);
  }, [role, snapshot, products]);
  const matches = useMemo(() => Object.fromEntries(opportunities.map(item => [item.id, affinity(item, segments, context)])), [opportunities, segments, context]);
  const sortedOpportunities = useMemo(() => [...opportunities].sort((a, b) => (matches[b.id]?.score || 0) - (matches[a.id]?.score || 0)), [opportunities, matches]);

  async function share(opportunity) {
    if (!opportunity.campaignId) return location.href = "/oportunidades";
    setBusy(opportunity.id); setNotice("");
    try {
      const response = await fetch("/api/app/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "create_invitation", params: { p_campaign_id: opportunity.campaignId, p_label: `${opportunity.name} · Conecta 2.0`, p_expires_in_days: 90 } }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível criar o link.");
      const data = Array.isArray(payload.data) ? payload.data[0] : payload.data;
      const code = data?.invitation_code || data?.public_code;
      if (!code) throw new Error("O link foi criado, mas o código não foi retornado.");
      location.href = `/compartilhar/${code}`;
    } catch (error) { setNotice(error.message); setBusy(null); }
  }

  function logout() { fetch("/api/auth/logout", { method: "POST" }).finally(() => { location.href = "/"; }); }

  if (role === "pending" || context?.profile_status !== "active") return <main className={styles.pending}><NetworkMark/><span className={styles.eyebrow}>CADASTRO EM VALIDAÇÃO</span><h1>Seu perfil está sendo analisado.</h1><p>Assim que a equipe concluir a validação, você terá acesso às oportunidades, ao DNA Comercial, ao TrustScore e aos links rastreáveis.</p><button onClick={logout}>Sair</button></main>;

  return <div className={styles.os}>
    <aside className={styles.rail}>
      <NetworkMark inverse/>
      <div className={styles.roleBox}><span>{ROLE_LABELS[role]}</span><b>{context.display_name}</b></div>
      <nav>{navigation.map(([key, label, icon]) => <button key={key} className={active === key ? styles.navActive : ""} onClick={() => setActive(key)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
      <div className={styles.railBottom}><Link href="/painel/inteligencia"><Icon name="target"/>Inteligência Conecta</Link>{role === "staff" && <Link href="/painel/operacao"><Icon name="chart"/>Operação completa</Link>}<button onClick={logout}><Icon name="arrow"/>Sair</button></div>
    </aside>

    <div className={styles.viewport}>
      <header className={styles.topbar}>
        <div className={styles.mobileBrand}><NetworkMark compact/></div>
        <div><small>{ROLE_LABELS[role]}</small><b>{context.display_name}</b></div>
        <div className={styles.topActions}><Link href="/painel/inteligencia" aria-label="Inteligência"><Icon name="target"/></Link><button onClick={logout}>Sair</button></div>
      </header>
      {notice && <div className={styles.notice}>{notice}<button onClick={() => setNotice("")}>×</button></div>}
      <main className={styles.content}>
        {role === "connector" && <ConnectorExperience active={active} context={context} snapshot={snapshot} opportunities={sortedOpportunities} matches={matches} onShare={share} busy={busy}/>} 
        {role === "staff" && <StaffExperience active={active} snapshot={snapshot}/>} 
        {role === "partner" && <PartnerExperience active={active} snapshot={snapshot}/>} 
        {role === "broker" && <BrokerExperience active={active} snapshot={snapshot}/>} 
      </main>
      <nav className={styles.bottomNav}>{navigation.slice(0, 5).map(([key, label, icon]) => <button key={key} className={active === key ? styles.bottomActive : ""} onClick={() => setActive(key)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
    </div>
  </div>;
}
