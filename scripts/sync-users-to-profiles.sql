-- Script para sincronizar datos de 'users' a 'profiles' si es necesario

-- Primero verificar si la tabla profiles existe y tiene la estructura correcta
DO $$
BEGIN
  -- Crear tabla profiles si no existe (basada en la estructura que podría necesitar)
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(20),
      membership_status VARCHAR(50) DEFAULT 'free',
      email_confirmed BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE
    );
    
    -- Crear índices
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_membership ON public.profiles(membership_status);
    
    RAISE NOTICE 'Tabla profiles creada';
  ELSE
    RAISE NOTICE 'Tabla profiles ya existe';
  END IF;
END $$;

-- Sincronizar datos de 'users' a 'profiles'
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  phone,
  membership_status,
  email_confirmed,
  created_at,
  updated_at,
  last_login
)
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone,
  u.membership_status,
  u.email_confirmed,
  u.created_at,
  u.updated_at,
  u.last_login
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL  -- Solo insertar los que no existen en profiles
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  membership_status = EXCLUDED.membership_status,
  email_confirmed = EXCLUDED.email_confirmed,
  updated_at = NOW();

-- Mostrar resultado
SELECT 
  'SINCRONIZACIÓN COMPLETADA' as resultado,
  COUNT(*) as total_profiles
FROM public.profiles;

-- Mostrar estado final
SELECT 
  au.email,
  CASE 
    WHEN pu.id IS NOT NULL AND pp.id IS NOT NULL THEN '✅ AMBAS TABLAS'
    WHEN pu.id IS NOT NULL THEN '📋 SOLO users'
    WHEN pp.id IS NOT NULL THEN '👤 SOLO profiles'
    ELSE '❌ NINGUNA TABLA'
  END as estado
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;
