-- Cleanup script to completely remove user ergomara2@gmail.com from all tables
-- Run this in Supabase SQL Editor to fully delete the user

-- 1. Delete from profiles table (custom user data)
DELETE FROM public.profiles 
WHERE email = 'ergomara2@gmail.com';

-- 2. Delete from membership_intents (any pending memberships)
DELETE FROM public.membership_intents 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'ergomara2@gmail.com'
);

-- 3. Delete from user_memberships (active memberships)
DELETE FROM public.user_memberships 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'ergomara2@gmail.com'
);

-- 4. Delete from gift_card_transactions (gift card usage history)
DELETE FROM public.gift_card_transactions 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'ergomara2@gmail.com'
);

-- 5. Delete from reservations (if exists)
DELETE FROM public.reservations 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'ergomara2@gmail.com'
);

-- 6. Delete from identity_verifications (Stripe verification records)
DELETE FROM public.identity_verifications 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'ergomara2@gmail.com'
);

-- 7. Finally, delete from auth.users (authentication table)
DELETE FROM auth.users 
WHERE email = 'ergomara2@gmail.com';

-- Verify deletion
SELECT 'Profiles' as table_name, COUNT(*) as count FROM public.profiles WHERE email = 'ergomara2@gmail.com'
UNION ALL
SELECT 'Auth Users', COUNT(*) FROM auth.users WHERE email = 'ergomara2@gmail.com';
