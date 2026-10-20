-- Marca de envio del correo 'Tu nuevo bolso ya viaja hacia ti' (uno por envio, aunque lo disparen el panel y el seguimiento de Correos). Idempotente.
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS in_transit_email_sent_at timestamptz;
