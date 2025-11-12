-- Script seguro para sincronizar datos de 'users' a 'profiles'

-- Primero mostrar qué columnas existen en cada tabla
SELECT 'COLUMNAS EN USERS' as tabla, column_name
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
UNION ALL
SELECT 'COLUMNAS EN PROFILES' as tabla, column_name
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY tabla, column_name;

-- Sincronizar solo las columnas que existen en ambas tablas
DO $$
DECLARE
  sync_count INTEGER := 0;
BEGIN
  -- Insertar/actualizar registros de users a profiles
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    updated_at
  )
  SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.updated_at
  FROM public.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = EXCLUDED.updated_at;

  GET DIAGNOSTICS sync_count = ROW_COUNT;
  RAISE NOTICE 'Sincronizados % registros', sync_count;

  -- Actualizar columnas adicionales si existen
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email' AND table_schema = 'public') THEN
    UPDATE public.profiles p 
    SET email = u.email
    FROM public.users u 
    WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
    RAISE NOTICE 'Emails actualizados';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone' AND table_schema = 'public') THEN
    UPDATE public.profiles p 
    SET phone = u.phone
    FROM public.users u 
    WHERE p.id = u.id AND u.phone IS NOT NULL;
    RAISE NOTICE 'Teléfonos actualizados';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'membership_status' AND table_schema = 'public') THEN
    UPDATE public.profiles p 
    SET membership_status = COALESCE(u.membership_status, 'free')
    FROM public.users u 
    WHERE p.id = u.id;
    RAISE NOTICE 'Estados de membresía actualizados';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_confirmed' AND table_schema = 'public') THEN
    UPDATE public.profiles p 
    SET email_confirmed = COALESCE(u.email_confirmed, true)
    FROM public.users u 
    WHERE p.id = u.id;
    RAISE NOTICE 'Estados de confirmación actualizados';
  END IF;
END $$;

-- Mostrar resultado final
SELECT 
  'RESULTADO FINAL' as seccion,
  au.email,
  CASE WHEN pu.id IS NOT NULL THEN '✓' ELSE '✗' END as en_users,
  CASE WHEN pp.id IS NOT NULL THEN '✓' ELSE '✗' END as en_profiles,
  CASE 
    WHEN pu.id IS NOT NULL AND pp.id IS NOT NULL THEN '✅ AMBAS'
    WHEN pu.id IS NOT NULL THEN '📋 SOLO users'
    WHEN pp.id IS NOT NULL THEN '👤 SOLO profiles'
    ELSE '❌ NINGUNA'
  END as estado
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;

-- Contar totales
SELECT 
  'TOTALES' as info,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as total_confirmados;
