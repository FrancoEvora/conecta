-- Product Center taxonomy aligned with the exact categories used in connector signup.
-- Products remain the generic commercial entity; developments are optional real-estate groupings.

do $$
declare
  v_org uuid;
begin
  select id into v_org
  from public.organizations
  where slug = 'conecta-futura-casa';

  if v_org is null then
    raise exception 'organization_not_found';
  end if;

  insert into public.verticals (
    organization_id,
    slug,
    name,
    description,
    product_label,
    specialist_label,
    professional_credential_required,
    status,
    metadata
  )
  values
    (v_org, 'imoveis', 'Imóveis', 'Lotes, casas, apartamentos e investimentos.', 'Produto imobiliário', 'Corretor', false, 'active', '{"connector_code":"imoveis","catalog_code":"real_estate"}'::jsonb),
    (v_org, 'veiculos', 'Veículos', 'Carros, motos, máquinas e mobilidade.', 'Veículo', 'Consultor', false, 'active', '{"connector_code":"veiculos","catalog_code":"vehicles"}'::jsonb),
    (v_org, 'perfumaria-beleza', 'Perfumaria e beleza', 'Cosméticos, fragrâncias e bem-estar.', 'Produto', 'Consultor', false, 'active', '{"connector_code":"perfumaria","catalog_code":"beauty"}'::jsonb),
    (v_org, 'energia-solar', 'Energia solar', 'Soluções residenciais e empresariais.', 'Solução', 'Consultor', false, 'active', '{"connector_code":"energia-solar","catalog_code":"solar"}'::jsonb),
    (v_org, 'agronegocio', 'Agronegócio', 'Terras, insumos, máquinas e serviços.', 'Produto', 'Especialista', false, 'active', '{"connector_code":"agronegocio","catalog_code":"agribusiness"}'::jsonb),
    (v_org, 'turismo', 'Turismo', 'Viagens, hospedagem e experiências.', 'Experiência', 'Consultor', false, 'active', '{"connector_code":"turismo","catalog_code":"tourism"}'::jsonb),
    (v_org, 'seguros', 'Seguros', 'Proteção pessoal e patrimonial.', 'Seguro', 'Consultor', false, 'active', '{"connector_code":"seguros","catalog_code":"insurance"}'::jsonb),
    (v_org, 'consorcios', 'Consórcios', 'Imóveis, veículos e serviços.', 'Consórcio', 'Consultor', false, 'active', '{"connector_code":"consorcios","catalog_code":"consortium"}'::jsonb),
    (v_org, 'saude', 'Saúde', 'Clínicas, serviços e soluções de saúde.', 'Serviço de saúde', 'Especialista', false, 'active', '{"connector_code":"saude","catalog_code":"health"}'::jsonb),
    (v_org, 'educacao', 'Educação', 'Cursos, escolas e capacitação.', 'Solução educacional', 'Consultor', false, 'active', '{"connector_code":"educacao","catalog_code":"education"}'::jsonb),
    (v_org, 'tecnologia', 'Tecnologia', 'Software, equipamentos e serviços.', 'Solução tecnológica', 'Consultor', false, 'active', '{"connector_code":"tecnologia","catalog_code":"technology"}'::jsonb),
    (v_org, 'construcao', 'Construção', 'Materiais, projetos e fornecedores.', 'Produto de construção', 'Especialista', false, 'active', '{"connector_code":"construcao","catalog_code":"construction"}'::jsonb),
    (v_org, 'moda', 'Moda', 'Vestuário, acessórios e marcas.', 'Produto', 'Consultor', false, 'active', '{"connector_code":"moda","catalog_code":"fashion"}'::jsonb),
    (v_org, 'investimentos', 'Investimentos', 'Oportunidades e ativos selecionados.', 'Oportunidade', 'Especialista', false, 'active', '{"connector_code":"investimentos","catalog_code":"investments"}'::jsonb),
    (v_org, 'outros', 'Outros mercados', 'Outras áreas da rede comercial.', 'Produto', 'Especialista', false, 'active', '{"connector_code":"outros","catalog_code":"other"}'::jsonb)
  on conflict (organization_id, slug)
  do update set
    name = excluded.name,
    description = excluded.description,
    status = 'active',
    metadata = coalesce(public.verticals.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now();
end
$$;

create or replace function public.admin_upsert_product_v2(
  p_product_id uuid,
  p_payload jsonb,
  p_expected_lock_version integer default null::integer
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_org uuid;
  v_actor uuid;
  v_vertical uuid;
  v_vertical_slug text;
  v_id uuid;
  v_current integer;
  v_development uuid;
  v_partner uuid;
  v_product_type text;
  v_segment text;
  v_attributes jsonb;
begin
  select id into v_org
  from public.organizations
  where slug = 'conecta-futura-casa';

  if not (
    public.has_permission(v_org, 'catalog.edit')
    or public.has_permission(v_org, 'catalog.manage')
    or public.has_organization_role(v_org, array['owner','manager']::public.organization_role[])
  ) then
    raise exception 'permission_denied';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object'
     or octet_length(coalesce(p_payload, '{}'::jsonb)::text) > 65536
  then
    raise exception 'invalid_payload';
  end if;

  v_actor := public.current_profile_id(v_org);
  if v_actor is null then
    raise exception 'active_profile_required';
  end if;

  v_segment := coalesce(
    nullif(p_payload->'metadata'->>'connector_segment', ''),
    nullif(p_payload->'metadata'->>'segment', ''),
    nullif(p_payload->>'vertical_slug', ''),
    ''
  );

  v_product_type := coalesce(
    nullif(p_payload->>'product_type', ''),
    case v_segment
      when 'imoveis' then 'real_estate'
      when 'real_estate' then 'real_estate'
      when 'veiculos' then 'vehicle'
      when 'vehicles' then 'vehicle'
      when 'vehicle' then 'vehicle'
      when 'perfumaria' then 'beauty'
      when 'perfumaria-beleza' then 'beauty'
      when 'beauty' then 'beauty'
      when 'energia-solar' then 'solar'
      when 'solar' then 'solar'
      when 'agronegocio' then 'service'
      when 'agribusiness' then 'service'
      when 'turismo' then 'tourism'
      when 'tourism' then 'tourism'
      when 'seguros' then 'insurance'
      when 'insurance' then 'insurance'
      when 'consorcios' then 'consortium'
      when 'consortium' then 'consortium'
      when 'saude' then 'service'
      when 'health' then 'service'
      when 'educacao' then 'education'
      when 'education' then 'education'
      when 'tecnologia' then 'service'
      when 'technology' then 'service'
      when 'construcao' then 'service'
      when 'construction' then 'service'
      when 'moda' then 'retail'
      when 'fashion' then 'retail'
      when 'investimentos' then 'service'
      when 'investments' then 'service'
      when 'outros' then 'other'
      when 'other' then 'other'
      else null
    end,
    'other'
  );

  if v_product_type not in (
    'real_estate','vehicle','perfumery','beauty','insurance','consortium',
    'energy','solar','tourism','education','service','retail','other'
  ) then
    raise exception 'invalid_product_type';
  end if;

  v_vertical_slug := coalesce(
    nullif(p_payload->>'vertical_slug', ''),
    case v_segment
      when 'imoveis' then 'imoveis'
      when 'real_estate' then 'imoveis'
      when 'veiculos' then 'veiculos'
      when 'vehicles' then 'veiculos'
      when 'vehicle' then 'veiculos'
      when 'perfumaria' then 'perfumaria-beleza'
      when 'perfumaria-beleza' then 'perfumaria-beleza'
      when 'beauty' then 'perfumaria-beleza'
      when 'energia-solar' then 'energia-solar'
      when 'solar' then 'energia-solar'
      when 'agronegocio' then 'agronegocio'
      when 'agribusiness' then 'agronegocio'
      when 'turismo' then 'turismo'
      when 'tourism' then 'turismo'
      when 'seguros' then 'seguros'
      when 'insurance' then 'seguros'
      when 'consorcios' then 'consorcios'
      when 'consortium' then 'consorcios'
      when 'saude' then 'saude'
      when 'health' then 'saude'
      when 'educacao' then 'educacao'
      when 'education' then 'educacao'
      when 'tecnologia' then 'tecnologia'
      when 'technology' then 'tecnologia'
      when 'construcao' then 'construcao'
      when 'construction' then 'construcao'
      when 'moda' then 'moda'
      when 'fashion' then 'moda'
      when 'investimentos' then 'investimentos'
      when 'investments' then 'investimentos'
      when 'outros' then 'outros'
      when 'other' then 'outros'
      else null
    end,
    case v_product_type
      when 'real_estate' then 'imoveis'
      when 'vehicle' then 'veiculos'
      when 'perfumery' then 'perfumaria-beleza'
      when 'beauty' then 'perfumaria-beleza'
      when 'insurance' then 'seguros'
      when 'consortium' then 'consorcios'
      when 'energy' then 'energia-solar'
      when 'solar' then 'energia-solar'
      when 'tourism' then 'turismo'
      when 'education' then 'educacao'
      when 'retail' then 'moda'
      when 'other' then 'outros'
      else 'servicos'
    end
  );

  select id into v_vertical
  from public.verticals
  where organization_id = v_org
    and slug = v_vertical_slug
    and status = 'active'
  limit 1;

  if v_vertical is null then
    raise exception 'vertical_not_found';
  end if;

  v_attributes := coalesce(
    case when jsonb_typeof(p_payload->'attributes') = 'object' then p_payload->'attributes' end,
    case when jsonb_typeof(p_payload->'metadata'->'attributes') = 'object' then p_payload->'metadata'->'attributes' end,
    '{}'::jsonb
  );

  if coalesce(p_payload->>'slug', '') !~ '^[a-z0-9-]{2,80}$'
     or char_length(trim(coalesce(p_payload->>'name', ''))) not between 2 and 160
     or char_length(coalesce(p_payload->>'description', '')) > 12000
     or jsonb_typeof(coalesce(p_payload->'metadata', '{}'::jsonb)) <> 'object'
     or jsonb_typeof(v_attributes) <> 'object'
  then
    raise exception 'invalid_product';
  end if;

  v_development := nullif(p_payload->>'development_id', '')::uuid;
  v_partner := nullif(p_payload->>'partner_id', '')::uuid;

  if v_product_type <> 'real_estate' then
    v_development := null;
  elsif v_development is not null and not exists (
    select 1
    from public.developments d
    where d.id = v_development
      and d.organization_id = v_org
      and d.status <> 'archived'
  ) then
    raise exception 'invalid_development';
  end if;

  if v_partner is not null and not exists (
    select 1
    from public.business_partners b
    where b.id = v_partner
      and b.organization_id = v_org
      and b.status in ('pending','active','paused')
  ) then
    raise exception 'invalid_partner';
  end if;

  if p_product_id is null then
    insert into public.products (
      organization_id, vertical_id, partner_id, name, slug, legal_name, category,
      target_audience, service_region, description, minimum_ticket_cents,
      maximum_ticket_cents, lead_sla_minutes, training_required, status,
      public_visibility, commercial_status, metadata, workflow_status, created_by,
      product_type, brand, model, sku, condition, attributes
    ) values (
      v_org, v_vertical, v_partner, trim(p_payload->>'name'), p_payload->>'slug',
      nullif(trim(p_payload->>'legal_name'), ''), trim(coalesce(p_payload->>'category', '')),
      trim(coalesce(p_payload->>'target_audience', '')),
      trim(coalesce(p_payload->>'service_region', '')),
      coalesce(p_payload->>'description', ''),
      nullif(p_payload->>'minimum_ticket_cents', '')::bigint,
      nullif(p_payload->>'maximum_ticket_cents', '')::bigint,
      coalesce(nullif(p_payload->>'lead_sla_minutes', '')::integer, 30),
      coalesce(nullif(p_payload->>'training_required', '')::boolean, true),
      'draft', false, 'planning', coalesce(p_payload->'metadata', '{}'::jsonb),
      'draft', v_actor, v_product_type,
      coalesce(nullif(trim(p_payload->>'brand'), ''), nullif(trim(v_attributes->>'brand'), '')),
      coalesce(nullif(trim(p_payload->>'model'), ''), nullif(trim(v_attributes->>'model_version'), '')),
      nullif(trim(p_payload->>'sku'), ''), nullif(trim(p_payload->>'condition'), ''),
      v_attributes
    )
    returning id into v_id;
  else
    select lock_version into v_current
    from public.products
    where id = p_product_id and organization_id = v_org
    for update;

    if v_current is null then raise exception 'product_not_found'; end if;
    if p_expected_lock_version is not null and p_expected_lock_version <> v_current then
      raise exception 'stale_catalog_version';
    end if;

    update public.products set
      vertical_id = v_vertical,
      partner_id = v_partner,
      name = trim(p_payload->>'name'),
      slug = p_payload->>'slug',
      legal_name = nullif(trim(p_payload->>'legal_name'), ''),
      category = trim(coalesce(p_payload->>'category', '')),
      target_audience = trim(coalesce(p_payload->>'target_audience', '')),
      service_region = trim(coalesce(p_payload->>'service_region', '')),
      description = coalesce(p_payload->>'description', ''),
      minimum_ticket_cents = nullif(p_payload->>'minimum_ticket_cents', '')::bigint,
      maximum_ticket_cents = nullif(p_payload->>'maximum_ticket_cents', '')::bigint,
      lead_sla_minutes = coalesce(nullif(p_payload->>'lead_sla_minutes', '')::integer, lead_sla_minutes),
      training_required = coalesce(nullif(p_payload->>'training_required', '')::boolean, training_required),
      metadata = coalesce(p_payload->'metadata', metadata),
      product_type = v_product_type,
      brand = coalesce(nullif(trim(p_payload->>'brand'), ''), nullif(trim(v_attributes->>'brand'), '')),
      model = coalesce(nullif(trim(p_payload->>'model'), ''), nullif(trim(v_attributes->>'model_version'), '')),
      sku = nullif(trim(p_payload->>'sku'), ''),
      condition = nullif(trim(p_payload->>'condition'), ''),
      attributes = v_attributes,
      workflow_status = 'draft',
      lock_version = lock_version + 1,
      updated_at = now()
    where id = p_product_id and organization_id = v_org
    returning id into v_id;
  end if;

  update public.development_products
  set active = false, is_primary = false
  where organization_id = v_org and product_id = v_id;

  if v_product_type = 'real_estate' and v_development is not null then
    insert into public.development_products (
      organization_id, development_id, product_id, is_primary, active
    ) values (
      v_org, v_development, v_id, true, true
    )
    on conflict (development_id, product_id)
    do update set active = true, is_primary = true;
  end if;

  if v_product_type <> 'real_estate' then
    update public.products
    set legacy_development_id = null
    where id = v_id;
  end if;

  perform private.record_catalog_revision(
    v_org, 'product', v_id, 'draft',
    coalesce(nullif(p_payload->>'change_summary', ''), 'Cadastro ou edição de produto.'),
    v_actor
  );

  insert into private.audit_logs (
    organization_id, actor_profile_id, action, entity_type, entity_id, metadata
  ) values (
    v_org, v_actor, 'catalog.product_draft_saved', 'product', v_id,
    jsonb_build_object(
      'lock_version', (select lock_version from public.products where id = v_id),
      'product_type', v_product_type,
      'vertical_slug', v_vertical_slug,
      'connector_segment', nullif(p_payload->'metadata'->>'connector_segment', '')
    )
  );

  return private.catalog_entity_snapshot('product', v_id);
end
$function$;

comment on function public.admin_upsert_product_v2(uuid, jsonb, integer) is
'Creates and edits multi-category products. The canonical commercial category may be supplied through metadata.connector_segment or metadata.segment and is aligned with the connector DNA taxonomy.';
