-- AUDITORÍA COMPLETA DEL USUARIO DE PRUEBA
-- Ejecutar para diagnosticar estado actual

-- 1. PROFILES
SELECT 
  'PROFILES' as tabla,
  id,
  email,
  phone,
  full_name,
  first_name,
  last_name,
  shipping_address,
  shipping_city,
  shipping_postal_code,
  document_type,
  document_number,
  identity_verified,
  created_at
FROM profiles 
WHERE phone = '+34624239394' OR email ILIKE '%ergomara%';

-- 2. MEMBERSHIP_INTENTS
SELECT 
  'MEMBERSHIP_INTENTS' as tabla,
  id,
  user_id,
  status,
  membership_type,
  billing_cycle,
  stripe_verification_session_id,
  created_at,
  updated_at
FROM membership_intents
WHERE user_id IN (SELECT id FROM profiles WHERE phone = '+34624239394');

-- 3. USER_MEMBERSHIPS (si existe)
SELECT 
  'USER_MEMBERSHIPS' as tabla,
  id,
  user_id,
  membership_type,
  status,
  start_date,
  end_date,
  created_at
FROM user_memberships
WHERE user_id IN (SELECT id FROM profiles WHERE phone = '+34624239394');

-- 4. IDENTITY_VERIFICATIONS
SELECT 
  'IDENTITY_VERIFICATIONS' as tabla,
  id,
  user_id,
  status,
  stripe_verification_id,
  created_at,
  verified_at
FROM identity_verifications
WHERE user_id IN (SELECT id FROM profiles WHERE phone = '+34624239394');

-- 5. CONTAR REGISTROS
SELECT 
  'TOTALES' as info,
  (SELECT COUNT(*) FROM profiles WHERE phone = '+34624239394') as profiles_count,
  (SELECT COUNT(*) FROM membership_intents WHERE user_id IN (SELECT id FROM profiles WHERE phone = '+34624239394')) as intents_count,
  (SELECT COUNT(*) FROM identity_verifications WHERE user_id IN (SELECT id FROM profiles WHERE phone = '+34624239394')) as verifications_count;
