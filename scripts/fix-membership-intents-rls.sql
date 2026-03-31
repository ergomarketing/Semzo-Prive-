-- Fix RLS policies for membership_intents
-- El problema: la política "System can manage membership intents" usa USING(true)
-- pero no permite INSERT a usuarios autenticados via ANON_KEY + cookies

-- 1. Eliminar políticas existentes conflictivas
DROP POLICY IF EXISTS "System can manage membership intents" ON membership_intents;
DROP POLICY IF EXISTS "Users can insert own membership intents" ON membership_intents;
DROP POLICY IF EXISTS "Users can update own membership intents" ON membership_intents;
DROP POLICY IF EXISTS "Users can delete own membership intents" ON membership_intents;

-- 2. Crear política explícita de INSERT para usuarios autenticados
CREATE POLICY "Users can insert own membership intents"
  ON membership_intents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Crear política explícita de UPDATE para usuarios autenticados
CREATE POLICY "Users can update own membership intents"
  ON membership_intents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Crear política explícita de DELETE para usuarios autenticados
CREATE POLICY "Users can delete own membership intents"
  ON membership_intents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Política para service_role (webhook de Stripe y operaciones de sistema)
CREATE POLICY "Service role can manage all membership intents"
  ON membership_intents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
