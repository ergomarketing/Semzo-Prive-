-- Agregar la columna created_at que falta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar created_at para registros existentes (usar updated_at como referencia)
UPDATE public.profiles 
SET created_at = updated_at 
WHERE created_at IS NULL;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('created_at', 'updated_at')
ORDER BY ordinal_position;
