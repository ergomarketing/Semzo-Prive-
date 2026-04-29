-- Fase 2A SEO: Backfill de colores en tabla bags
-- NO modifica nada que afecte reservas, membresias o pagos.
-- Solo actualiza la columna `color` y limpia espacios en `brand`.

-- Paso 1: Trim de espacios en brand (limpieza basica)
UPDATE bags
SET brand = TRIM(brand)
WHERE brand IS NOT NULL AND brand != TRIM(brand);

-- Paso 2: Backfill de colores segun lista validada por el equipo
UPDATE bags SET color = 'Rosa'    WHERE brand = 'Celine'         AND name = 'Teen Triumph';
UPDATE bags SET color = 'Rojo'    WHERE brand = 'Chanel'         AND name = '2.55 Reissue';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Chanel'         AND name = 'Classic Flap';
UPDATE bags SET color = 'Menta'   WHERE brand = 'Chanel'         AND name = 'Mini Flap Matelasse';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Dior'           AND name = 'Lady Dior';
UPDATE bags SET color = 'Beige'   WHERE brand = 'Dior'           AND name = 'Saddle Bag';
UPDATE bags SET color = 'Beige'   WHERE brand = 'Dior'           AND name = 'Vanity Case';
UPDATE bags SET color = 'Cereza'  WHERE brand = 'Fendi'          AND name = '3Baguette';
UPDATE bags SET color = 'Beige'   WHERE brand = 'Fendi'          AND name = 'Croissant';
UPDATE bags SET color = 'Fucsia'  WHERE brand = 'Fendi'          AND name = 'FF Logo Pouch';
UPDATE bags SET color = 'Rojo'    WHERE brand = 'Fendi'          AND name = 'Mini Peekaboo';
UPDATE bags SET color = 'Beige'   WHERE brand = 'Fendi'          AND name = 'Saddle Bag';
UPDATE bags SET color = 'Azul'    WHERE brand = 'Furla'          AND name = '1927 Denim';
UPDATE bags SET color = 'Beige'   WHERE brand = 'Furla'          AND name = 'Club 2 Mini';
UPDATE bags SET color = 'Camel'   WHERE brand = 'Gucci'          AND name = 'Bamboo 1947 Medium';
UPDATE bags SET color = 'Burdeos' WHERE brand = 'Gucci'          AND name = 'Jackie';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Karl Lagerfeld' AND name = 'K/Studio';
UPDATE bags SET color = 'Marron'  WHERE brand = 'Loewe'          AND name = 'Gate';
UPDATE bags SET color = 'Beige'   WHERE brand = 'Loewe'          AND name = 'Gate Mini';
UPDATE bags SET color = 'Amarillo' WHERE brand = 'Louis Vuitton' AND name = 'Malesherbes Epi';
UPDATE bags SET color = 'Rosa'    WHERE brand = 'Louis Vuitton' AND name = 'Pochette Felicie';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Louis Vuitton' AND name = 'Pont-Neuf';
UPDATE bags SET color = 'Marron'  WHERE brand = 'Louis Vuitton' AND name = 'Reverie';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Marni'          AND name = 'Tribeca';
UPDATE bags SET color = 'Rosa'    WHERE brand = 'Marni'          AND name = 'Trunk Mini';
UPDATE bags SET color = 'Beige'   WHERE brand = 'PATOU'          AND name = 'Le Patou Geometric';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Prada'          AND name = '2WAY Negro';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Prada'          AND name = 'Bucket Saffiano';
UPDATE bags SET color = 'Camel'   WHERE brand = 'Prada'          AND name = 'Hobo Bag';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Prada'          AND name = 'Saffiano Negro';
UPDATE bags SET color = 'Negro'   WHERE brand = 'Prada'          AND name = 'Structured Bag';
UPDATE bags SET color = 'Verde'   WHERE brand = 'Saint Laurent'  AND name = 'College';
UPDATE bags SET color = 'Magenta' WHERE brand = 'Yves Saint Laurent' AND name = 'Cassandre Envelope';

-- Paso 3: Verificacion
SELECT 
  COUNT(*) FILTER (WHERE color IS NOT NULL AND color != '') AS con_color,
  COUNT(*) FILTER (WHERE color IS NULL OR color = '') AS sin_color,
  COUNT(*) AS total
FROM bags;

SELECT brand, name, color, slug
FROM bags
ORDER BY brand, name;
