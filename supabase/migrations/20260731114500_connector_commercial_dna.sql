create table if not exists public.connector_segments (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,50}$'),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '',
  icon text not null default 'target',
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.connector_segments(slug,name,description,sort_order) values
('imoveis','Imóveis','Lotes, casas, apartamentos e investimentos',10),('veiculos','Veículos','Carros, motos, máquinas e mobilidade',20),('perfumaria','Perfumaria e beleza','Cosméticos, fragrâncias e bem-estar',30),('energia-solar','Energia solar','Soluções residenciais e empresariais',40),('agronegocio','Agronegócio','Terras, insumos, máquinas e serviços',50),('turismo','Turismo','Viagens, hospedagem e experiências',60),('seguros','Seguros','Proteção pessoal e patrimonial',70),('consorcios','Consórcios','Imóveis, veículos e serviços',80),('saude','Saúde','Clínicas, serviços e soluções de saúde',90),('educacao','Educação','Cursos, escolas e capacitação',100),('tecnologia','Tecnologia','Software, equipamentos e serviços',110),('construcao','Construção','Materiais, projetos e fornecedores',120),('moda','Moda','Vestuário, acessórios e marcas',130),('investimentos','Investimentos','Oportunidades e ativos selecionados',140),('outros','Outros mercados','Outras áreas da rede',150)
on conflict(slug) do update set name=excluded.name,description=excluded.description,sort_order=excluded.sort_order,active=true;

create table if not exists public.connector_segment_preferences (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  segment_slug text not null references public.connector_segments(slug) on delete restrict,
  priority smallint not null default 1 check (priority between 1 and 5),
  source text not null default 'signup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(profile_id,segment_slug)
);
create index if not exists connector_segment_preferences_org_segment_idx on public.connector_segment_preferences(organization_id,segment_slug);
alter table public.connector_segment_preferences enable row level security;

drop policy if exists connector_segment_preferences_self_read on public.connector_segment_preferences;
create policy connector_segment_preferences_self_read on public.connector_segment_preferences for select to authenticated using (exists(select 1 from public.profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())) or public.has_permission(organization_id,'connectors.read'));
drop policy if exists connector_segment_preferences_self_write on public.connector_segment_preferences;
create policy connector_segment_preferences_self_write on public.connector_segment_preferences for all to authenticated using (exists(select 1 from public.profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid()) and p.status='active') or public.has_permission(organization_id,'connectors.approve')) with check (exists(select 1 from public.profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid()) and p.status='active') or public.has_permission(organization_id,'connectors.approve'));

create or replace function private.enrich_connector_profile_after_signup() returns trigger language plpgsql security definer set search_path='' as $function$
declare v_org uuid; v_profile uuid; v_segments jsonb:=coalesce(new.raw_user_meta_data->'connector_segments','[]'::jsonb); v_channels jsonb:=coalesce(new.raw_user_meta_data->'connector_channels','[]'::jsonb); v_cities jsonb:=coalesce(new.raw_user_meta_data->'connector_cities','[]'::jsonb); v_commercial jsonb;
begin
 if coalesce(new.raw_user_meta_data->>'signup_kind','') <> 'connector' then return new; end if;
 select p.organization_id,p.id into v_org,v_profile from public.profiles p where p.auth_user_id=new.id limit 1;
 if v_profile is null then return new; end if;
 v_commercial:=jsonb_build_object('segments',v_segments,'channels',v_channels,'cities',v_cities,'network_size',coalesce(new.raw_user_meta_data->>'connector_network_size',''),'objective',coalesce(new.raw_user_meta_data->>'connector_objective',''),'version',coalesce(new.raw_user_meta_data->>'commercial_profile_version','connector-dna-2026-07-31'),'captured_at',now());
 update public.profiles set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('commercial_profile',v_commercial),updated_at=now() where id=v_profile;
 update public.connector_applications set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('commercial_profile',v_commercial),updated_at=now() where profile_id=v_profile;
 insert into public.connector_segment_preferences(organization_id,profile_id,segment_slug,priority,source) select v_org,v_profile,s.value,1,'signup' from jsonb_array_elements_text(v_segments) s(value) join public.connector_segments cs on cs.slug=s.value and cs.active on conflict(profile_id,segment_slug) do update set updated_at=now(),source='signup';
 insert into private.audit_logs(organization_id,actor_profile_id,action,entity_type,entity_id,metadata) values(v_org,v_profile,'connector.commercial_profile_created','profile',v_profile,v_commercial);
 return new;
end;$function$;
drop trigger if exists zz_rede_conecta_enrich_connector on auth.users;
create trigger zz_rede_conecta_enrich_connector after insert on auth.users for each row execute function private.enrich_connector_profile_after_signup();

create or replace function public.list_connector_segments() returns jsonb language sql stable security definer set search_path='' as $function$ select coalesce(jsonb_agg(jsonb_build_object('slug',slug,'name',name,'description',description,'icon',icon) order by sort_order),'[]'::jsonb) from public.connector_segments where active;$function$;
grant execute on function public.list_connector_segments() to anon,authenticated;

create or replace function public.admin_list_connector_applications(p_status text default null,p_limit integer default 100) returns jsonb language plpgsql stable security definer set search_path='' as $function$
declare v_org uuid;
begin
 select id into v_org from public.organizations where slug='conecta-futura-casa' limit 1;
 if not public.has_permission(v_org,'connectors.read') then raise exception 'permission_denied'; end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select id,profile_id,full_name,email,phone,city,state,occupation,network_profile,status,review_notes,rejection_reason,metadata,created_at,reviewed_at,approved_at from public.connector_applications where organization_id=v_org and (p_status is null or status=p_status) order by created_at desc limit greatest(1,least(p_limit,500))) x),'[]'::jsonb);
end;$function$;