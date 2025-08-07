-- Sincronizar el usuario específico que está en auth.users pero no en profiles
-- Este script es solo para arreglar la situación actual

DO $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Buscar usuarios en auth.users que no están en profiles
    FOR auth_user IN 
        SELECT 
            au.id,
            au.email,
            au.raw_user_meta_data,
            au.created_at,
            au.email_confirmed_at
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Insertar el perfil faltante
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            first_name,
            last_name,
            phone,
            membership_status,
            email_confirmed,
            created_at,
            updated_at
        ) VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.email),
            COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'phone', ''),
            'free',
            CASE WHEN auth_user.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            auth_user.created_at,
            NOW()
        );
        
        RAISE NOTICE 'Perfil creado para usuario: %', auth_user.email;
    END LOOP;
END $$;

-- Verificar el resultado
SELECT 
    'Sincronización completada' as status,
    COUNT(*) as usuarios_sincronizados
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id;
