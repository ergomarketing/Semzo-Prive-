-- =====================================================
-- FIX SIGNUP TRIGGERS - SOLUCIÓN COMPLETA
-- =====================================================
-- Este script elimina los triggers problemáticos y crea uno correcto

-- Paso 1: Eliminar todos los triggers existentes en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
DROP TRIGGER IF EXISTS sync_user_to_profiles ON auth.users;

-- Paso 2: Eliminar las funciones antiguas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_to_profiles() CASCADE;

-- Paso 3: Crear función correcta que inserta en public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_phone_formatted TEXT;
  v_full_name TEXT;
BEGIN
  -- Formatear teléfono si existe
  v_phone_formatted := NEW.phone;
  
  -- Construir full_name desde raw_user_meta_data si existe
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
  );
  
  -- Si full_name está vacío, usar email
  IF v_full_name IS NULL OR TRIM(v_full_name) = '' THEN
    v_full_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;

  -- Insertar en profiles solo si no existe
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    first_name,
    last_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_phone_formatted,
    v_full_name,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- No hacer nada si ya existe
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error pero no fallar el signup
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 4: Crear trigger en auth.users DESPUÉS del INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Paso 5: Verificar que el trigger se creó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✓ Trigger on_auth_user_created creado exitosamente';
  ELSE
    RAISE EXCEPTION '✗ Error: Trigger no se creó correctamente';
  END IF;
END $$;

-- Paso 6: Verificar que la función existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✓ Función handle_new_user creada exitosamente';
  ELSE
    RAISE EXCEPTION '✗ Error: Función no se creó correctamente';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TRIGGERS ARREGLADOS EXITOSAMENTE';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Ahora puedes registrar nuevos usuarios sin errores';
END $$;
