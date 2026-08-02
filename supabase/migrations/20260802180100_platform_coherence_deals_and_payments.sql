-- Rede Conecta Platform Coherence v3
-- Deal validation, economic snapshots, ledger expectations and stakeholder notifications.

create or replace function public.admin_transition_deal(p_deal_id uuid,p_to_status text,p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_d public.deals%rowtype;
  v_old_status text;
  v_actor uuid;
  v_product public.products%rowtype;
  v_connection public.connections%rowtype;
  v_ps public.product_specialists%rowtype;
  v_connector uuid;
  v_specialist uuid;
  v_fee bigint;
  v_reward bigint;
  v_commission bigint;
  v_commission_due date;
  v_title text;
  v_body text;
begin
  select * into v_d from public.deals where id=p_deal_id for update;
  if v_d.id is null then raise exception 'deal_not_found'; end if;
  if not (
    public.has_permission(v_d.organization_id,'deals.manage')
    or public.has_permission(v_d.organization_id,'platform.all')
    or public.has_organization_role(v_d.organization_id,array['owner','manager']::public.organization_role[])
  ) then raise exception 'permission_denied'; end if;
  if p_to_status not in ('draft','reservation','contract_pending','contracted','validated','cancelled','lost') then raise exception 'invalid_deal_status'; end if;

  v_actor:=public.current_profile_id(v_d.organization_id);
  v_old_status:=v_d.status;
  select * into v_product from public.products where id=v_d.product_id;
  select * into v_connection from public.connections where id=v_d.connection_id for update;
  v_connector:=v_connection.connector_profile_id;
  v_specialist:=coalesce(v_d.assigned_operator_id,v_connection.assigned_operator_id);
  if v_specialist is not null and v_d.product_id is not null then
    select * into v_ps from public.product_specialists where profile_id=v_specialist and product_id=v_d.product_id;
  end if;

  v_commission:=coalesce(v_d.specialist_commission_cents,0);
  if p_to_status in ('contracted','validated') and v_commission=0 then
    if v_ps.commission_type='percentage' then
      v_commission:=round(coalesce(v_d.gross_value_cents,0)*coalesce(v_ps.commission_basis_points,0)/10000.0)::bigint;
    elsif v_ps.commission_type='fixed' then
      v_commission:=coalesce(v_ps.commission_fixed_cents,0);
    end if;
  end if;
  v_commission_due:=coalesce(v_d.specialist_commission_due_at,current_date+coalesce(v_ps.commission_payment_days,7));

  update public.deals set
    status=p_to_status,
    assigned_operator_id=coalesce(assigned_operator_id,v_specialist),
    validated_at=case when p_to_status='validated' then now() else validated_at end,
    cancelled_at=case when p_to_status='cancelled' then now() else cancelled_at end,
    cancellation_reason=case when p_to_status='cancelled' then left(coalesce(p_reason,''),2000) else cancellation_reason end,
    conecta_fee_basis_points=case when p_to_status in ('contracted','validated') then coalesce(conecta_fee_basis_points,v_product.conecta_fee_basis_points,0) else conecta_fee_basis_points end,
    conecta_fee_expected_cents=case when p_to_status in ('contracted','validated') then coalesce(conecta_fee_expected_cents,round(coalesce(gross_value_cents,0)*coalesce(v_product.conecta_fee_basis_points,0)/10000.0)::bigint) else conecta_fee_expected_cents end,
    conecta_fee_due_at=case when p_to_status in ('contracted','validated') then coalesce(conecta_fee_due_at,current_date+coalesce(v_product.conecta_fee_payment_days,7)) else conecta_fee_due_at end,
    specialist_commission_rule_type=case when p_to_status in ('contracted','validated') then coalesce(specialist_commission_rule_type,v_ps.commission_type) else specialist_commission_rule_type end,
    specialist_commission_basis_points=case when p_to_status in ('contracted','validated') then coalesce(specialist_commission_basis_points,v_ps.commission_basis_points) else specialist_commission_basis_points end,
    specialist_commission_fixed_cents=case when p_to_status in ('contracted','validated') then coalesce(specialist_commission_fixed_cents,v_ps.commission_fixed_cents) else specialist_commission_fixed_cents end,
    specialist_commission_cents=case when p_to_status in ('contracted','validated') then v_commission else specialist_commission_cents end,
    specialist_commission_due_at=case when p_to_status in ('contracted','validated') then v_commission_due else specialist_commission_due_at end,
    updated_at=now()
  where id=p_deal_id returning * into v_d;

  insert into public.deal_status_history(organization_id,deal_id,from_status,to_status,changed_by,reason)
  values(v_d.organization_id,p_deal_id,v_old_status,p_to_status,v_actor,left(coalesce(p_reason,''),2000));

  if p_to_status='contracted' and v_connection.status not in ('won','lost','cancelled') then
    update public.connections set status='proposal',last_activity_at=now(),updated_at=now() where id=v_d.connection_id;
    if v_connection.status<>'proposal' then
      insert into public.connection_status_history(connection_id,from_status,to_status,changed_by,note)
      values(v_d.connection_id,v_connection.status,'proposal',v_actor,'Venda informada; aguardando validação da Rede Conecta.');
    end if;
  elsif p_to_status='validated' and v_connection.status<>'won' then
    update public.connections set status='won',closed_at=coalesce(closed_at,now()),last_activity_at=now(),updated_at=now() where id=v_d.connection_id;
    insert into public.connection_status_history(connection_id,from_status,to_status,changed_by,note)
    values(v_d.connection_id,v_connection.status,'won',v_actor,'Venda validada pela Rede Conecta.');
  elsif p_to_status='cancelled' and v_connection.status<>'cancelled' then
    update public.connections set status='cancelled',closed_at=now(),last_activity_at=now(),updated_at=now() where id=v_d.connection_id;
    insert into public.connection_status_history(connection_id,from_status,to_status,changed_by,note)
    values(v_d.connection_id,v_connection.status,'cancelled',v_actor,left(coalesce(p_reason,'Negócio cancelado.'),500));
  elsif p_to_status='lost' and v_connection.status<>'lost' then
    update public.connections set status='lost',closed_at=now(),loss_reason=left(coalesce(p_reason,''),1000),last_activity_at=now(),updated_at=now() where id=v_d.connection_id;
    insert into public.connection_status_history(connection_id,from_status,to_status,changed_by,note)
    values(v_d.connection_id,v_connection.status,'lost',v_actor,left(coalesce(p_reason,'Negócio encerrado.'),500));
  end if;

  if p_to_status in ('contracted','validated') then
    v_fee:=coalesce(v_d.conecta_fee_expected_cents,0);
    if v_fee>0 and not exists(select 1 from public.deal_financial_ledger where deal_id=p_deal_id and entry_type='conecta_receivable' and status<>'cancelled') then
      insert into public.deal_financial_ledger(organization_id,deal_id,product_id,entry_type,status,amount_cents,due_at,description,created_by)
      values(v_d.organization_id,p_deal_id,v_d.product_id,'conecta_receivable','expected',v_fee,v_d.conecta_fee_due_at,'Receita contratual da Rede Conecta',v_actor);
    end if;
    select coalesce(sum(amount_cents),0) into v_reward from public.rewards where connection_id=v_d.connection_id and status in ('pending','approved','scheduled','paid');
    if v_reward>0 and not exists(select 1 from public.deal_financial_ledger where deal_id=p_deal_id and entry_type='connector_reward' and status<>'cancelled') then
      insert into public.deal_financial_ledger(organization_id,deal_id,product_id,entry_type,status,amount_cents,due_at,description,created_by)
      values(v_d.organization_id,p_deal_id,v_d.product_id,'connector_reward','expected',v_reward,v_d.conecta_fee_due_at,'Recompensa do conector',v_actor);
    end if;
    if v_commission>0 and not exists(select 1 from public.deal_financial_ledger where deal_id=p_deal_id and entry_type='specialist_commission' and status<>'cancelled') then
      insert into public.deal_financial_ledger(organization_id,deal_id,product_id,entry_type,status,amount_cents,due_at,description,created_by,metadata)
      values(v_d.organization_id,p_deal_id,v_d.product_id,'specialist_commission','expected',v_commission,v_commission_due,'Comissão esperada do especialista',v_actor,jsonb_build_object('specialist_profile_id',v_specialist,'rule_type',v_d.specialist_commission_rule_type,'basis_points',v_d.specialist_commission_basis_points,'fixed_cents',v_d.specialist_commission_fixed_cents));
    end if;
  elsif p_to_status in ('cancelled','lost') then
    update public.deal_financial_ledger set status='cancelled',updated_at=now() where deal_id=p_deal_id and status in ('expected','due','scheduled');
  end if;

  if v_connector is not null then
    v_title:=case p_to_status when 'contracted' then 'Venda informada' when 'validated' then 'Venda confirmada' when 'cancelled' then 'Negócio cancelado' when 'lost' then 'Negociação encerrada' else 'Andamento atualizado' end;
    v_body:=case p_to_status when 'contracted' then 'O especialista informou a conclusão do negócio. A operação aguarda validação da Rede Conecta.' when 'validated' then 'A venda originada pela sua conexão foi validada. A recompensa seguirá as regras do produto.' when 'cancelled' then 'O negócio foi cancelado. O histórico e a origem permanecem registrados para auditoria.' when 'lost' then 'A negociação foi encerrada sem venda neste momento.' else 'A oportunidade avançou para uma nova etapa.' end;
    insert into public.connector_notifications(organization_id,connector_profile_id,connection_id,deal_id,notification_type,title,body,metadata)
    values(v_d.organization_id,v_connector,v_d.connection_id,p_deal_id,'deal_'||p_to_status,v_title,v_body,jsonb_build_object('status',p_to_status,'gross_value_cents',v_d.gross_value_cents));
  end if;
  if v_specialist is not null then
    insert into public.specialist_notifications(organization_id,specialist_profile_id,connection_id,deal_id,notification_type,title,body,metadata)
    values(v_d.organization_id,v_specialist,v_d.connection_id,p_deal_id,'deal_'||p_to_status,
      case p_to_status when 'validated' then 'Venda validada' when 'contracted' then 'Venda registrada' when 'cancelled' then 'Venda cancelada' when 'lost' then 'Negócio encerrado' else 'Negócio atualizado' end,
      case p_to_status when 'validated' then 'A venda foi validada. A comissão esperada permanece registrada e será paga conforme a regra do produto.' when 'contracted' then 'A venda foi registrada e aguarda validação.' when 'cancelled' then 'A venda foi cancelada e as expectativas financeiras abertas foram canceladas.' when 'lost' then 'O negócio foi encerrado sem venda.' else 'O negócio recebeu uma nova atualização.' end,
      jsonb_build_object('status',p_to_status,'gross_value_cents',v_d.gross_value_cents,'specialist_commission_cents',v_commission,'due_at',v_commission_due));
  end if;
  insert into private.audit_logs(organization_id,actor_profile_id,action,entity_type,entity_id,metadata)
  values(v_d.organization_id,v_actor,'deal.status_changed','deal',p_deal_id,jsonb_build_object('from',v_old_status,'to',p_to_status,'specialist_profile_id',v_specialist,'specialist_commission_cents',v_commission));
  return jsonb_build_object('deal_id',p_deal_id,'status',p_to_status,'conecta_fee_expected_cents',v_d.conecta_fee_expected_cents,'specialist_commission_cents',v_commission,'specialist_commission_due_at',v_commission_due);
end
$function$;

create or replace function public.admin_record_financial_entry(
  p_deal_id uuid,
  p_entry_type text,
  p_amount_cents bigint,
  p_status text default 'paid',
  p_due_at date default null,
  p_paid_at timestamptz default now(),
  p_description text default ''
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_deal public.deals%rowtype;
  v_actor uuid;
  v_id uuid;
  v_connection public.connections%rowtype;
  v_specialist uuid;
  v_connector uuid;
begin
  select * into v_deal from public.deals where id=p_deal_id for update;
  if v_deal.id is null then raise exception 'deal_not_found'; end if;
  if not (
    public.has_permission(v_deal.organization_id,'rewards.manage')
    or public.has_permission(v_deal.organization_id,'payouts.manage')
    or public.has_permission(v_deal.organization_id,'platform.all')
    or public.has_organization_role(v_deal.organization_id,array['owner','manager']::public.organization_role[])
  ) then raise exception 'permission_denied'; end if;
  if p_entry_type not in ('conecta_receipt','connector_reward_payment','specialist_commission_payment','refund','adjustment') or p_amount_cents<0 or p_status not in ('expected','due','scheduled','paid','cancelled') then raise exception 'invalid_financial_entry'; end if;

  v_actor:=public.current_profile_id(v_deal.organization_id);
  select * into v_connection from public.connections where id=v_deal.connection_id;
  v_specialist:=coalesce(v_deal.assigned_operator_id,v_connection.assigned_operator_id);
  v_connector:=v_connection.connector_profile_id;

  insert into public.deal_financial_ledger(organization_id,deal_id,product_id,entry_type,status,amount_cents,due_at,paid_at,description,created_by,metadata)
  values(v_deal.organization_id,v_deal.id,v_deal.product_id,p_entry_type,p_status,p_amount_cents,p_due_at,case when p_status='paid' then coalesce(p_paid_at,now()) else null end,left(coalesce(p_description,''),1000),v_actor,jsonb_build_object('recorded_by',v_actor))
  returning id into v_id;

  if p_entry_type='conecta_receipt' and p_status='paid' then
    update public.deals set conecta_fee_received_cents=conecta_fee_received_cents+p_amount_cents,conecta_fee_received_at=coalesce(conecta_fee_received_at,coalesce(p_paid_at,now())),updated_at=now() where id=p_deal_id;
  elsif p_entry_type='specialist_commission_payment' and p_status='paid' then
    update public.deals set specialist_commission_paid_cents=specialist_commission_paid_cents+p_amount_cents,updated_at=now() where id=p_deal_id;
    if v_specialist is not null then
      insert into public.specialist_notifications(organization_id,specialist_profile_id,connection_id,deal_id,notification_type,title,body,metadata)
      values(v_deal.organization_id,v_specialist,v_deal.connection_id,p_deal_id,'commission_paid','Comissão paga','Um pagamento de comissão foi registrado na sua carteira.',jsonb_build_object('amount_cents',p_amount_cents,'paid_at',coalesce(p_paid_at,now())));
    end if;
  elsif p_entry_type='connector_reward_payment' and p_status='paid' and v_connector is not null then
    insert into public.connector_notifications(organization_id,connector_profile_id,connection_id,deal_id,notification_type,title,body,metadata)
    values(v_deal.organization_id,v_connector,v_deal.connection_id,p_deal_id,'reward_payment_recorded','Pagamento de recompensa registrado','Um pagamento de recompensa foi registrado para esta conexão.',jsonb_build_object('amount_cents',p_amount_cents,'paid_at',coalesce(p_paid_at,now())));
  end if;

  insert into private.audit_logs(organization_id,actor_profile_id,action,entity_type,entity_id,metadata)
  values(v_deal.organization_id,v_actor,'finance.entry_recorded','deal_financial_ledger',v_id,jsonb_build_object('deal_id',p_deal_id,'entry_type',p_entry_type,'amount_cents',p_amount_cents,'status',p_status));
  return (select to_jsonb(x) from public.deal_financial_ledger x where x.id=v_id);
end
$function$;