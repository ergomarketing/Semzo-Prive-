-- Agregar columna de categoría de membresía a la tabla bags
ALTER TABLE bags ADD COLUMN IF NOT EXISTS membership_category TEXT;

-- Actualizar valores existentes con una categoría por defecto
UPDATE bags SET membership_category = 'SIGNATURE' WHERE membership_category IS NULL;

-- Agregar constraint para validar solo las 3 categorías
ALTER TABLE bags ADD CONSTRAINT membership_category_check 
CHECK (membership_category IN ('SIGNATURE', 'PRIVÉ', 'L''ESSENTIEL'));
