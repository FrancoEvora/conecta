-- Rede Conecta Platform Coherence v3
-- Canonical specialist pipeline, commissions, notifications and assignment synchronization.

alter table public.product_specialists
  add column if not exists commission_type text not null default 'not_defined',
  add column if not exists commission_basis_points integer,
  add column if not exists commission_fixed_cents bigint,
  add column if not exists commission_payment_days integer not null default 7,
  add column if not exists commission_notes text not null default '';

alter table public.deals
  add column if not exists specialist_commission_rule_type text,
  add column if not exists specialist_commission_basis_points integer,
  add column if not exists specialist_commission_fixed_cents bigint,
  add column if not exists specialist_commission_due_at date;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='product_specialists_commission_type_check') then
    alter table public.product_specialists add constraint product_specialists_commission_type_check check (commission_type in ('not_defined','percentage','fixed'));
  end if;
  if not exists (select 1 from pg_constraint where conname='product_specialists_commission_basis_points_check') then
    alter table public.product_specialists add constraint product_specialists_commission_basis_points_check check (commission_basis_points is null or commission_basis_points between 0 and 10000);
  end if;
  if not exists (select 1 from pg_constraint where conname='product_specialists_commission_fixed_cents_check') then
    alter table public.product_specialists add constraint product_specialists_commission_fixed_cents_check check (commission_fixed_cents is null or commission_fixed_cents >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname='product_specialists_commission_payment_days_check') then
    alter table public.product_specialists add constraint product_specialists_commission_payment_days_check check (commission_payment_days between 0 and 365);
  end if;
  if not exists (select 1 from pg_constraint where conname='deals_specialist_commission_basis_points_check') then
    alter table public.deals add constraint deals_specialist_commission_basis_points_check check (specialist_commission_basis_points is null or specialist_commission_basis_points between 0 and 10000);
  end if;
  if not exists (select 1 from pg_constraint where conname='deals_specialist_commission_fixed_cents_check') then
    alter table public.deals add constraint deals_specialist_commission_fixed_cents_check check (specialist_commission_fixed_cents is null or specialist_commission_fixed_cents >= 0);
  end if;
end $$;

create table if not exists public.specialist_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  specialist_profile_id uuid not null references public.profiles(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists specialist_notifications_profile_created_idx on public.specialist_notifications(specialist_profile_id,created_at desc);
create index if not exists specialist_notifications_connection_idx on public.specialist_notifications(connection_id);
alter table public.specialist_notifications enable row level security;
revoke all on public.specialist_notifications from anon,authenticated;
grant all on public.specialist_notifications to service_role;

create or replace function private.current_specialist_profile_id()
returns uuid
language sql
stable
security definer
set search_path to ''
as $$
  select p.id
  from public.profiles p
  join public.broker_records b on b.profile_id=p.id and b.status='active'
  where p.auth_user_id=(select auth.uid())
    and p.role='broker'
    and p.status='active'
  limit 1
$$;

revoke all on function private.current_specialist_profile_id() from public;
grant execute on function private.current_specialist_profile_id() to authenticated,service_role;

create or replace function public.admin_handoff_after_sdr(
  p_connection_id uuid,
  p_mode text default 'automatic',
  p_operator_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_org uuid;
  v_actor uuid;
  v_selected uuid;
  v_selected_role text;
  v_selected_name text;
  v_previous uuid;
  v_previous_name text;
  v_product uuid;
  v_product_training boolean;
  v_connector uuid;
  v_protocol text;
  v_is_reassignment boolean:=false;
begin
  select c.organization_id,c.assigned_operator_id,coalesce(c.destination_product_id,c.source_product_id),c.connector_profile_id,c.protocol
    into v_org,v_previous,v_product,v_connector,v_protocol
  from public.connections c where c.id=p_connection_id for update;
  if v_org is null then raise exception 'connection_not_found'; end if;
  if not (
    public.has_permission(v_org,'leads.assign')
    or public.has_permission(v_org,'platform.all')
    or public.has_organization_role(v_org,array['owner','manager']::public.organization_role[])
  ) then raise exception 'permission_denied'; end if;
  if p_mode not in ('automatic','manual') then raise exception 'invalid_assignment_mode'; end if;

  if p_mode='manual' then
    if p_operator_id is null then raise exception 'operator_required'; end if;
    select p.id,p.role::text,p.display_name into v_selected,v_selected_role,v_selected_name
    from public.profiles p
    where p.id=p_operator_id and p.organization_id=v_org and p.status='active'
      and (
        p.role::text in ('admin','broker')
        or exists(
          select 1 from public.profile_access_roles par
          join public.role_permissions rp on rp.role_id=par.role_id
          where par.profile_id=p.id and par.organization_id=v_org and par.active
            and rp.permission_code in ('leads.manage','leads.assign','platform.all')
        )
      );
  else
    select candidate.id,candidate.role::text,candidate.display_name
      into v_selected,v_selected_role,v_selected_name
    from public.profiles candidate
    left join public.broker_records br on br.profile_id=candidate.id and br.status='active'
    left join public.product_specialists ps on ps.profile_id=candidate.id and ps.product_id=v_product and ps.status in ('enabled','pending_training')
    where candidate.organization_id=v_org and candidate.status='active'
      and (
        candidate.role::text='broker'
        or exists(
          select 1 from public.profile_access_roles par
          join public.role_permissions rp on rp.role_id=par.role_id
          where par.profile_id=candidate.id and par.organization_id=v_org and par.active
            and rp.permission_code in ('leads.manage','leads.assign','platform.all')
        )
      )
    order by
      case when ps.status='enabled' then 0 when ps.status='pending_training' then 1 when candidate.role::text='broker' then 2 else 3 end,
      case when br.capacity_per_day is null or br.capacity_per_day=0 then 0 else
        (select count(*)::numeric/br.capacity_per_day from public.connections x where x.assigned_operator_id=candidate.id and x.status not in ('won','lost','cancelled')) end,
      (select count(*) from public.connections x where x.assigned_operator_id=candidate.id and x.status not in ('won','lost','cancelled')),
      candidate.created_at
    limit 1;
  end if;

  if v_selected is null then raise exception 'eligible_operator_required'; end if;
  v_actor:=public.current_profile_id(v_org);
  if v_actor is null then raise exception 'active_profile_required'; end if;
  select display_name into v_previous_name from public.profiles where id=v_previous;
  v_is_reassignment:=v_previous is not null and v_previous<>v_selected;

  update public.connections set
    assigned_operator_id=v_selected,
    assigned_broker_id=case when v_selected_role='broker' then v_selected else null end,
    human_assignment_mode=p_mode,
    human_handoff_status='assigned',
    human_handoff_at=now(),
    status=case when status in ('won','lost','cancelled') then status else 'assigned' end,
    accepted_at=case when v_previous is distinct from v_selected then null else accepted_at end,
    last_activity_at=now(),
    updated_at=now()
  where id=p_connection_id;

  update public.broker_assignments set unassigned_at=now()
  where connection_id=p_connection_id and unassigned_at is null;

  if v_selected_role='broker' then
    insert into public.broker_assignments(connection_id,broker_profile_id,assigned_by)
    values(p_connection_id,v_selected,v_actor);

    if v_product is not null then
      select training_required into v_product_training from public.products where id=v_product;
      insert into public.product_specialists(
        organization_id,product_id,profile_id,status,training_compliant,priority,invited_by,enabled_at,notes
      ) values(
        v_org,v_product,v_selected,
        case when coalesce(v_product_training,false) then 'pending_training'::public.product_specialist_status else 'enabled'::public.product_specialist_status end,
        not coalesce(v_product_training,false),100,v_actor,
        case when coalesce(v_product_training,false) then null else now() end,
        'Vínculo criado pela distribuição administrativa de atendimento.'
      )
      on conflict(product_id,profile_id) do update set
        status=case when public.product_specialists.status in ('revoked','paused') then excluded.status else public.product_specialists.status end,
        training_compliant=case when public.product_specialists.status in ('revoked','paused') then excluded.training_compliant else public.product_specialists.training_compliant end,
        revoked_at=null,
        updated_at=now();
    end if;

    insert into public.specialist_notifications(
      organization_id,specialist_profile_id,connection_id,notification_type,title,body,metadata
    ) values(
      v_org,v_selected,p_connection_id,
      case when v_is_reassignment then 'connection_reassigned' else 'connection_assigned' end,
      case when v_is_reassignment then 'Novo atendimento redistribuído para você' else 'Novo atendimento atribuído' end,
      'Abra sua carteira para consultar o contato, o produto, o briefing do SDR e o prazo da próxima ação.',
      jsonb_build_object('protocol',v_protocol,'previous_operator_id',v_previous,'mode',p_mode)
    );
  end if;

  if v_connector is not null then
    insert into public.connector_notifications(
      organization_id,connector_profile_id,connection_id,notification_type,title,body,metadata
    ) values(
      v_org,v_connector,p_connection_id,'connection_assigned','Atendimento encaminhado',
      'Sua conexão foi encaminhada para '||coalesce(v_selected_name,'um especialista da Rede Conecta')||'. A origem continua protegida.',
      jsonb_build_object('operator_id',v_selected,'operator_name',v_selected_name,'mode',p_mode)
    );
  end if;

  insert into public.connection_activities(
    organization_id,connection_id,actor_profile_id,activity_type,title,notes,metadata
  ) values(
    v_org,p_connection_id,v_actor,'human_handoff',
    case when v_is_reassignment then 'Atendimento redistribuído pela administração' else 'Atendimento distribuído pela administração' end,
    case when p_mode='automatic' then 'Distribuição automática por elegibilidade e carga.' else 'Distribuição manual realizada pela gestão.' end,
    jsonb_build_object('operator_id',v_selected,'operator_name',v_selected_name,'previous_operator_id',v_previous,'previous_operator_name',v_previous_name,'operator_role',v_selected_role,'mode',p_mode,'sdr_status_at_assignment',(select sdr_status from public.connections where id=p_connection_id))
  );

  insert into private.audit_logs(organization_id,actor_profile_id,action,entity_type,entity_id,metadata)
  values(v_org,v_actor,case when v_is_reassignment then 'connection.reassigned_anytime' else 'connection.assigned_anytime' end,'connection',p_connection_id,
    jsonb_build_object('operator_id',v_selected,'operator_name',v_selected_name,'previous_operator_id',v_previous,'previous_operator_name',v_previous_name,'operator_role',v_selected_role,'mode',p_mode));

  return jsonb_build_object('connection_id',p_connection_id,'operator_id',v_selected,'operator_name',v_selected_name,'previous_operator_id',v_previous,'operator_role',v_selected_role,'mode',p_mode,'reassigned',v_is_reassignment,'status','assigned');
end
$function$;

create or replace function public.specialist_portal_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_profile uuid;
  v_org uuid;
begin
  v_profile:=private.current_specialist_profile_id();
  if v_profile is null then raise exception 'active_specialist_required'; end if;
  select organization_id into v_org from public.profiles where id=v_profile;

  return jsonb_build_object(
    'specialist',(
      select jsonb_build_object(
        'profile_id',p.id,'display_name',p.display_name,'status',p.status,
        'professional_type',b.professional_type,
        'professional_type_label',case b.professional_type
          when 'real_estate_broker' then 'Corretor de imóveis'
          when 'real_estate_consultant' then 'Consultor imobiliário'
          when 'vehicle_salesperson' then 'Vendedor de veículos'
          when 'solar_consultant' then 'Consultor de energia solar'
          when 'insurance_consultant' then 'Consultor de seguros'
          when 'consortium_consultant' then 'Consultor de consórcios'
          when 'financial_consultant' then 'Consultor financeiro'
          when 'internal_sales' then 'Vendedor interno'
          else 'Especialista comercial' end,
        'credential_type',coalesce(b.credential_type,case when b.creci_number is not null then 'CRECI' end),
        'credential_number',coalesce(b.credential_number,b.creci_number),
        'credential_state',coalesce(b.credential_state,b.creci_state),
        'operating_mode',b.operating_mode,'service_regions',b.service_regions,'capacity_per_day',b.capacity_per_day,
        'partner_name',bp.name
      )
      from public.profiles p join public.broker_records b on b.profile_id=p.id
      left join public.business_partners bp on bp.id=b.partner_id
      where p.id=v_profile
    ),
    'summary',jsonb_build_object(
      'new_assignments',(select count(*) from public.connections c where c.assigned_operator_id=v_profile and c.status='assigned'),
      'active_pipeline',(select count(*) from public.connections c where c.assigned_operator_id=v_profile and c.status not in ('won','lost','cancelled')),
      'contacted',(select count(*) from public.connections c where c.assigned_operator_id=v_profile and c.status in ('contacted','qualified','visit_scheduled','proposal')),
      'proposals',(select count(*) from public.connections c where c.assigned_operator_id=v_profile and c.status='proposal'),
      'won',(select count(*) from public.connections c where c.assigned_operator_id=v_profile and c.status='won'),
      'overdue_actions',(select count(*) from public.connections c where c.assigned_operator_id=v_profile and c.status not in ('won','lost','cancelled') and c.next_action_at<now()),
      'sales_value_cents',(select coalesce(sum(d.gross_value_cents),0) from public.deals d where d.assigned_operator_id=v_profile and d.status in ('contracted','validated')),
      'commission_expected_cents',(select coalesce(sum(d.specialist_commission_cents),0) from public.deals d where d.assigned_operator_id=v_profile and d.status in ('contracted','validated')),
      'commission_open_cents',(select coalesce(sum(l.amount_cents),0) from public.deal_financial_ledger l join public.deals d on d.id=l.deal_id where d.assigned_operator_id=v_profile and l.entry_type='specialist_commission' and l.status in ('expected','due','scheduled')),
      'commission_paid_cents',(select coalesce(sum(l.amount_cents),0) from public.deal_financial_ledger l join public.deals d on d.id=l.deal_id where d.assigned_operator_id=v_profile and l.entry_type='specialist_commission_payment' and l.status='paid'),
      'unread_notifications',(select count(*) from public.specialist_notifications n where n.specialist_profile_id=v_profile and n.read_at is null)
    ),
    'pipeline',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.updated_at desc) from (
        select c.id,c.protocol,c.status::text,c.source_product_id,c.destination_product_id,c.source_product_name_snapshot,c.interest_topic,c.preferred_time,c.submitted_at,c.accepted_at,c.contacted_at,c.last_activity_at,c.next_action_at,c.updated_at,c.sdr_status,c.sdr_score,c.sdr_summary,c.sdr_qualification,c.sdr_recommendation,c.human_handoff_at,c.origin_social_channel,
          cc.first_name contact_name,cc.phone contact_phone,cc.email contact_email,
          cp.display_name connector_name,
          coalesce(p2.name,p1.name,c.source_product_name_snapshot) product_name,
          coalesce(p2.category,p1.category) product_category,
          coalesce(p2.service_region,p1.service_region) service_region,
          d.id deal_id,d.status deal_status,d.deal_number,d.unit_reference,d.gross_value_cents,d.contract_signed_at,d.validated_at,d.specialist_commission_cents,d.specialist_commission_paid_cents,d.specialist_commission_due_at,
          ps.commission_type,ps.commission_basis_points,ps.commission_fixed_cents,ps.commission_payment_days,ps.commission_notes,ps.training_compliant,ps.status::text product_specialist_status,
          case when ps.commission_type='fixed' then ps.commission_fixed_cents when ps.commission_type='percentage' and coalesce(p2.minimum_ticket_cents,p1.minimum_ticket_cents) is not null then round(coalesce(p2.minimum_ticket_cents,p1.minimum_ticket_cents)*ps.commission_basis_points/10000.0)::bigint end commission_estimate_min_cents,
          case when ps.commission_type='fixed' then ps.commission_fixed_cents when ps.commission_type='percentage' and coalesce(p2.maximum_ticket_cents,p1.maximum_ticket_cents,p2.minimum_ticket_cents,p1.minimum_ticket_cents) is not null then round(coalesce(p2.maximum_ticket_cents,p1.maximum_ticket_cents,p2.minimum_ticket_cents,p1.minimum_ticket_cents)*ps.commission_basis_points/10000.0)::bigint end commission_estimate_max_cents,
          coalesce((select jsonb_agg(jsonb_build_object('from',h.from_status,'to',h.to_status,'note',h.note,'at',h.created_at) order by h.created_at) from public.connection_status_history h where h.connection_id=c.id),'[]'::jsonb) timeline
        from public.connections c
        left join private.connection_contacts cc on cc.connection_id=c.id
        left join public.profiles cp on cp.id=c.connector_profile_id
        left join public.products p1 on p1.id=c.source_product_id
        left join public.products p2 on p2.id=c.destination_product_id
        left join lateral(select d1.* from public.deals d1 where d1.connection_id=c.id order by d1.created_at desc limit 1) d on true
        left join public.product_specialists ps on ps.profile_id=v_profile and ps.product_id=coalesce(c.destination_product_id,c.source_product_id)
        where c.assigned_operator_id=v_profile or c.assigned_broker_id=v_profile
      ) x
    ),'[]'::jsonb),
    'products',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.product_name) from (
        select p.id product_id,p.name product_name,p.category,p.service_region,p.status::text product_status,p.training_required,p.minimum_ticket_cents,p.maximum_ticket_cents,
          ps.status::text assignment_status,ps.training_compliant,ps.commission_type,ps.commission_basis_points,ps.commission_fixed_cents,ps.commission_payment_days,ps.commission_notes,
          (select count(*) from public.connections c where c.assigned_operator_id=v_profile and coalesce(c.destination_product_id,c.source_product_id)=p.id and c.status not in ('won','lost','cancelled')) active_connections,
          (select count(*) from public.connections c where c.assigned_operator_id=v_profile and coalesce(c.destination_product_id,c.source_product_id)=p.id and c.status='won') won_connections
        from public.product_specialists ps join public.products p on p.id=ps.product_id
        where ps.profile_id=v_profile and ps.status in ('enabled','pending_training','paused')
      ) x
    ),'[]'::jsonb),
    'commissions',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.reference_date desc) from (
        select d.id,d.deal_number,d.status deal_status,d.gross_value_cents,d.specialist_commission_cents,d.specialist_commission_paid_cents,d.specialist_commission_due_at,
          coalesce(d.validated_at,d.contract_signed_at,d.created_at) reference_date,p.name product_name,c.protocol,
          coalesce((select sum(l.amount_cents) from public.deal_financial_ledger l where l.deal_id=d.id and l.entry_type='specialist_commission_payment' and l.status='paid'),0) paid_ledger_cents
        from public.deals d join public.connections c on c.id=d.connection_id left join public.products p on p.id=d.product_id
        where d.assigned_operator_id=v_profile
      ) x
    ),'[]'::jsonb),
    'notifications',coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc) from public.specialist_notifications n where n.specialist_profile_id=v_profile),'[]'::jsonb)
  );
end
$function$;

create or replace function public.specialist_accept_connection(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare v_profile uuid; v_c public.connections%rowtype; v_connector uuid;
begin
  v_profile:=private.current_specialist_profile_id();
  if v_profile is null then raise exception 'active_specialist_required'; end if;
  select * into v_c from public.connections where id=p_connection_id and assigned_operator_id=v_profile for update;
  if v_c.id is null then raise exception 'connection_not_assigned_to_specialist'; end if;
  if v_c.status in ('won','lost','cancelled') then raise exception 'connection_closed'; end if;
  if v_c.status in ('new','assigned') then
    update public.connections set status='accepted',accepted_at=now(),last_activity_at=now(),updated_at=now() where id=p_connection_id;
    insert into public.connection_status_history(connection_id,from_status,to_status,changed_by,note) values(p_connection_id,v_c.status,'accepted',v_profile,'Atendimento aceito pelo especialista.');
    insert into public.connection_activities(organization_id,connection_id,actor_profile_id,activity_type,title,notes) values(v_c.organization_id,p_connection_id,v_profile,'status_change','Atendimento aceito','O especialista assumiu o atendimento.');
  end if;
  v_connector:=v_c.connector_profile_id;
  if v_connector is not null then
    insert into public.connector_notifications(organization_id,connector_profile_id,connection_id,notification_type,title,body,metadata)
    values(v_c.organization_id,v_connector,p_connection_id,'specialist_accepted','Atendimento aceito','O especialista responsável aceitou o atendimento. A origem continua protegida.',jsonb_build_object('specialist_profile_id',v_profile));
  end if;
  return jsonb_build_object('connection_id',p_connection_id,'status','accepted');
end
$function$;

create or replace function public.specialist_update_connection_stage(
  p_connection_id uuid,
  p_to_status text,
  p_note text default '',
  p_next_action_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_profile uuid;
  v_c public.connections%rowtype;
  v_to public.connection_status;
  v_connector uuid;
  v_title text;
  v_body text;
begin
  v_profile:=private.current_specialist_profile_id();
  if v_profile is null then raise exception 'active_specialist_required'; end if;
  select * into v_c from public.connections where id=p_connection_id and assigned_operator_id=v_profile for update;
  if v_c.id is null then raise exception 'connection_not_assigned_to_specialist'; end if;
  if v_c.status in ('won','lost','cancelled') then raise exception 'connection_closed'; end if;
  if p_to_status not in ('accepted','contacted','qualified','visit_scheduled','proposal','lost') then raise exception 'invalid_specialist_stage'; end if;
  v_to:=p_to_status::public.connection_status;
  update public.connections set
    status=v_to,
    accepted_at=case when v_to='accepted' then coalesce(accepted_at,now()) else accepted_at end,
    contacted_at=case when v_to='contacted' then coalesce(contacted_at,now()) else contacted_at end,
    closed_at=case when v_to='lost' then now() else closed_at end,
    loss_reason=case when v_to='lost' then left(coalesce(p_note,''),1000) else loss_reason end,
    next_action_at=p_next_action_at,
    last_activity_at=now(),updated_at=now()
  where id=p_connection_id;
  insert into public.connection_status_history(connection_id,from_status,to_status,changed_by,note) values(p_connection_id,v_c.status,v_to,v_profile,left(coalesce(p_note,''),500));
  insert into public.connection_activities(organization_id,connection_id,actor_profile_id,activity_type,title,notes,next_action_at)
  values(v_c.organization_id,p_connection_id,v_profile,'status_change','Etapa atualizada para '||p_to_status,left(coalesce(p_note,''),2000),p_next_action_at);

  v_connector:=v_c.connector_profile_id;
  if v_connector is not null and p_to_status in ('contacted','visit_scheduled','proposal','lost') then
    v_title:=case p_to_status when 'contacted' then 'Contato iniciado' when 'visit_scheduled' then 'Reunião ou visita agendada' when 'proposal' then 'Proposta apresentada' else 'Negociação encerrada' end;
    v_body:=case p_to_status when 'contacted' then 'O especialista iniciou o atendimento da sua conexão.' when 'visit_scheduled' then 'A oportunidade avançou para uma reunião ou visita.' when 'proposal' then 'A oportunidade avançou para proposta.' else 'A negociação foi encerrada sem venda neste momento.' end;
    insert into public.connector_notifications(organization_id,connector_profile_id,connection_id,notification_type,title,body,metadata)
    values(v_c.organization_id,v_connector,p_connection_id,'connection_'||p_to_status,v_title,v_body,jsonb_build_object('specialist_profile_id',v_profile));
  end if;
  insert into private.audit_logs(organization_id,actor_profile_id,action,entity_type,entity_id,metadata)
  values(v_c.organization_id,v_profile,'specialist.connection_stage_updated','connection',p_connection_id,jsonb_build_object('from',v_c.status,'to',v_to,'next_action_at',p_next_action_at));
  return jsonb_build_object('connection_id',p_connection_id,'status',v_to,'next_action_at',p_next_action_at);
end
$function$;

create or replace function public.specialist_report_sale(p_connection_id uuid,p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_profile uuid;
  v_c public.connections%rowtype;
  v_product uuid;
  v_ps public.product_specialists%rowtype;
  v_deal public.deals%rowtype;
  v_gross bigint;
  v_commission bigint:=0;
  v_due date;
  v_connector uuid;
  v_old_status public.connection_status;
begin
  v_profile:=private.current_specialist_profile_id();
  if v_profile is null then raise exception 'active_specialist_required'; end if;
  select * into v_c from public.connections where id=p_connection_id and assigned_operator_id=v_profile for update;
  if v_c.id is null then raise exception 'connection_not_assigned_to_specialist'; end if;
  if jsonb_typeof(coalesce(p_payload,'{}'::jsonb))<>'object' then raise exception 'invalid_payload'; end if;
  v_gross:=nullif(p_payload->>'gross_value_cents','')::bigint;
  if v_gross is null or v_gross<=0 then raise exception 'gross_value_required'; end if;
  v_product:=coalesce(nullif(p_payload->>'product_id','')::uuid,v_c.destination_product_id,v_c.source_product_id);
  select * into v_ps from public.product_specialists where profile_id=v_profile and product_id=v_product;
  if v_ps.commission_type='percentage' then v_commission:=round(v_gross*coalesce(v_ps.commission_basis_points,0)/10000.0)::bigint;
  elsif v_ps.commission_type='fixed' then v_commission:=coalesce(v_ps.commission_fixed_cents,0);
  end if;
  v_due:=current_date+coalesce(v_ps.commission_payment_days,7);
  select * into v_deal from public.deals where connection_id=p_connection_id order by created_at desc limit 1 for update;
  if v_deal.id is null then
    insert into public.deals(
      organization_id,connection_id,partner_id,product_id,assigned_operator_id,status,deal_number,unit_reference,gross_value_cents,contract_signed_at,evidence_status,notes,metadata,created_by,
      specialist_commission_rule_type,specialist_commission_basis_points,specialist_commission_fixed_cents,specialist_commission_cents,specialist_commission_due_at
    ) values(
      v_c.organization_id,v_c.id,v_c.partner_id,v_product,v_profile,'contracted',nullif(p_payload->>'deal_number',''),nullif(p_payload->>'unit_reference',''),v_gross,
      coalesce(nullif(p_payload->>'contract_signed_at','')::timestamptz,now()),'pending',left(coalesce(p_payload->>'notes',''),4000),
      jsonb_build_object('reported_by_specialist',true,'evidence_reference',coalesce(p_payload->>'evidence_reference','')),
      v_profile,v_ps.commission_type,v_ps.commission_basis_points,v_ps.commission_fixed_cents,v_commission,v_due
    ) returning * into v_deal;
    insert into public.deal_status_history(organization_id,deal_id,to_status,changed_by,reason)
    values(v_c.organization_id,v_deal.id,'contracted',v_profile,'Venda informada pelo especialista e enviada para validação.');
  else
    update public.deals set
      product_id=v_product,assigned_operator_id=v_profile,status='contracted',deal_number=coalesce(nullif(p_payload->>'deal_number',''),deal_number),unit_reference=coalesce(nullif(p_payload->>'unit_reference',''),unit_reference),gross_value_cents=v_gross,
      contract_signed_at=coalesce(nullif(p_payload->>'contract_signed_at','')::timestamptz,contract_signed_at,now()),evidence_status='pending',notes=left(coalesce(p_payload->>'notes',notes),4000),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('reported_by_specialist',true,'evidence_reference',coalesce(p_payload->>'evidence_reference','')),
      specialist_commission_rule_type=v_ps.commission_type,specialist_commission_basis_points=v_ps.commission_basis_points,specialist_commission_fixed_cents=v_ps.commission_fixed_cents,
      specialist_commission_cents=v_commission,specialist_commission_due_at=v_due,updated_at=now()
    where id=v_deal.id returning * into v_deal;
  end if;

  v_old_status:=v_c.status;
  if v_c.status not in ('won','lost','cancelled') then
    update public.connections set status='proposal',last_activity_at=now(),updated_at=now() where id=p_connection_id;
    if v_old_status<>'proposal' then insert into public.connection_status_history(connection_id,from_status,to_status,changed_by,note) values(p_connection_id,v_old_status,'proposal',v_profile,'Venda informada; aguardando validação da Rede Conecta.'); end if;
  end if;
  if v_commission>0 and not exists(select 1 from public.deal_financial_ledger where deal_id=v_deal.id and entry_type='specialist_commission' and status<>'cancelled') then
    insert into public.deal_financial_ledger(organization_id,deal_id,product_id,entry_type,status,amount_cents,due_at,description,created_by,metadata)
    values(v_c.organization_id,v_deal.id,v_product,'specialist_commission','expected',v_commission,v_due,'Comissão esperada do especialista',v_profile,jsonb_build_object('rule_type',v_ps.commission_type,'basis_points',v_ps.commission_basis_points,'fixed_cents',v_ps.commission_fixed_cents));
  end if;
  insert into public.specialist_notifications(organization_id,specialist_profile_id,connection_id,deal_id,notification_type,title,body,metadata)
  values(v_c.organization_id,v_profile,p_connection_id,v_deal.id,'sale_reported','Venda enviada para validação',case when v_commission>0 then 'A venda foi registrada. Sua comissão esperada foi calculada e permanece sujeita à validação e recebimento.' else 'A venda foi registrada. A regra de comissão ainda precisa ser definida pela gestão.' end,jsonb_build_object('gross_value_cents',v_gross,'commission_cents',v_commission));
  v_connector:=v_c.connector_profile_id;
  if v_connector is not null then
    insert into public.connector_notifications(organization_id,connector_profile_id,connection_id,deal_id,notification_type,title,body,metadata)
    values(v_c.organization_id,v_connector,p_connection_id,v_deal.id,'deal_contracted','Venda informada','O especialista informou a conclusão do negócio. A operação aguarda validação da Rede Conecta.',jsonb_build_object('gross_value_cents',v_gross));
  end if;
  insert into private.audit_logs(organization_id,actor_profile_id,action,entity_type,entity_id,metadata)
  values(v_c.organization_id,v_profile,'specialist.sale_reported','deal',v_deal.id,jsonb_build_object('connection_id',p_connection_id,'gross_value_cents',v_gross,'commission_cents',v_commission));
  return jsonb_build_object('deal_id',v_deal.id,'status','contracted','gross_value_cents',v_gross,'specialist_commission_cents',v_commission,'specialist_commission_due_at',v_due);
end
$function$;

create or replace function public.specialist_mark_notification_read(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare v_profile uuid;
begin
  v_profile:=private.current_specialist_profile_id();
  if v_profile is null then raise exception 'active_specialist_required'; end if;
  update public.specialist_notifications set read_at=coalesce(read_at,now()) where id=p_notification_id and specialist_profile_id=v_profile;
  return jsonb_build_object('notification_id',p_notification_id,'read',true);
end
$function$;

create or replace function public.admin_list_specialist_financial_rules()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare v_org uuid;
begin
  select id into v_org from public.organizations where slug='conecta-futura-casa';
  if not (public.has_permission(v_org,'rewards.manage') or public.has_permission(v_org,'payouts.manage') or public.has_permission(v_org,'brokers.manage') or public.has_permission(v_org,'platform.all') or public.has_organization_role(v_org,array['owner','manager']::public.organization_role[])) then raise exception 'permission_denied'; end if;
  return coalesce((select jsonb_agg(to_jsonb(x) order by x.specialist_name,x.product_name) from (
    select ps.id,ps.profile_id,prf.display_name specialist_name,br.professional_type,ps.product_id,p.name product_name,p.category,p.minimum_ticket_cents,p.maximum_ticket_cents,
      ps.status::text assignment_status,ps.training_compliant,ps.commission_type,ps.commission_basis_points,ps.commission_fixed_cents,ps.commission_payment_days,ps.commission_notes,
      (select count(*) from public.connections c where c.assigned_operator_id=ps.profile_id and coalesce(c.destination_product_id,c.source_product_id)=ps.product_id and c.status not in ('won','lost','cancelled')) active_connections,
      (select count(*) from public.deals d where d.assigned_operator_id=ps.profile_id and d.product_id=ps.product_id and d.status in ('contracted','validated')) closed_deals,
      (select coalesce(sum(d.specialist_commission_cents),0) from public.deals d where d.assigned_operator_id=ps.profile_id and d.product_id=ps.product_id and d.status in ('contracted','validated')) commission_expected_cents,
      (select coalesce(sum(d.specialist_commission_paid_cents),0) from public.deals d where d.assigned_operator_id=ps.profile_id and d.product_id=ps.product_id) commission_paid_cents
    from public.product_specialists ps join public.profiles prf on prf.id=ps.profile_id join public.products p on p.id=ps.product_id left join public.broker_records br on br.profile_id=ps.profile_id
    where ps.organization_id=v_org
  ) x),'[]'::jsonb);
end
$function$;

create or replace function public.admin_set_specialist_financial_rule(
  p_profile_id uuid,
  p_product_id uuid,
  p_commission_type text,
  p_basis_points integer default null,
  p_fixed_cents bigint default null,
  p_payment_days integer default 7,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare v_org uuid; v_actor uuid; v_training boolean; v_id uuid;
begin
  select id into v_org from public.organizations where slug='conecta-futura-casa';
  if not (public.has_permission(v_org,'rewards.manage') or public.has_permission(v_org,'payouts.manage') or public.has_permission(v_org,'brokers.manage') or public.has_permission(v_org,'platform.all') or public.has_organization_role(v_org,array['owner','manager']::public.organization_role[])) then raise exception 'permission_denied'; end if;
  if p_commission_type not in ('not_defined','percentage','fixed') or p_payment_days not between 0 and 365 then raise exception 'invalid_commission_rule'; end if;
  if p_commission_type='percentage' and (p_basis_points is null or p_basis_points<0 or p_basis_points>10000) then raise exception 'basis_points_required'; end if;
  if p_commission_type='fixed' and (p_fixed_cents is null or p_fixed_cents<0) then raise exception 'fixed_amount_required'; end if;
  if not exists(select 1 from public.profiles where id=p_profile_id and organization_id=v_org and role='broker' and status='active') then raise exception 'specialist_not_found'; end if;
  select training_required into v_training from public.products where id=p_product_id and organization_id=v_org;
  if v_training is null then raise exception 'product_not_found'; end if;
  v_actor:=public.current_profile_id(v_org);
  insert into public.product_specialists(
    organization_id,product_id,profile_id,status,training_compliant,priority,invited_by,enabled_at,notes,commission_type,commission_basis_points,commission_fixed_cents,commission_payment_days,commission_notes
  ) values(
    v_org,p_product_id,p_profile_id,case when v_training then 'pending_training'::public.product_specialist_status else 'enabled'::public.product_specialist_status end,not v_training,100,v_actor,case when v_training then null else now() end,'Vínculo financeiro e comercial definido pela gestão.',p_commission_type,
    case when p_commission_type='percentage' then p_basis_points else null end,
    case when p_commission_type='fixed' then p_fixed_cents else null end,p_payment_days,left(coalesce(p_notes,''),1000)
  ) on conflict(product_id,profile_id) do update set
    commission_type=excluded.commission_type,commission_basis_points=excluded.commission_basis_points,commission_fixed_cents=excluded.commission_fixed_cents,commission_payment_days=excluded.commission_payment_days,commission_notes=excluded.commission_notes,updated_at=now()
  returning id into v_id;
  insert into private.audit_logs(organization_id,actor_profile_id,action,entity_type,entity_id,metadata)
  values(v_org,v_actor,'specialist.commission_rule_set','product_specialist',v_id,jsonb_build_object('profile_id',p_profile_id,'product_id',p_product_id,'commission_type',p_commission_type,'basis_points',p_basis_points,'fixed_cents',p_fixed_cents,'payment_days',p_payment_days));
  return (select to_jsonb(ps) from public.product_specialists ps where ps.id=v_id);
end
$function$;

update public.broker_records set operating_mode='contact_granted',updated_at=now() where status='active' and operating_mode='read_only';

insert into public.product_specialists(
  organization_id,product_id,profile_id,status,training_compliant,priority,invited_by,enabled_at,notes
)
select c.organization_id,coalesce(c.destination_product_id,c.source_product_id),c.assigned_broker_id,
  case when p.training_required then 'pending_training'::public.product_specialist_status else 'enabled'::public.product_specialist_status end,
  not p.training_required,100,c.assigned_broker_id,case when p.training_required then null else now() end,'Vínculo reconstruído a partir de atendimento já distribuído.'
from public.connections c join public.products p on p.id=coalesce(c.destination_product_id,c.source_product_id)
where c.assigned_broker_id is not null
on conflict(product_id,profile_id) do nothing;

revoke all on function public.specialist_portal_snapshot() from public;
revoke all on function public.specialist_accept_connection(uuid) from public;
revoke all on function public.specialist_update_connection_stage(uuid,text,text,timestamptz) from public;
revoke all on function public.specialist_report_sale(uuid,jsonb) from public;
revoke all on function public.specialist_mark_notification_read(uuid) from public;
revoke all on function public.admin_list_specialist_financial_rules() from public;
revoke all on function public.admin_set_specialist_financial_rule(uuid,uuid,text,integer,bigint,integer,text) from public;
grant execute on function public.specialist_portal_snapshot() to authenticated,service_role;
grant execute on function public.specialist_accept_connection(uuid) to authenticated,service_role;
grant execute on function public.specialist_update_connection_stage(uuid,text,text,timestamptz) to authenticated,service_role;
grant execute on function public.specialist_report_sale(uuid,jsonb) to authenticated,service_role;
grant execute on function public.specialist_mark_notification_read(uuid) to authenticated,service_role;
grant execute on function public.admin_list_specialist_financial_rules() to authenticated,service_role;
grant execute on function public.admin_set_specialist_financial_rule(uuid,uuid,text,integer,bigint,integer,text) to authenticated,service_role;