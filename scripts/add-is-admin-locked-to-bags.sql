-- Añade flag para identificar bolsos bloqueados manualmente por admin
-- El cron de cleanup-orphaned-bags debe respetar este flag y no liberarlos
ALTER TABLE bags
  ADD COLUMN IF NOT EXISTS is_admin_locked BOOLEAN NOT NULL DEFAULT false;

-- Índice para búsquedas rápidas del cron
CREATE INDEX IF NOT EXISTS idx_bags_is_admin_locked ON bags(is_admin_locked) WHERE is_admin_locked = true;
