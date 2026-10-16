-- ============================================================================
-- Libro de crédito de Modo Colecciona: una fila por factura de Stripe.
--
-- Una factura solo puede dar crédito UNA vez (stripe_invoice_id UNIQUE), da igual
-- a qué ownership_progress se asocie (activo, cancelado o completado).
--
-- USO
--   1) Ejecuta el script tal cual: modo DRY-RUN (dry_run := true). No cambia nada,
--      solo informa por NOTICE de lo que haría.
--   2) Cuando el informe sea correcto, cambia `dry_run boolean := true` por `false`
--      y vuelve a ejecutar para crear la tabla.
--
-- Seguridad: RLS activado y SIN políticas. Solo accede el service role (que ignora
-- RLS); anon y authenticated quedan sin acceso.
-- ============================================================================

DO $$
DECLARE
  dry_run boolean := true;  -- <-- cambia a false para aplicar
  table_exists boolean := to_regclass('public.ownership_credit_entries') IS NOT NULL;
BEGIN
  IF to_regclass('public.ownership_progress') IS NULL OR to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Faltan las tablas ownership_progress y/o profiles. Abortado.';
  END IF;

  IF dry_run THEN
    RAISE NOTICE '[DRY-RUN] Sin cambios. ownership_credit_entries existe: %', table_exists;
    RAISE NOTICE '[DRY-RUN] Se ejecutaría: CREATE TABLE IF NOT EXISTS ownership_credit_entries (...)';
    RAISE NOTICE '[DRY-RUN] Se ejecutaría: 2 índices + ENABLE ROW LEVEL SECURITY (sin políticas)';
    RETURN;
  END IF;

  CREATE TABLE IF NOT EXISTS public.ownership_credit_entries (
    id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- NO ACTION: borrar un progreso con entradas falla al final de la sentencia, así sus facturas no quedan libres para recontarse.
    ownership_progress_id uuid        NOT NULL REFERENCES public.ownership_progress(id) ON DELETE NO ACTION,
    user_id               uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_invoice_id     text        NOT NULL UNIQUE,
    amount_cents          integer     NOT NULL CHECK (amount_cents > 0),
    source                text        NOT NULL CHECK (source IN ('rental_conversion', 'collect_invoice')),
    created_at            timestamptz NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_ownership_credit_entries_progress
    ON public.ownership_credit_entries (ownership_progress_id);
  CREATE INDEX IF NOT EXISTS idx_ownership_credit_entries_user
    ON public.ownership_credit_entries (user_id);

  ALTER TABLE public.ownership_credit_entries ENABLE ROW LEVEL SECURITY;

  RAISE NOTICE 'ownership_credit_entries creada (RLS activado, sin políticas).';
END $$;
