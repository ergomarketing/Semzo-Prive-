-- Script para renombrar la columna member_type a membership_type
-- Esto corrige la inconsistencia entre el esquema y el código

-- 1. Renombrar la columna
ALTER TABLE public.profiles 
RENAME COLUMN member_type TO membership_type;

-- 2. Actualizar el constraint check
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_member_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_membership_type_check 
CHECK (membership_type IN ('free', 'essentiel', 'signature', 'prive'));

-- 3. Verificar que el cambio se aplicó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'membership_type';
