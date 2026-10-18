-- Modo Colecciona: archivo de contratos firmados (PDF). Idempotente.
-- El PDF se guarda en un bucket PRIVADO de Supabase Storage; la tabla lo registra con su huella SHA-256.
-- RLS activada sin politicas: solo accede el servidor (service role). La descarga pasa por
-- /api/user/ownership/contract, que comprueba que el contrato es de quien lo pide.
-- Sin claves foraneas a proposito: es documentacion legal y no debe bloquear el borrado de usuarios
-- ni desaparecer con ellos.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('colecciona-contracts', 'colecciona-contracts', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.colecciona_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ownership_progress_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  bag_id uuid NOT NULL,
  acceptance_id uuid,
  contract_version text NOT NULL,
  storage_path text NOT NULL,
  sha256 text NOT NULL,
  size_bytes integer NOT NULL,
  stripe_session_id text,
  stripe_invoice_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS colecciona_contracts_user_idx ON public.colecciona_contracts (user_id);

ALTER TABLE public.colecciona_contracts ENABLE ROW LEVEL SECURITY;
