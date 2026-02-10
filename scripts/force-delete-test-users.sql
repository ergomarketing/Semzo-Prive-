-- Eliminar usuarios de prueba con CASCADE para forzar eliminación de todas las dependencias

-- Deshabilitar temporalmente triggers y constraints
SET session_replication_role = replica;

-- Usuario 1: ROSA ORTIZ
DELETE FROM auth.users WHERE id = '2a0433aa-e143-460a-a76d-88f7832b94d6';

-- Usuario 2: erika rosa gonzalez ortiz (hotmail)
DELETE FROM auth.users WHERE id = '90d67b08-249b-4d45-b549-9fdbdfbc981c';

-- Usuario 3: erika rosa gonzalez ortiz (gmail)
DELETE FROM auth.users WHERE id = 'd7b69013-b4b2-4c31-aa14-4e5d46a34ff2';

-- Reactivar triggers y constraints
SET session_replication_role = DEFAULT;

-- Verificar eliminación
SELECT COUNT(*) as remaining_test_users 
FROM auth.users 
WHERE email IN (
  'ergomarketing24@gmail.com',
  'ergomarket@hotmail.com'
);
