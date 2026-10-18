-- Modo Colecciona: ficha del estado del bolso (Anexo I del contrato de compraventa). Idempotente.
-- Claves del JSON: exterior, esquinas, asas, herrajes, interior, accesorios, updated_at.
-- Se rellena en el admin (Inventario > editar bolso > Modo Colecciona). Sin los seis apartados
-- completos el bolso no se puede comprar en Colecciona.
ALTER TABLE public.bags
  ADD COLUMN IF NOT EXISTS condition_report jsonb;
