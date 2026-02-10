-- Sistema automático de gestión de inventario
-- Este script crea triggers que actualizan automáticamente el estado de los bolsos

-- 1. Función para actualizar el estado del bolso cuando se crea una reserva
CREATE OR REPLACE FUNCTION update_bag_status_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la reserva está activa (confirmed, preparing, shipped, delivered, active)
  -- marcar el bolso como no disponible
  IF NEW.status IN ('confirmed', 'preparing', 'shipped', 'delivered', 'active') THEN
    UPDATE bags 
    SET status = 'rented',
        updated_at = NOW()
    WHERE id = NEW.bag_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para liberar el bolso cuando la reserva termina
CREATE OR REPLACE FUNCTION release_bag_on_reservation_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la reserva se completa o cancela, liberar el bolso
  IF NEW.status IN ('completed', 'cancelled', 'returned') AND 
     OLD.status NOT IN ('completed', 'cancelled', 'returned') THEN
    
    UPDATE bags 
    SET status = 'available',
        updated_at = NOW()
    WHERE id = NEW.bag_id;
    
    -- Notificar a usuarios en lista de espera
    -- (esto se puede expandir para enviar emails)
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
$$ LANGUAGE plpgsql;

-- 3. Crear triggers
DROP TRIGGER IF EXISTS trigger_update_bag_on_reservation ON reservations;
CREATE TRIGGER trigger_update_bag_on_reservation
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_bag_status_on_reservation();

DROP TRIGGER IF EXISTS trigger_release_bag_on_end ON reservations;
CREATE TRIGGER trigger_release_bag_on_end
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION release_bag_on_reservation_end();

-- 4. Crear tabla de notificaciones si no existe
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bag_id UUID REFERENCES bags(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Habilitar RLS en notificaciones
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para notificaciones
CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema puede crear notificaciones"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 7. Actualizar tabla waitlist para incluir campo notified
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITH TIME ZONE;

-- 8. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_bags_status ON bags(status);
CREATE INDEX IF NOT EXISTS idx_reservations_bag_id ON reservations(bag_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_bag_id ON waitlist(bag_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON waitlist(notified);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

COMMENT ON FUNCTION update_bag_status_on_reservation() IS 'Actualiza automáticamente el estado del bolso a "rented" cuando se crea o confirma una reserva';
COMMENT ON FUNCTION release_bag_on_reservation_end() IS 'Libera el bolso y notifica a usuarios en lista de espera cuando una reserva termina';
