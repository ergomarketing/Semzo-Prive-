-- Query para diagnosticar el último intento de compra/activación
-- Usuario: 34624239394

-- 1. Estado actual del usuario
SELECT 
  'USER PROFILE' as section,
  id,
  email,
  phone,
  full_name,
  identity_verified,
  membership_status,
  membership_type,
  shipping_address,
  shipping_city,
  created_at,
  updated_at
FROM profiles 
WHERE phone LIKE '%624239394%'
UNION ALL

-- 2. Intents de membresía (últimos 5)
SELECT 
  'MEMBERSHIP INTENTS' as section,
  id::text,
  status,
  membership_type,
  amount::text,
  stripe_payment_intent_id,
  stripe_verification_session_id,
  created_at,
  updated_at
FROM membership_intents 
WHERE user_id IN (SELECT id FROM profiles WHERE phone LIKE '%624239394%')
ORDER BY created_at DESC
LIMIT 5
UNION ALL

-- 3. User memberships activas
SELECT 
  'USER MEMBERSHIPS' as section,
  id::text,
  membership_type,
  status,
  NULL as col4,
  NULL as col5,
  NULL as col6,
  created_at,
  updated_at
FROM user_memberships 
WHERE user_id IN (SELECT id FROM profiles WHERE phone LIKE '%624239394%')
UNION ALL

-- 4. Admin notifications recientes
SELECT 
  'ADMIN NOTIFICATIONS' as section,
  id::text,
  type,
  title,
  message,
  severity,
  NULL as col6,
  created_at,
  NULL as col8
FROM admin_notifications 
WHERE user_id IN (SELECT id FROM profiles WHERE phone LIKE '%624239394%')
   OR message LIKE '%624239394%'
ORDER BY created_at DESC
LIMIT 5;
