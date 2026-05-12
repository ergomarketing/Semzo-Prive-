-- =====================================================================
-- SEMZO PRIVE — Sistema de Referidos FASE 1
-- =====================================================================
-- Crea la infraestructura backend del programa de referidos:
--   1) Anade columnas referral_code y referral_balance a la tabla profiles
--   2) Crea la tabla referrals (relacion referrer -> referred)
--   3) Define indices y politicas RLS
--   4) Backfill: asigna referral_code a usuarios existentes
--
-- IMPORTANTE:
--   - Idempotente: se puede ejecutar varias veces sin romper nada
--   - NO modifica ningun campo existente
--   - NO toca el sistema de pagos
--   - Los creditos NO se aplican automaticamente todavia: referral_balance
--     queda en 0 hasta que en Fase 2 conectemos el webhook de Stripe.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Columnas nuevas en profiles
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_balance INTEGER NOT NULL DEFAULT 0;

-- Indice unico parcial: permite NULL durante backfill pero garantiza
-- unicidad cuando hay valor.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code_unique
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2) Tabla referrals
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code      TEXT NOT NULL,
  -- status: pending | qualified | rewarded | cancelled
  --   pending   = referido se registro, todavia no ha completado 60 dias
  --   qualified = cumple los 60 dias pagados, pendiente de aplicar credito
  --   rewarded  = credito ya aplicado al referrer
  --   cancelled = referido canceleo antes de cualificar
  status             TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','qualified','rewarded','cancelled')),
  qualified_at       TIMESTAMPTZ,
  reward_applied_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un usuario solo puede ser "referido" una vez en su vida.
  CONSTRAINT referrals_referred_user_unique UNIQUE (referred_user_id),
  -- Un usuario no puede referirse a si mismo.
  CONSTRAINT referrals_not_self CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals (referrer_user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status
  ON public.referrals (status);

CREATE INDEX IF NOT EXISTS idx_referrals_code
  ON public.referrals (referral_code);

-- ---------------------------------------------------------------------
-- 3) RLS — Row Level Security
-- ---------------------------------------------------------------------
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Los usuarios SOLO pueden ver sus propios referidos (donde son referrer).
-- Los inserts SOLO se hacen desde el backend con service-role key.
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Inserts SOLO desde service-role (backend). No hay policy para INSERT,
-- por lo que las inserciones desde el cliente quedan bloqueadas.
-- (service-role bypasea RLS automaticamente).

-- ---------------------------------------------------------------------
-- 4) Funcion: generar codigo de referido a partir del email/nombre
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_referral_code(seed TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  suffix INT := 0;
BEGIN
  -- Toma alfanumericos del seed, mayusculas, max 8 chars.
  base := UPPER(REGEXP_REPLACE(COALESCE(seed,''), '[^A-Za-z0-9]', '', 'g'));
  IF LENGTH(base) < 3 THEN
    base := base || 'USER';
  END IF;
  base := SUBSTRING(base FROM 1 FOR 8);

  candidate := base;
  -- Reintenta con sufijo numerico hasta encontrar uno libre.
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate) LOOP
    suffix := suffix + 1;
    candidate := base || suffix::TEXT;
  END LOOP;

  RETURN candidate;
END;
$$;

-- ---------------------------------------------------------------------
-- 5) Backfill: asigna codigo a usuarios existentes que no lo tengan
-- ---------------------------------------------------------------------
DO $$
DECLARE
  prof RECORD;
  new_code TEXT;
BEGIN
  FOR prof IN
    SELECT id, COALESCE(first_name, email, 'USER') AS seed
    FROM public.profiles
    WHERE referral_code IS NULL
  LOOP
    new_code := public.generate_referral_code(prof.seed);
    UPDATE public.profiles
      SET referral_code = new_code
      WHERE id = prof.id;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------
-- Verificacion final
-- ---------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE referral_code IS NOT NULL) AS profiles_con_codigo,
  (SELECT COUNT(*) FROM public.profiles WHERE referral_code IS NULL)     AS profiles_sin_codigo,
  (SELECT COUNT(*) FROM public.referrals)                                AS total_referrals;
