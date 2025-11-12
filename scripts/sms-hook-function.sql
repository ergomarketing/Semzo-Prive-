-- Función para el SMS Hook personalizado
CREATE OR REPLACE FUNCTION send_custom_sms(event jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phone_number text;
  otp_code text;
  custom_message text;
BEGIN
  -- Extraer datos del evento
  phone_number := event->'sms'->>'phone';
  otp_code := event->'sms'->>'otp';
  
  -- Crear mensaje personalizado
  custom_message := 'Tu código de verificación Semzo Privé es: ' || otp_code;
  
  -- Llamar al endpoint HTTP para enviar SMS personalizado
  PERFORM net.http_post(
    url := current_setting('app.base_url') || '/api/sms/send-custom',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'phone', phone_number,
      'message', custom_message
    )
  );
  
  RAISE LOG 'SMS personalizado enviado a: %', phone_number;
END;
$$;

-- Dar permisos
GRANT EXECUTE ON FUNCTION send_custom_sms TO supabase_auth_admin;
