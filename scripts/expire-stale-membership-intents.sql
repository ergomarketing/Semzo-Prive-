-- =====================================================
-- LIMPIEZA AUTOMATICA DE MEMBERSHIP_INTENTS HUERFANOS
-- =====================================================
-- Tarea 3 del plan de cierre logistico/datos.
-- Objetivo: evitar acumulacion de intents basura que generan
-- loops en resume_checkout y ruido en analitica.
--
-- Reglas:
--   - initiated > 24h sin pago             -> expired
--   - paid_pending_verification > 7 dias   -> expired
--   - active / canceled / expired          -> NO TOCAR
--   - intents con stripe_subscription_id   -> NO TOCAR (defensivo)
--
-- Mantiene compatibilidad con codigo aplicacion (no toca endpoints).
-- =====================================================

-- 1) FUNCION DE EXPIRACION
-- =====================================================
CREATE OR REPLACE FUNCTION public.expire_stale_membership_intents()
RETURNS TABLE(expired_initiated INT, expired_pending_verification INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initiated_count INT := 0;
  v_pending_count INT := 0;
BEGIN
  -- 1.a) initiated con mas de 24h sin progreso
  WITH updated AS (
    UPDATE public.membership_intents
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'initiated'
      AND created_at < NOW() - INTERVAL '24 hours'
      AND stripe_subscription_id IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_initiated_count FROM updated;

  -- 1.b) paid_pending_verification con mas de 7 dias
  WITH updated AS (
    UPDATE public.membership_intents
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'paid_pending_verification'
      AND created_at < NOW() - INTERVAL '7 days'
      AND stripe_subscription_id IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_pending_count FROM updated;

  RAISE NOTICE 'expire_stale_membership_intents: initiated=%, pending_verification=%',
    v_initiated_count, v_pending_count;

  RETURN QUERY SELECT v_initiated_count, v_pending_count;
END;
$$;

COMMENT ON FUNCTION public.expire_stale_membership_intents IS
'Expira membership_intents huerfanos: initiated >24h y paid_pending_verification >7d.
Defensivo: nunca toca intents con stripe_subscription_id ni status active/canceled/expired.';


-- 2) BACKFILL INMEDIATO
-- =====================================================
-- Limpia los intents huerfanos actuales (Anly y otros usuarios)
SELECT * FROM public.expire_stale_membership_intents();


-- 3) PROGRAMACION VIA pg_cron (si esta disponible)
-- =====================================================
-- Verifica si pg_cron esta habilitado. Si lo esta, programa
-- ejecucion cada hora. Si no, solo informa para usar Vercel Cron.
DO $$
DECLARE
  v_has_pg_cron BOOLEAN;
  v_existing_job INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO v_has_pg_cron;

  IF v_has_pg_cron THEN
    -- Eliminar job previo si existia (idempotente)
    SELECT jobid INTO v_existing_job
    FROM cron.job
    WHERE jobname = 'expire_stale_membership_intents_hourly';

    IF v_existing_job IS NOT NULL THEN
      PERFORM cron.unschedule(v_existing_job);
      RAISE NOTICE 'Job previo eliminado, reprogramando...';
    END IF;

    -- Programar cada hora en el minuto 0
    PERFORM cron.schedule(
      'expire_stale_membership_intents_hourly',
      '0 * * * *',
      $cron$ SELECT public.expire_stale_membership_intents(); $cron$
    );

    RAISE NOTICE 'pg_cron OK: limpieza programada cada hora.';
  ELSE
    RAISE NOTICE 'pg_cron NO disponible. Usa Vercel Cron sobre /api/cron/expire-intents.';
  END IF;
END;
$$;


-- 4) VERIFICACION FINAL
-- =====================================================
-- Debe mostrar:
--   - 0 intents 'initiated' con > 24h
--   - 0 intents 'paid_pending_verification' con > 7 dias
SELECT
  status,
  COUNT(*) AS total,
  MIN(created_at) AS oldest,
  MAX(created_at) AS newest
FROM public.membership_intents
WHERE
  (status = 'initiated' AND created_at < NOW() - INTERVAL '24 hours')
  OR
  (status = 'paid_pending_verification' AND created_at < NOW() - INTERVAL '7 days')
GROUP BY status;
