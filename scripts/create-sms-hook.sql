-- Crear tabla para cola de SMS
CREATE TABLE IF NOT EXISTS sms_queue (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  otp TEXT,
  user_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Habilitar RLS
ALTER TABLE sms_queue ENABLE ROW LEVEL SECURITY;

-- Política para supabase_auth_admin
CREATE POLICY "Allow supabase_auth_admin full access" ON sms_queue
  FOR ALL TO supabase_auth_admin
  USING (true)
  WITH CHECK (true);

-- Función para manejar SMS Hook
CREATE OR REPLACE FUNCTION send_custom_sms(user_data jsonb, sms_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phone_number TEXT;
  otp_code TEXT;
  message_body TEXT;
BEGIN
  -- Extraer datos del SMS
  phone_number := sms_data->>'phone';
  otp_code := sms_data->>'otp';
  
  -- Crear mensaje personalizado
  message_body := 'Tu código de verificación Semzo Privé es: ' || otp_code || '. Válido por 5 minutos.';
  
  -- Insertar en cola de SMS
  INSERT INTO sms_queue (phone, message, otp, user_id, status)
  VALUES (
    phone_number,
    message_body,
    otp_code,
    (user_data->>'id')::UUID,
    'pending'
  );
  
  -- Llamar al endpoint para procesar inmediatamente
  PERFORM net.http_post(
    url := current_setting('app.base_url') || '/api/sms/process-hook',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'phone', phone_number,
      'message', message_body,
      'otp', otp_code
    )
  );
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION send_custom_sms TO supabase_auth_admin;
