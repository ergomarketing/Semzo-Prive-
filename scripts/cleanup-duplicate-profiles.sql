-- Script para eliminar perfiles duplicados y usuarios de prueba
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- Eliminar todos los registros relacionados con ergomara2@hotmail.com
DELETE FROM public.profiles 
WHERE email = 'ergomara2@hotmail.com';

DELETE FROM public.profiles 
WHERE email LIKE '%346242393948@phone.semzoprive.com%';

-- Eliminar registros con teléfono +34624239394 (duplicados de erika)
DELETE FROM public.profiles 
WHERE phone = '+34624239394';

-- Eliminar otros perfiles de prueba visibles en el screenshot
DELETE FROM public.profiles 
WHERE email IN (
  'wendyvanessagr@hotmail.com',
  'begoromero21@gmail.com',
  'galvanicbelleza@gmail.com'
);

-- Eliminar registros con nombres duplicados de "erika rosa gonzalez"
DELETE FROM public.profiles 
WHERE full_name ILIKE '%erika rosa gonzalez%'
  AND email_confirmed = FALSE;

-- Verificar perfiles restantes
SELECT id, email, full_name, phone, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

COMMIT;

-- NOTA: Si necesitas eliminar TODOS los usuarios de prueba y empezar limpio:
-- UNCOMMENT las siguientes líneas:
/*
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.membership_intents CASCADE;
TRUNCATE TABLE public.user_memberships CASCADE;
TRUNCATE TABLE public.gift_card_transactions CASCADE;
TRUNCATE TABLE public.reservations CASCADE;
TRUNCATE TABLE public.identity_verifications CASCADE;
*/
