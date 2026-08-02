"use client";

import { useState } from "react";
import styles from "./CatalogConsole.module.css";
import { Field, FormActions, parseJson, request } from "./CatalogShared";
import { registerExternalProductMedia, uploadProductMedia } from "@/lib/client-product-media";

export function MediaForm({ item, products, campaigns, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const productId = String(form.get("product_id") || "");
      const campaignId = String(form.get("campaign_id") || "");
      const mediaType = String(form.get("media_type") || "image");
      const usageScope = String(form.get("usage_scope") || "gallery");
      const title = String(form.get("title") || "").trim();
      const altText = String(form.get("alt_text") || "").trim();
      const sortOrder = Number(form.get("sort_order") || 0);
      const publicUrl = String(form.get("public_url") || "").trim();
      const file = form.get("file");

      if (!productId) throw new Error("Selecione o produto.");

      if (file instanceof File && file.size) {
        await uploadProductMedia({
          mediaId: item?.id || null,
          productId,
          campaignId,
          file,
          usageScope,
          mediaType,
          title,
          altText,
          sortOrder,
          metadata: item?.metadata || {}
        });
      } else {
        const sourceUrl = publicUrl || item?.public_url || "";
        const storagePath = item?.storage_path || "";
        if (!sourceUrl && !storagePath) {
          throw new Error("Selecione um arquivo ou informe uma URL externa.");
        }
        await registerExternalProductMedia({
          mediaId: item?.id || null,
          productId,
          campaignId,
          mediaType,
          usageScope,
          title,
          altText,
          sortOrder,
          publicUrl: sourceUrl,
          storagePath,
          mimeType: item?.mime_type || "",
          fileSize: item?.file_size_bytes || "",
          width: item?.width_pixels || "",
          height: item?.height_pixels || "",
          metadata: item?.metadata || {}
        });
      }

      setToast(
        usageScope === "cover"
          ? "Imagem principal salva como rascunho. Envie para revisão e publique para usá-la nos convites."
          : "Mídia salva como rascunho e pronta para revisão."
      );
      await onSaved();
      onClose();
    } catch (error) {
      setToast(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <Field label="Produto">
        <select name="product_id" required defaultValue={item?.product_id || ""}>
          <option value="">Selecione</option>
          {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
      </Field>
      <Field label="Campanha específica">
        <select name="campaign_id" defaultValue={item?.campaign_id || ""}>
          <option value="">Uso geral do produto</option>
          {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
        </select>
      </Field>
      <Field label="Tipo">
        <select name="media_type" defaultValue={item?.media_type || "image"}>
          <option value="image">Imagem</option>
          <option value="video">Vídeo</option>
          <option value="document">Documento</option>
          <option value="render">Render</option>
          <option value="map">Mapa</option>
          <option value="floorplan">Planta</option>
          <option value="social_creative">Peça social</option>
        </select>
      </Field>
      <Field label="Uso">
        <select name="usage_scope" defaultValue={item?.usage_scope || "gallery"}>
          <option value="cover">Imagem principal do produto</option>
          <option value="gallery">Galeria</option>
          <option value="og">Prévia dos links</option>
          <option value="feed">Arte para feed</option>
          <option value="story">Arte para stories</option>
          <option value="document">Documento</option>
          <option value="general">Uso geral</option>
        </select>
      </Field>
      <Field label="Título"><input name="title" defaultValue={item?.title || ""} placeholder="Ex.: Corolla 2016 · imagem principal"/></Field>
      <Field label="Texto alternativo"><input name="alt_text" defaultValue={item?.alt_text || ""} placeholder="Descreva objetivamente o conteúdo"/></Field>
      <Field label="Ordem"><input name="sort_order" type="number" min="0" defaultValue={item?.sort_order || 0}/></Field>
      <Field label="URL externa"><input name="public_url" type="url" defaultValue={item?.public_url || ""} placeholder="Somente quando o arquivo estiver hospedado externamente"/></Field>
    </div>

    <Field label={item?.id ? "Substituir arquivo" : "Enviar arquivo"} hint="Imagens até 30 MB são otimizadas automaticamente; PDF e MP4 até 4 MB">
      <input
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
        onChange={event => setFileName(event.target.files?.[0]?.name || "")}
      />
    </Field>
    {fileName && <div className={styles.resultBox}><b>Arquivo selecionado</b><span>{fileName}</span><small>A imagem será redimensionada e comprimida antes do envio, sem alterar o arquivo original.</small></div>}
    {item?.public_url && !fileName && <div className={styles.resultBox}><b>Mídia atual</b><a href={item.public_url} target="_blank" rel="noreferrer">Abrir arquivo</a></div>}

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
