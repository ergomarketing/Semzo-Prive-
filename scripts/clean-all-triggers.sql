-- Limpiar todos los triggers y funciones relacionadas con usuarios y perfiles

-- Eliminar triggers existentes en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS handle_users_updated_at ON auth.users;

-- Eliminar triggers en public.users si existen
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON public.users;

-- Eliminar triggers en public.profiles
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Eliminar funciones relacionadas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_confirmed() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_confirmed_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_email_confirmed() CASCADE;
DROP FUNCTION IF EXISTS public.update_profiles_updated_at() CASCADE;

-- Mostrar triggers restantes
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE (event_object_schema = 'auth' AND event_object_table = 'users')
   OR (event_object_schema = 'public' AND event_object_table IN ('users', 'profiles'))
ORDER BY event_object_table, trigger_name;

SELECT 'Triggers y funciones limpiados exitosamente' as resultado;
