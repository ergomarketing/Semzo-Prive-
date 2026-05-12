-- ============================================================
-- REFERRALS WEBHOOK — Tabla de idempotencia (BLOQUE 3)
-- ============================================================
-- Tabla DEDICADA solo para el webhook de referidos. Aislada del
-- webhook principal de Stripe (que usa `stripe_processed_events`).
--
-- Objetivo: evitar procesar dos veces el mismo evento de Stripe
-- cuando Stripe hace retries por timeout o 5xx. Antes de procesar
-- cualquier evento, intentamos insertar su `event_id`. Si choca
-- (UNIQUE violation), significa que ya esta en proceso o procesado
-- y el handler devuelve 200 sin tocar nada.
--
-- Idempotente: se puede ejecutar varias veces. No toca el webhook
-- principal ni la tabla de eventos del webhook principal.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals_webhook_events (
  event_id        text PRIMARY KEY,
  event_type      text NOT NULL,
  received_at     timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  -- Resultado libre para auditoria (status final, motivo de skip, etc).
  result          jsonb
);

-- Indices para depuracion rapida desde admin.
CREATE INDEX IF NOT EXISTS idx_referrals_webhook_events_received_at
  ON public.referrals_webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_webhook_events_type
  ON public.referrals_webhook_events (event_type);

-- RLS: solo service role escribe. Lectura permitida a admins via
-- politicas existentes del esquema (si hay rol admin) o por consultas
-- directas con la service key. No exponemos esta tabla al cliente.
ALTER TABLE public.referrals_webhook_events ENABLE ROW LEVEL SECURITY;

-- No creamos politicas de SELECT/INSERT publicas: la tabla queda
-- accesible SOLO via service role. El cliente nunca la consulta.

-- Verificacion rapida tras ejecutar.
SELECT
  COUNT(*) AS total_eventos_registrados
FROM public.referrals_webhook_events;
