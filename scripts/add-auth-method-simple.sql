-- PASO 1: Agregar columna auth_method a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_method TEXT CHECK (auth_method IN ('sms', 'email'));

-- PASO 1.1: Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_method ON profiles(auth_method);

-- PASO 1.2: Establecer 'email' por defecto para usuarios existentes
UPDATE profiles 
SET auth_method = 'email' 
WHERE auth_method IS NULL;
