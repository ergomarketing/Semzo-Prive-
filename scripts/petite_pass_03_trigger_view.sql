-- PETITE PASS - PASO 3 de 3: Trigger y vista
-- Ejecutar al final.

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
