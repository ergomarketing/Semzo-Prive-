-- =====================================================================
-- SEMZO PRIVE — Sistema de Referidos: funcion transaccional de recompensa
-- =====================================================================
-- Aplica de forma ATOMICA (en una sola transaccion) la recompensa de un
-- referido cualificado:
--   1) SELECT FOR UPDATE de la fila referrals (lock pesimista)
--   2) Verifica status='qualified' AND reward_applied_at IS NULL
--   3) Suma p_amount a referral_balance del referrer
--   4) Suma p_amount a referral_balance del referred
--   5) Marca la fila como status='rewarded' + reward_applied_at=NOW()
--
-- Si cualquier paso falla, toda la operacion se revierte. Si la fila ya
-- fue procesada por otra ejecucion concurrente, devuelve already_applied
-- sin modificar nada.
--
-- IMPORTANTE:
--   - Idempotente: ejecutar 2 veces seguidas no duplica el credito.
--   - SECURITY DEFINER: corre con permisos del owner, ignora RLS. Solo
--     debe ser llamada desde service-role (backend), nunca desde cliente.
--   - NO toca Stripe, NO toca subscriptions, NO toca payments.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.process_referral_reward(
  p_referral_id UUID,
  p_amount INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
BEGIN
  -- Validacion de input.
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  -- 1) Lock pesimista de la fila para impedir doble procesamiento
  --    concurrente desde 2 ejecuciones del cron simultaneas.
  SELECT id, referrer_user_id, referred_user_id, status, reward_applied_at
    INTO v_referral
    FROM public.referrals
    WHERE id = p_referral_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  -- 2) Estado requerido: qualified y nunca aplicado.
  IF v_referral.status <> 'qualified' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'not_qualified',
      'current_status', v_referral.status
    );
  END IF;

  IF v_referral.reward_applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_applied');
  END IF;

  -- 3) Sumar credito al referrer (quien invito).
  UPDATE public.profiles
    SET referral_balance = COALESCE(referral_balance, 0) + p_amount
    WHERE id = v_referral.referrer_user_id;

  -- 4) Sumar credito al referido (quien fue invitado).
  UPDATE public.profiles
    SET referral_balance = COALESCE(referral_balance, 0) + p_amount
    WHERE id = v_referral.referred_user_id;

  -- 5) Marcar la fila como rewarded.
  UPDATE public.referrals
    SET status = 'rewarded',
        reward_applied_at = NOW()
    WHERE id = p_referral_id;

  RETURN jsonb_build_object(
    'ok', true,
    'referral_id', p_referral_id,
    'referrer_user_id', v_referral.referrer_user_id,
    'referred_user_id', v_referral.referred_user_id,
    'amount', p_amount
  );
END;
$$;

-- ---------------------------------------------------------------------
-- Permisos: solo service-role (no anon, no authenticated)
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.process_referral_reward(UUID, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_referral_reward(UUID, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_referral_reward(UUID, INT) FROM authenticated;

-- service_role tiene EXECUTE por defecto al ser owner via SECURITY DEFINER.

-- ---------------------------------------------------------------------
-- Verificacion
-- ---------------------------------------------------------------------
SELECT
  proname,
  prosecdef AS is_security_definer
FROM pg_proc
WHERE proname = 'process_referral_reward';
