-- PETITE PASS - PASO 2 de 3: Funcion del trigger
-- Ejecutar SOLO este bloque. Cuando termine OK, ejecutar petite_pass_03_trigger_view.sql

CREATE OR REPLACE FUNCTION set_petite_pass_expiry_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
DECLARE
  v_pass_id UUID;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    IF NEW.reservation_id IS NOT NULL THEN
      SELECT bag_pass_id INTO v_pass_id FROM reservations WHERE id = NEW.reservation_id;
      IF v_pass_id IS NOT NULL THEN
        UPDATE reservations
        SET delivered_at = NOW(),
            pass_expires_at = NOW() + INTERVAL '7 days',
            end_date = NOW() + INTERVAL '7 days',
            updated_at = NOW()
        WHERE id = NEW.reservation_id AND delivered_at IS NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;
