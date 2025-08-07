-- Agregar columnas faltantes a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Actualizar registros existentes
UPDATE public.profiles 
SET 
  email_confirmed = FALSE,
  membership_status = 'free'
WHERE email_confirmed IS NULL OR membership_status IS NULL;

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
