-- 2026-11-23 — Proteger los campos sensibles del perfil frente a la propia socia.
--
-- Problema: la politica "Users can update own profile" deja a cada socia editar CUALQUIER columna de su fila
-- (is_admin, membership_*, stripe_customer_id, sepa_*, flags de identidad duplicada, saldos...).
--
-- Solucion: un trigger que vigila SOLO las peticiones hechas con la sesion de una socia (rol JWT anon/authenticated).
-- Pasan sin tocarse: la clave de servidor (service_role), las funciones internas de la base de datos y el SQL directo.
--
-- Dos modos, sin redeploy: tabla profile_guard_config.block
--   false = SOLO REGISTRA (profile_guard_log) y deja pasar  -> fase de observacion
--   true  = BLOQUEA con un error claro
-- Marcha atras inmediata:  update public.profile_guard_config set block = false;
-- Retirada total:           drop trigger trg_guard_profile_sensitive on public.profiles;

create table if not exists public.profile_guard_config (
  id boolean primary key default true check (id),   -- una sola fila
  block boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.profile_guard_config (id, block) values (true, false) on conflict (id) do nothing;
alter table public.profile_guard_config enable row level security;   -- sin politicas: solo servidor

create table if not exists public.profile_guard_log (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  profile_id uuid,
  op text,
  jwt_role text,
  changed_columns text[],
  old_values jsonb,
  new_values jsonb,
  blocked boolean not null default false
);
alter table public.profile_guard_log enable row level security;       -- sin politicas: solo servidor

create or replace function public.guard_profile_sensitive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sensitive text[] := array[
    'is_admin','membership_status','membership_type',
    'stripe_customer_id','stripe_subscription_id','subscription_end_date',
    'active_bag_pass','bag_pass_expires','bag_pass_bag_id',
    'gift_card_balance','referral_balance','referral_code',
    'identity_verified','identity_verified_at','stripe_identity_session_id',
    'identity_document_hash','identity_duplicate_flag','identity_duplicate_of',
    'duplicate_identity_flag','duplicate_identity_matched_user_id',
    'sepa_payment_method_id','sepa_mandate_accepted_at','sepa_holder_name',
    'sepa_name_mismatch','sepa_name_checked_at','sepa_name_match_status',
    'sepa_setup_failed_count','sepa_setup_blocked_at','phone_verified'
  ];
  v_role text;
  v_new jsonb;
  v_old jsonb;
  v_changed text[] := '{}';
  v_block boolean;
  c text;
begin
  v_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );

  -- Solo se vigila a la socia (o visitante). Servidor, funciones internas y SQL directo no tienen ese rol.
  if v_role is null or v_role not in ('anon', 'authenticated') then
    return NEW;
  end if;

  v_new := to_jsonb(NEW);
  if TG_OP = 'UPDATE' then
    v_old := to_jsonb(OLD);
  else
    -- Alta de perfil: valores por defecto de la tabla
    v_old := jsonb_build_object(
      'membership_status','free','membership_type','free','gift_card_balance',0,'referral_balance',0,
      'is_admin',false,'identity_verified',false,'phone_verified',false,'sepa_name_mismatch',false,
      'duplicate_identity_flag',false,'identity_duplicate_flag',false,'sepa_setup_failed_count',0
    );
  end if;

  foreach c in array sensitive loop
    -- NULL de SQL y null de JSON se tratan igual; asi "sin valor" no cuenta como cambio.
    if coalesce(v_new -> c, 'null'::jsonb) is distinct from coalesce(v_old -> c, 'null'::jsonb) then
      v_changed := v_changed || c;
    end if;
  end loop;

  if array_length(v_changed, 1) is null then
    return NEW;
  end if;

  select block into v_block from public.profile_guard_config where id;

  if coalesce(v_block, false) then
    raise exception 'Campo protegido del perfil: % solo puede modificarlo el servidor', v_changed
      using errcode = '42501';
  end if;

  insert into public.profile_guard_log (profile_id, op, jwt_role, changed_columns, old_values, new_values, blocked)
  select NEW.id, TG_OP, v_role, v_changed,
         (select jsonb_object_agg(k, v_old -> k) from unnest(v_changed) k),
         (select jsonb_object_agg(k, v_new -> k) from unnest(v_changed) k),
         false;

  return NEW;
end;
$$;

revoke all on function public.guard_profile_sensitive() from public, anon, authenticated;

drop trigger if exists trg_guard_profile_sensitive on public.profiles;
create trigger trg_guard_profile_sensitive
  before insert or update on public.profiles
  for each row execute function public.guard_profile_sensitive();
