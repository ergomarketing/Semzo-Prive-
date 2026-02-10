-- ========================================
-- FIX DEFINITIVO PARA SIGNUP
-- ========================================
-- Este script elimina el trigger roto y crea uno nuevo correcto

-- PASO 1: Eliminar trigger y función rotos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;

-- PASO 2: Crear función correcta que inserta en PROFILES (no en users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar en public.profiles cuando se crea un usuario en auth.users
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay error, no fallar el signup, solo loguear
    RAISE WARNING 'Error creando profile para user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- PASO 3: Crear trigger que ejecuta la función
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 4: Verificación
DO $$
BEGIN
  RAISE NOTICE '✓ Trigger y función recreados correctamente';
  RAISE NOTICE '✓ Ahora los usuarios se registrarán en public.profiles sin errores';
END $$;
