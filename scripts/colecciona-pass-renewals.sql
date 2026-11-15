-- COLECCIONA · RENOVACION AUTOMATICA DEL PASE SEMANAL (socias Petite)
-- Ejecutar en Supabase (SQL Editor) ANTES de desplegar la rama feat/colecciona-pase-semanal-automatico.
-- Es solo aditivo: crea una tabla nueva y no toca ninguna existente.
--
-- Una fila por cada cobro semanal: la pareja (reserva, fin del pase que se renueva) es unica, asi un
-- mismo vencimiento nunca se cobra dos veces aunque el cron se ejecute dos veces.

CREATE TABLE IF NOT EXISTS colecciona_pass_renewals (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL,
  reservation_id            uuid NOT NULL,
  ownership_progress_id     uuid,
  bag_id                    uuid,
  pass_tier                 text NOT NULL,
  amount_cents              integer NOT NULL CHECK (amount_cents > 0),
  -- Fin del pase que se renueva con este cobro (reservations.pass_expires_at en ese momento).
  period_end                timestamptz NOT NULL,
  -- pending_notice -> notified -> charging -> succeeded | failed (reintento) | gave_up | processing
  status                    text NOT NULL DEFAULT 'pending_notice'
                            CHECK (status IN ('pending_notice','notified','charging','processing','succeeded','failed','gave_up')),
  notice_sent_at            timestamptz,
  attempts                  integer NOT NULL DEFAULT 0,
  last_attempt_at           timestamptz,
  last_error                text,
  stripe_payment_intent_id  text UNIQUE,
  charged_at                timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, period_end)
);

CREATE INDEX IF NOT EXISTS colecciona_pass_renewals_progress_idx
  ON colecciona_pass_renewals (ownership_progress_id, status);
CREATE INDEX IF NOT EXISTS colecciona_pass_renewals_user_idx
  ON colecciona_pass_renewals (user_id, created_at DESC);

-- Solo el servidor (service role) lee y escribe esta tabla.
ALTER TABLE colecciona_pass_renewals ENABLE ROW LEVEL SECURITY;
