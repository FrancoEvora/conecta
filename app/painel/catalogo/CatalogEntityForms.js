"use client";

import { useState } from "react";
import { Icon } from "@/components/UI";
import styles from "./CatalogConsole.module.css";
import { Field, FormActions, request, slugify } from "./CatalogShared";

export function DevelopmentForm({ item, partners, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());
      values.training_required = form.get("training_required") === "on";
      values.commercial_metadata = { seo_title: values.seo_title || "", seo_description: values.seo_description || "" };
      delete values.seo_title; delete values.seo_description;
      await request("upsert_development_v2", { p_development_id: item?.id || null, p_payload: values, p_expected_lock_version: item?.lock_version ?? null });
      setToast("Rascunho do empreendimento salvo com histórico de versão."); onSaved(); onClose();
    } catch (error) { setToast(error.message, true); } finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <Field label="Nome"><input name="name" required defaultValue={item?.name || ""} onBlur={event => { const slug = event.currentTarget.form.elements.slug; if (!slug.value) slug.value = `${slugify(event.target.value)}-empreendimento`; }}/></Field>
      <Field label="Slug"><input name="slug" required defaultValue={item?.slug || ""}/></Field>
      <Field label="Parceiro responsável"><select name="partner_id" required defaultValue={item?.partner_id || ""}><option value="">Selecione</option>{partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></Field>
      <Field label="Razão jurídica"><input name="legal_name" defaultValue={item?.legal_name || ""}/></Field>
      <Field label="Cidade"><input name="city" required defaultValue={item?.city || ""}/></Field>
      <Field label="Estado"><input name="state" required maxLength="2" defaultValue={item?.state || ""}/></Field>
      <Field label="Categoria"><input name="category" required defaultValue={item?.category || ""}/></Field>
      <Field label="Público prioritário"><input name="target_audience" defaultValue={item?.target_audience || ""}/></Field>
      <Field label="Região de atendimento"><input name="service_region" defaultValue={item?.service_region || ""}/></Field>
      <Field label="Quantidade de unidades"><input name="unit_count" type="number" min="0" defaultValue={item?.unit_count ?? ""}/></Field>
      <Field label="SLA do primeiro contato" hint="minutos"><input name="lead_sla_minutes" type="number" min="5" max="1440" defaultValue={item?.lead_sla_minutes || 30}/></Field>
      <Field label="Website"><input name="website_url" type="url" defaultValue={item?.website_url || ""}/></Field>
      <Field label="Latitude"><input name="latitude" inputMode="decimal" defaultValue={item?.latitude || ""}/></Field>
      <Field label="Longitude"><input name="longitude" inputMode="decimal" defaultValue={item?.longitude || ""}/></Field>
      <Field label="Título para busca"><input name="seo_title" defaultValue={item?.commercial_metadata?.seo_title || ""}/></Field>
      <Field label="Resumo para busca"><input name="seo_description" defaultValue={item?.commercial_metadata?.seo_description || ""}/></Field>
    </div>
    <Field label="Endereço"><input name="address" defaultValue={item?.address || ""}/></Field>
    <Field label="Descrição institucional"><textarea name="description" rows="5" required defaultValue={item?.description || ""}/></Field>
    <Field label="Resumo da alteração"><input name="change_summary" required placeholder="Ex.: atualização de localização e descrição comercial"/></Field>
    <label className={styles.check}><input name="training_required" type="checkbox" defaultChecked={item?.training_required ?? true}/>Treinamento obrigatório para profissionais vinculados</label>
    <FormActions onClose={onClose} busy={busy}/>
  </form>;
}

export function ProductForm({ item, partners, developments, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());
      values.training_required = form.get("training_required") === "on";
      values.metadata = {
        image: values.image || "",
        area_from: values.area_from || "",
        payment: values.payment || "",
        location: values.location || "",
        lifestyle: values.lifestyle || "",
        features: String(values.features || "").split("\n").map(value => value.trim()).filter(Boolean)
      };
      ["image","area_from","payment","location","lifestyle","features"].forEach(key => delete values[key]);
      await request("upsert_product_v2", { p_product_id: item?.id || null, p_payload: values, p_expected_lock_version: item?.lock_version ?? null });
      setToast("Rascunho do produto salvo. A versão publicada anterior permanece no ar até nova aprovação."); onSaved(); onClose();
    } catch (error) { setToast(error.message, true); } finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <Field label="Nome do produto"><input name="name" required defaultValue={item?.name || ""} onBlur={event => { const slug = event.currentTarget.form.elements.slug; if (!slug.value) slug.value = slugify(event.target.value); }}/></Field>
      <Field label="Slug"><input name="slug" required defaultValue={item?.slug || ""}/></Field>
      <Field label="Empreendimento principal"><select name="development_id" required defaultValue={item?.development_ids?.[0] || ""}><option value="">Selecione</option>{developments.map(development => <option key={development.id} value={development.id}>{development.name}</option>)}</select></Field>
      <Field label="Parceiro"><select name="partner_id" required defaultValue={item?.partner_id || ""}><option value="">Selecione</option>{partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></Field>
      <Field label="Categoria"><input name="category" required defaultValue={item?.category || ""}/></Field>
      <Field label="Público prioritário"><input name="target_audience" defaultValue={item?.target_audience || ""}/></Field>
      <Field label="Região"><input name="service_region" defaultValue={item?.service_region || ""}/></Field>
      <Field label="SLA do lead" hint="minutos"><input name="lead_sla_minutes" type="number" min="5" max="1440" defaultValue={item?.lead_sla_minutes || 30}/></Field>
      <Field label="Ticket mínimo" hint="centavos"><input name="minimum_ticket_cents" type="number" min="0" defaultValue={item?.minimum_ticket_cents ?? ""}/></Field>
      <Field label="Ticket máximo" hint="centavos"><input name="maximum_ticket_cents" type="number" min="0" defaultValue={item?.maximum_ticket_cents ?? ""}/></Field>
      <Field label="Imagem de capa"><input name="image" type="url" defaultValue={item?.metadata?.image || ""} placeholder="URL pública ou use o módulo de mídia"/></Field>
      <Field label="Metragem/destaque"><input name="area_from" defaultValue={item?.metadata?.area_from || ""}/></Field>
      <Field label="Condição comercial curta"><input name="payment" defaultValue={item?.metadata?.payment || ""}/></Field>
      <Field label="Localização curta"><input name="location" defaultValue={item?.metadata?.location || ""}/></Field>
      <Field label="Estilo de vida"><input name="lifestyle" defaultValue={item?.metadata?.lifestyle || ""}/></Field>
      <Field label="Nome jurídico"><input name="legal_name" defaultValue={item?.legal_name || ""}/></Field>
    </div>
    <Field label="Descrição comercial"><textarea name="description" rows="5" required defaultValue={item?.description || ""}/></Field>
    <Field label="Diferenciais" hint="um por linha"><textarea name="features" rows="5" defaultValue={(item?.metadata?.features || []).join("\n")}/></Field>
    <Field label="Resumo da alteração"><input name="change_summary" required placeholder="Descreva objetivamente o que foi alterado"/></Field>
    <label className={styles.check}><input name="training_required" type="checkbox" defaultChecked={item?.training_required ?? true}/>Exigir treinamento antes da atuação</label>
    <FormActions onClose={onClose} busy={busy}/>
  </form>;
}

export function CampaignForm({ item, products, developments, partners, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());
      values.alternative_discovery_enabled = form.get("alternative_discovery_enabled") === "on";
      values.interest_options = String(values.interest_options || "").split("\n").map(value => value.trim()).filter(Boolean);
      await request("upsert_campaign_v2", { p_campaign_id: item?.id || null, p_payload: values, p_expected_lock_version: item?.lock_version ?? null });
      setToast("Campanha salva como rascunho independente do produto."); onSaved(); onClose();
    } catch (error) { setToast(error.message, true); } finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <Field label="Título da campanha"><input name="title" required defaultValue={item?.title || ""} onBlur={event => { const slug = event.currentTarget.form.elements.slug; if (!slug.value) slug.value = slugify(event.target.value); }}/></Field>
      <Field label="Slug"><input name="slug" required defaultValue={item?.slug || ""}/></Field>
      <Field label="Produto"><select name="product_id" required defaultValue={item?.product_id || ""}><option value="">Selecione</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
      <Field label="Empreendimento"><select name="development_id" defaultValue={item?.development_id || ""}><option value="">Selecione</option>{developments.map(development => <option key={development.id} value={development.id}>{development.name}</option>)}</select></Field>
      <Field label="Parceiro"><select name="partner_id" required defaultValue={item?.partner_id || ""}><option value="">Selecione</option>{partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></Field>
      <Field label="Localização"><input name="location" required defaultValue={item?.location || ""}/></Field>
      <Field label="Início"><input name="starts_at" type="datetime-local" defaultValue={item?.starts_at ? new Date(item.starts_at).toISOString().slice(0,16) : ""}/></Field>
      <Field label="Término"><input name="ends_at" type="datetime-local" defaultValue={item?.ends_at ? new Date(item.ends_at).toISOString().slice(0,16) : ""}/></Field>
      <Field label="Janela de atribuição" hint="dias"><input name="attribution_window_days" type="number" min="1" max="365" defaultValue={item?.attribution_window_days || 180}/></Field>
      <Field label="Escopo de alternativas"><select name="alternative_discovery_scope" defaultValue={item?.alternative_discovery_scope || "same_organization"}><option value="disabled">Desabilitado</option><option value="same_development">Mesmo empreendimento</option><option value="same_organization">Mesma empresa</option><option value="network">Toda a rede</option></select></Field>
      <Field label="Regra de conversão cruzada"><select name="conversion_reward_policy" defaultValue={item?.conversion_reward_policy || "destination_product_rule"}><option value="destination_product_rule">Regra do produto vendido</option><option value="source_campaign_rule">Regra da campanha original</option><option value="manual_review">Análise manual</option></select></Field>
    </div>
    <Field label="Resumo comercial"><textarea name="summary" rows="5" required defaultValue={item?.summary || ""}/></Field>
    <Field label="Opções de interesse" hint="uma por linha"><textarea name="interest_options" rows="5" required defaultValue={(item?.interest_options || ["Quero conhecer o produto"]).join("\n")}/></Field>
    <Field label="Resumo da alteração"><input name="change_summary" required placeholder="Informe o objetivo desta versão"/></Field>
    <label className={styles.check}><input name="alternative_discovery_enabled" type="checkbox" defaultChecked={item?.alternative_discovery_enabled ?? true}/>Permitir investigação de alternativas somente após autorização</label>
    <FormActions onClose={onClose} busy={busy}/>
  </form>;
}

export function RewardForm({ campaign, onClose, onSaved, setToast }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await request("set_reward_rule_v2", {
        p_campaign_id: campaign.id,
        p_amount_cents: Number(form.get("amount_cents")),
        p_terms_version: String(form.get("terms_version")),
        p_qualifying_event: "won",
        p_change_summary: String(form.get("change_summary"))
      });
      setToast("Nova regra de recompensa criada como rascunho. Ela não afeta a regra publicada até a aprovação final."); onSaved(); onClose();
    } catch (error) { setToast(error.message, true); } finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.notice}><Icon name="shield"/><span><b>Versionamento financeiro</b>A regra vigente continua ativa até uma nova versão ser revisada, aprovada e publicada.</span></div>
    <div className={styles.formGrid}>
      <Field label="Valor da recompensa" hint="centavos"><input name="amount_cents" type="number" min="0" required defaultValue={campaign.reward_amount_cents ?? 0}/></Field>
      <Field label="Versão dos termos"><input name="terms_version" required defaultValue={campaign.reward_terms_version || new Date().toISOString().slice(0,10)}/></Field>
    </div>
    <Field label="Justificativa"><textarea name="change_summary" rows="4" required placeholder="Explique o motivo da alteração financeira"/></Field>
    <FormActions onClose={onClose} busy={busy} label="Criar regra em rascunho"/>
  </form>;
}
