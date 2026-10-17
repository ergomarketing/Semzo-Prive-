-- Un solo uso: credito retroactivo para mariahurtadosanchez5@gmail.com
-- Reclama la factura in_1UJLJdKBSKEgBoTnjBf7jnVP (139,50 EUR) para su progreso collect activo
-- (source='rental_conversion') y pone accumulated = 139.50.
--
-- Pegar TODO en el SQL Editor de Supabase.
--   dry_run = true  -> no guarda nada: termina con un error "DRY-RUN" que contiene el informe.
--   dry_run = false -> aplica los cambios.
-- Idempotente: si la factura ya esta en el libro, no hace nada.
-- Requiere que exista public.ownership_credit_entries (scripts/create-ownership-credit-entries.sql).

DO $$
DECLARE
  dry_run     boolean := true;  -- cambiar a false para aplicar

  v_email     text    := 'mariahurtadosanchez5@gmail.com';
  v_invoice   text    := 'in_1UJLJdKBSKEgBoTnjBf7jnVP';
  v_cents     integer := 13950;

  v_user_id   uuid;
  v_progress  record;
  v_count     integer;
  v_exists    boolean;
  v_new_acc   numeric;
  v_report    text;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = lower(v_email);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe ningun perfil con email %', v_email;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.ownership_progress
  WHERE user_id = v_user_id AND mode = 'collect' AND status = 'active';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Se esperaba exactamente 1 progreso collect activo y hay % (no se toca nada)', v_count;
  END IF;

  SELECT id, accumulated, purchase_price INTO v_progress
  FROM public.ownership_progress
  WHERE user_id = v_user_id AND mode = 'collect' AND status = 'active';

  SELECT EXISTS (
    SELECT 1 FROM public.ownership_credit_entries WHERE stripe_invoice_id = v_invoice
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'La factura % YA esta en el libro. No se hace nada.', v_invoice;
  END IF;

  v_new_acc := LEAST(v_cents / 100.0, v_progress.purchase_price);

  v_report := format(
    'Socia %s | progreso %s | accumulated %s -> %s (precio %s) | factura %s, %s centimos, source=rental_conversion | status se queda active',
    v_email, v_progress.id, v_progress.accumulated, v_new_acc, v_progress.purchase_price, v_invoice, v_cents
  );

  IF dry_run THEN
    RAISE EXCEPTION 'DRY-RUN (no se ha guardado nada). Se haria: %', v_report;
  END IF;

  INSERT INTO public.ownership_credit_entries
    (ownership_progress_id, user_id, stripe_invoice_id, amount_cents, source)
  VALUES
    (v_progress.id, v_user_id, v_invoice, v_cents, 'rental_conversion');

  UPDATE public.ownership_progress
  SET accumulated = v_new_acc, updated_at = now()
  WHERE id = v_progress.id;

  RAISE NOTICE 'APLICADO: %', v_report;
END
$$;

-- Comprobacion (ejecutar aparte tras aplicar):
-- SELECT op.id, op.status, op.accumulated, op.purchase_price, e.stripe_invoice_id, e.amount_cents, e.source
-- FROM public.ownership_progress op
-- LEFT JOIN public.ownership_credit_entries e ON e.ownership_progress_id = op.id
-- WHERE op.user_id = (SELECT id FROM public.profiles WHERE lower(email) = 'mariahurtadosanchez5@gmail.com')
--   AND op.mode = 'collect' AND op.status = 'active';
