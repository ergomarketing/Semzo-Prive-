-- Script para arreglar usuario con gift card aplicada pero membresía no activada
-- Usuario ID: d7b69013-b4b2-4c31-aa14-4e5d46a34ff2

-- 1. Actualizar profiles con datos correctos
UPDATE profiles 
SET 
  membership_status = 'active',
  membership_type = 'signature',
  subscription_end_date = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';

-- 2. Crear/actualizar registro en user_memberships
INSERT INTO user_memberships (
  user_id,
  membership_type,
  status,
  start_date,
  end_date,
  can_make_reservations,
  payment_method_verified,
  failed_payment_count
) VALUES (
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2',
  'signature',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  true,
  0
)
ON CONFLICT (user_id) DO UPDATE SET
  membership_type = 'signature',
  status = 'active',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '30 days',
  can_make_reservations = true,
  payment_method_verified = true,
  failed_payment_count = 0;

-- 3. Registrar en membership_history
INSERT INTO membership_history (
  user_id,
  membership_type,
  status,
  started_at,
  payment_method,
  payment_reference,
  amount
) VALUES (
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2',
  'signature',
  'active',
  NOW(),
  'gift_card',
  'SEMZO-8R62-XB6R',
  129.00
);

-- 4. Registrar en audit_logs
INSERT INTO audit_logs (
  user_id,
  action,
  entity_type,
  entity_id,
  new_data,
  created_at
) VALUES (
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2',
  'membership_fixed',
  'membership',
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2',
  jsonb_build_object(
    'membership_type', 'signature',
    'status', 'active',
    'fix_reason', 'gift_card_applied_but_not_activated'
  ),
  NOW()
);

-- Verificar resultados
SELECT 
  'profiles' as table_name,
  membership_status,
  membership_type,
  subscription_end_date
FROM profiles 
WHERE id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2'

UNION ALL

SELECT 
  'user_memberships' as table_name,
  status as membership_status,
  membership_type,
  end_date as subscription_end_date
FROM user_memberships
WHERE user_id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';
