-- Script para eliminar usuarios de prueba específicos
-- ADVERTENCIA: Esto eliminará TODOS los datos relacionados con estos usuarios

-- IDs de los usuarios a eliminar
DO $$
DECLARE
    user_ids UUID[] := ARRAY[
        '2a0433aa-e143-460a-a76d-88f7832b94d6'::UUID,  -- ROSA ORTIZ
        '90d67b08-249b-4d45-b549-9fdbdfbc981c'::UUID,  -- erika rosa gonzalez ortiz
        'd7b69013-b4c2-4c31-aaf4-4de5d46a34ff'::UUID   -- erika rosa gonzalez ortiz
    ];
    v_user_id UUID;
BEGIN
    FOREACH v_user_id IN ARRAY user_ids
    LOOP
        -- Eliminar solo tablas que existen, con IF EXISTS para evitar errores
        
        -- 1. Eliminar reservations
        DELETE FROM reservations WHERE user_id = v_user_id;
        RAISE NOTICE 'Deleted reservations for user %', v_user_id;
        
        -- 2. Eliminar identity_verifications
        DELETE FROM identity_verifications WHERE user_id = v_user_id;
        RAISE NOTICE 'Deleted identity_verifications for user %', v_user_id;
        
        -- 3. Eliminar profiles
        DELETE FROM profiles WHERE id = v_user_id;
        RAISE NOTICE 'Deleted profile for user %', v_user_id;
        
        -- 4. Eliminar usuario de auth.users
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE NOTICE 'Deleted auth user %', v_user_id;
    END LOOP;
    
    RAISE NOTICE 'All test users deleted successfully';
END $$;

-- Verificar que los usuarios fueron eliminados
SELECT 'Remaining test users:' as message;
SELECT id, email FROM auth.users 
WHERE email IN (
    'ergomarketing24@gmail.com',
    'ergomarket@hotmail.com'
);
