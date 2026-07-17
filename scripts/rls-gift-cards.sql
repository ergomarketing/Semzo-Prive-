-- ============================================================
-- RLS: gift_cards y gift_card_transactions
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================
-- REGLAS:
--   service_role → acceso total (todos los endpoints de servidor lo usan)
--   authenticated → solo puede VER sus propias GCs/transacciones
--   nadie puede insertar/actualizar/borrar desde el cliente (solo el backend)
-- ============================================================

-- ------------------------------------------------------------
-- TABLA: gift_cards
-- ------------------------------------------------------------
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas (idempotente, se puede re-ejecutar sin riesgo)
DROP POLICY IF EXISTS "gift_cards_service_all"  ON public.gift_cards;
DROP POLICY IF EXISTS "gift_cards_user_select"  ON public.gift_cards;

-- Service role: acceso total sin restricciones
CREATE POLICY "gift_cards_service_all"
  ON public.gift_cards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Socias autenticadas: solo pueden LEER sus propias GCs.
-- Una GC es "suya" si:
--   a) used_by = su auth.uid()           (ya la canjeó)
--   b) recipient_email = su email        (se le asignó antes de registrarse)
CREATE POLICY "gift_cards_user_select"
  ON public.gift_cards
  FOR SELECT
  TO authenticated
  USING (
    used_by = auth.uid()
    OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ------------------------------------------------------------
-- TABLA: gift_card_transactions
-- ------------------------------------------------------------
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gc_transactions_service_all"  ON public.gift_card_transactions;
DROP POLICY IF EXISTS "gc_transactions_user_select"  ON public.gift_card_transactions;

-- Service role: acceso total
CREATE POLICY "gc_transactions_service_all"
  ON public.gift_card_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Socias autenticadas: solo ven sus propias transacciones
CREATE POLICY "gc_transactions_user_select"
  ON public.gift_card_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
