-- Agregar campos NFC a la tabla bags para control interno de inventario
-- Este sistema permite asignar un chip NFC único a cada bolso y validar su autenticidad

ALTER TABLE bags 
  ADD COLUMN IF NOT EXISTS nfc_uid VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS nfc_assigned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS nfc_last_scan TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS nfc_scan_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nfc_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nfc_blocked_reason TEXT;

-- Crear índice para búsquedas rápidas por NFC UID
CREATE INDEX IF NOT EXISTS idx_bags_nfc_uid ON bags(nfc_uid);

-- Comentarios explicativos
COMMENT ON COLUMN bags.nfc_uid IS 'UID único del chip NFC asignado al bolso (solo lectura después de asignación)';
COMMENT ON COLUMN bags.nfc_assigned_at IS 'Fecha y hora cuando se asignó el chip NFC';
COMMENT ON COLUMN bags.nfc_last_scan IS 'Último escaneo NFC realizado para validación';
COMMENT ON COLUMN bags.nfc_scan_count IS 'Contador de escaneos NFC realizados';
COMMENT ON COLUMN bags.nfc_blocked IS 'Indica si el bolso está bloqueado por discrepancia de NFC';
COMMENT ON COLUMN bags.nfc_blocked_reason IS 'Razón del bloqueo (ej: UID no coincide)';
