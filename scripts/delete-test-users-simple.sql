-- Script simple para eliminar usuarios de prueba específicos

-- 1. Eliminar reservations
DELETE FROM reservations 
WHERE user_id IN (
  '2a0433aa-e143-460a-a76d-88f7832b94d6',
  '90d67b08-249b-4d45-b549-9fdbdfbc981c',
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2'
);

-- 2. Eliminar identity_verifications
DELETE FROM identity_verifications 
WHERE user_id IN (
  '2a0433aa-e143-460a-a76d-88f7832b94d6',
  '90d67b08-249b-4d45-b549-9fdbdfbc981c',
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2'
);

-- 3. Eliminar profiles
DELETE FROM profiles 
WHERE id IN (
  '2a0433aa-e143-460a-a76d-88f7832b94d6',
  '90d67b08-249b-4d45-b549-9fdbdfbc981c',
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2'
);

-- 4. Eliminar usuarios de auth.users
DELETE FROM auth.users 
WHERE id IN (
  '2a0433aa-e143-460a-a76d-88f7832b94d6',
  '90d67b08-249b-4d45-b549-9fdbdfbc981c',
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2'
);

-- Verificar que fueron eliminados
SELECT COUNT(*) as remaining_test_users
FROM auth.users 
WHERE id IN (
  '2a0433aa-e143-460a-a76d-88f7832b94d6',
  '90d67b08-249b-4d45-b549-9fdbdfbc981c',
  'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2'
);
