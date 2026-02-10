-- Corregir la tabla sms_verification_codes para alinear con el comportamiento de Supabase
-- Los códigos OTP de Supabase expiran en 60 segundos, no 10 minutos

-- Agregar columna para trackear si fue enviado vía Supabase
ALTER TABLE sms_verification_codes 
ADD COLUMN IF NOT EXISTS sent_via_supabase BOOLEAN DEFAULT TRUE;

-- Actualizar la función de limpieza para reflejar el tiempo correcto
CREATE OR REPLACE FUNCTION cleanup_expired_sms_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Eliminar códigos expirados (mayores a 5 minutos es más que suficiente)
  DELETE FROM sms_verification_codes 
  WHERE expires_at < NOW() - INTERVAL '5 minutes';
  
  -- O alternativamente, eliminar códigos de más de 2 minutos
  -- ya que Supabase solo los mantiene válidos por 60 segundos
  DELETE FROM sms_verification_codes 
  WHERE created_at < NOW() - INTERVAL '2 minutes';
END;
$$;

-- Agregar comentario explicativo
COMMENT ON COLUMN sms_verification_codes.expires_at IS 
'Tiempo de expiración almacenado. NOTA: Supabase OTP expira en 60 segundos independientemente de este valor.';

-- Limpiar códigos antiguos existentes
SELECT cleanup_expired_sms_codes();
