-- Script para sincronizar usuarios faltantes entre auth.users y profiles
-- Ejecutar cuando hay usuarios en auth.users pero no en profiles

DO $$
DECLARE
    user_record RECORD;
    profile_count INTEGER;
BEGIN
    -- Contar usuarios en auth.users que no tienen perfil
    SELECT COUNT(*) INTO profile_count
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL;
    
    RAISE NOTICE 'Usuarios sin perfil encontrados: %', profile_count;
    
    -- Verificar usuarios en auth.users que no están en public.profiles
    FOR user_record IN 
        SELECT au.id,
               au.email,
               au.created_at as auth_created,
               au.email_confirmed_at,
               p.id as profile_exists
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
        ORDER BY au.created_at DESC
    LOOP
        -- Crear perfiles para usuarios que no los tienen y cuyo email está confirmado
        IF user_record.email_confirmed_at IS NOT NULL THEN
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                first_name,
                last_name,
                phone,
                membership_status,
                is_active,
                email_confirmed,
                created_at,
                updated_at
            ) VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', '') as full_name,
                COALESCE(user_record.raw_user_meta_data->>'first_name', '') as first_name,
                COALESCE(user_record.raw_user_meta_data->>'last_name', '') as last_name,
                COALESCE(user_record.raw_user_meta_data->>'phone', '') as phone,
                'free' as membership_status,
                true as is_active,
                true as email_confirmed,
                user_record.auth_created,
                NOW()
            );
            
            RAISE NOTICE 'Perfil creado para usuario: %', user_record.email;
        END IF;
    END LOOP;
    
    -- Sincronizar usuarios faltantes de auth.users a public.profiles
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      first_name,
      last_name,
      phone,
      membership_status,
      is_active,
      email_confirmed,
      created_at,
      updated_at
    )
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', ''),
      COALESCE(au.raw_user_meta_data->>'first_name', ''),
      COALESCE(au.raw_user_meta_data->>'last_name', ''),
      COALESCE(au.raw_user_meta_data->>'phone', ''),
      'free' as membership_status,
      true as is_active,
      (au.email_confirmed_at IS NOT NULL) as email_confirmed,
      au.created_at,
      NOW() as updated_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL;

    -- Verificar resultados
    SELECT 
      'auth.users' as tabla, 
      COUNT(*) as total 
    INTO profile_count
    FROM auth.users
    UNION ALL
    SELECT 
      'public.profiles' as tabla, 
      COUNT(*) as total 
    INTO profile_count
    FROM public.profiles;
    
    RAISE NOTICE 'Usuarios sincronizados: %', profile_count;
    
    RAISE NOTICE 'Sincronización completada';
END $$;
