-- =====================================================
-- SISTEMA DE VENCIMIENTO DE PASES PETITE
-- Idempotente: se puede ejecutar varias veces sin romper nada.
-- IMPORTANTE: ejecutar este script en DOS pasos en Supabase SQL Editor:
--   PASO 1: ejecutar todo lo de la SECCION A (commit implicito al terminar)
--   PASO 2: ejecutar la SECCION B
-- O simplemente ejecutarlo entero dos veces seguidas (es idempotente).
-- =====================================================

-- ===================== SECCION A =====================
-- Solo ALTER TABLE para asegurar columnas

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS bag_pass_id UUID REFERENCES bag_passes(id) ON DELETE SET NULL;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS pass_expires_at TIMESTAMPTZ;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reminder_2d_sent_at TIMESTAMPTZ;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS overdue_1d_sent_at TIMESTAMPTZ;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS overdue_admin_notified_at TIMESTAMPTZ;

-- ===================== SECCION B =====================
-- Indices, trigger, vista (despues de que las columnas existan)
COMMIT;

CREATE INDEX IF NOT EXISTS idx_reservations_bag_pass_id
  ON reservations(bag_pass_id);

CREATE INDEX IF NOT EXISTS idx_reservations_pass_expires_at
  ON reservations(pass_expires_at);

CREATE OR REPLACE FUNCTION set_petite_pass_expiry_on_delivery()
RETURNS TRIGGER AS $func$
DECLARE
  v_pass_id UUID;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    IF NEW.reservation_id IS NOT NULL THEN
      SELECT bag_pass_id INTO v_pass_id
      FROM reservations
      WHERE id = NEW.reservation_id;

      IF v_pass_id IS NOT NULL THEN
        UPDATE reservations
        SET
          delivered_at = NOW(),
          pass_expires_at = NOW() + INTERVAL '7 days',
          end_date = NOW() + INTERVAL '7 days',
          updated_at = NOW()
        WHERE id = NEW.reservation_id
          AND delivered_at IS NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_petite_pass_expiry ON shipments;
CREATE TRIGGER trg_petite_pass_expiry
  AFTER UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION set_petite_pass_expiry_on_delivery();

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
    WHEN r.pass_expires_at > NOW() - INTERVAL '1 day' THEN 'just_expired'
    ELSE 'overdue'
  END AS expiry_state,
  EXTRACT(DAY FROM (r.pass_expires_at - NOW()))::INTEGER AS days_until_expiry
FROM reservations r
WHERE r.bag_pass_id IS NOT NULL
  AND r.status IN ('confirmed', 'active');

-- 2. Funcion trigger: al pasar a 'delivered', calcular vencimiento
CREATE OR REPLACE FUNCTION set_petite_pass_expiry_on_delivery()
RETURNS TRIGGER AS $func$
DECLARE
  v_pass_id UUID;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    IF NEW.reservation_id IS NOT NULL THEN
      SELECT bag_pass_id INTO v_pass_id
      FROM reservations
      WHERE id = NEW.reservation_id;

      IF v_pass_id IS NOT NULL THEN
        UPDATE reservations
        SET
          delivered_at = NOW(),
          pass_expires_at = NOW() + INTERVAL '7 days',
          end_date = NOW() + INTERVAL '7 days',
          updated_at = NOW()
        WHERE id = NEW.reservation_id
          AND delivered_at IS NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- 3. Trigger en shipments
DROP TRIGGER IF EXISTS trg_petite_pass_expiry ON shipments;
CREATE TRIGGER trg_petite_pass_expiry
  AFTER UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION set_petite_pass_expiry_on_delivery();

-- 4. Vista util: estado de vencimiento de pases Petite
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
    WHEN r.pass_expires_at > NOW() - INTERVAL '1 day' THEN 'just_expired'
    ELSE 'overdue'
  END AS expiry_state,
  EXTRACT(DAY FROM (r.pass_expires_at - NOW()))::INTEGER AS days_until_expiry
FROM reservations r
WHERE r.bag_pass_id IS NOT NULL
  AND r.status IN ('confirmed', 'active');
