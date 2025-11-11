-- Eliminar triggers y funciones existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_confirmation();

-- Función para manejar confirmación de email (cuando se actualiza email_confirmed_at)
CREATE OR REPLACE FUNCTION public.handle_user_confirmation() 
RETURNS TRIGGER AS $$
BEGIN
  -- Solo proceder si email_confirmed_at cambió de NULL a una fecha (confirmación)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Verificar si ya existe el perfil
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      
      -- Crear perfil en tabla users
      INSERT INTO public.users (
        id, 
        email, 
        first_name, 
        last_name, 
        phone,
        membership_status,
        email_confirmed,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        'free',
        true,
        NOW(),
        NOW()
      );
      
      -- Log para debugging
      RAISE LOG 'Usuario confirmado y perfil creado: % (%)', NEW.email, NEW.id;
      
    ELSE
      -- Si ya existe, solo actualizar que está confirmado
      UPDATE public.users 
      SET 
        email_confirmed = true,
        updated_at = NOW()
      WHERE id = NEW.id;
      
      RAISE LOG 'Usuario ya existía, marcado como confirmado: % (%)', NEW.email, NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar cuando se actualiza auth.users (confirmación de email)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_user_confirmation();

-- También mantener función para usuarios que se crean ya confirmados (admin)
CREATE OR REPLACE FUNCTION public.handle_new_confirmed_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el usuario se crea YA confirmado
  IF NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Verificar si ya existe el perfil
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      
      INSERT INTO public.users (
        id, 
        email, 
        first_name, 
        last_name, 
        phone,
        membership_status,
        email_confirmed,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        'free',
        true,
        NOW(),
        NOW()
      );
      
      RAISE LOG 'Usuario creado ya confirmado: % (%)', NEW.email, NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para usuarios creados ya confirmados
CREATE TRIGGER on_auth_user_created_confirmed
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_confirmed_user();

-- Verificar que los triggers se crearon correctamente
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name IN ('on_auth_user_confirmed', 'on_auth_user_created_confirmed');

-- Mostrar usuarios en auth que están confirmados pero no tienen perfil
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  CASE WHEN pu.id IS NULL THEN 'SIN PERFIL' ELSE 'CON PERFIL' END as estado_perfil
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;
