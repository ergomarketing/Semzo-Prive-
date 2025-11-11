-- Limpiar todas las tablas de usuarios
-- CUIDADO: Esto eliminará TODOS los usuarios

DO $$
DECLARE
    user_record RECORD;
    total_deleted INTEGER := 0;
BEGIN
    RAISE NOTICE '=== INICIANDO LIMPIEZA DE USUARIOS ===';
    
    -- Contar usuarios antes de eliminar
    SELECT COUNT(*) INTO total_deleted FROM auth.users;
    RAISE NOTICE 'Usuarios encontrados en auth.users: %', total_deleted;
    
    -- Eliminar de las tablas públicas primero
    DELETE FROM public.profiles;
    RAISE NOTICE '✓ Tabla public.profiles limpiada';
    
    DELETE FROM public.users;
    RAISE NOTICE '✓ Tabla public.users limpiada';
    
    -- Eliminar usuarios de auth.users uno por uno
    total_deleted := 0;
    FOR user_record IN 
        SELECT id, email FROM auth.users
    LOOP
        DELETE FROM auth.users WHERE id = user_record.id;
        total_deleted := total_deleted + 1;
        RAISE NOTICE 'Usuario eliminado: % (%)', user_record.email, user_record.id;
    END LOOP;
    
    RAISE NOTICE '=== LIMPIEZA COMPLETADA ===';
    RAISE NOTICE 'Total de usuarios eliminados: %', total_deleted;
    
END $$;

-- Mostrar estado final de las tablas
SELECT 'auth.users' as tabla, count(*) as registros FROM auth.users
UNION ALL
SELECT 'public.users' as tabla, count(*) as registros FROM public.users
UNION ALL  
SELECT 'public.profiles' as tabla, count(*) as registros FROM public.profiles;
