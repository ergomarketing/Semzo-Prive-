-- Atribucion de registro: "como nos encontraron".
--
-- Una fila por usuaria, escrita en el momento del registro por
-- /api/auth/register (y como respaldo por /api/attribution para altas por SMS
-- u otras vias). Tabla aislada a proposito: NO toca `profiles` (flujo de
-- registro validado, con constraints propias) ni `leads`.
--
-- APLICAR A MANO en Supabase (SQL Editor) antes o despues del deploy: el
-- codigo esta preparado para que, mientras la tabla no exista, el registro
-- funcione igual (solo se loguea "[attribution] No se pudo guardar").
--
-- Lectura: solo service role (panel admin / SQL). Sin politicas para usuarias.

create table if not exists public.signup_attribution (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Declarada: desplegable opcional del formulario de registro.
  -- instagram | tiktok | google | pinterest | friend | press | event | other
  self_reported text,
  -- Texto libre: "¿quien te recomendo?" (friend) o "cuentanos" (other).
  self_reported_detail text,

  -- Automatica: canal normalizado derivado de los touches (para GROUP BY).
  -- google_ads | tiktok | instagram | facebook | pinterest | email |
  -- organic_search | referral_site | other_campaign | direct
  channel text,

  -- Primer contacto y ultimo contacto con senal (utm_*, click_id_type,
  -- click_id, referrer_host, landing_path, ts). jsonb para no multiplicar columnas.
  first_touch jsonb,
  last_touch jsonb,

  created_at timestamptz not null default now()
);

create index if not exists signup_attribution_channel_idx on public.signup_attribution (channel);
create index if not exists signup_attribution_self_reported_idx on public.signup_attribution (self_reported);
create index if not exists signup_attribution_created_at_idx on public.signup_attribution (created_at desc);

alter table public.signup_attribution enable row level security;

drop policy if exists "service_role_all_signup_attribution" on public.signup_attribution;
create policy "service_role_all_signup_attribution" on public.signup_attribution
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Consultas utiles
-- ---------------------------------------------------------------------------
-- Canal automatico vs. lo que dicen ellas (donde se ve el "boca a boca" oculto):
--   select channel, self_reported, count(*)
--   from public.signup_attribution
--   group by 1, 2 order by 3 desc;
--
-- Registros por canal en los ultimos 30 dias:
--   select channel, count(*) from public.signup_attribution
--   where created_at > now() - interval '30 days' group by 1 order by 2 desc;
--
-- Campañas de Google Ads que mas registran:
--   select last_touch->>'utm_campaign' as campaign, count(*)
--   from public.signup_attribution where channel = 'google_ads'
--   group by 1 order by 2 desc;
