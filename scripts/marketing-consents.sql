-- Consentimiento de marketing por correo (casilla expresa, no premarcada). Idempotente.
-- Una fila por consentimiento: texto exacto aceptado, fecha, IP y navegador (prueba RGPD).
-- withdrawn_at se rellena al darse de baja. RLS activada sin politicas: solo el servidor accede.
CREATE TABLE IF NOT EXISTS public.marketing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  source text NOT NULL,
  consent_text text NOT NULL,
  locale text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  withdrawn_at timestamptz,
  klaviyo_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketing_consents_email_idx ON public.marketing_consents (lower(email));
ALTER TABLE public.marketing_consents ENABLE ROW LEVEL SECURITY;
