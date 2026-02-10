-- Test manual del trigger
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test@example.com';
BEGIN
    -- Verificar estado actual de la base de datos
    RAISE NOTICE 'Verificando configuración...';
    PERFORM COUNT(*) FROM public.profiles;
    
    -- Verificar usuarios en auth
    RAISE NOTICE 'Usuarios en auth.users...';
    PERFORM COUNT(*) FROM auth.users;
    PERFORM COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) FROM auth.users;
    
    -- Simular inserción en auth.users (esto normalmente lo hace Supabase)
    RAISE NOTICE 'Simulando confirmación de usuario...';
    
    -- Llamar directamente a la función del trigger
    PERFORM public.handle_user_confirmation();
    
    -- Mostrar últimos usuarios registrados
    RAISE NOTICE 'Mostrando últimos usuarios registrados...';
    PERFORM email, email_confirmed_at, created_at, user_metadata 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 5;
    
    RAISE NOTICE 'Test completado. Verificar logs arriba.';
END $$;

-- Verificar que la función existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_user_confirmation';
