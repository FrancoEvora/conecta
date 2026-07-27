begin;

alter table public.invitation_link_events
  drop constraint if exists invitation_link_events_type_check;

alter table public.invitation_link_events
  add constraint invitation_link_events_type_check
  check (event_type in (
    'view',
    'cta_click',
    'form_started',
    'form_submitted',
    'alternative_interest',
    'share'
  ));

create index if not exists invitation_link_events_share_idx
  on public.invitation_link_events (invitation_link_id, created_at desc)
  where event_type = 'share';

create or replace function public.register_public_link_event(
  p_invite_code text,
  p_event_type text,
  p_session_hash text,
  p_metadata jsonb default '{}'::jsonb
)
returns table(event_id uuid)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_invitation public.invitation_links%rowtype;
  v_event_id uuid;
begin
  if char_length(trim(coalesce(p_invite_code, ''))) not between 12 and 80
     or p_event_type not in ('view', 'cta_click', 'form_started', 'form_submitted', 'alternative_interest', 'share')
     or coalesce(p_session_hash, '') !~ '^[a-f0-9]{64}$'
     or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object'
     or octet_length(coalesce(p_metadata, '{}'::jsonb)::text) > 2048
     or (
       p_event_type = 'share'
       and coalesce(p_metadata ->> 'channel', '') not in ('copy', 'whatsapp', 'native', 'other')
     )
  then
    raise exception 'invalid_event_payload';
  end if;

  select * into v_invitation
  from public.invitation_links
  where code_hash = extensions.digest(upper(trim(p_invite_code)), 'sha256')
    and active
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_invitation.id is null then
    raise exception 'invalid_invitation';
  end if;

  insert into public.invitation_link_events (
    organization_id,
    invitation_link_id,
    campaign_id,
    product_id,
    event_type,
    session_hash,
    metadata
  ) values (
    v_invitation.organization_id,
    v_invitation.id,
    v_invitation.campaign_id,
    v_invitation.product_id,
    p_event_type,
    p_session_hash,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return query select v_event_id;
end;
$function$;

revoke all on function public.register_public_link_event(text, text, text, jsonb) from public;
grant execute on function public.register_public_link_event(text, text, text, jsonb) to anon, authenticated;

with seed(invite_code, campaign_slug, label) as (
  values
    ('SOLARIS-FRANCO-2026', 'solaris', 'Solaris · compartilhamento de Franco'),
    ('PARQUE-FRANCO-2026', 'parque-comercial', 'Parque Comercial · compartilhamento de Franco'),
    ('FUTURA-FRANCO-2026', 'futura-casa', 'Futura Casa · compartilhamento de Franco')
), source as (
  select
    seed.invite_code,
    seed.label,
    campaign.organization_id,
    campaign.id as campaign_id,
    product.id as product_id,
    product.name as product_name,
    campaign.title as campaign_title,
    coalesce(reward_rule.amount_cents, product.referral_bonus_cents) as reward_amount_cents,
    coalesce(reward_rule.terms_version, '2026-07-26') as terms_version
  from seed
  join public.campaigns as campaign
    on campaign.slug = seed.campaign_slug
   and campaign.status = 'active'
  join public.products as product
    on product.id = campaign.product_id
   and product.organization_id = campaign.organization_id
   and product.status = 'active'
  left join lateral (
    select rule.amount_cents, rule.terms_version
    from public.campaign_reward_rules as rule
    where rule.campaign_id = campaign.id
      and rule.organization_id = campaign.organization_id
      and rule.active
    order by rule.version desc, rule.effective_from desc
    limit 1
  ) as reward_rule on true
)
insert into public.invitation_links as target (
  organization_id,
  campaign_id,
  product_id,
  connector_profile_id,
  code_hash,
  label,
  active,
  expires_at,
  connector_display_name,
  channel,
  product_name_snapshot,
  campaign_title_snapshot,
  reward_amount_cents_snapshot,
  terms_version_snapshot,
  metadata
)
select
  source.organization_id,
  source.campaign_id,
  source.product_id,
  null,
  extensions.digest(upper(source.invite_code), 'sha256'),
  source.label,
  true,
  null,
  'Franco',
  'link',
  source.product_name,
  source.campaign_title,
  source.reward_amount_cents,
  source.terms_version,
  jsonb_build_object(
    'source', 'connector_share_studio',
    'official_domain', 'conecta-pearl.vercel.app',
    'message_personalization', true,
    'verified_preview', true
  )
from source
on conflict (code_hash) do update set
  organization_id = excluded.organization_id,
  campaign_id = excluded.campaign_id,
  product_id = excluded.product_id,
  label = excluded.label,
  active = true,
  expires_at = null,
  connector_display_name = excluded.connector_display_name,
  channel = excluded.channel,
  product_name_snapshot = excluded.product_name_snapshot,
  campaign_title_snapshot = excluded.campaign_title_snapshot,
  reward_amount_cents_snapshot = excluded.reward_amount_cents_snapshot,
  terms_version_snapshot = excluded.terms_version_snapshot,
  metadata = target.metadata || excluded.metadata,
  updated_at = now();

commit;
