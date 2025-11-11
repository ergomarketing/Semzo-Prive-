-- Script simplificado para corregir RLS y sincronizar usuarios
-- Este script es compatible con la estructura actual de la base de datos

-- PARTE 1: VERIFICAR Y AJUSTAR RLS
-- ============================================

-- Verificar que RLS esté habilitado (ya debería estarlo)
ALTER TABLE IF EXISTS public.sms_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- PARTE 2: MEJORAR TRIGGER DE SINCRONIZACIÓN
-- ============================================

-- Función mejorada para crear perfiles automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_phone TEXT;
  user_email TEXT;
BEGIN
  -- Intentar obtener teléfono desde varias fuentes posibles
  user_phone := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone_number'
  );
  
  -- Obtener email (puede ser NULL para usuarios SMS)
  user_email := NEW.email;
  
  -- Si no hay email, generar uno temporal para usuarios SMS
  IF user_email IS NULL OR user_email = '' THEN
    IF user_phone IS NOT NULL THEN
      user_email := replace(user_phone, '+', '') || '@phone.semzoprive.com';
    ELSE
      user_email := NEW.id::TEXT || '@temp.semzoprive.com';
    END IF;
  END IF;

  -- Insertar perfil solo si no existe
  INSERT INTO public.profiles (id, email, phone, full_name, email_confirmed, created_at)
  VALUES (
    NEW.id,
    user_email,
    user_phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    email = COALESCE(EXCLUDED.email, profiles.email),
    email_confirmed = COALESCE(NEW.email_confirmed_at IS NOT NULL, profiles.email_confirmed);

  RETURN NEW;
END;
$$;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PARTE 3: SINCRONIZAR USUARIOS EXISTENTES
-- ============================================

-- Sincronizar todos los usuarios que no tienen perfil
DO $$
DECLARE
  user_record RECORD;
  user_phone TEXT;
  user_email TEXT;
  synced_count INT := 0;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.phone, u.raw_user_meta_data, u.email_confirmed_at, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Obtener teléfono
    user_phone := COALESCE(
      user_record.phone,
      user_record.raw_user_meta_data->>'phone',
      user_record.raw_user_meta_data->>'phone_number'
    );
    
    -- Obtener o generar email
    user_email := user_record.email;
    IF user_email IS NULL OR user_email = '' THEN
      IF user_phone IS NOT NULL THEN
        user_email := replace(user_phone, '+', '') || '@phone.semzoprive.com';
      ELSE
        user_email := user_record.id::TEXT || '@temp.semzoprive.com';
      END IF;
    END IF;

    -- Insertar perfil
    INSERT INTO public.profiles (id, email, phone, full_name, email_confirmed, created_at)
    VALUES (
      user_record.id,
      user_email,
      user_phone,
      COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
      COALESCE(user_record.email_confirmed_at IS NOT NULL, FALSE),
      user_record.created_at
    )
    ON CONFLICT (id) DO NOTHING;
    
    synced_count := synced_count + 1;
  END LOOP;

  RAISE NOTICE 'Sincronizados % usuarios con perfiles', synced_count;
END;
$$;

-- PARTE 4: CREAR TABLA ADDRESSES SI NO EXISTE
-- ============================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'ES',
  phone TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para addresses
DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON public.addresses(user_id, is_default) WHERE is_default = true;

-- PARTE 5: VERIFICACIÓN FINAL
-- ============================================

SELECT 
  'Configuración completada' as status,
  COUNT(*) as total_usuarios,
  COUNT(p.id) as usuarios_con_perfil,
  COUNT(*) - COUNT(p.id) as usuarios_sin_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;
