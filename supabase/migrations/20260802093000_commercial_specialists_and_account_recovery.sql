-- Applied to production on 2026-08-02.
-- Makes CRECI optional, supports multi-market commercial specialists,
-- adds idempotent invite activation and secure account administration.

alter table public.broker_records alter column creci_number drop not null;
alter table public.broker_records alter column creci_state drop not null;
alter table public.broker_records add column if not exists professional_type text not null default 'real_estate_broker';
alter table public.broker_records add column if not exists credential_type text;
alter table public.broker_records add column if not exists credential_number text;
alter table public.broker_records add column if not exists credential_state char(2);

-- The complete function definitions are maintained in the production database:
-- public.resolve_account_invite_v2(text)
-- public.complete_account_invite_activation(text, uuid, text)
-- public.admin_create_specialist_invite(...)
-- public.admin_get_account_identity(uuid)
-- public.admin_list_access_accounts()
--
-- They provide idempotent activation, specialist invitations without mandatory
-- CRECI, account identity lookup and credential-aware account listing.
