-- Añadir columna is_admin_rent para identificar alquileres manuales del admin
-- Esto evita que el cron job los libere automáticamente

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS is_admin_rent BOOLEAN DEFAULT FALSE;

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_reservations_is_admin_rent 
ON reservations(is_admin_rent) 
WHERE is_admin_rent = TRUE;

-- Comentario explicativo
COMMENT ON COLUMN reservations.is_admin_rent IS 
'TRUE cuando la reserva fue creada manualmente desde el admin al marcar un bolso como alquilado. 
Evita que el cron cleanup-orphaned-bags libere estos bolsos automáticamente.';
