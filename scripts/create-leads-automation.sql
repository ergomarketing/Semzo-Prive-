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
  source text default 'google_ads', -- 'google_ads' | 'organic_web' | 'social' | 'invitation_es' | 'invitation_en' | 'referral' | 'manual'
  referral_code text,
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

-- 4. Plantillas de email editables desde el panel admin
create table if not exists email_templates (
  id integer primary key check (id between 1 and 5),
  name text not null,                    -- nombre descriptivo ej: "Email 1 - Bienvenida"
  subject text not null,                 -- asunto del email (soporta {{name}})
  body_html text not null,               -- cuerpo HTML completo (soporta {{name}}, {{cta_url}}, {{unsubscribe_url}})
  delay_days integer not null default 0, -- días desde el registro para enviarlo
  active boolean default true,
  updated_at timestamptz default now()
);

-- Contenido inicial de los 5 emails
insert into email_templates (id, name, subject, delay_days, body_html) values
(1, 'Email 1 - Bienvenida', 'Bienvenida a algo diferente, {{name}}', 0,
'<p>Hola {{name}},</p>
<p>Gracias por tu interés en SEMZO Privé. Hemos creado algo para mujeres que entienden que el lujo no tiene por qué ser permanente para ser real.</p>
<p>Bolsos de Hermès, Chanel, Louis Vuitton y otras maisons. Disponibles por membresía mensual. Auténticos, revisados y listos para ti.</p>
<p><a href="{{cta_url}}">Ver la colección</a></p>
<p>Nos vemos pronto,<br>El equipo de SEMZO Privé</p>
<p style="font-size:12px;color:#999;"><a href="{{unsubscribe_url}}">Darse de baja</a></p>'),

(2, 'Email 2 - Storytelling', 'No todo el mundo sabe lo que tiene delante', 2,
'<p>Hola {{name}},</p>
<p>Un bolso Hermès no es solo un accesorio. Es el resultado de 15 horas de trabajo artesanal, materiales seleccionados a mano y una lista de espera de meses.</p>
<p>En SEMZO Privé creemos que deberías poder disfrutarlo sin esperar, ni comprometerte de por vida.</p>
<p><a href="{{cta_url}}">Descubrir las membresías</a></p>
<p>SEMZO Privé</p>
<p style="font-size:12px;color:#999;"><a href="{{unsubscribe_url}}">Darse de baja</a></p>'),

(3, 'Email 3 - Propuesta de valor', '¿Qué incluye realmente una suscripción SEMZO?', 4,
'<p>Hola {{name}},</p>
<p>Una membresía SEMZO Privé incluye: acceso a bolsos de primeras firmas, envío y devolución gratuitos, seguro incluido y la opción de adquirirlo si te enamoras.</p>
<p>Desde 59€/mes. Sin permanencia.</p>
<p><a href="{{cta_url}}">Ver planes y precios</a></p>
<p>SEMZO Privé</p>
<p style="font-size:12px;color:#999;"><a href="{{unsubscribe_url}}">Darse de baja</a></p>'),

(4, 'Email 4 - Escasez', 'Prendas como estas no esperan', 6,
'<p>Hola {{name}},</p>
<p>Nuestra colección es limitada y rotativa. Algunos modelos solo están disponibles unas semanas antes de pasar a otra socia.</p>
<p>Si hay alguno que te haya llamado la atención, este es el momento.</p>
<p><a href="{{cta_url}}">Ver disponibilidad ahora</a></p>
<p>SEMZO Privé</p>
<p style="font-size:12px;color:#999;"><a href="{{unsubscribe_url}}">Darse de baja</a></p>'),

(5, 'Email 5 - Cierre', 'Una última cosa, {{name}}', 10,
'<p>Hola {{name}},</p>
<p>Este es nuestro último mensaje. Si el momento no es ahora, lo entendemos.</p>
<p>Cuando estés lista, estaremos aquí. La colección se renueva cada temporada y siempre hay algo nuevo esperándote.</p>
<p><a href="{{cta_url}}">Acceder a SEMZO Privé</a></p>
<p>Con cariño,<br>El equipo de SEMZO Privé</p>
<p style="font-size:12px;color:#999;"><a href="{{unsubscribe_url}}">Darse de baja</a></p>')
on conflict (id) do nothing;

alter table email_templates enable row level security;
create policy "service_role_all_templates" on email_templates
  for all using (auth.role() = 'service_role');

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
