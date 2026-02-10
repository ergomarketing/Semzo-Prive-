-- Sistema de alertas administrativas
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_alerts_severity ON admin_alerts(severity, created_at DESC);
CREATE INDEX idx_admin_alerts_type ON admin_alerts(type);
CREATE INDEX idx_admin_alerts_unread ON admin_alerts(is_read) WHERE is_read = FALSE;

-- Tabla para reportes consolidados
CREATE TABLE IF NOT EXISTS membership_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_active INTEGER DEFAULT 0,
    total_cancelled INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    new_memberships INTEGER DEFAULT 0,
    cancelled_memberships INTEGER DEFAULT 0,
    metadata JSONB,
    generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membership_reports_period ON membership_reports(period_start, period_end);
CREATE INDEX idx_membership_reports_type ON membership_reports(report_type);
