-- ============================================================================
-- Agrega columnas de referencia interna a la tabla bags:
--   serial_number  → numero de serie / referencia del bolso (unico por unidad)
--   cost_price     → precio que le costo a la empresa (uso interno admin)
--
-- Ambos campos son opcionales y de uso estrictamente interno. No se exponen
-- al publico. Idempotente: se puede ejecutar multiples veces sin efectos.
-- ============================================================================

ALTER TABLE public.bags
  ADD COLUMN IF NOT EXISTS serial_number TEXT,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2);

-- Indice para busqueda rapida por numero de serie
CREATE INDEX IF NOT EXISTS idx_bags_serial_number
  ON public.bags (serial_number)
  WHERE serial_number IS NOT NULL;

-- Comentarios descriptivos para documentar en Supabase
COMMENT ON COLUMN public.bags.serial_number IS 'Numero de serie o referencia interna del bolso (uso admin)';
COMMENT ON COLUMN public.bags.cost_price IS 'Precio de adquisicion del bolso en euros (uso admin interno)';
