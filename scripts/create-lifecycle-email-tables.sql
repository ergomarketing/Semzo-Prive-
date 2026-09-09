-- Fase 3 — Infraestructura de emails de lifecycle/negocio.
-- NO tocar: leads, email_templates, email_sequence_log, send-lead-emails (Secuencia 1, newsletter).
-- Esto es un framework NUEVO y aislado para todas las secuencias de la Fase 3
-- (onboarding post-activación, checkout abandonado, renovación, tarjeta por
-- caducar, win-back, reactivación de pausa, back-in-stock, NPS).
--
-- Ya aplicado en la base de datos via Supabase MCP. Este script queda como
-- referencia versionada en el repo / para poder re-aplicar en otro entorno.

create table if not exists public.lifecycle_email_templates (
  id serial primary key,
  sequence_key text not null,       -- 'membership_onboarding' | 'checkout_abandoned' | 'renewal_reminder' |
                                     -- 'card_expiring' | 'winback' | 'pause_reactivation' | 'back_in_stock' | 'nps'
  step_number int not null,         -- 1, 2, 3...
  name text not null,
  subject text not null,
  body_html text not null,
  delay_hours int not null default 0,  -- horas desde el enrolamiento (no desde "ahora")
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(sequence_key, step_number)
);

alter table public.lifecycle_email_templates enable row level security;

drop policy if exists "service_role_all_lifecycle_templates" on public.lifecycle_email_templates;
create policy "service_role_all_lifecycle_templates" on public.lifecycle_email_templates
  for all using (auth.role() = 'service_role');

create table if not exists public.lifecycle_email_log (
  id uuid primary key default gen_random_uuid(),
  sequence_key text not null,
  step_number int not null,
  entity_type text not null,        -- 'membership' | 'membership_intent' | 'wishlist_item' | 'reservation'
  entity_id text not null,          -- identificador del recurso relacionado (texto para máxima flexibilidad)
  user_id uuid references auth.users(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sent','skipped','failed','cancelled')),
  sent_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique(sequence_key, step_number, entity_id)  -- evita doble-enrolamiento
);

create index if not exists lifecycle_email_log_status_scheduled_idx
  on public.lifecycle_email_log(status, scheduled_for);

alter table public.lifecycle_email_log enable row level security;

drop policy if exists "service_role_all_lifecycle_log" on public.lifecycle_email_log;
create policy "service_role_all_lifecycle_log" on public.lifecycle_email_log
  for all using (auth.role() = 'service_role');

-- Guard de idempotencia para el onboarding post-activación (Secuencia 2) y
-- timestamp de pausa para poder calcular ventanas de reactivación (15/30 días).
alter table public.user_memberships
  add column if not exists onboarding_sequence_started_at timestamptz;

alter table public.user_memberships
  add column if not exists paused_at timestamptz;
