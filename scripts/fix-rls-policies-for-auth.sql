-- DIAGNÓSTICO Y FIX: RLS policies que bloquean queries internas de Supabase Auth
-- El error "Database error finding user" ocurre porque Auth intenta consultar profiles
-- durante signup pero las policies RLS bloquean la consulta

-- 1. VER POLICIES ACTUALES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. DESHABILITAR RLS TEMPORALMENTE PARA AUTH SERVICE ROLE
-- Esto permite que las queries internas de Auth funcionen

-- Eliminar policies restrictivas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Crear policies que permitan a Auth service role trabajar
CREATE POLICY "Allow service role full access to profiles"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Permitir que usuarios autenticados vean su propio profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Permitir que usuarios autenticados actualicen su propio profile  
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir inserts para usuarios autenticados (para sync-profile)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- IMPORTANTE: Verificar que RLS está habilitado pero con policies correctas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR RESULTADO
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
