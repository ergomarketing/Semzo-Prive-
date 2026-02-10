-- Eliminar usuarios de prueba directamente
-- Ejecutar cada bloque por separado si es necesario

-- Usuario 1: ROSA ORTIZ
DELETE FROM identity_verifications WHERE user_id = '2a0433aa-e143-460a-a76d-88f7832b94d6';
DELETE FROM reservations WHERE user_id = '2a0433aa-e143-460a-a76d-88f7832b94d6';
DELETE FROM profiles WHERE id = '2a0433aa-e143-460a-a76d-88f7832b94d6';
DELETE FROM auth.users WHERE id = '2a0433aa-e143-460a-a76d-88f7832b94d6';

-- Usuario 2: erika rosa gonzalez ortiz (hotmail)
DELETE FROM identity_verifications WHERE user_id = '90d67b08-249b-4d45-b549-9fdbdfbc981c';
DELETE FROM reservations WHERE user_id = '90d67b08-249b-4d45-b549-9fdbdfbc981c';
DELETE FROM profiles WHERE id = '90d67b08-249b-4d45-b549-9fdbdfbc981c';
DELETE FROM auth.users WHERE id = '90d67b08-249b-4d45-b549-9fdbdfbc981c';

-- Usuario 3: erika rosa gonzalez ortiz (gmail)
DELETE FROM identity_verifications WHERE user_id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';
DELETE FROM reservations WHERE user_id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';
DELETE FROM profiles WHERE id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';
DELETE FROM auth.users WHERE id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';

-- Verificar eliminación
SELECT COUNT(*) as remaining_users FROM auth.users 
WHERE email IN ('ergomarketing24@gmail.com', 'ergomarket@hotmail.com');
