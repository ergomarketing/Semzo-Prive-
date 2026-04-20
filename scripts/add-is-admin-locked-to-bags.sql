-- Añade flag para identificar bolsos bloqueados manualmente por admin
-- El cron de cleanup-orphaned-bags debe respetar este flag y no liberarlos
ALTER TABLE bags
  ADD COLUMN IF NOT EXISTS is_admin_locked BOOLEAN NOT NULL DEFAULT false;

-- Índice para búsquedas rápidas del cron
CREATE INDEX IF NOT EXISTS idx_bags_is_admin_locked ON bags(is_admin_locked) WHERE is_admin_locked = true;

-- Backfill: marcar como admin_locked los bolsos que actualmente están rented sin reserva activa
-- (son los que el admin bloqueó manualmente y el cron podría liberar incorrectamente)
UPDATE bags
SET is_admin_locked = true
WHERE status IN ('rented', 'Rented', 'locked', 'Locked')
  AND id NOT IN (
    SELECT DISTINCT bag_id
    FROM reservations
    WHERE bag_id IS NOT NULL
      AND status IN ('confirmed', 'active', 'pending', 'in_progress', 'preparing')
  );
