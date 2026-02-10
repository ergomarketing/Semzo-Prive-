-- Migrar datos existentes de raw_user_meta_data a profiles
-- Este script actualiza los usuarios que ya existen pero no tienen nombre/teléfono en profiles

UPDATE profiles
SET 
  first_name = COALESCE(
    first_name,
    (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = profiles.id)
  ),
  last_name = COALESCE(
    last_name,
    (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE id = profiles.id)
  ),
  full_name = COALESCE(
    full_name,
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = profiles.id),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = profiles.id)
  ),
  phone = COALESCE(
    phone,
    (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = profiles.id),
    (SELECT phone FROM auth.users WHERE id = profiles.id)
  ),
  updated_at = NOW()
WHERE 
  (first_name IS NULL OR last_name IS NULL OR full_name IS NULL OR phone IS NULL)
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = profiles.id);

-- Verificar resultados
SELECT 
  id,
  email,
  first_name,
  last_name,
  full_name,
  phone
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
