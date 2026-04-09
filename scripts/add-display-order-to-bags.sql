-- Añadir columna display_order para ordenamiento manual del catálogo
-- Esta columna permite a los admins reordenar bolsos en el catálogo

ALTER TABLE bags 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Crear índice para mejorar performance en queries ordenadas
CREATE INDEX IF NOT EXISTS idx_bags_display_order ON bags(display_order);

-- Inicializar display_order basado en el orden actual (por ID)
UPDATE bags 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM bags
) AS subquery
WHERE bags.id = subquery.id;

-- Comentario en la tabla para documentación
COMMENT ON COLUMN bags.display_order IS 'Orden manual de visualización en el catálogo. Menor número = aparece primero. Se puede actualizar desde el admin panel.';
