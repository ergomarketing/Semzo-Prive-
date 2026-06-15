-- ============================================================
-- SEMZO PRIVÉ — Sistema de automatización de leads
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla principal de leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  phone text,
  source text default 'google_ads', -- 'google_ads' | 'organic' | 'referral' | 'manual'
  utm_campaign text,
  utm_medium text,
  utm_content text,
  status text default 'lead' check (status in ('lead','subscribed','unsubscribed','cold')),
  created_at timestamptz default now(),
  subscribed_at timestamptz,
  unsubscribed_at timestamptz
);

-- 2. Log de secuencia de emails (5 emails por lead)
create table if not exists email_sequence_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  email_number integer not null check (email_number between 1 and 5),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text default 'pending' check (status in ('pending','sent','skipped','failed')),
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

-- 3. Log de newsletter mensual
create table if not exists newsletter_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  campaign_id text not null,
  sent_at timestamptz default now(),
  opened_at timestamptz,
  clicked_at timestamptz
);

-- Índices para rendimiento
create index if not exists idx_leads_email on leads(email);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_email_seq_status_scheduled on email_sequence_log(status, scheduled_for);
create index if not exists idx_email_seq_lead on email_sequence_log(lead_id);

-- RLS: solo service_role accede (endpoints server-side)
alter table leads enable row level security;
alter table email_sequence_log enable row level security;
alter table newsletter_log enable row level security;

create policy "service_role_all_leads" on leads
  for all using (auth.role() = 'service_role');

create policy "service_role_all_seq" on email_sequence_log
  for all using (auth.role() = 'service_role');

create policy "service_role_all_newsletter_log" on newsletter_log
  for all using (auth.role() = 'service_role');
