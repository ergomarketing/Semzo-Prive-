-- =====================================================
-- SISTEMA DE VENCIMIENTO DE PASES PETITE
-- Anade columnas para trackear entrega + vencimiento real
-- =====================================================

-- 1. Columnas en reservations para el ciclo de vida del pase
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pass_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_2d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overdue_1d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overdue_admin_notified_at TIMESTAMPTZ;

-- Indice para el cron (busqueda rapida de pases por vencer / vencidos)
CREATE INDEX IF NOT EXISTS idx_reservations_pass_expires_at
  ON reservations(pass_expires_at)
  WHERE pass_expires_at IS NOT NULL AND status IN ('active', 'confirmed');

-- 2. Funcion: cuando un envio pasa a 'delivered', calcular pass_expires_at
--    para reservas asociadas a un pase Petite.
CREATE OR REPLACE FUNCTION set_petite_pass_expiry_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_reservation_id UUID;
  v_pass_id UUID;
BEGIN
  -- Solo nos interesa la transicion a 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    v_reservation_id := NEW.reservation_id;

    IF v_reservation_id IS NOT NULL THEN
      -- Verificar si la reserva esta asociada a un pase Petite
      SELECT bag_pass_id INTO v_pass_id
      FROM reservations
      WHERE id = v_reservation_id;

      IF v_pass_id IS NOT NULL THEN
        -- Setear delivered_at + pass_expires_at (7 dias desde ahora)
        UPDATE reservations
        SET
          delivered_at = NOW(),
          pass_expires_at = NOW() + INTERVAL '7 days',
          end_date = NOW() + INTERVAL '7 days',
          updated_at = NOW()
        WHERE id = v_reservation_id
          AND delivered_at IS NULL; -- idempotencia: solo primera entrega
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger en shipments
DROP TRIGGER IF EXISTS trg_petite_pass_expiry ON shipments;
CREATE TRIGGER trg_petite_pass_expiry
  AFTER UPDATE OF status ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION set_petite_pass_expiry_on_delivery();

-- 4. Vista util: pases activos con su estado de vencimiento
CREATE OR REPLACE VIEW petite_pass_status AS
SELECT
  r.id AS reservation_id,
  r.user_id,
  r.bag_id,
  r.bag_pass_id,
  r.status AS reservation_status,
  r.delivered_at,
  r.pass_expires_at,
  r.reminder_2d_sent_at,
  r.overdue_1d_sent_at,
  CASE
    WHEN r.pass_expires_at IS NULL THEN 'pending_delivery'
    WHEN r.pass_expires_at > NOW() THEN 'active'
    WHEN r.pass_expires_at <= NOW() AND r.pass_expires_at > NOW() - INTERVAL '1 day' THEN 'just_expired'
    ELSE 'overdue'
  END AS expiry_state,
  EXTRACT(DAY FROM (r.pass_expires_at - NOW()))::INTEGER AS days_until_expiry
FROM reservations r
WHERE r.bag_pass_id IS NOT NULL
  AND r.status IN ('confirmed', 'active');

COMMENT ON VIEW petite_pass_status IS 'Estado de vencimiento de pases Petite activos';
