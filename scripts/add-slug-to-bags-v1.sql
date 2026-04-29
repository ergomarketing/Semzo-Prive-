-- Fase 1.5 SEO: anadir columna slug a bags y hacer backfill
-- Genera slugs SEO-friendly desde brand + name + color (si hay duplicados)
-- NO toca ninguna otra columna ni constraint. Las reservas siguen usando bag_id (UUID).

-- 1. Anadir columna slug si no existe
ALTER TABLE bags ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Funcion auxiliar: convertir texto a slug
--    "Karl Lagerfeld K/Studio" -> "karl-lagerfeld-k-studio"
CREATE OR REPLACE FUNCTION slugify(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;
  
  -- Lowercase
  result := lower(input_text);
  
  -- Quitar acentos comunes
  result := translate(result, 'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
                              'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC');
  
  -- Reemplazar cualquier caracter no alfanumerico por guion
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  
  -- Quitar guiones al inicio y final
  result := regexp_replace(result, '^-+|-+$', '', 'g');
  
  -- Colapsar guiones consecutivos
  result := regexp_replace(result, '-+', '-', 'g');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Backfill: generar slug para bolsos sin slug
--    Estrategia: brand-name. Si hay duplicado, anade color. Si sigue duplicado, anade primeros 6 chars del UUID.
DO $$
DECLARE
  bag_record RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  attempt INT;
  short_id TEXT;
BEGIN
  FOR bag_record IN 
    SELECT id, brand, name, color FROM bags WHERE slug IS NULL OR slug = ''
  LOOP
    -- Slug base: brand-name
    base_slug := slugify(COALESCE(bag_record.brand, '') || '-' || COALESCE(bag_record.name, ''));
    
    -- Si el slug base esta vacio (datos rotos), usar el UUID
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'bolso-' || substring(bag_record.id::text from 1 for 6);
    END IF;
    
    candidate_slug := base_slug;
    attempt := 0;
    
    -- Comprobar si existe ya ese slug en otro bolso
    WHILE EXISTS (SELECT 1 FROM bags WHERE slug = candidate_slug AND id != bag_record.id) LOOP
      attempt := attempt + 1;
      
      IF attempt = 1 AND bag_record.color IS NOT NULL AND bag_record.color != '' THEN
        -- Intento 1: anadir color
        candidate_slug := base_slug || '-' || slugify(bag_record.color);
      ELSE
        -- Intento 2+: anadir 6 primeros chars del UUID para garantizar unicidad
        short_id := substring(bag_record.id::text from 1 for 6);
        candidate_slug := base_slug || '-' || short_id;
        EXIT; -- no hay forma de chocar con UUID prefix
      END IF;
    END LOOP;
    
    UPDATE bags SET slug = candidate_slug WHERE id = bag_record.id;
  END LOOP;
END $$;

-- 4. Crear indice unico (CONCURRENTLY no funciona dentro de transaccion DO, asi que normal)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bags_slug ON bags(slug);

-- 5. Verificacion: contar bolsos con/sin slug
SELECT 
  COUNT(*) FILTER (WHERE slug IS NOT NULL AND slug != '') AS con_slug,
  COUNT(*) FILTER (WHERE slug IS NULL OR slug = '') AS sin_slug,
  COUNT(*) AS total
FROM bags;

-- 6. Mostrar primeros 10 slugs generados para verificacion visual
SELECT id, brand, name, color, slug FROM bags ORDER BY brand, name LIMIT 10;
