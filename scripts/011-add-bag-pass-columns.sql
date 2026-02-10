-- Agregar columnas para rastrear pases de bolso en profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_bag_pass TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bag_pass_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bag_pass_bag_id UUID DEFAULT NULL;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN profiles.active_bag_pass IS 'ID del pase de bolso activo o tipo de pase';
COMMENT ON COLUMN profiles.bag_pass_expires IS 'Fecha de expiración del pase de bolso';
COMMENT ON COLUMN profiles.bag_pass_bag_id IS 'ID del bolso asociado al pase';
