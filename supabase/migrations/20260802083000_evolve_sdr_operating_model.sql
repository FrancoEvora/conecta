-- Rede Conecta: operational SDR v2.
-- Production migration applied through Supabase on 2026-08-02.
-- Adds structured qualification and recommendation data, permits the v2 simulation mode,
-- and expands activity auditing for SDR qualification and human handoff.

alter table public.connections
  add column if not exists sdr_qualification jsonb not null default '{}'::jsonb,
  add column if not exists sdr_recommendation jsonb not null default '{}'::jsonb;

alter table public.connections drop constraint if exists connections_sdr_qualification_check;
alter table public.connections add constraint connections_sdr_qualification_check
  check (jsonb_typeof(sdr_qualification) = 'object');

alter table public.connections drop constraint if exists connections_sdr_recommendation_check;
alter table public.connections add constraint connections_sdr_recommendation_check
  check (jsonb_typeof(sdr_recommendation) = 'object');

alter table public.connections drop constraint if exists connections_sdr_mode_check;
alter table public.connections add constraint connections_sdr_mode_check
  check (sdr_mode = any(array['simulation','simulation_v2','api']::text[]));

alter table public.connection_activities drop constraint if exists connection_activities_type_check;
alter table public.connection_activities add constraint connection_activities_type_check check (
  activity_type = any(array[
    'note','call','whatsapp','email','meeting','visit','proposal','product_rejected',
    'alternative_discovery_authorized','alternative_product_presented','document','system',
    'sdr_simulation','human_handoff'
  ]::text[])
);

comment on column public.connections.sdr_qualification is
'Structured answers and score components collected during SDR qualification.';
comment on column public.connections.sdr_recommendation is
'Next-best-action recommendation and human handoff briefing produced by the SDR.';

-- The security-definer functions admin_run_sdr_simulation, admin_handoff_after_sdr and
-- admin_sdr_console are replaced by this release through the managed production migration.
-- They intentionally remain managed at database level because they contain authorization,
-- private contact access, workload balancing and audit-log writes in one transaction.
