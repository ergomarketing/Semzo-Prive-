-- Agregar columna membership_type a la tabla bags
ALTER TABLE bags ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'essentiel';

-- Crear un índice para mejorar las consultas por tipo de membresía
CREATE INDEX IF NOT EXISTS idx_bags_membership_type ON bags(membership_type);
