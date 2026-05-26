-- Tabla de leads que solicitan acceso al catalogo privado
CREATE TABLE IF NOT EXISTS catalog_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  whatsapp TEXT,
  source TEXT DEFAULT 'catalog_gate',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip TEXT,
  user_agent TEXT,
  converted_to_member BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_leads_email ON catalog_leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_catalog_leads_created_at ON catalog_leads(created_at DESC);
