-- Script para eliminar TODOS los registros de erika rosa gonzalez ortiz / ergomara2
-- Identifica por email y teléfono

-- Mostrar todos los registros que se van a eliminar
SELECT 
  id,
  email,
  full_name,
  phone,
  created_at
FROM public.profiles
WHERE 
  email ILIKE '%ergomara2%'
  OR phone = '+34624239394'
  OR phone = '34624239394'
  OR email = '34624239394@phone.semzoprive.com'
ORDER BY created_at DESC;

-- ELIMINAR de todas las tablas relacionadas (en orden correcto para evitar foreign key violations)

-- 1. Primero eliminar bag_passes que referencian a reservations
DELETE FROM public.bag_passes
WHERE used_for_reservation_id IN (
  SELECT r.id FROM public.reservations r
  INNER JOIN public.profiles p ON r.user_id = p.id
  WHERE p.email ILIKE '%ergomara2%' 
    OR p.phone = '+34624239394'
    OR p.phone = '34624239394'
    OR p.email = '34624239394@phone.semzoprive.com'
);

-- 2. Ahora eliminar reservations
DELETE FROM public.reservations
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- 3. Eliminar membership_intents
DELETE FROM public.membership_intents
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- 4. Eliminar user_memberships
DELETE FROM public.user_memberships
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- 5. Eliminar gift_card_transactions
DELETE FROM public.gift_card_transactions
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- 6. Eliminar identity_verifications
DELETE FROM public.identity_verifications
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- 7. Eliminar audit_log
DELETE FROM public.audit_log
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- 8. Eliminar de profiles
DELETE FROM public.profiles
WHERE 
  email ILIKE '%ergomara2%'
  OR phone = '+34624239394'
  OR phone = '34624239394'
  OR email = '34624239394@phone.semzoprive.com';

-- 9. Eliminar de auth.users (si existen)
DELETE FROM auth.users
WHERE 
  email ILIKE '%ergomara2%'
  OR phone = '+34624239394'
  OR phone = '34624239394';

-- Verificar que se eliminaron todos los registros
SELECT 
  'profiles' as tabla,
  COUNT(*) as registros_restantes
FROM public.profiles
WHERE 
  email ILIKE '%ergomara2%'
  OR phone = '+34624239394'
  OR phone = '34624239394'
  OR email = '34624239394@phone.semzoprive.com'

UNION ALL

SELECT 
  'auth.users' as tabla,
  COUNT(*) as registros_restantes
FROM auth.users
WHERE 
  email ILIKE '%ergomara2%'
  OR phone = '+34624239394'
  OR phone = '34624239394';

-- Debería mostrar 0 registros restantes en ambas tablas
