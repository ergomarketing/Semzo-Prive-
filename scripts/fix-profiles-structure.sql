-- Primero verificar la estructura actual de la tabla profiles
SELECT 
  'ESTRUCTURA ACTUAL DE PROFILES' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
  -- Agregar phone si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'phone' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone VARCHAR(20);
    RAISE NOTICE 'Columna phone agregada';
  END IF;

  -- Agregar membership_status si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'membership_status' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN membership_status VARCHAR(50) DEFAULT 'free';
    RAISE NOTICE 'Columna membership_status agregada';
  END IF;

  -- Agregar email_confirmed si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email_confirmed' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_confirmed BOOLEAN DEFAULT false;
    RAISE NOTICE 'Columna email_confirmed agregada';
  END IF;

  -- Agregar last_login si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'last_login' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Columna last_login agregada';
  END IF;

  -- Agregar email si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255);
    RAISE NOTICE 'Columna email agregada';
  END IF;
END $$;

-- Mostrar estructura actualizada
SELECT 
  'ESTRUCTURA ACTUALIZADA DE PROFILES' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
