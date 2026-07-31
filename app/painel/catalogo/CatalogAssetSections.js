"use client";

import { Icon } from "@/components/UI";
import styles from "./CatalogConsole.module.css";
import { date, money, Status } from "./CatalogShared";

export function MediaSection({ data, permissions, productsById, setModal, simpleTransition }) {
  return <section>
    <div className={styles.sectionHead}><div><span className="eyebrow">Biblioteca oficial</span><h2>Mídia e documentos</h2></div>{permissions.edit && <button className="button button--orange" onClick={() => setModal({ type: "media", item: null })}>Adicionar mídia</button>}</div>
    <div className={styles.mediaGrid}>{(data.media || []).map(item => <article className={styles.mediaCard} key={item.id}>
      {["image", "render", "social_creative"].includes(item.media_type) ? <div className={styles.mediaThumb} style={{ backgroundImage: `url('${item.public_url}')` }}/> : <div className={styles.mediaIcon}><Icon name="link" size={34}/></div>}
      <div><Status value={item.status}/><small>{item.usage_scope}</small><h3>{item.title || productsById[item.product_id]?.name || "Mídia"}</h3><p>{item.alt_text || item.mime_type}</p><div className={styles.actions}>{permissions.edit && !["published", "archived"].includes(item.status) && <button onClick={() => setModal({ type: "media", item })}>Editar</button>}{permissions.submit && item.status === "draft" && <button onClick={() => simpleTransition("transition_product_media", item.id, "submit")}>Enviar para revisão</button>}{permissions.approve && item.status === "in_review" && <><button className={styles.goodAction} onClick={() => simpleTransition("transition_product_media", item.id, "approve")}>Aprovar</button><button className={styles.dangerAction} onClick={() => simpleTransition("transition_product_media", item.id, "reject")}>Rejeitar</button></>}{permissions.publish && item.status === "approved" && <button className={styles.goodAction} onClick={() => simpleTransition("transition_product_media", item.id, "publish")}>Publicar</button>}{permissions.publish && item.status !== "archived" && <button onClick={() => simpleTransition("transition_product_media", item.id, "archive")}>Arquivar</button>}</div></div>
    </article>)}</div>
  </section>;
}

export function PricesSection({ data, permissions, productsById, setModal, simpleTransition }) {
  return <section>
    <div className={styles.sectionHead}><div><span className="eyebrow">Governança financeira</span><h2>Tabelas comerciais</h2></div>{permissions.price && <button className="button button--orange" onClick={() => setModal({ type: "price", item: null })}>Nova tabela</button>}</div>
    <div className={styles.tableWrap}><table><thead><tr><th>Tabela</th><th>Produto</th><th>Versão</th><th>Vigência</th><th>Preço-base</th><th>Status</th><th>Ações</th></tr></thead><tbody>{(data.price_tables || []).map(item => <tr key={item.id}><td><b>{item.name}</b></td><td>{productsById[item.product_id]?.name || "—"}</td><td>v{item.version}</td><td>{date(item.valid_from)}<small>até {date(item.valid_until)}</small></td><td>{money(item.base_price_cents)}<small>{item.price_per_sqm_cents ? `${money(item.price_per_sqm_cents)}/m²` : ""}</small></td><td><Status value={item.status}/></td><td><div className={styles.actions}>{permissions.price && ["draft", "in_review", "approved"].includes(item.status) && <button onClick={() => setModal({ type: "price", item })}>Editar</button>}{permissions.price && item.status === "draft" && <button onClick={() => simpleTransition("transition_price_table", item.id, "submit")}>Enviar</button>}{permissions.approve && item.status === "in_review" && <button className={styles.goodAction} onClick={() => simpleTransition("transition_price_table", item.id, "approve")}>Aprovar</button>}{permissions.publish && item.status === "approved" && <button className={styles.goodAction} onClick={() => simpleTransition("transition_price_table", item.id, "publish")}>Publicar</button>}{permissions.publish && item.status !== "archived" && <button onClick={() => simpleTransition("transition_price_table", item.id, "archive")}>Arquivar</button>}</div></td></tr>)}</tbody></table></div>
  </section>;
}

export function InventorySection({ data, permissions, productsById, setModal, importCsv }) {
  return <section>
    <div className={styles.sectionHead}><div><span className="eyebrow">Disponibilidade em tempo real</span><h2>Estoque e unidades</h2></div>{permissions.inventory && <button className="button button--orange" onClick={() => setModal({ type: "inventory", item: null })}>Nova unidade</button>}</div>
    {permissions.inventory && <form className={styles.importBox} onSubmit={importCsv}><div><b>Importação em lote</b><span>CSV: external_code, development_id, block_label, unit_label, typology, area_sqm, price_cents, status, attributes</span></div><select name="product_id" required defaultValue=""><option value="">Selecione o produto</option>{(data.products || []).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input name="file" type="file" accept=".csv,text/csv" required/><button className="button button--navy">Importar CSV</button></form>}
    <div className={styles.tableWrap}><table><thead><tr><th>Código</th><th>Produto</th><th>Quadra/Unidade</th><th>Tipologia</th><th>Área</th><th>Preço</th><th>Status</th><th>Atualização</th><th></th></tr></thead><tbody>{(data.inventory || []).map(item => <tr key={item.id}><td><b>{item.external_code}</b></td><td>{productsById[item.product_id]?.name || "—"}</td><td>{item.block_label} · {item.unit_label}</td><td>{item.typology || "—"}</td><td>{item.area_sqm ? `${item.area_sqm} m²` : "—"}</td><td>{money(item.price_cents)}</td><td><Status value={item.status}/></td><td>{date(item.updated_at)}</td><td>{permissions.inventory && <button onClick={() => setModal({ type: "inventory", item })}>Editar</button>}</td></tr>)}</tbody></table></div>
  </section>;
}

export function RevisionsSection({ data }) {
  return <section><div className={styles.sectionHead}><div><span className="eyebrow">Trilha imutável</span><h2>Histórico de versões</h2></div></div><div className={styles.revisionList}>{(data.revisions || []).map(item => <article key={item.id}><span><Icon name="shield"/></span><div><b>{item.entity_type.replaceAll("_", " ")} · revisão {item.revision_number}</b><p>{item.change_summary || "Alteração registrada."}</p><small>{date(item.created_at)}</small></div><Status value={item.workflow_status}/></article>)}</div></section>;
}
