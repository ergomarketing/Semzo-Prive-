-- Fase 2A: completar el ultimo bolso sin color y limpiar espacios en name

-- 1. Asignar color al ultimo bolso
UPDATE bags 
SET color = 'Negro' 
WHERE id = '09ff3109-fa03-4871-875b-997d9d7986ac';

-- 2. Limpiar espacios en name (Yves Saint Laurent tenia "  Cassandre Envelope  ")
UPDATE bags 
SET name = TRIM(name) 
WHERE name IS NOT NULL AND name != TRIM(name);

-- 3. Verificacion final
SELECT 
  COUNT(*) FILTER (WHERE color IS NOT NULL AND color != '') AS con_color,
  COUNT(*) FILTER (WHERE color IS NULL OR color = '') AS sin_color,
  COUNT(*) AS total
FROM bags;

-- 4. Distribucion de colores
SELECT color, COUNT(*) AS cantidad
FROM bags
GROUP BY color
ORDER BY cantidad DESC;
