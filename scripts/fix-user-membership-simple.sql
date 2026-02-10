-- Script simplificado para arreglar usuario con gift card aplicada
-- Usuario ID: d7b69013-b4b2-4c31-aa14-4e5d46a34ff2

-- 1. Actualizar profiles con membership activa
UPDATE profiles 
SET 
  membership_status = 'active',
  membership_type = 'signature',
  subscription_end_date = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';

-- 2. Crear registro en user_memberships (la tabla principal)
INSERT INTO user_memberships (
  user_id,
  membership_type,
  status,
  start_date,
  end_date,
  can_make_reservations,
  payment_method_verified,
  failed_payment_count,
  created_at,
  updated_at
) VALUES (
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2',
  'signature',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  true,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  membership_type = 'signature',
  status = 'active',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '30 days',
  can_make_reservations = true,
  payment_method_verified = true,
  failed_payment_count = 0,
  updated_at = NOW();

-- Verificar resultado
SELECT 
  id,
  email,
  membership_status,
  membership_type,
  subscription_end_date
FROM profiles 
WHERE id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';

SELECT 
  user_id,
  membership_type,
  status,
  start_date,
  end_date,
  can_make_reservations
FROM user_memberships 
WHERE user_id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';
