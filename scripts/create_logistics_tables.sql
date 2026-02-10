-- ============================================================================
-- LOGISTICS MODULE - DATABASE SCHEMA
-- ============================================================================
-- Este script crea las tablas necesarias para el módulo de logística
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TABLA: shipments (Envíos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Pendiente de envío
    'picked_up',         -- Recogido por transportista
    'in_transit',        -- En tránsito
    'out_for_delivery',  -- Listo para entregar
    'delivered',         -- Entregado
    'failed_delivery',   -- Fallo en entrega
    'returned',          -- Devuelto
    'cancelled'          -- Cancelado
  )),
  carrier VARCHAR(100),  -- DHL, FedEx, UPS, Correos, Glovo, etc.
  tracking_number VARCHAR(255) UNIQUE,  -- Número de seguimiento
  estimated_delivery TIMESTAMP,  -- Fecha estimada de entrega
  actual_delivery TIMESTAMP,     -- Fecha real de entrega
  pickup_date TIMESTAMP,         -- Fecha de recogida
  return_date TIMESTAMP,         -- Fecha de devolución
  cost DECIMAL(10, 2),           -- Costo del envío
  notes TEXT,                    -- Notas adicionales
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),  -- Admin que creó el envío
  
  -- Índices para búsquedas rápidas
  CONSTRAINT fk_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE INDEX idx_shipments_reservation_id ON shipments(reservation_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_carrier ON shipments(carrier);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_created_at ON shipments(created_at);

-- ============================================================================
-- 2. TABLA: shipment_events (Eventos de Envío)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'created',              -- Envío creado
    'label_generated',      -- Etiqueta generada
    'picked_up',            -- Recogido
    'in_transit',           -- En tránsito
    'out_for_delivery',     -- Listo para entregar
    'delivered',            -- Entregado
    'delivery_attempted',   -- Intento de entrega fallido
    'returned',             -- Devuelto
    'exception',            -- Excepción/Problema
    'cancelled'             -- Cancelado
  )),
  location VARCHAR(255),   -- Ubicación del evento
  description TEXT,        -- Descripción detallada
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

CREATE INDEX idx_shipment_events_shipment_id ON shipment_events(shipment_id);
CREATE INDEX idx_shipment_events_event_type ON shipment_events(event_type);
CREATE INDEX idx_shipment_events_timestamp ON shipment_events(timestamp);

-- ============================================================================
-- 3. TABLA: returns (Devoluciones)
-- ============================================================================
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL CHECK (reason IN (
    'customer_request',     -- Solicitud del cliente
    'damaged',              -- Dañado
    'wrong_item',           -- Artículo incorrecto
    'not_as_described',     -- No como se describió
    'quality_issue',        -- Problema de calidad
    'lost',                 -- Perdido
    'other'                 -- Otro
  )),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',              -- Pendiente
    'approved',             -- Aprobado
    'in_transit',           -- En tránsito
    'received',             -- Recibido
    'processed',            -- Procesado
    'rejected'              -- Rechazado
  )),
  return_tracking VARCHAR(255),  -- Número de seguimiento de retorno
  return_carrier VARCHAR(100),   -- Transportista de retorno
  return_cost DECIMAL(10, 2),    -- Costo de retorno
  refund_amount DECIMAL(10, 2),  -- Monto del reembolso
  notes TEXT,                    -- Notas adicionales
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),  -- Admin que creó la devolución
  
  CONSTRAINT fk_shipment_return FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

CREATE INDEX idx_returns_shipment_id ON returns(shipment_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_created_at ON returns(created_at);

-- ============================================================================
-- 4. TABLA: logistics_settings (Configuración de Logística)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_name VARCHAR(100) NOT NULL UNIQUE,  -- DHL, FedEx, UPS, etc.
  is_enabled BOOLEAN DEFAULT FALSE,           -- ¿Está habilitado?
  api_key VARCHAR(500),                       -- Clave API
  account_number VARCHAR(255),                -- Número de cuenta
  default_service VARCHAR(100),               -- Servicio por defecto
  webhook_url VARCHAR(500),                   -- URL para webhooks
  webhook_secret VARCHAR(500),                -- Secreto para webhooks
  config_json JSONB,                          -- Configuración adicional en JSON
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT fk_settings_user FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX idx_logistics_settings_carrier ON logistics_settings(carrier_name);
CREATE INDEX idx_logistics_settings_enabled ON logistics_settings(is_enabled);

-- ============================================================================
-- 5. TABLA: shipment_notifications (Notificaciones de Envío)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'created',              -- Envío creado
    'picked_up',            -- Recogido
    'in_transit',           -- En tránsito
    'out_for_delivery',     -- Listo para entregar
    'delivered',            -- Entregado
    'failed_delivery',      -- Fallo en entrega
    'return_initiated',     -- Devolución iniciada
    'return_received',      -- Devolución recibida
    'exception'             -- Excepción
  )),
  channel VARCHAR(50) NOT NULL CHECK (channel IN (
    'email',
    'sms',
    'push',
    'in_app'
  )),
  recipient VARCHAR(255),  -- Email, teléfono, etc.
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'sent',
    'failed',
    'bounced'
  )),
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_notification_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_notifications_shipment_id ON shipment_notifications(shipment_id);
CREATE INDEX idx_notifications_user_id ON shipment_notifications(user_id);
CREATE INDEX idx_notifications_status ON shipment_notifications(status);
CREATE INDEX idx_notifications_created_at ON shipment_notifications(created_at);

-- ============================================================================
-- 6. TABLA: logistics_audit_log (Registro de Auditoría)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,  -- create_shipment, update_status, etc.
  entity_type VARCHAR(50),       -- shipment, return, settings, etc.
  entity_id UUID,                -- ID de la entidad afectada
  old_values JSONB,              -- Valores anteriores
  new_values JSONB,              -- Nuevos valores
  admin_id UUID REFERENCES auth.users(id),  -- Admin que realizó la acción
  ip_address VARCHAR(45),        -- Dirección IP
  user_agent TEXT,               -- User Agent
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_audit_log_entity ON logistics_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_admin ON logistics_audit_log(admin_id);
CREATE INDEX idx_audit_log_created_at ON logistics_audit_log(created_at);
CREATE INDEX idx_audit_log_action ON logistics_audit_log(action);

-- ============================================================================
-- 7. POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para shipments (solo admins pueden ver/editar)
CREATE POLICY "Admins can view all shipments" ON shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      )
    )
  );

CREATE POLICY "Admins can insert shipments" ON shipments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      )
    )
  );

CREATE POLICY "Admins can update shipments" ON shipments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      )
    )
  );

-- Políticas similares para otras tablas...
-- (Se pueden expandir según sea necesario)

-- ============================================================================
-- 8. FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logistics_settings_updated_at
  BEFORE UPDATE ON logistics_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. VISTAS ÚTILES
-- ============================================================================

-- Vista: Resumen de envíos por estado
CREATE OR REPLACE VIEW shipments_summary AS
SELECT
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN carrier IS NOT NULL THEN 1 END) as with_carrier,
  AVG(cost) as avg_cost,
  MAX(created_at) as last_shipment
FROM shipments
GROUP BY status;

-- Vista: Envíos pendientes de entrega
CREATE OR REPLACE VIEW pending_shipments AS
SELECT
  s.id,
  s.reservation_id,
  s.status,
  s.carrier,
  s.tracking_number,
  s.estimated_delivery,
  p.full_name,
  p.email,
  b.name as bag_name,
  b.brand as bag_brand
FROM shipments s
JOIN reservations r ON s.reservation_id = r.id
JOIN profiles p ON r.user_id = p.id
JOIN bags b ON r.bag_id = b.id
WHERE s.status NOT IN ('delivered', 'returned', 'cancelled')
ORDER BY s.estimated_delivery ASC;

-- Vista: Tasa de devoluciones
CREATE OR REPLACE VIEW return_statistics AS
SELECT
  DATE_TRUNC('month', r.created_at) as month,
  COUNT(*) as total_returns,
  COUNT(CASE WHEN r.status = 'processed' THEN 1 END) as processed_returns,
  AVG(r.refund_amount) as avg_refund,
  r.reason,
  COUNT(*) as count_by_reason
FROM returns r
GROUP BY DATE_TRUNC('month', r.created_at), r.reason
ORDER BY month DESC;

-- ============================================================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE shipments IS 'Tabla principal para gestionar envíos de bolsos a clientes';
COMMENT ON TABLE shipment_events IS 'Registro de eventos de seguimiento de envíos';
COMMENT ON TABLE returns IS 'Gestión de devoluciones de bolsos';
COMMENT ON TABLE logistics_settings IS 'Configuración de integraciones con transportistas';
COMMENT ON TABLE shipment_notifications IS 'Notificaciones enviadas a clientes sobre sus envíos';
COMMENT ON TABLE logistics_audit_log IS 'Registro de auditoría de todas las acciones en logística';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
