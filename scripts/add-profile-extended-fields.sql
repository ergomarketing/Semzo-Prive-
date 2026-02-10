-- Agregar campos extendidos a profiles para verificación
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'España';
