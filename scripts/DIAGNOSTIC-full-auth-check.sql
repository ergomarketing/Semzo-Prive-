-- DIAGNÓSTICO COMPLETO: Identificar qué está causando "Database error finding user"

-- 1. Verificar que existe el schema auth
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- 2. Verificar que existe la tabla auth.users
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';

-- 3. Verificar columnas de auth.users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Verificar si existe la tabla profiles
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- 5. Verificar RLS status de profiles
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 6. Verificar policies activas en profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 7. Verificar extensiones instaladas relacionadas con Auth
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pgcrypto', 'uuid-ossp', 'pgjwt');

-- 8. Verificar funciones en public schema que podrían estar interfiriendo
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%' OR routine_name LIKE '%auth%'
ORDER BY routine_name;

-- 9. Buscar constraints en profiles que puedan fallar
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'profiles';

-- 10. Verificar índices en profiles
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'profiles';
