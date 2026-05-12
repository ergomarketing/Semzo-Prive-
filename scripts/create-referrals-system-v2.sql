-- =====================================================================
-- SEMZO PRIVE — Sistema de Referidos FASE 1 / BLOQUE 1
-- Migracion v2: ajustes de estados + antifraude + mejora de codigo
-- =====================================================================
-- Aplica encima de v1. Idempotente. NO modifica datos validos.
--
-- Cambios:
--   1) Estados oficiales: pending, paid, qualified, rewarded, rejected
--      (elimina 'cancelled', anade 'paid' y 'rejected')
--   2) Migra filas con status='cancelled' a 'rejected'
--   3) Anade columna stripe_customer_id en referrals (cache del referido
--      al momento del signup para antifraude)
--   4) Mejora generate_referral_code para usar nombre real + 4 digitos
--      numericos aleatorios (formato MARIA8472)
--
-- NO se hace en este bloque:
--   - webhook Stripe
--   - cron de cualificacion
--   - aplicacion de creditos
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Migrar filas 'cancelled' a 'rejected' antes de cambiar el CHECK
-- ---------------------------------------------------------------------
UPDATE public.referrals
SET status = 'rejected'
WHERE status = 'cancelled';

-- ---------------------------------------------------------------------
-- 2) Reemplazar el CHECK de status con los estados oficiales
-- ---------------------------------------------------------------------
-- Drop del CHECK antiguo (nombre auto-generado, lo buscamos por columna)
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.referrals'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.referrals DROP CONSTRAINT %I', con_name);
  END IF;
END;
$$;

-- Nuevo CHECK con los 5 estados oficiales
ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_status_check
  CHECK (status IN ('pending','paid','qualified','rewarded','rejected'));

COMMENT ON COLUMN public.referrals.status IS
  'pending: signup registrado, sin primer pago | '
  'paid: referido pago primer mes, contando 60 dias | '
  'qualified: cumplio 60 dias activos, credito pendiente de aplicar | '
  'rewarded: credito de 50 EUR aplicado al referrer | '
  'rejected: cancelado o invalidado antes de cualificar';

-- ---------------------------------------------------------------------
-- 3) Anadir stripe_customer_id en referrals (cache antifraude)
-- ---------------------------------------------------------------------
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

COMMENT ON COLUMN public.referrals.stripe_customer_id IS
  'Stripe customer_id del referido (cache al momento del signup). '
  'Usado para deteccion de fraude por reutilizacion de tarjeta.';

CREATE INDEX IF NOT EXISTS idx_referrals_stripe_customer
  ON public.referrals (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 4) Mejorar generate_referral_code: nombre real + 4 digitos numericos
-- ---------------------------------------------------------------------
-- Formato objetivo: MARIA8472 (nombre limpio + 4 digitos aleatorios).
-- Si no hay nombre, fallback a primeros chars del email. Si choca,
-- reintenta con otros 4 digitos hasta 50 veces.
CREATE OR REPLACE FUNCTION public.generate_referral_code(seed TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  attempts INT := 0;
  random_suffix TEXT;
BEGIN
  -- Limpiar seed: alfanumericos, sin acentos, mayusculas.
  base := UPPER(REGEXP_REPLACE(
    TRANSLATE(COALESCE(seed,''),
      'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇáéíóúàèìòùäëïöüâêîôûñç',
      'AEIOUAEIOUAEIOUAEIOUNCAEIOUAEIOUAEIOUAEIOUNC'),
    '[^A-Za-z0-9]', '', 'g'));

  IF LENGTH(base) < 3 THEN
    base := base || 'USER';
  END IF;

  -- Maximo 5 chars del nombre + 4 digitos = 9 chars total
  base := SUBSTRING(base FROM 1 FOR 5);

  -- Reintenta con sufijos aleatorios hasta encontrar uno libre.
  LOOP
    random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    candidate := base || random_suffix;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate) THEN
      RETURN candidate;
    END IF;

    attempts := attempts + 1;
    EXIT WHEN attempts >= 50;
  END LOOP;

  -- Fallback extremadamente improbable: usar timestamp
  RETURN base || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
END;
$$;

-- ---------------------------------------------------------------------
-- 5) Verificacion final
-- ---------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM public.referrals WHERE status = 'pending')   AS s_pending,
  (SELECT COUNT(*) FROM public.referrals WHERE status = 'paid')      AS s_paid,
  (SELECT COUNT(*) FROM public.referrals WHERE status = 'qualified') AS s_qualified,
  (SELECT COUNT(*) FROM public.referrals WHERE status = 'rewarded')  AS s_rewarded,
  (SELECT COUNT(*) FROM public.referrals WHERE status = 'rejected')  AS s_rejected,
  (SELECT COUNT(*) FROM public.profiles WHERE referral_code IS NOT NULL) AS profiles_con_codigo;
