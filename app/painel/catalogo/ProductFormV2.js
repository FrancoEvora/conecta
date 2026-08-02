"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/UI";
import styles from "./CatalogConsole.module.css";
import pro from "./CatalogProfessionalForms.module.css";
import { Field, FormActions, request, slugify } from "./CatalogShared";
import { PRODUCT_SEGMENTS, segmentByCode, typeLabel } from "./ProductTaxonomy";

function SegmentSelector({ value, onChange }) {
  return <div className={pro.segmentGrid}>
    {PRODUCT_SEGMENTS.map(segment => <label
      className={`${pro.segmentCard} ${value === segment.code ? pro.selected : ""}`}
      key={segment.code}
    >
      <input
        type="radio"
        value={segment.code}
        checked={value === segment.code}
        onChange={() => onChange(segment.code)}
      />
      <Icon name={segment.icon}/>
      <span><b>{segment.label}</b><small>{segment.description}</small></span>
    </label>)}
  </div>;
}

function Section({ number, title, description, children }) {
  return <section className={pro.section}>
    <header>
      <div className={pro.sectionTitle}>
        <span className={pro.sectionNumber}>{number}</span>
        <div><h3>{title}</h3><p>{description}</p></div>
      </div>
    </header>
    {children}
  </section>;
}

function DynamicProductFields({ segment, item }) {
  const attributes = item?.metadata?.attributes || {};

  if (segment === "real_estate") return <div className={pro.dynamicGrid}>
    <Field label="Área privativa ou do lote"><input name="area_from" defaultValue={item?.metadata?.area_from || attributes.area_from || ""} placeholder="Ex.: a partir de 360 m²"/></Field>
    <Field label="Estágio do produto"><select name="delivery_stage" defaultValue={attributes.delivery_stage || "launch"}><option value="launch">Lançamento</option><option value="under_construction">Em implantação ou obra</option><option value="ready">Pronto</option><option value="resale">Revenda</option></select></Field>
    <Field label="Quartos ou suítes"><input name="bedrooms" type="number" min="0" defaultValue={attributes.bedrooms || ""}/></Field>
    <Field label="Vagas"><input name="parking_spaces" type="number" min="0" defaultValue={attributes.parking_spaces || ""}/></Field>
  </div>;

  if (segment === "vehicles") return <div className={pro.dynamicGrid}>
    <Field label="Marca"><input name="brand" defaultValue={attributes.brand || ""}/></Field>
    <Field label="Modelo e versão"><input name="model_version" defaultValue={attributes.model_version || ""}/></Field>
    <Field label="Ano/modelo"><input name="model_year" defaultValue={attributes.model_year || ""}/></Field>
    <Field label="Quilometragem"><input name="mileage" type="number" min="0" defaultValue={attributes.mileage || ""}/></Field>
    <Field label="Combustível"><input name="fuel" defaultValue={attributes.fuel || ""}/></Field>
    <Field label="Transmissão"><input name="transmission" defaultValue={attributes.transmission || ""}/></Field>
  </div>;

  if (segment === "beauty") return <div className={pro.dynamicGrid}>
    <Field label="Marca"><input name="brand" defaultValue={attributes.brand || ""}/></Field>
    <Field label="Linha"><input name="line" defaultValue={attributes.line || ""}/></Field>
    <Field label="Volume ou quantidade"><input name="volume" defaultValue={attributes.volume || ""}/></Field>
    <Field label="Público"><select name="audience" defaultValue={attributes.audience || "unisex"}><option value="female">Feminino</option><option value="male">Masculino</option><option value="unisex">Unissex</option></select></Field>
  </div>;

  if (segment === "solar") return <div className={pro.dynamicGrid}>
    <Field label="Potência estimada"><input name="installed_power" defaultValue={attributes.installed_power || ""} placeholder="Ex.: 8,8 kWp"/></Field>
    <Field label="Economia estimada"><input name="estimated_savings" defaultValue={attributes.estimated_savings || ""}/></Field>
    <Field label="Prazo de instalação"><input name="installation_time" defaultValue={attributes.installation_time || ""}/></Field>
    <Field label="Garantia"><input name="warranty" defaultValue={attributes.warranty || ""}/></Field>
  </div>;

  if (segment === "agribusiness") return <div className={pro.dynamicGrid}>
    <Field label="Marca ou fabricante"><input name="brand" defaultValue={attributes.brand || ""}/></Field>
    <Field label="Aplicação"><input name="application" defaultValue={attributes.application || ""}/></Field>
    <Field label="Unidade de comercialização"><input name="unit_measure" defaultValue={attributes.unit_measure || ""}/></Field>
    <Field label="Disponibilidade"><input name="availability" defaultValue={attributes.availability || ""}/></Field>
  </div>;

  if (segment === "tourism") return <div className={pro.dynamicGrid}>
    <Field label="Destino"><input name="destination" defaultValue={attributes.destination || ""}/></Field>
    <Field label="Tipo de experiência"><input name="trip_type" defaultValue={attributes.trip_type || ""}/></Field>
    <Field label="Duração"><input name="duration" defaultValue={attributes.duration || ""}/></Field>
    <Field label="Período ou disponibilidade"><input name="availability" defaultValue={attributes.availability || ""}/></Field>
  </div>;

  if (segment === "insurance") return <div className={pro.dynamicGrid}>
    <Field label="Tipo de cobertura"><input name="coverage_type" defaultValue={attributes.coverage_type || ""}/></Field>
    <Field label="Seguradora"><input name="provider" defaultValue={attributes.provider || ""}/></Field>
    <Field label="Capital ou limite segurado"><input name="insured_value" defaultValue={attributes.insured_value || ""}/></Field>
    <Field label="Critério de elegibilidade"><input name="eligibility" defaultValue={attributes.eligibility || ""}/></Field>
  </div>;

  if (segment === "consortium") return <div className={pro.dynamicGrid}>
    <Field label="Valor da carta de crédito"><input name="credit_amount" defaultValue={attributes.credit_amount || ""}/></Field>
    <Field label="Prazo"><input name="term" defaultValue={attributes.term || ""}/></Field>
    <Field label="Parcela inicial"><input name="installment_from" defaultValue={attributes.installment_from || ""}/></Field>
    <Field label="Administradora"><input name="provider" defaultValue={attributes.provider || ""}/></Field>
  </div>;

  if (segment === "health") return <div className={pro.dynamicGrid}>
    <Field label="Serviço ou especialidade"><input name="service_type" defaultValue={attributes.service_type || ""}/></Field>
    <Field label="Clínica ou profissional"><input name="provider" defaultValue={attributes.provider || ""}/></Field>
    <Field label="Formato de atendimento"><input name="service_mode" defaultValue={attributes.service_mode || ""}/></Field>
    <Field label="Prazo ou disponibilidade"><input name="availability" defaultValue={attributes.availability || ""}/></Field>
  </div>;

  if (segment === "education") return <div className={pro.dynamicGrid}>
    <Field label="Instituição"><input name="provider" defaultValue={attributes.provider || ""}/></Field>
    <Field label="Modalidade"><input name="modality" defaultValue={attributes.modality || ""}/></Field>
    <Field label="Duração"><input name="duration" defaultValue={attributes.duration || ""}/></Field>
    <Field label="Certificação"><input name="certification" defaultValue={attributes.certification || ""}/></Field>
  </div>;

  if (segment === "technology") return <div className={pro.dynamicGrid}>
    <Field label="Marca ou fornecedor"><input name="brand" defaultValue={attributes.brand || ""}/></Field>
    <Field label="Modelo ou versão"><input name="model_version" defaultValue={attributes.model_version || ""}/></Field>
    <Field label="Licenciamento"><input name="license_type" defaultValue={attributes.license_type || ""}/></Field>
    <Field label="Formato de entrega"><input name="delivery_format" defaultValue={attributes.delivery_format || ""}/></Field>
  </div>;

  if (segment === "construction") return <div className={pro.dynamicGrid}>
    <Field label="Marca ou fornecedor"><input name="brand" defaultValue={attributes.brand || ""}/></Field>
    <Field label="Aplicação"><input name="application" defaultValue={attributes.application || ""}/></Field>
    <Field label="Unidade de comercialização"><input name="unit_measure" defaultValue={attributes.unit_measure || ""}/></Field>
    <Field label="Responsável técnico"><input name="technical_owner" defaultValue={attributes.technical_owner || ""}/></Field>
  </div>;

  if (segment === "fashion") return <div className={pro.dynamicGrid}>
    <Field label="Marca"><input name="brand" defaultValue={attributes.brand || ""}/></Field>
    <Field label="Linha ou coleção"><input name="line" defaultValue={attributes.line || ""}/></Field>
    <Field label="Público"><input name="audience" defaultValue={attributes.audience || ""}/></Field>
    <Field label="Tamanhos ou variações"><input name="sizes" defaultValue={attributes.sizes || ""}/></Field>
  </div>;

  if (segment === "investments") return <div className={pro.dynamicGrid}>
    <Field label="Tipo de ativo"><input name="asset_type" defaultValue={attributes.asset_type || ""}/></Field>
    <Field label="Investimento mínimo"><input name="minimum_investment" defaultValue={attributes.minimum_investment || ""}/></Field>
    <Field label="Liquidez ou prazo"><input name="liquidity" defaultValue={attributes.liquidity || ""}/></Field>
    <Field label="Perfil de risco"><input name="risk_profile" defaultValue={attributes.risk_profile || ""}/></Field>
  </div>;

  return <div className={pro.dynamicGrid}>
    <Field label="Formato de entrega"><input name="delivery_format" defaultValue={attributes.delivery_format || ""}/></Field>
    <Field label="Prazo ou duração"><input name="duration" defaultValue={attributes.duration || ""}/></Field>
    <Field label="Área de cobertura"><input name="coverage" defaultValue={attributes.coverage || ""}/></Field>
    <Field label="Responsável técnico"><input name="technical_owner" defaultValue={attributes.technical_owner || ""}/></Field>
  </div>;
}

export default function ProductFormV2({ item, partners, developments, onClose, onSaved, setToast }) {
  const initialSegment = segmentByCode(item?.metadata?.segment || item?.metadata?.connector_segment || "real_estate").code;
  const [segment, setSegment] = useState(initialSegment);
  const [busy, setBusy] = useState(false);
  const segmentDefinition = useMemo(() => segmentByCode(segment), [segment]);
  const productTypes = segmentDefinition.types;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());
      const productType = values.product_type;
      const attributeKeys = [
        "bedrooms", "parking_spaces", "delivery_stage", "brand", "model_version", "model_year", "mileage", "fuel", "transmission",
        "line", "volume", "audience", "installed_power", "estimated_savings", "installation_time", "warranty", "application",
        "unit_measure", "availability", "term", "installment_from", "eligibility", "provider", "delivery_format", "duration",
        "coverage", "technical_owner", "destination", "trip_type", "coverage_type", "insured_value", "credit_amount", "service_type",
        "service_mode", "modality", "certification", "license_type", "sizes", "asset_type", "minimum_investment", "liquidity", "risk_profile"
      ];
      const attributes = Object.fromEntries(
        attributeKeys
          .filter(key => values[key] !== undefined && values[key] !== "")
          .map(key => [key, values[key]])
      );

      values.category = typeLabel(segment, productType);
      values.development_id = segment === "real_estate" && values.development_id ? values.development_id : null;
      values.minimum_ticket_cents = values.minimum_ticket_reais
        ? Math.round(Number(String(values.minimum_ticket_reais).replace(",", ".")) * 100)
        : null;
      values.maximum_ticket_cents = values.maximum_ticket_reais
        ? Math.round(Number(String(values.maximum_ticket_reais).replace(",", ".")) * 100)
        : null;
      values.training_required = form.get("training_required") === "on";
      values.metadata = {
        ...(item?.metadata || {}),
        segment,
        connector_segment: segmentDefinition.connectorCode,
        segment_label: segmentDefinition.label,
        product_type: productType,
        product_type_label: typeLabel(segment, productType),
        image: values.image || "",
        area_from: values.area_from || "",
        payment: values.payment || "",
        location: values.location || "",
        lifestyle: values.lifestyle || "",
        features: String(values.features || "").split("\n").map(value => value.trim()).filter(Boolean),
        attributes
      };

      [
        "product_type", "minimum_ticket_reais", "maximum_ticket_reais", "image", "area_from", "payment", "location", "lifestyle", "features",
        ...attributeKeys
      ].forEach(key => delete values[key]);

      await request("upsert_product_v2", {
        p_product_id: item?.id || null,
        p_payload: values,
        p_expected_lock_version: item?.lock_version ?? null
      });
      setToast(`Produto de ${segmentDefinition.label.toLowerCase()} salvo como rascunho estruturado.`);
      onSaved();
      onClose();
    } catch (error) {
      setToast(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  return <form className={`${styles.form} ${pro.formShell}`} onSubmit={submit}>
    <div className={pro.classification}>
      <header>
        <h3>Categoria do produto</h3>
        <p>As categorias são exatamente as mesmas usadas no DNA Comercial do conector.</p>
      </header>
      <SegmentSelector value={segment} onChange={setSegment}/>
      <div className={pro.typeSelect} style={{ marginTop: 12 }}>
        <label>
          Tipo de produto
          <select name="product_type" required key={segment} defaultValue={item?.metadata?.product_type || productTypes[0][0]}>
            {productTypes.map(([code, label]) => <option value={code} key={code}>{label}</option>)}
          </select>
        </label>
        {segment === "real_estate" ? <label>
          Empreendimento imobiliário <small>opcional</small>
          <select name="development_id" defaultValue={item?.development_ids?.[0] || item?.development_id || ""}>
            <option value="">Produto imobiliário independente</option>
            {developments.map(development => <option key={development.id} value={development.id}>{development.name}</option>)}
          </select>
        </label> : <div className={pro.contextNote}>
          <Icon name={segmentDefinition.icon}/>
          <span><b>{segmentDefinition.label}</b>Este produto não precisa ser vinculado a um empreendimento imobiliário.</span>
        </div>}
      </div>
    </div>

    <Section number="1" title="Identidade comercial" description="Nome, propriedade e posicionamento do produto.">
      <div className={styles.formGrid}>
        <Field label="Nome do produto"><input name="name" required defaultValue={item?.name || ""} onBlur={event => { const slug = event.currentTarget.form.elements.slug; if (!slug.value) slug.value = slugify(event.target.value); }}/></Field>
        <Field label="Slug"><input name="slug" required defaultValue={item?.slug || ""}/></Field>
        <Field label="Parceiro responsável"><select name="partner_id" required defaultValue={item?.partner_id || ""}><option value="">Selecione</option>{partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></Field>
        <Field label="Nome jurídico ou referência interna"><input name="legal_name" defaultValue={item?.legal_name || ""}/></Field>
        <Field label="Público prioritário"><input name="target_audience" defaultValue={item?.target_audience || ""}/></Field>
        <Field label="Região de atuação"><input name="service_region" defaultValue={item?.service_region || ""}/></Field>
      </div>
    </Section>

    <Section number="2" title="Atributos do produto" description={`Campos adequados para ${segmentDefinition.label.toLowerCase()}.`}>
      <DynamicProductFields segment={segment} item={item}/>
    </Section>

    <Section number="3" title="Condição e operação comercial" description="Ticket, SLA e principais argumentos de venda.">
      <div className={pro.moneyGrid}>
        <Field label="Ticket mínimo" hint="R$"><input name="minimum_ticket_reais" inputMode="decimal" defaultValue={item?.minimum_ticket_cents ? item.minimum_ticket_cents / 100 : ""}/></Field>
        <Field label="Ticket máximo" hint="R$"><input name="maximum_ticket_reais" inputMode="decimal" defaultValue={item?.maximum_ticket_cents ? item.maximum_ticket_cents / 100 : ""}/></Field>
        <Field label="SLA do lead" hint="minutos"><input name="lead_sla_minutes" type="number" min="5" max="1440" defaultValue={item?.lead_sla_minutes || 30}/></Field>
      </div>
      <div className={styles.formGrid}>
        <Field label="Condição comercial resumida"><input name="payment" defaultValue={item?.metadata?.payment || ""}/></Field>
        <Field label="Localização ou cobertura"><input name="location" defaultValue={item?.metadata?.location || ""}/></Field>
        <Field label="Estilo, posicionamento ou benefício"><input name="lifestyle" defaultValue={item?.metadata?.lifestyle || ""}/></Field>
        <Field label="Imagem principal"><input name="image" type="url" defaultValue={item?.metadata?.image || ""} placeholder="URL pública da imagem principal"/></Field>
      </div>
    </Section>

    <Section number="4" title="Apresentação e governança" description="Conteúdo usado nas páginas, campanhas e compartilhamentos.">
      <Field label="Descrição comercial"><textarea name="description" rows="5" required defaultValue={item?.description || ""}/></Field>
      <Field label="Diferenciais" hint="um por linha"><textarea name="features" rows="5" defaultValue={(item?.metadata?.features || []).join("\n")}/></Field>
      <Field label="Resumo da alteração"><input name="change_summary" required placeholder="Descreva objetivamente o que foi criado ou alterado"/></Field>
      <div className={pro.governance}>
        <label className={pro.checkCard}><input name="training_required" type="checkbox" defaultChecked={item?.training_required ?? true}/><span>Exigir treinamento antes da atuação comercial.</span></label>
        <div className={pro.summary}><b>Fluxo editorial:</b> este salvamento cria ou atualiza um rascunho. Aprovação e publicação permanecem etapas separadas.</div>
      </div>
    </Section>

    <FormActions onClose={onClose} busy={busy}/>
  </form>;
}
