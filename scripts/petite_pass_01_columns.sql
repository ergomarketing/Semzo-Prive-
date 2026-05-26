-- PETITE PASS - PASO 1 de 3: Columnas e indices
-- Ejecutar este script PRIMERO. Cuando termine OK, ejecutar petite_pass_02_function.sql

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS bag_pass_id UUID REFERENCES bag_passes(id) ON DELETE SET NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pass_expires_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reminder_2d_sent_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS overdue_1d_sent_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS overdue_admin_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reservations_bag_pass_id ON reservations(bag_pass_id);
CREATE INDEX IF NOT EXISTS idx_reservations_pass_expires_at ON reservations(pass_expires_at);
