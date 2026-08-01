-- Temporary launch fallback.
-- Connector accounts are automatically e-mail-confirmed while access to campaigns,
-- products and rewards remains subject to the Rede Conecta internal validation flow.

create or replace function public.auto_confirm_connector_email()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'signup_kind', '') = 'connector'
     and new.email_confirmed_at is null then
    update auth.users
       set email_confirmed_at = now(),
           updated_at = now()
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_confirm_connector_email on auth.users;
create trigger trg_auto_confirm_connector_email
after insert on auth.users
for each row
execute function public.auto_confirm_connector_email();

update auth.users
   set email_confirmed_at = coalesce(email_confirmed_at, now()),
       updated_at = now()
 where email_confirmed_at is null
   and coalesce(raw_user_meta_data ->> 'signup_kind', '') = 'connector';

comment on function public.auto_confirm_connector_email() is
'Temporary launch fallback: auto-confirms connector e-mail accounts while connector access remains subject to internal profile validation.';
