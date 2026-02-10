-- LIMPIEZA SIMPLE DE BASE DE DATOS
-- Ejecutar paso a paso

-- Paso 1: Eliminar tablas duplicadas
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.temp_users CASCADE;

-- Paso 2: Verificar estructura básica
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
