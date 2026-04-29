-- AUDITORIA Fase 2A: estado de la columna color en bags
-- Solo lectura, no modifica datos

-- 1. Cuantos bolsos tienen color y cuantos no
SELECT 
  COUNT(*) FILTER (WHERE color IS NOT NULL AND color != '') AS con_color,
  COUNT(*) FILTER (WHERE color IS NULL OR color = '') AS sin_color,
  COUNT(*) AS total
FROM bags;

-- 2. Lista los bolsos sin color (para que decidas como rellenarlos)
SELECT id, brand, name, slug, color, status
FROM bags
WHERE color IS NULL OR color = ''
ORDER BY brand, name;

-- 3. Lista los bolsos con color (para verificar formato)
SELECT id, brand, name, color, slug
FROM bags
WHERE color IS NOT NULL AND color != ''
ORDER BY brand, name
LIMIT 20;
