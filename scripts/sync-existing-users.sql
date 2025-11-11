-- Sincronizar usuarios existentes de auth.users a public.users y public.profiles

DO $$
DECLARE
    user_record RECORD;
    users_synced INTEGER := 0;
    profiles_synced INTEGER := 0;
BEGIN
    RAISE NOTICE '=== SINCRONIZANDO USUARIOS EXISTENTES ===';
    
    -- Contar usuarios en auth.users
    SELECT COUNT(*) INTO users_synced FROM auth.users;
    RAISE NOTICE 'Usuarios encontrados en auth.users: %', users_synced;
    
    users_synced := 0;
    profiles_synced := 0;
    
    -- Procesar cada usuario de auth.users
    FOR user_record IN 
        SELECT 
            id,
            email,
            raw_user_meta_data,
            created_at,
            updated_at,
            email_confirmed_at,
            last_sign_in_at
        FROM auth.users
        ORDER BY created_at
    LOOP
        -- Sincronizar a public.users
        INSERT INTO public.users (
            id,
            email,
            full_name,
            created_at,
            updated_at,
            email_confirmed_at,
            last_sign_in_at,
            is_active
        ) VALUES (
            user_record.id,
            user_record.email,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.raw_user_meta_data->>'name',
                split_part(user_record.email, '@', 1)
            ),
            user_record.created_at,
            user_record.updated_at,
            user_record.email_confirmed_at,
            user_record.last_sign_in_at,
            true
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            updated_at = EXCLUDED.updated_at,
            email_confirmed_at = EXCLUDED.email_confirmed_at,
            last_sign_in_at = EXCLUDED.last_sign_in_at;
        
        users_synced := users_synced + 1;
        
        -- Sincronizar a public.profiles
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            first_name,
            last_name,
            email_verified,
            created_at,
            updated_at,
            last_login
        ) VALUES (
            user_record.id,
            user_record.email,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.raw_user_meta_data->>'name',
                split_part(user_record.email, '@', 1)
            ),
            user_record.raw_user_meta_data->>'first_name',
            user_record.raw_user_meta_data->>'last_name',
            user_record.email_confirmed_at IS NOT NULL,
            user_record.created_at,
            user_record.updated_at,
            user_record.last_sign_in_at
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email_verified = EXCLUDED.email_verified,
            updated_at = EXCLUDED.updated_at,
            last_login = EXCLUDED.last_login;
        
        profiles_synced := profiles_synced + 1;
        
        RAISE NOTICE 'Usuario sincronizado: % (%)', user_record.email, user_record.id;
    END LOOP;
    
    RAISE NOTICE '=== SINCRONIZACIÓN COMPLETADA ===';
    RAISE NOTICE 'Usuarios sincronizados en public.users: %', users_synced;
    RAISE NOTICE 'Perfiles sincronizados en public.profiles: %', profiles_synced;
END $$;

-- Verificar sincronización
SELECT 'auth.users' as tabla, count(*) as registros FROM auth.users
UNION ALL
SELECT 'public.users' as tabla, count(*) as registros FROM public.users
UNION ALL  
SELECT 'public.profiles' as tabla, count(*) as registros FROM public.profiles;

-- Mostrar algunos registros para verificar
SELECT 
    'auth.users' as origen,
    id,
    email,
    created_at
FROM auth.users
LIMIT 3

UNION ALL

SELECT 
    'public.users' as origen,
    id::text,
    email,
    created_at
FROM public.users
LIMIT 3

UNION ALL

SELECT 
    'public.profiles' as origen,
    id::text,
    email,
    created_at
FROM public.profiles
LIMIT 3;
