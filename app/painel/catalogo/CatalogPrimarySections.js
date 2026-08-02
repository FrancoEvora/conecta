"use client";

import { Icon } from "@/components/UI";
import styles from "./CatalogConsole.module.css";
import pro from "./CatalogProfessionalForms.module.css";
import { date, money, EntityActions, Metric, Status } from "./CatalogShared";
import { PRODUCT_SEGMENTS, segmentByCode } from "./ProductTaxonomy";

function productSegment(item) {
  return segmentByCode(item?.metadata?.segment || item?.metadata?.connector_segment || "real_estate");
}

export function OverviewSection({ data, permissions }) {
  const pending = [...(data.developments || []), ...(data.products || []), ...(data.campaigns || [])]
    .filter(item => ["in_review", "approved", "scheduled"].includes(item.workflow_status));
  const available = (data.inventory || []).filter(item => item.status === "available").length;

  return <>
    <section className={styles.hero}>
      <div>
        <span className="eyebrow">Catálogo com governança</span>
        <h2>Produtos primeiro. Categoria, atributos, campanha e publicação dentro do mesmo fluxo.</h2>
        <p>O cadastro começa pela categoria comercial escolhida também pelo conector. Alterações continuam versionadas e a última versão aprovada permanece no ar até uma nova publicação.</p>
      </div>
      <div className={styles.heroShield}><Icon name="shield" size={34}/><span><b>Ambiente restrito</b>Somente usuários internos com permissão específica acessam este módulo.</span></div>
    </section>

    <section className={styles.metrics}>
      <Metric label="Produtos" value={(data.products || []).length} note={`${(data.products || []).filter(item => item.workflow_status === "published").length} publicados`} icon="home"/>
      <Metric label="Categorias comerciais" value={PRODUCT_SEGMENTS.length} note="As mesmas do DNA do conector" icon="target"/>
      <Metric label="Campanhas" value={(data.campaigns || []).length} note={`${pending.length} itens em fluxo de aprovação`} icon="chart"/>
      <Metric label="Unidades disponíveis" value={available} note={`${(data.inventory || []).length} no estoque`} icon="check"/>
    </section>

    <section className={styles.dashboardGrid}>
      <article className={styles.card}>
        <div className={styles.cardHead}><div><span className="eyebrow">Fila editorial</span><h3>Itens aguardando decisão</h3></div></div>
        {pending.length
          ? pending.slice(0, 12).map(item => <div className={styles.queue} key={`${item.id}-${item.workflow_status}`}><span><b>{item.name || item.title}</b><small>{item.category || item.product_name || "Catálogo"}</small></span><Status value={item.workflow_status}/></div>)
          : <p className={styles.empty}>Nenhum item aguardando revisão, aprovação ou publicação.</p>}
      </article>
      <article className={`${styles.card} ${styles.darkCard}`}>
        <span className="eyebrow">Regra operacional</span>
        <h3>Nenhum usuário publica sozinho por padrão.</h3>
        <p>Editores criam rascunhos. Aprovadores validam conteúdo e condições. Publicadores liberam a versão para o mercado.</p>
        <div><span><b>{permissions.edit ? "Sim" : "Não"}</b>Editar</span><span><b>{permissions.approve ? "Sim" : "Não"}</b>Aprovar</span><span><b>{permissions.publish ? "Sim" : "Não"}</b>Publicar</span></div>
      </article>
    </section>
  </>;
}

export function DevelopmentsSection({ data, permissions, setModal, transition, preflight }) {
  return <section>
    <div className={styles.sectionHead}>
      <div><span className="eyebrow">Apenas para a vertical imobiliária</span><h2>Estruturas imobiliárias</h2><p>Empreendimentos permanecem como agrupadores opcionais de produtos imobiliários, não como a porta principal do catálogo.</p></div>
      {permissions.edit && <button className="button button--orange" onClick={() => setModal({ type: "development", item: null })}>Nova estrutura imobiliária</button>}
    </div>
    <div className={styles.tableWrap}><table><thead><tr><th>Estrutura</th><th>Parceiro</th><th>Localização</th><th>Produtos</th><th>Workflow</th><th>Versão</th><th>Ações</th></tr></thead><tbody>{(data.developments || []).map(item => <tr key={item.id}><td><b>{item.name}</b><small>{item.category}</small></td><td>{item.partner_name || "—"}</td><td>{item.city} · {item.state}</td><td>{item.product_count}</td><td><Status value={item.workflow_status}/></td><td>v{item.lock_version}</td><td><EntityActions type="development" item={item} permissions={permissions} onEdit={value => setModal({ type: "development", item: value })} onRun={transition} onPreflight={preflight}/></td></tr>)}</tbody></table></div>
  </section>;
}

export function ProductsSection({ data, permissions, setModal, transition, preflight }) {
  const products = data.products || [];

  function createProduct(segment) {
    setModal({
      type: "product",
      item: {
        metadata: {
          segment: segment.code,
          connector_segment: segment.connectorCode,
          segment_label: segment.label
        }
      }
    });
  }

  return <section>
    {permissions.edit && <section className={pro.segmentHub}>
      <div className={pro.segmentHubHeader}>
        <div>
          <span className="eyebrow">Novo produto</span>
          <h2>Primeiro, selecione a categoria.</h2>
          <p>Estas são exatamente as categorias apresentadas ao conector no cadastro. A escolha define o formulário, os atributos, os filtros e as futuras recomendações comerciais.</p>
        </div>
        <span>{PRODUCT_SEGMENTS.length} categorias</span>
      </div>
      <div className={pro.segmentGrid}>
        {PRODUCT_SEGMENTS.map(segment => {
          const count = products.filter(item => productSegment(item).code === segment.code).length;
          return <button
            type="button"
            className={`${pro.segmentCard} ${pro.segmentAction}`}
            key={segment.code}
            onClick={() => createProduct(segment)}
          >
            <Icon name={segment.icon}/>
            <span><b>{segment.label}</b><small>{segment.description}</small></span>
            <i className={pro.segmentCount}>{count}</i>
          </button>;
        })}
      </div>
    </section>}

    <div className={styles.sectionHead}>
      <div><span className="eyebrow">Portfólio comercial</span><h2>Produtos cadastrados</h2><p>Produtos imobiliários, veículos, serviços e demais ofertas convivem no mesmo catálogo, cada qual com seus atributos.</p></div>
    </div>

    <div className={styles.productGrid}>{products.map(item => {
      const segment = productSegment(item);
      return <article className={styles.productCard} key={item.id}>
        <div className={styles.productImage} style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(7,28,58,.82)),url('${item.metadata?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=75"}')` }}>
          <Status value={item.workflow_status}/><span>{segment.label}</span>
        </div>
        <div className={styles.productBody}>
          <small>{item.partner_name || "Parceiro não definido"}</small>
          <h3>{item.name}</h3>
          <p>{item.description || "Descrição pendente."}</p>
          <dl><dt>Tipo</dt><dd>{item.category || "Não definido"}</dd><dt>Estoque</dt><dd>{item.available_count}/{item.inventory_count}</dd><dt>Mídias</dt><dd>{item.media_count}</dd><dt>Versão</dt><dd>{item.lock_version}</dd></dl>
          <EntityActions type="product" item={item} permissions={permissions} onEdit={value => setModal({ type: "product", item: value })} onRun={transition} onPreflight={preflight}/>
        </div>
      </article>;
    })}</div>
  </section>;
}

export function CampaignsSection({ data, permissions, setModal, transition, preflight, simpleTransition, campaignsById }) {
  return <section>
    <div className={styles.sectionHead}><div><span className="eyebrow">Distribuição e regras</span><h2>Campanhas</h2></div>{permissions.edit && <button className="button button--orange" onClick={() => setModal({ type: "campaign", item: null })}>Nova campanha</button>}</div>
    <div className={styles.tableWrap}><table><thead><tr><th>Campanha</th><th>Produto</th><th>Período</th><th>Recompensa</th><th>Workflow</th><th>Ações</th></tr></thead><tbody>{(data.campaigns || []).map(item => <tr key={item.id}><td><b>{item.title}</b><small>{item.location}</small></td><td>{item.product_name || "—"}</td><td>{date(item.starts_at)}<small>até {date(item.ends_at)}</small></td><td><b>{money(item.reward_amount_cents)}</b><small><Status value={item.reward_workflow_status || "draft"}/></small></td><td><Status value={item.workflow_status}/></td><td><div className={styles.stackActions}><EntityActions type="campaign" item={item} permissions={permissions} onEdit={value => setModal({ type: "campaign", item: value })} onRun={transition} onPreflight={preflight}/>{permissions.price && <button onClick={() => setModal({ type: "reward", item })}>Nova regra de recompensa</button>}</div></td></tr>)}</tbody></table></div>
    <div className={styles.subsection}><h3>Versões de recompensa</h3><div className={styles.tableWrap}><table><thead><tr><th>Campanha</th><th>Versão</th><th>Valor</th><th>Termos</th><th>Status</th><th>Ações</th></tr></thead><tbody>{(data.reward_rules || []).map(rule => <tr key={rule.id}><td>{campaignsById[rule.campaign_id]?.title || "Campanha"}</td><td>v{rule.version}</td><td>{money(rule.amount_cents)}</td><td>{rule.terms_version}</td><td><Status value={rule.workflow_status}/></td><td><div className={styles.actions}>{permissions.price && rule.workflow_status === "draft" && <button onClick={() => simpleTransition("transition_reward_rule_v2", rule.id, "submit")}>Enviar para revisão</button>}{permissions.approve && rule.workflow_status === "in_review" && <><button className={styles.goodAction} onClick={() => simpleTransition("transition_reward_rule_v2", rule.id, "approve")}>Aprovar</button><button className={styles.dangerAction} onClick={() => simpleTransition("transition_reward_rule_v2", rule.id, "reject")}>Rejeitar</button></>}{permissions.publish && rule.workflow_status === "approved" && <button className={styles.goodAction} onClick={() => simpleTransition("transition_reward_rule_v2", rule.id, "publish")}>Publicar regra</button>}{permissions.publish && rule.workflow_status !== "archived" && <button onClick={() => simpleTransition("transition_reward_rule_v2", rule.id, "archive")}>Arquivar</button>}</div></td></tr>)}</tbody></table></div></div>
  </section>;
}
