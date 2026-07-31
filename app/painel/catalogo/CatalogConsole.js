"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./CatalogConsole.module.css";
import { tabs, parseCsv, parseJson, request, Modal } from "./CatalogShared";
import { DevelopmentForm, ProductForm, CampaignForm, RewardForm } from "./CatalogEntityForms";
import { MediaForm, PriceForm, InventoryForm } from "./CatalogOperationsForms";
import { OverviewSection, DevelopmentsSection, ProductsSection, CampaignsSection } from "./CatalogPrimarySections";
import { MediaSection, PricesSection, InventorySection, RevisionsSection } from "./CatalogAssetSections";

export default function CatalogConsole({ context, initialData }) {
  const [data, setData] = useState(initialData || {});
  const [active, setActive] = useState("overview");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToastState] = useState(null);
  const permissionsArray = context.permissions || [];
  const has = permission => permissionsArray.includes("platform.all") || permissionsArray.includes(permission);
  const permissions = {
    read: has("catalog.read") || has("catalog.manage"),
    edit: has("catalog.edit") || has("catalog.manage"),
    submit: has("catalog.submit") || has("catalog.edit") || has("catalog.manage"),
    approve: has("catalog.approve") || has("catalog.manage"),
    publish: has("catalog.publish"),
    price: has("pricing.manage") || has("catalog.manage"),
    inventory: has("inventory.manage") || has("catalog.manage")
  };

  const productsById = useMemo(() => Object.fromEntries((data.products || []).map(item => [item.id, item])), [data.products]);
  const campaignsById = useMemo(() => Object.fromEntries((data.campaigns || []).map(item => [item.id, item])), [data.campaigns]);

  function setToast(message, error = false) {
    setToastState({ message, error });
    setTimeout(() => setToastState(null), 6000);
  }

  async function reload() {
    setLoading(true);
    try { setData(await request("catalog_v2")); }
    catch (error) { setToast(error.message, true); }
    finally { setLoading(false); }
  }

  async function transition(type, item, action) {
    try {
      let notes = "";
      let scheduled = null;
      if (["reject", "pause", "archive"].includes(action)) {
        notes = prompt(action === "reject" ? "Motivo da rejeição:" : "Justificativa:", "") ?? "";
        if (!notes.trim() && action === "reject") return;
      }
      if (action === "schedule") {
        const value = prompt("Informe a data e hora no formato AAAA-MM-DDTHH:MM:", "");
        if (!value) return;
        scheduled = new Date(value).toISOString();
      }
      if (action === "restore") {
        await request("catalog_restore_published", { p_entity_type: type, p_entity_id: item.id, p_notes: "Rascunho descartado pelo usuário." });
      } else {
        await request("catalog_transition", { p_entity_type: type, p_entity_id: item.id, p_action: action, p_notes: notes, p_scheduled_at: scheduled });
      }
      setToast("Fluxo atualizado com auditoria e nova revisão.");
      await reload();
    } catch (error) { setToast(error.message, true); }
  }

  async function preflight(type, id) {
    try {
      const result = await request("catalog_preflight", { p_entity_type: type, p_entity_id: id });
      setModal({ type: "preflight", result, entityType: type });
    } catch (error) { setToast(error.message, true); }
  }

  async function simpleTransition(operation, id, action) {
    try {
      let notes = "";
      if (action === "reject") {
        notes = prompt("Motivo da rejeição:", "") || "";
        if (!notes.trim()) return;
      }
      const params = operation === "transition_reward_rule_v2"
        ? { p_rule_id: id, p_action: action, p_notes: notes }
        : operation === "transition_product_media"
          ? { p_media_id: id, p_action: action, p_notes: notes }
          : { p_price_table_id: id, p_action: action, p_notes: notes };
      await request(operation, params);
      setToast("Status atualizado.");
      await reload();
    } catch (error) { setToast(error.message, true); }
  }

  async function importCsv(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const productId = String(form.get("product_id") || "");
    const file = form.get("file");
    if (!productId || !(file instanceof File) || !file.size) return setToast("Selecione o produto e o arquivo CSV.", true);
    try {
      const rows = parseCsv(await file.text()).map(row => ({
        external_code: row.external_code,
        development_id: row.development_id || null,
        block_label: row.block_label || "",
        unit_label: row.unit_label || "",
        typology: row.typology || "",
        area_sqm: row.area_sqm || null,
        price_cents: row.price_cents || null,
        status: row.status || "available",
        attributes: row.attributes ? parseJson(row.attributes, {}) : {}
      }));
      if (!rows.length) throw new Error("O CSV não contém linhas válidas.");
      const result = await request("import_inventory_units", { p_product_id: productId, p_rows: rows });
      setToast(`${result.processed} unidades processadas.`);
      event.currentTarget.reset();
      await reload();
    } catch (error) { setToast(error.message, true); }
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <NetworkMark inverse/>
      <div className={styles.sideLabel}>Catálogo profissional</div>
      <nav>{tabs
        .filter(([key]) => key !== "prices" || permissions.price)
        .filter(([key]) => key !== "inventory" || permissions.inventory)
        .map(([key, label, icon]) => <button key={key} className={active === key ? styles.navActive : ""} onClick={() => setActive(key)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
      <div className={styles.sideLinks}><Link href="/painel"><Icon name="arrow"/> Voltar ao painel</Link><Link href="/painel/compartilhamentos"><Icon name="chart"/> Distribuição social</Link></div>
      <div className={styles.sideSecurity}><Icon name="shield"/><span><b>Separação de responsabilidades</b>Edição, aprovação, publicação e preço obedecem permissões diferentes.</span></div>
    </aside>

    <div className={styles.main}>
      <header className={styles.topbar}><div><span className="eyebrow">Central de governança comercial</span><h1>{tabs.find(([key]) => key === active)?.[1]}</h1></div><div className={styles.topActions}><button onClick={reload} disabled={loading}>{loading ? "Atualizando…" : "Atualizar"}</button><span><b>{context.display_name}</b><small>Equipe interna</small></span><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button></div></header>
      {loading && <div className={styles.loading}/>}<main className={styles.content}>
        {active === "overview" && <OverviewSection data={data} permissions={permissions}/>}
        {active === "developments" && <DevelopmentsSection data={data} permissions={permissions} setModal={setModal} transition={transition} preflight={preflight}/>}
        {active === "products" && <ProductsSection data={data} permissions={permissions} setModal={setModal} transition={transition} preflight={preflight}/>}
        {active === "campaigns" && <CampaignsSection data={data} permissions={permissions} setModal={setModal} transition={transition} preflight={preflight} simpleTransition={simpleTransition} campaignsById={campaignsById}/>}
        {active === "media" && <MediaSection data={data} permissions={permissions} productsById={productsById} setModal={setModal} simpleTransition={simpleTransition}/>}
        {active === "prices" && <PricesSection data={data} permissions={permissions} productsById={productsById} setModal={setModal} simpleTransition={simpleTransition}/>}
        {active === "inventory" && <InventorySection data={data} permissions={permissions} productsById={productsById} setModal={setModal} importCsv={importCsv}/>}
        {active === "revisions" && <RevisionsSection data={data}/>}
      </main>
    </div>

    {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ""}`}><Icon name={toast.error ? "shield" : "check"}/><span>{toast.message}</span><button onClick={() => setToastState(null)}>×</button></div>}
    {modal?.type === "development" && <Modal title={modal.item ? "Editar empreendimento" : "Novo empreendimento"} subtitle="Toda alteração é salva como rascunho versionado." onClose={() => setModal(null)} wide><DevelopmentForm item={modal.item} partners={data.partners || []} onClose={() => setModal(null)} onSaved={reload} setToast={setToast}/></Modal>}
    {modal?.type === "product" && <Modal title={modal.item ? "Editar produto" : "Novo produto"} subtitle="Produto e campanha são entidades independentes." onClose={() => setModal(null)} wide><ProductForm item={modal.item} partners={data.partners || []} developments={data.developments || []} onClose={() => setModal(null)} onSaved={reload} setToast={setToast}/></Modal>}
    {modal?.type === "campaign" && <Modal title={modal.item ? "Editar campanha" : "Nova campanha"} subtitle="Uma campanha define público, período, atribuição e jornada comercial." onClose={() => setModal(null)} wide><CampaignForm item={modal.item} products={data.products || []} developments={data.developments || []} partners={data.partners || []} onClose={() => setModal(null)} onSaved={reload} setToast={setToast}/></Modal>}
    {modal?.type === "reward" && <Modal title="Nova versão da recompensa" subtitle={modal.item.title} onClose={() => setModal(null)}><RewardForm campaign={modal.item} onClose={() => setModal(null)} onSaved={reload} setToast={setToast}/></Modal>}
    {modal?.type === "media" && <Modal title={modal.item ? "Editar mídia" : "Adicionar mídia"} subtitle="Arquivos passam por verificação de formato e fluxo editorial." onClose={() => setModal(null)} wide><MediaForm item={modal.item} products={data.products || []} campaigns={data.campaigns || []} onClose={() => setModal(null)} onSaved={reload} setToast={setToast}/></Modal>}
    {modal?.type === "price" && <Modal title={modal.item ? "Editar tabela comercial" : "Nova tabela comercial"} subtitle="Somente uma tabela publicada fica vigente por produto." onClose={() => setModal(null)} wide><PriceForm item={modal.item} products={data.products || []} campaigns={data.campaigns || []} onClose={() => setModal(null)} onSaved={reload} setToast={setToast}/></Modal>}
    {modal?.type === "inventory" && <Modal title={modal.item ? "Editar unidade" : "Nova unidade"} subtitle="Atualizações usam controle de versão para evitar sobrescrita acidental." onClose={() => setModal(null)} wide><InventoryForm item={modal.item} products={data.products || []} developments={data.developments || []} onClose={() => setModal(null)} onSaved={reload} setToast={setToast}/></Modal>}
    {modal?.type === "preflight" && <Modal title={modal.result.valid ? "Pronto para aprovação" : "Pendências encontradas"} subtitle="Pré-validação editorial e comercial" onClose={() => setModal(null)}><div className={modal.result.valid ? styles.preflightGood : styles.preflightBad}><Icon name={modal.result.valid ? "check" : "shield"} size={36}/><h3>{modal.result.valid ? "Todos os critérios obrigatórios foram atendidos." : "Corrija os itens antes de aprovar ou publicar."}</h3>{!modal.result.valid && <ul>{modal.result.errors.map(error => <li key={error}>{error}</li>)}</ul>}</div></Modal>}
  </div>;
}
