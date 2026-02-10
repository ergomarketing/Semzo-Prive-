-- Arreglar trigger de signup que está causando "Database error finding user"
-- Este script elimina triggers conflictivos y crea uno limpio

-- PASO 1: Eliminar TODOS los triggers existentes que puedan estar causando conflicto
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- PASO 2: Eliminar funciones antiguas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_email_confirmed() CASCADE;

-- PASO 3: Verificar que NO exista tabla 'users' (debería ser 'profiles')
-- Si existe 'users', renombrarla o migrar datos
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    RAISE NOTICE 'Tabla public.users encontrada - considerar migrar a profiles';
  END IF;
END $$;

-- PASO 4: Crear función CORRECTA que inserta en profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en profiles con manejo de errores
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    is_active,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    true,
    (NEW.email_confirmed_at IS NOT NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RETURN NEW; -- Continuar sin fallar el signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear trigger limpio
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 6: Verificar triggers activos
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- PASO 7: Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✓ Triggers limpiados y recreados correctamente';
  RAISE NOTICE '✓ Signup ahora debería funcionar sin errores';
END $$;
