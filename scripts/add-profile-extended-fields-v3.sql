-- Agregar columnas extendidas a profiles para verificación de identidad
-- Solo agrega las columnas que faltan

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_identity_session_id TEXT;
