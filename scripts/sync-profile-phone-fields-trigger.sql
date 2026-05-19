-- =====================================================================
-- Sincronizacion automatica profiles.phone <-> profiles.shipping_phone
-- =====================================================================
-- Objetivo: si uno de los dos campos existe y el otro esta vacio,
-- copiar el valor. Nunca sobrescribir un valor ya presente.
--
-- Fuente de verdad: ambos campos son validos. El trigger solo
-- evita que queden huecos cuando el usuario rellena uno solo.
--
-- Compatibilidad: no toca endpoints. Funciona como red de seguridad
-- para INSERT y UPDATE en profiles.
-- =====================================================================

-- 1) Funcion trigger
CREATE OR REPLACE FUNCTION sync_profile_phone_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar cadenas vacias a NULL para que la logica funcione
  IF NEW.phone IS NOT NULL AND btrim(NEW.phone) = '' THEN
    NEW.phone := NULL;
  END IF;

  IF NEW.shipping_phone IS NOT NULL AND btrim(NEW.shipping_phone) = '' THEN
    NEW.shipping_phone := NULL;
  END IF;

  -- Caso 1: phone lleno, shipping_phone vacio -> copiar phone a shipping_phone
  IF NEW.phone IS NOT NULL AND NEW.shipping_phone IS NULL THEN
    NEW.shipping_phone := NEW.phone;
  END IF;

  -- Caso 2: shipping_phone lleno, phone vacio -> copiar shipping_phone a phone
  IF NEW.shipping_phone IS NOT NULL AND NEW.phone IS NULL THEN
    NEW.phone := NEW.shipping_phone;
  END IF;

  -- Si ambos tienen valor: NO se toca nada (respeta lo que el usuario puso)
  -- Si ambos son NULL: NO se toca nada

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Drop trigger previo si existia (idempotente)
DROP TRIGGER IF EXISTS trg_sync_profile_phone_fields ON profiles;

-- 3) Crear trigger BEFORE INSERT OR UPDATE
-- Solo se dispara cuando cambian los campos relevantes (eficiencia).
CREATE TRIGGER trg_sync_profile_phone_fields
BEFORE INSERT OR UPDATE OF phone, shipping_phone ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_phone_fields();

-- =====================================================================
-- 4) BACKFILL: corregir desfases existentes en BD
-- =====================================================================
-- Estrategia: actualizar perfiles donde uno de los dos campos este lleno
-- y el otro vacio. Esto disparara el trigger que copiara el valor.

-- 4a) Normalizar cadenas vacias previas a NULL (preparacion)
UPDATE profiles
SET phone = NULL
WHERE phone IS NOT NULL AND btrim(phone) = '';

UPDATE profiles
SET shipping_phone = NULL
WHERE shipping_phone IS NOT NULL AND btrim(shipping_phone) = '';

-- 4b) Backfill: phone lleno, shipping_phone vacio
UPDATE profiles
SET shipping_phone = phone
WHERE phone IS NOT NULL
  AND shipping_phone IS NULL;

-- 4c) Backfill: shipping_phone lleno, phone vacio
UPDATE profiles
SET phone = shipping_phone
WHERE shipping_phone IS NOT NULL
  AND phone IS NULL;

-- =====================================================================
-- 5) VERIFICACION: deberia devolver 0 filas (cero inconsistencias)
-- =====================================================================
SELECT
  id,
  email,
  phone,
  shipping_phone,
  CASE
    WHEN phone IS NOT NULL AND shipping_phone IS NULL THEN 'phone sin shipping_phone'
    WHEN shipping_phone IS NOT NULL AND phone IS NULL THEN 'shipping_phone sin phone'
  END AS inconsistencia
FROM profiles
WHERE
  (phone IS NOT NULL AND shipping_phone IS NULL)
  OR (shipping_phone IS NOT NULL AND phone IS NULL);
