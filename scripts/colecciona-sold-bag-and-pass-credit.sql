-- Modo Colecciona: bolso vendido y credito por pases (idempotente).
-- Aplicado en produccion el 2026-10-17; este script deja constancia y sirve para otros entornos.

-- 1) Un bolso vendido (status 'colecciona') NO se libera ni avisa a la lista de espera
--    cuando su reserva pasa a 'completed'. Antes el trigger lo devolvia a 'available'
--    y mandaba un aviso falso de "bolso disponible".
CREATE OR REPLACE FUNCTION public.release_bag_on_reservation_end()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Si la reserva se completa o cancela, liberar el bolso
  IF NEW.status IN ('completed', 'cancelled', 'returned') AND
     OLD.status NOT IN ('completed', 'cancelled', 'returned') THEN

    -- Bolso vendido en Modo Colecciona: no se libera ni se avisa a nadie
    IF EXISTS (SELECT 1 FROM bags WHERE id = NEW.bag_id AND status = 'colecciona') THEN
      RETURN NEW;
    END IF;

    UPDATE bags
    SET status = 'available',
        updated_at = NOW()
    WHERE id = NEW.bag_id;

    -- Notificar a usuarios en lista de espera
    INSERT INTO notifications (user_id, bag_id, message, type, created_at)
    SELECT
      user_id,
      bag_id,
      'El bolso ' || (SELECT name FROM bags WHERE id = NEW.bag_id) || ' está ahora disponible!',
      'bag_available',
      NOW()
    FROM waitlist
    WHERE bag_id = NEW.bag_id
      AND notified = false;

    -- Marcar como notificados
    UPDATE waitlist
    SET notified = true,
        notified_at = NOW()
    WHERE bag_id = NEW.bag_id
      AND notified = false;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) El credito de Colecciona tambien puede venir de un pase de bolso pagado.
ALTER TABLE public.ownership_credit_entries
  DROP CONSTRAINT IF EXISTS ownership_credit_entries_source_check;
ALTER TABLE public.ownership_credit_entries
  ADD CONSTRAINT ownership_credit_entries_source_check
  CHECK (source = ANY (ARRAY['rental_conversion'::text, 'collect_invoice'::text, 'collect_pass'::text]));
