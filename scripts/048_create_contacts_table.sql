-- ============================================================
-- Tabla `contacts` para el formulario de soporte (/support)
-- Necesaria porque /api/contact intenta hacer INSERT aqui.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS activado: el endpoint /api/contact usa service_role asi que bypassea las policies.
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON public.contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS contacts_status_idx ON public.contacts (status);
