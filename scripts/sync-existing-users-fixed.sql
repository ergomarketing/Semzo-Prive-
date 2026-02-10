-- Sincronizar usuarios existentes de auth.users a public.profiles

-- Insertar perfiles para usuarios existentes que no tienen perfil
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    email_verified,
    is_active,
    created_at,
    updated_at,
    last_login
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    true,
    NOW(),
    NOW(),
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Mostrar cuántos perfiles se sincronizaron
SELECT 
    COUNT(*) as perfiles_sincronizados,
    'Usuarios sincronizados exitosamente' as resultado
FROM public.profiles;

-- Verificar la sincronización
SELECT 
    'auth.users' as tabla,
    COUNT(*) as total_usuarios
FROM auth.users
UNION ALL
SELECT 
    'public.profiles' as tabla,
    COUNT(*) as total_perfiles
FROM public.profiles;
