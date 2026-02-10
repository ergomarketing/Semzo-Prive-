-- Verificar qué tablas existen
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar estructura de la tabla profiles
\d public.profiles;

-- Verificar si hay usuarios en auth.users
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar si hay perfiles en public.profiles
SELECT id, email, full_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar triggers existentes
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY trigger_name;
