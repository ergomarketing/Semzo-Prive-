-- =====================================================================
-- FIX: shipments.reservation_id debe ser NULLABLE
-- =====================================================================
-- Motivo: el panel de Logistica permite crear envios manuales (sin
-- reserva asociada) para casos administrativos. La constraint NOT NULL
-- bloquea estos casos y rompe el flujo cuando el admin no encuentra
-- la reserva en el selector.
--
-- Idempotente: si ya es nullable, no hace nada.
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'shipments'
      AND column_name  = 'reservation_id'
      AND is_nullable  = 'NO'
  ) THEN
    EXECUTE 'ALTER TABLE public.shipments ALTER COLUMN reservation_id DROP NOT NULL';
    RAISE NOTICE 'shipments.reservation_id ahora es NULLABLE';
  ELSE
    RAISE NOTICE 'shipments.reservation_id ya era NULLABLE, no se hizo nada';
  END IF;
END $$;
