-- Agregar columna de onboarding completado a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
ON public.profiles(onboarding_completed);

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica si el usuario completó el wizard de onboarding';
