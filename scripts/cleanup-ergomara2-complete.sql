-- LIMPIEZA COMPLETA de ergomara2@gmail.com
-- Ejecuta este script en Supabase SQL Editor

-- 1. Eliminar de todas las tablas relacionadas
DELETE FROM public.bag_passes WHERE user_id IN (SELECT id FROM public.profiles WHERE email ILIKE '%ergomara2%');
DELETE FROM public.identity_verifications WHERE user_id IN (SELECT id FROM public.profiles WHERE email ILIKE '%ergomara2%');
DELETE FROM public.membership_intents WHERE user_id IN (SELECT id FROM public.profiles WHERE email ILIKE '%ergomara2%');
DELETE FROM public.user_memberships WHERE user_id IN (SELECT id FROM public.profiles WHERE email ILIKE '%ergomara2%');
DELETE FROM public.reservations WHERE user_id IN (SELECT id FROM public.profiles WHERE email ILIKE '%ergomara2%');
DELETE FROM public.gift_card_transactions WHERE user_id IN (SELECT id FROM public.profiles WHERE email ILIKE '%ergomara2%');
DELETE FROM public.audit_log WHERE user_id IN (SELECT id FROM public.profiles WHERE email ILIKE '%ergomara2%');

-- 2. Eliminar de profiles
DELETE FROM public.profiles WHERE email ILIKE '%ergomara2%';

-- 3. Eliminar de auth.users
DELETE FROM auth.users WHERE email ILIKE '%ergomara2%';

-- 4. Verificar que está limpio
SELECT 'profiles' as tabla, COUNT(*) as registros FROM public.profiles WHERE email ILIKE '%ergomara2%'
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users WHERE email ILIKE '%ergomara2%';
