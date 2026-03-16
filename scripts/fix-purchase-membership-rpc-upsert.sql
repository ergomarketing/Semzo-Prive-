-- Fix purchase_membership_with_gift_card RPC
-- Reemplaza INSERT por UPSERT para permitir reactivar membresías canceladas

CREATE OR REPLACE FUNCTION public.purchase_membership_with_gift_card(
  p_user_id        UUID,
  p_gift_card_id   UUID,
  p_membership_type TEXT,
  p_billing_cycle  TEXT,
  p_amount         DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gc_amount   DECIMAL;
  v_gc_status   TEXT;
  v_end_date    TIMESTAMPTZ;
BEGIN
  -- 1. Verificar gift card
  SELECT amount, status
    INTO v_gc_amount, v_gc_status
    FROM public.gift_cards
   WHERE id = p_gift_card_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gift card no encontrada';
  END IF;

  IF v_gc_status NOT IN ('active', 'partial') THEN
    RAISE EXCEPTION 'Gift card no está activa (estado: %)', v_gc_status;
  END IF;

  IF v_gc_amount < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente en gift card: disponible %, solicitado %', v_gc_amount, p_amount;
  END IF;

  -- 2. Calcular fecha de fin según ciclo de facturación
  v_end_date := CASE p_billing_cycle
    WHEN 'quarterly' THEN NOW() + INTERVAL '3 months'
    WHEN 'weekly'    THEN NOW() + INTERVAL '7 days'
    ELSE                  NOW() + INTERVAL '1 month'
  END;

  -- 3. Descontar saldo gift card
  UPDATE public.gift_cards
     SET amount     = amount - p_amount,
         status     = CASE WHEN (amount - p_amount) <= 0 THEN 'used' ELSE 'active' END,
         updated_at = NOW()
   WHERE id = p_gift_card_id;

  -- 4. Registrar transacción
  INSERT INTO public.gift_card_transactions (
    gift_card_id, user_id, reference_type, reference_id, amount, balance_before, balance_after
  ) VALUES (
    p_gift_card_id, p_user_id, 'membership', p_user_id::TEXT || '-' || NOW()::TEXT,
    p_amount, v_gc_amount, v_gc_amount - p_amount
  )
  ON CONFLICT DO NOTHING;

  -- 5. UPSERT membresía — permite reactivar si ya existe una cancelada/expirada
  INSERT INTO public.user_memberships (
    user_id,
    membership_type,
    billing_cycle,
    status,
    payment_method,
    start_date,
    end_date,
    stripe_subscription_id,
    updated_at
  ) VALUES (
    p_user_id,
    p_membership_type,
    p_billing_cycle,
    'active',
    'gift_card',
    NOW(),
    v_end_date,
    NULL,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    membership_type        = EXCLUDED.membership_type,
    billing_cycle          = EXCLUDED.billing_cycle,
    status                 = 'active',
    payment_method         = 'gift_card',
    start_date             = NOW(),
    end_date               = v_end_date,
    stripe_subscription_id = NULL,
    updated_at             = NOW();

END;
$$;
