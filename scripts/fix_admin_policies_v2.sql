-- Corregir políticas RLS eliminando email de usuario de las políticas de admin
-- Solo deben tener acceso de admin los emails administrativos reales de Semzo Privé

-- Eliminar políticas existentes que incluyen email de usuario
DROP POLICY IF EXISTS "Admins pueden ver todas las reservas" ON reservations;
DROP POLICY IF EXISTS "Admins pueden gestionar bolsos" ON bags;

-- Recrear políticas solo con emails de admin reales
-- Eliminando ergomara@hotmail.com (email de usuario) y dejando solo emails de admin
CREATE POLICY "Admins pueden ver todas las reservas" ON reservations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email IN ('admin@semzoprive.com')
  )
);

CREATE POLICY "Admins pueden gestionar bolsos" ON bags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email IN ('admin@semzoprive.com')
  )
);

-- Nota: Reemplaza 'admin@semzoprive.com' con los emails administrativos reales que uses para Semzo Privé
