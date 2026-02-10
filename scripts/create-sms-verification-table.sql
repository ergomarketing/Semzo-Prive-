-- Crear tabla para almacenar códigos de verificación SMS
CREATE TABLE IF NOT EXISTS sms_verification_codes (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_sms_verification_phone_code ON sms_verification_codes(phone, code);

-- Limpiar códigos expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_sms_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM sms_verification_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;
