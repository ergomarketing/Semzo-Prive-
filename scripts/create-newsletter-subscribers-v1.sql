-- Crear tabla de suscriptores del newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website'
);

-- Habilitar RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Política para que cualquiera pueda suscribirse
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT TO public
  WITH CHECK (true);

-- Política para que el servicio pueda leer todos
CREATE POLICY "Service can read all subscribers" ON newsletter_subscribers
  FOR SELECT TO service_role
  USING (true);

-- Política para lectura anónima (para el admin)
CREATE POLICY "Anyone can read subscribers" ON newsletter_subscribers
  FOR SELECT TO anon, authenticated
  USING (true);

-- Política para actualizar (unsubscribe)
CREATE POLICY "Anyone can update their subscription" ON newsletter_subscribers
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
