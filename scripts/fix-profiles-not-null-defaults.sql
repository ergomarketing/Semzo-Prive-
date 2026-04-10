-- Fix: establecer DEFAULT en columnas NOT NULL de profiles
-- para que el trigger handle_new_user nunca falle al insertar un nuevo usuario.
-- membership_status y identity_verified son ahora solo datos de legado/compatibilidad;
-- la fuente de verdad real es user_memberships e identity_verifications.

-- Añadir DEFAULT a membership_status si la columna existe
ALTER TABLE public.profiles
  ALTER COLUMN membership_status SET DEFAULT 'free';

-- Añadir DEFAULT a identity_verified si la columna existe
ALTER TABLE public.profiles
  ALTER COLUMN identity_verified SET DEFAULT false;

-- Asegurarse de que ninguna fila existente tenga NULL en esas columnas
UPDATE public.profiles
  SET membership_status = 'free'
  WHERE membership_status IS NULL;

UPDATE public.profiles
  SET identity_verified = false
  WHERE identity_verified IS NULL;

SELECT 'Defaults establecidos correctamente en profiles' AS status;
