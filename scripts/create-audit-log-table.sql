-- Crear tabla de auditoría para seguridad y compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'membership_purchase', 'membership_activation', 'admin_edit', etc.
  entity_type TEXT NOT NULL, -- 'profile', 'subscription', 'payment', etc.
  entity_id TEXT NOT NULL,
  actor_id UUID, -- Usuario o admin que ejecutó la acción
  actor_type TEXT NOT NULL, -- 'user', 'admin', 'system', 'webhook'
  changes JSONB, -- Cambios realizados (antes/después)
  metadata JSONB, -- Datos adicionales contextuales
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);

-- RLS para auditoría (solo admin puede ver)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service role can access audit logs" ON audit_logs;
CREATE POLICY "Only service role can access audit logs" ON audit_logs
  FOR ALL USING (true);
