-- EMERGENCY: Deshabilitar RLS en profiles para permitir signup
-- Esto es temporal hasta identificar qué policy específica está bloqueando Auth

-- Deshabilitar RLS completamente en profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verificación
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
