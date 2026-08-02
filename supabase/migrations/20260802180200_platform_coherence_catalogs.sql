-- Rede Conecta Platform Coherence v3
-- Administrative catalogs used by the unified opportunity center and controladoria.

create or replace function public.admin_specialist_financial_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare v_org uuid;
begin
  select id into v_org from public.organizations where slug='conecta-futura-casa';
  if not (
    public.has_permission(v_org,'rewards.manage')
    or public.has_permission(v_org,'payouts.manage')
    or public.has_permission(v_org,'brokers.manage')
    or public.has_permission(v_org,'platform.all')
    or public.has_organization_role(v_org,array['owner','manager']::public.organization_role[])
  ) then raise exception 'permission_denied'; end if;

  return jsonb_build_object(
    'summary',jsonb_build_object(
      'specialists',(select count(*) from public.broker_records b join public.profiles p on p.id=b.profile_id where b.organization_id=v_org and b.status='active' and p.status='active'),
      'products',(select count(*) from public.products p where p.organization_id=v_org and p.status<>'archived'),
      'rules',(select count(*) from public.product_specialists ps where ps.organization_id=v_org and ps.status<>'revoked'),
      'undefined_rules',(select count(*) from public.product_specialists ps where ps.organization_id=v_org and ps.status<>'revoked' and ps.commission_type='not_defined')
    ),
    'specialists',coalesce((select jsonb_agg(to_jsonb(x) order by x.display_name) from (
      select p.id profile_id,p.display_name,b.professional_type,
        case b.professional_type
          when 'real_estate_broker' then 'Corretor de imóveis'
          when 'real_estate_consultant' then 'Consultor imobiliário'
          when 'vehicle_salesperson' then 'Vendedor de veículos'
          when 'solar_consultant' then 'Consultor de energia solar'
          when 'insurance_consultant' then 'Consultor de seguros'
          when 'consortium_consultant' then 'Consultor de consórcios'
          when 'financial_consultant' then 'Consultor financeiro'
          when 'internal_sales' then 'Vendedor interno'
          else 'Especialista comercial' end professional_type_label,
        b.partner_id,bp.name partner_name,b.capacity_per_day,b.service_regions,b.status
      from public.broker_records b join public.profiles p on p.id=b.profile_id
      left join public.business_partners bp on bp.id=b.partner_id
      where b.organization_id=v_org and b.status='active' and p.status='active'
    ) x),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(to_jsonb(x) order by x.name) from (
      select p.id product_id,p.name,p.category,p.status::text,p.training_required,p.minimum_ticket_cents,p.maximum_ticket_cents,
        p.conecta_fee_basis_points,p.conecta_fee_payment_days,bp.name partner_name
      from public.products p left join public.business_partners bp on bp.id=p.partner_id
      where p.organization_id=v_org and p.status<>'archived'
    ) x),'[]'::jsonb),
    'rules',public.admin_list_specialist_financial_rules()
  );
end
$function$;

create or replace function public.admin_sdr_console(p_limit integer default 500)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare v_org uuid;
begin
  select id into v_org from public.organizations where slug='conecta-futura-casa';
  if not (
    public.has_permission(v_org,'leads.read')
    or public.has_permission(v_org,'leads.assign')
    or public.has_permission(v_org,'platform.all')
    or public.has_organization_role(v_org,array['owner','manager']::public.organization_role[])
  ) then raise exception 'permission_denied'; end if;

  return jsonb_build_object(
    'summary',jsonb_build_object(
      'pending',(select count(*) from public.connections where organization_id=v_org and sdr_status='pending'),
      'in_progress',(select count(*) from public.connections where organization_id=v_org and sdr_status='in_progress'),
      'qualified',(select count(*) from public.connections where organization_id=v_org and sdr_status='qualified'),
      'nurture',(select count(*) from public.connections where organization_id=v_org and sdr_status='nurture'),
      'ready',(select count(*) from public.connections where organization_id=v_org and human_handoff_status='ready'),
      'assigned',(select count(*) from public.connections where organization_id=v_org and human_handoff_status='assigned'),
      'average_score',(select coalesce(round(avg(sdr_score)),0) from public.connections where organization_id=v_org and sdr_score is not null)
    ),
    'leads',coalesce((select jsonb_agg(to_jsonb(x) order by x.submitted_at desc) from (
      select c.id,c.protocol,c.status::text,c.source_product_id,c.destination_product_id,c.source_product_name_snapshot,c.interest_topic,c.preferred_time,c.submitted_at,
        c.sdr_status,c.sdr_mode,c.sdr_score,c.sdr_summary,c.sdr_transcript,c.sdr_qualification,c.sdr_recommendation,c.sdr_started_at,c.sdr_completed_at,
        c.human_handoff_status,c.human_assignment_mode,c.human_handoff_at,c.assigned_operator_id,c.assigned_broker_id,c.next_action_at,
        op.display_name operator_name,br.professional_type,
        case br.professional_type
          when 'real_estate_broker' then 'Corretor de imóveis'
          when 'real_estate_consultant' then 'Consultor imobiliário'
          when 'vehicle_salesperson' then 'Vendedor de veículos'
          when 'solar_consultant' then 'Consultor de energia solar'
          when 'insurance_consultant' then 'Consultor de seguros'
          when 'consortium_consultant' then 'Consultor de consórcios'
          when 'financial_consultant' then 'Consultor financeiro'
          when 'internal_sales' then 'Vendedor interno'
          else case when op.id is null then null else 'Especialista comercial' end end operator_professional_type_label,
        p.name partner_name,cc.first_name,cc.phone,cc.email
      from public.connections c
      left join public.profiles op on op.id=c.assigned_operator_id
      left join public.broker_records br on br.profile_id=op.id
      left join public.business_partners p on p.id=c.partner_id
      left join private.connection_contacts cc on cc.connection_id=c.id
      where c.organization_id=v_org
      order by c.submitted_at desc limit greatest(1,least(p_limit,1000))
    ) x),'[]'::jsonb),
    'operators',coalesce((select jsonb_agg(to_jsonb(x) order by x.active_leads,x.display_name) from (
      select distinct p.id,p.display_name,p.role::text,p.status,br.professional_type,
        case br.professional_type
          when 'real_estate_broker' then 'Corretor de imóveis'
          when 'real_estate_consultant' then 'Consultor imobiliário'
          when 'vehicle_salesperson' then 'Vendedor de veículos'
          when 'solar_consultant' then 'Consultor de energia solar'
          when 'insurance_consultant' then 'Consultor de seguros'
          when 'consortium_consultant' then 'Consultor de consórcios'
          when 'financial_consultant' then 'Consultor financeiro'
          when 'internal_sales' then 'Vendedor interno'
          else case when p.role::text='admin' then 'Gestor da Rede Conecta' else 'Especialista comercial' end end professional_type_label,
        br.capacity_per_day,br.service_regions,
        (select count(*) from public.connections c where c.assigned_operator_id=p.id and c.status not in ('won','lost','cancelled')) active_leads
      from public.profiles p
      left join public.broker_records br on br.profile_id=p.id and br.status='active'
      where p.organization_id=v_org and p.status='active'
        and (
          p.role::text in ('admin','broker')
          or exists(
            select 1 from public.profile_access_roles par
            join public.role_permissions rp on rp.role_id=par.role_id
            where par.profile_id=p.id and par.organization_id=v_org and par.active
              and rp.permission_code in ('leads.manage','leads.assign','platform.all')
          )
        )
    ) x),'[]'::jsonb)
  );
end
$function$;

revoke all on function public.admin_specialist_financial_catalog() from public;
grant execute on function public.admin_specialist_financial_catalog() to authenticated,service_role;