-- CUSTOM SIGNUP FUNCTION que bypasea completamente Supabase Auth
-- para evitar errores "Database error checking email" causados por queries internas de Auth

-- 1. Crear extension pgcrypto si no existe (para hash de passwords)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Crear función de signup custom
CREATE OR REPLACE FUNCTION public.custom_signup(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_password text;
  v_full_name text;
BEGIN
  -- Validar email
  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'EMAIL_REQUIRED');
  END IF;

  -- Verificar si el email ya existe en auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
    RETURN jsonb_build_object('success', false, 'error', 'EMAIL_ALREADY_EXISTS');
  END IF;

  -- Generar UUID para el usuario
  v_user_id := gen_random_uuid();
  
  -- Hash del password usando bcrypt
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  v_full_name := p_first_name || ' ' || p_last_name;

  -- Insertar en auth.users (tabla interna de Supabase)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(trim(p_email)),
    v_encrypted_password,
    NULL, -- Requiere confirmación
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'full_name', v_full_name,
      'first_name', p_first_name,
      'last_name', p_last_name,
      'phone', p_phone
    ),
    'authenticated',
    'authenticated',
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex')
  );

  -- Insertar en profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    membership_status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    lower(trim(p_email)),
    v_full_name,
    p_first_name,
    p_last_name,
    p_phone,
    'free',
    now(),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', lower(trim(p_email)),
    'requires_confirmation', true
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'EMAIL_ALREADY_EXISTS');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'SIGNUP_FAILED', 'details', SQLERRM);
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.custom_signup TO authenticated, anon;

-- 4. Comentario de documentación
COMMENT ON FUNCTION public.custom_signup IS 'Custom signup function that bypasses Supabase Auth internal queries to avoid database errors';
