-- Check if email exists in auth.users (Supabase Auth table)
-- This is separate from public.profiles

SELECT 
  id,
  email,
  phone,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'ergomara@hotmail.com'
ORDER BY created_at DESC;

-- Note: You CANNOT delete from auth.users directly via SQL
-- You must use Supabase Dashboard → Authentication → Users → Delete
-- Or use Supabase Admin API with service_role key
