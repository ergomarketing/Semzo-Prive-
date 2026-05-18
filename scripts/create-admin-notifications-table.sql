-- =====================================================
-- Crear tabla admin_notifications
-- Usada por:
--   - app/api/webhooks/stripe/route.ts (compra de pase via webhook)
--   - app/api/bag-passes/purchase/route.ts (gift card 100%)
--   - otros lugares que notifiquen al admin
--
-- Schema minimo - ampliable sin breaking changes.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,                              -- ej: 'bag_pass_purchase', 'subscription_started', 'payment_failed'
  priority    text NOT NULL DEFAULT 'normal'              -- 'low' | 'normal' | 'high' | 'urgent'
              CHECK (priority IN ('low','normal','high','urgent')),
  title       text NOT NULL,
  message     text NOT NULL,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  read        boolean NOT NULL DEFAULT false,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indices utiles para el admin
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
  ON public.admin_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
  ON public.admin_notifications (read, created_at DESC)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type
  ON public.admin_notifications (type);

-- RLS: solo service_role escribe/lee (los endpoints usan supabase admin client)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Politica: service_role tiene full access (la usan los endpoints del admin)
DROP POLICY IF EXISTS "service_role full access" ON public.admin_notifications;
CREATE POLICY "service_role full access"
  ON public.admin_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verificacion
SELECT
  'admin_notifications creada' as status,
  COUNT(*) as filas_iniciales
FROM public.admin_notifications;
