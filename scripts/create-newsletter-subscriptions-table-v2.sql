-- Crear tabla newsletter_subscriptions para almacenar suscriptores del magazine
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{
    "newArrivals": true,
    "exclusiveOffers": true,
    "styleGuides": true,
    "events": false,
    "membershipUpdates": true
  }'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON public.newsletter_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON public.newsletter_subscriptions(subscribed_at);

-- Habilitar RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política simplificada: cualquiera puede suscribirse (INSERT)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política: cualquiera puede actualizar suscripciones (para desuscribirse)
CREATE POLICY "Anyone can update newsletter subscription"
ON public.newsletter_subscriptions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Política: usuarios autenticados pueden ver todas las suscripciones
-- (esto permite que los admins las vean desde el panel)
CREATE POLICY "Authenticated users can view newsletter subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
TO authenticated
USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.newsletter_subscriptions IS 'Tabla para almacenar suscriptores del Semzo Magazine';
COMMENT ON COLUMN public.newsletter_subscriptions.email IS 'Email del suscriptor (único)';
COMMENT ON COLUMN public.newsletter_subscriptions.name IS 'Nombre del suscriptor (opcional)';
COMMENT ON COLUMN public.newsletter_subscriptions.preferences IS 'Preferencias de contenido del suscriptor';
COMMENT ON COLUMN public.newsletter_subscriptions.status IS 'Estado de la suscripción: active, unsubscribed, bounced';

-- Mensaje de éxito
SELECT 'Tabla newsletter_subscriptions creada exitosamente' as resultado;
