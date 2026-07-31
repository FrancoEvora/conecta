"use client";

import { useState } from "react";
import styles from "./CatalogConsole.module.css";
import { Field, FormActions, parseJson, request } from "./CatalogShared";

export function MediaForm({ item, products, campaigns, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const file = form.get("file");
      let upload = null;
      if (file instanceof File && file.size) {
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("bucket", "catalog-media");
        uploadForm.append("folder", `produtos/${form.get("product_id")}`);
        const response = await fetch("/api/storage/upload", { method: "POST", body: uploadForm });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Falha no upload.");
        upload = payload;
      }
      const values = Object.fromEntries(form.entries());
      delete values.file;
      values.storage_path = upload?.path || item?.storage_path || "";
      values.public_url = upload?.publicUrl || values.public_url || item?.public_url || "";
      values.mime_type = upload?.mimeType || item?.mime_type || "";
      values.file_size_bytes = upload?.size || item?.file_size_bytes || "";
      values.metadata = upload?.sha256 ? { sha256: upload.sha256 } : (item?.metadata || {});
      await request("upsert_product_media", { p_media_id: item?.id || null, p_payload: values });
      setToast("Mídia salva como rascunho e pronta para revisão."); onSaved(); onClose();
    } catch (error) { setToast(error.message, true); } finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <Field label="Produto"><select name="product_id" required defaultValue={item?.product_id || ""}><option value="">Selecione</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
      <Field label="Campanha específica"><select name="campaign_id" defaultValue={item?.campaign_id || ""}><option value="">Uso geral do produto</option>{campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}</select></Field>
      <Field label="Tipo"><select name="media_type" defaultValue={item?.media_type || "image"}><option value="image">Imagem</option><option value="video">Vídeo</option><option value="document">Documento</option><option value="render">Render</option><option value="map">Mapa</option><option value="floorplan">Planta</option><option value="social_creative">Peça social</option></select></Field>
      <Field label="Uso"><select name="usage_scope" defaultValue={item?.usage_scope || "gallery"}><option value="cover">Capa</option><option value="gallery">Galeria</option><option value="og">Prévia social</option><option value="feed">Feed</option><option value="story">Story</option><option value="document">Documento</option><option value="general">Geral</option></select></Field>
      <Field label="Título"><input name="title" defaultValue={item?.title || ""}/></Field>
      <Field label="Texto alternativo"><input name="alt_text" defaultValue={item?.alt_text || ""}/></Field>
      <Field label="Ordem"><input name="sort_order" type="number" defaultValue={item?.sort_order || 0}/></Field>
      <Field label="URL externa"><input name="public_url" type="url" defaultValue={item?.public_url || ""} placeholder="Para vídeos ou arquivos hospedados externamente"/></Field>
    </div>
    <Field label="Enviar arquivo" hint="JPG, PNG, WEBP, PDF ou MP4 até 4 MB"><input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"/></Field>
    <FormActions onClose={onClose} busy={busy}/>
  </form>;
}

export function PriceForm({ item, products, campaigns, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());
      values.payment_terms = parseJson(values.payment_terms, {});
      values.adjustment_rules = parseJson(values.adjustment_rules, {});
      await request("upsert_price_table", { p_price_table_id: item?.id || null, p_payload: values });
      setToast("Tabela comercial salva como rascunho versionado."); onSaved(); onClose();
    } catch (error) { setToast(error.message, true); } finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <Field label="Produto"><select name="product_id" required defaultValue={item?.product_id || ""}><option value="">Selecione</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
      <Field label="Campanha"><select name="campaign_id" defaultValue={item?.campaign_id || ""}><option value="">Tabela geral</option>{campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}</select></Field>
      <Field label="Nome da tabela"><input name="name" required defaultValue={item?.name || ""}/></Field>
      <Field label="Moeda"><input name="currency" maxLength="3" defaultValue={item?.currency || "BRL"}/></Field>
      <Field label="Vigência inicial"><input name="valid_from" type="datetime-local" defaultValue={item?.valid_from ? new Date(item.valid_from).toISOString().slice(0,16) : ""}/></Field>
      <Field label="Vigência final"><input name="valid_until" type="datetime-local" defaultValue={item?.valid_until ? new Date(item.valid_until).toISOString().slice(0,16) : ""}/></Field>
      <Field label="Preço-base" hint="centavos"><input name="base_price_cents" type="number" min="0" defaultValue={item?.base_price_cents ?? ""}/></Field>
      <Field label="Preço por m²" hint="centavos"><input name="price_per_sqm_cents" type="number" min="0" defaultValue={item?.price_per_sqm_cents ?? ""}/></Field>
    </div>
    <Field label="Condições de pagamento" hint="JSON"><textarea name="payment_terms" rows="5" defaultValue={JSON.stringify(item?.payment_terms || {}, null, 2)}/></Field>
    <Field label="Regras de correção" hint="JSON"><textarea name="adjustment_rules" rows="4" defaultValue={JSON.stringify(item?.adjustment_rules || {}, null, 2)}/></Field>
    <FormActions onClose={onClose} busy={busy}/>
  </form>;
}

export function InventoryForm({ item, products, developments, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());
      values.attributes = parseJson(values.attributes, {});
      await request("upsert_inventory_unit", { p_inventory_id: item?.id || null, p_payload: values, p_expected_lock_version: item?.lock_version ?? null });
      setToast("Unidade atualizada com controle de concorrência."); onSaved(); onClose();
    } catch (error) { setToast(error.message, true); } finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <Field label="Produto"><select name="product_id" required defaultValue={item?.product_id || ""}><option value="">Selecione</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
      <Field label="Empreendimento"><select name="development_id" defaultValue={item?.development_id || ""}><option value="">Selecione</option>{developments.map(development => <option key={development.id} value={development.id}>{development.name}</option>)}</select></Field>
      <Field label="Código externo"><input name="external_code" required defaultValue={item?.external_code || ""}/></Field>
      <Field label="Quadra/Bloco"><input name="block_label" defaultValue={item?.block_label || ""}/></Field>
      <Field label="Unidade/Lote"><input name="unit_label" defaultValue={item?.unit_label || ""}/></Field>
      <Field label="Tipologia"><input name="typology" defaultValue={item?.typology || ""}/></Field>
      <Field label="Área em m²"><input name="area_sqm" type="number" min="0" step="0.01" defaultValue={item?.area_sqm ?? ""}/></Field>
      <Field label="Preço" hint="centavos"><input name="price_cents" type="number" min="0" defaultValue={item?.price_cents ?? ""}/></Field>
      <Field label="Status"><select name="status" defaultValue={item?.status || "available"}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option><option value="blocked">Bloqueado</option><option value="unavailable">Indisponível</option></select></Field>
    </div>
    <Field label="Atributos adicionais" hint="JSON"><textarea name="attributes" rows="5" defaultValue={JSON.stringify(item?.attributes || {}, null, 2)}/></Field>
    <FormActions onClose={onClose} busy={busy} label="Salvar unidade"/>
  </form>;
}
