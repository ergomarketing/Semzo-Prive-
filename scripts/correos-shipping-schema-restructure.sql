-- ============================================================
-- SEMZO PRIVE — Reestructuración logística para Correos
-- Paso 1: Schema profiles + provincias + trigger legacy + backfill
-- ============================================================
-- Ejecutar en Supabase SQL Editor.
-- Idempotente: se puede reejecutar sin riesgo.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Nuevas columnas en profiles (estructura Correos)
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shipping_first_name      TEXT,
  ADD COLUMN IF NOT EXISTS shipping_last_name_1     TEXT,
  ADD COLUMN IF NOT EXISTS shipping_last_name_2     TEXT,
  ADD COLUMN IF NOT EXISTS shipping_document_type   TEXT
    CHECK (shipping_document_type IN ('DNI','NIE','PASAPORTE') OR shipping_document_type IS NULL),
  ADD COLUMN IF NOT EXISTS shipping_document_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_via_type        TEXT,
  ADD COLUMN IF NOT EXISTS shipping_via_name        TEXT,
  ADD COLUMN IF NOT EXISTS shipping_number          TEXT,
  ADD COLUMN IF NOT EXISTS shipping_portal          TEXT,
  ADD COLUMN IF NOT EXISTS shipping_floor           TEXT,
  ADD COLUMN IF NOT EXISTS shipping_door            TEXT,
  ADD COLUMN IF NOT EXISTS shipping_province        TEXT;

COMMENT ON COLUMN profiles.shipping_document_type   IS 'DNI | NIE | PASAPORTE — obligatorio para Correos';
COMMENT ON COLUMN profiles.shipping_document_number IS 'Obligatorio para Correos';
COMMENT ON COLUMN profiles.shipping_via_type        IS 'CALLE, AVENIDA, PLAZA, PASEO, CAMINO, CARRETERA, RONDA, TRAVESIA, OTRO';
COMMENT ON COLUMN profiles.shipping_via_name        IS 'Obligatorio Correos';
COMMENT ON COLUMN profiles.shipping_door            IS 'Obligatorio Correos';
COMMENT ON COLUMN profiles.shipping_province        IS 'Obligatorio Correos — nombre oficial provincia';

-- ------------------------------------------------------------
-- 2. Tabla auxiliar provincias_es (mapeo CP → provincia)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provincias_es (
  cp_prefix CHAR(2) PRIMARY KEY,    -- 2 primeros dígitos del CP
  province  TEXT NOT NULL
);

INSERT INTO provincias_es (cp_prefix, province) VALUES
  ('01','ALAVA'),('02','ALBACETE'),('03','ALICANTE'),('04','ALMERIA'),
  ('05','AVILA'),('06','BADAJOZ'),('07','ILLES BALEARS'),('08','BARCELONA'),
  ('09','BURGOS'),('10','CACERES'),('11','CADIZ'),('12','CASTELLON'),
  ('13','CIUDAD REAL'),('14','CORDOBA'),('15','A CORUNA'),('16','CUENCA'),
  ('17','GIRONA'),('18','GRANADA'),('19','GUADALAJARA'),('20','GIPUZKOA'),
  ('21','HUELVA'),('22','HUESCA'),('23','JAEN'),('24','LEON'),
  ('25','LLEIDA'),('26','LA RIOJA'),('27','LUGO'),('28','MADRID'),
  ('29','MALAGA'),('30','MURCIA'),('31','NAVARRA'),('32','OURENSE'),
  ('33','ASTURIAS'),('34','PALENCIA'),('35','LAS PALMAS'),('36','PONTEVEDRA'),
  ('37','SALAMANCA'),('38','SANTA CRUZ DE TENERIFE'),('39','CANTABRIA'),
  ('40','SEGOVIA'),('41','SEVILLA'),('42','SORIA'),('43','TARRAGONA'),
  ('44','TERUEL'),('45','TOLEDO'),('46','VALENCIA'),('47','VALLADOLID'),
  ('48','BIZKAIA'),('49','ZAMORA'),('50','ZARAGOZA'),('51','CEUTA'),
  ('52','MELILLA')
ON CONFLICT (cp_prefix) DO UPDATE SET province = EXCLUDED.province;

-- ------------------------------------------------------------
-- 3. Helper: inferir provincia desde CP
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION infer_province_from_cp(cp TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_prefix CHAR(2);
  v_province TEXT;
BEGIN
  IF cp IS NULL OR length(trim(cp)) < 2 THEN
    RETURN NULL;
  END IF;
  v_prefix := lpad(left(trim(cp), 2), 2, '0');
  SELECT province INTO v_province FROM provincias_es WHERE cp_prefix = v_prefix;
  RETURN v_province;
END;
$$;

-- ------------------------------------------------------------
-- 4. Trigger: reconstruir shipping_address legacy
--    cuando se actualicen los campos estructurados
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION rebuild_legacy_shipping_address()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_parts TEXT[];
  v_via   TEXT;
BEGIN
  -- Solo reconstruir si se han tocado campos estructurados
  IF (NEW.shipping_via_type   IS DISTINCT FROM OLD.shipping_via_type)
     OR (NEW.shipping_via_name IS DISTINCT FROM OLD.shipping_via_name)
     OR (NEW.shipping_number   IS DISTINCT FROM OLD.shipping_number)
     OR (NEW.shipping_portal   IS DISTINCT FROM OLD.shipping_portal)
     OR (NEW.shipping_floor    IS DISTINCT FROM OLD.shipping_floor)
     OR (NEW.shipping_door     IS DISTINCT FROM OLD.shipping_door)
     OR TG_OP = 'INSERT'
  THEN
    -- Solo si hay datos estructurados que valga la pena concatenar
    IF NEW.shipping_via_name IS NOT NULL AND length(trim(NEW.shipping_via_name)) > 0 THEN
      v_via := trim(coalesce(NEW.shipping_via_type,'') || ' ' || NEW.shipping_via_name);
      v_parts := ARRAY[v_via];

      IF NEW.shipping_number IS NOT NULL AND length(trim(NEW.shipping_number)) > 0 THEN
        v_parts := array_append(v_parts, trim(NEW.shipping_number));
      END IF;
      IF NEW.shipping_portal IS NOT NULL AND length(trim(NEW.shipping_portal)) > 0 THEN
        v_parts := array_append(v_parts, 'Portal ' || trim(NEW.shipping_portal));
      END IF;
      IF NEW.shipping_floor IS NOT NULL AND length(trim(NEW.shipping_floor)) > 0 THEN
        v_parts := array_append(v_parts, trim(NEW.shipping_floor) || 'º');
      END IF;
      IF NEW.shipping_door IS NOT NULL AND length(trim(NEW.shipping_door)) > 0 THEN
        v_parts := array_append(v_parts, trim(NEW.shipping_door));
      END IF;

      NEW.shipping_address := array_to_string(v_parts, ', ');
    END IF;
  END IF;

  -- Auto-inferir provincia desde CP si está vacía
  IF (NEW.shipping_province IS NULL OR length(trim(NEW.shipping_province)) = 0)
     AND NEW.shipping_postal_code IS NOT NULL
  THEN
    NEW.shipping_province := infer_province_from_cp(NEW.shipping_postal_code);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rebuild_legacy_shipping_address ON profiles;
CREATE TRIGGER trg_rebuild_legacy_shipping_address
BEFORE INSERT OR UPDATE OF
  shipping_via_type, shipping_via_name, shipping_number,
  shipping_portal, shipping_floor, shipping_door,
  shipping_postal_code, shipping_province
ON profiles
FOR EACH ROW
EXECUTE FUNCTION rebuild_legacy_shipping_address();

-- ------------------------------------------------------------
-- 5. Backfill: inferir provincia desde CP en filas existentes
-- ------------------------------------------------------------
UPDATE profiles
SET shipping_province = infer_province_from_cp(shipping_postal_code)
WHERE shipping_postal_code IS NOT NULL
  AND (shipping_province IS NULL OR length(trim(shipping_province)) = 0);

-- ------------------------------------------------------------
-- 6. Backfill: derivar shipping_first_name / last_name desde full_name
--    (best effort — si no se puede parsear queda NULL para que la socia lo complete)
-- ------------------------------------------------------------
UPDATE profiles
SET
  shipping_first_name = CASE
    WHEN shipping_first_name IS NOT NULL AND length(trim(shipping_first_name)) > 0
      THEN shipping_first_name
    WHEN full_name IS NOT NULL AND length(trim(full_name)) > 0
      THEN split_part(trim(full_name), ' ', 1)
    ELSE NULL
  END,
  shipping_last_name_1 = CASE
    WHEN shipping_last_name_1 IS NOT NULL AND length(trim(shipping_last_name_1)) > 0
      THEN shipping_last_name_1
    WHEN full_name IS NOT NULL AND array_length(string_to_array(trim(full_name), ' '), 1) >= 2
      THEN split_part(trim(full_name), ' ', 2)
    ELSE NULL
  END,
  shipping_last_name_2 = CASE
    WHEN shipping_last_name_2 IS NOT NULL AND length(trim(shipping_last_name_2)) > 0
      THEN shipping_last_name_2
    WHEN full_name IS NOT NULL AND array_length(string_to_array(trim(full_name), ' '), 1) >= 3
      THEN array_to_string((string_to_array(trim(full_name), ' '))[3:], ' ')
    ELSE NULL
  END;

-- ------------------------------------------------------------
-- 7. Verificación final
-- ------------------------------------------------------------
-- Cuántos perfiles tienen dirección completa según Correos
SELECT
  count(*) FILTER (WHERE shipping_postal_code IS NOT NULL)         AS con_cp,
  count(*) FILTER (WHERE shipping_province IS NOT NULL)            AS con_provincia,
  count(*) FILTER (WHERE shipping_via_name IS NOT NULL)            AS con_via_nueva,
  count(*) FILTER (WHERE shipping_document_number IS NOT NULL)     AS con_documento,
  count(*) FILTER (WHERE shipping_address IS NOT NULL
                    AND shipping_via_name IS NULL)                 AS legacy_sin_estructurar
FROM profiles;
