-- ============================================================
-- SEMZO PRIVÉ — Migración de usuarios existentes a tabla leads
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor
-- ============================================================

-- 1. Migrar usuarios FREE/Inactivos desde profiles
--    - Solo los que NO tienen membresía de pago activa
--    - ON CONFLICT (email) DO NOTHING para evitar duplicados
INSERT INTO leads (email, name, phone, source, status, created_at)
SELECT DISTINCT ON (p.email)
  p.email,
  TRIM(COALESCE(p.full_name, '')),
  p.phone,
  'organic_web',
  'lead',
  p.created_at
FROM profiles p
LEFT JOIN user_memberships um 
  ON um.user_id = p.id 
  AND um.status IN ('active', 'cancelled_active')
WHERE 
  um.id IS NULL                          -- sin membresía de pago
  AND p.email IS NOT NULL
  AND p.email NOT LIKE '%phone.semzopriv%' -- excluir emails de teléfono falsos
ON CONFLICT (email) DO NOTHING;

-- 2. Migrar leads de invitación desde invitation_registrations
INSERT INTO leads (email, name, phone, source, status, created_at)
SELECT DISTINCT ON (ir.email)
  ir.email,
  TRIM(COALESCE(ir.nombre, '')),
  ir.whatsapp,
  'invitation_es',
  'lead',
  ir.created_at
FROM invitation_registrations ir
WHERE ir.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- 3. Migrar suscriptores de newsletter que no estén ya en leads
INSERT INTO leads (email, name, phone, source, status, created_at)
SELECT DISTINCT ON (ns.email)
  ns.email,
  TRIM(COALESCE(ns.name, '')),
  ns.phone,
  'organic_web',
  'lead',
  ns.subscribed_at
FROM newsletter_subscriptions ns
WHERE 
  ns.email IS NOT NULL
  AND ns.status = 'active'
ON CONFLICT (email) DO NOTHING;

-- Verificar resultado
SELECT source, COUNT(*) as total 
FROM leads 
GROUP BY source 
ORDER BY total DESC;
