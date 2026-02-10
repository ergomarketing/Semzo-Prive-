# SOLUCIÓN URGENTE: Flujo de Membresías y Notificaciones

## Problema Detectado

Usuario **Maria Hurtado Sanchez** registrado el 15 de enero 2026:
- ❌ No recibió notificación en mailbox@semzoprive.com
- ❌ No pudo completar la membresía
- ❌ Tabla `membership_intents` NO existe en la base de datos

## Causa Raíz

El script SQL `scripts/create-membership-intents-table.sql` **NO SE EJECUTÓ** en la base de datos. Los cambios del deploy anterior quedaron solo en código, no en la base de datos.

## Solución URGENTE

### PASO 1: Ejecutar Script SQL (AHORA)

**Ve al SQL Editor de Supabase y ejecuta:**

\`\`\`sql
-- Este es el contenido de scripts/create-membership-intents-table.sql
CREATE TABLE IF NOT EXISTS membership_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  membership_type TEXT NOT NULL CHECK (membership_type IN ('petite', 'lessentiel', 'signature', 'prive')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly')),
  
  amount_cents INTEGER NOT NULL,
  original_amount_cents INTEGER NOT NULL,
  
  coupon_code TEXT,
  coupon_discount_cents INTEGER DEFAULT 0,
  gift_card_code TEXT,
  gift_card_applied_cents INTEGER DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'paid_pending_verification', 'active', 'canceled', 'expired')),
  
  stripe_payment_intent_id TEXT,
  stripe_setup_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_verification_session_id TEXT,
  
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_intents_user_id ON membership_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_intents_status ON membership_intents(status);
CREATE INDEX IF NOT EXISTS idx_membership_intents_stripe_payment_intent ON membership_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_membership_intents_expires_at ON membership_intents(expires_at);

ALTER TABLE membership_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership intents"
  ON membership_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage membership intents"
  ON membership_intents FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_membership_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_membership_intents_timestamp
  BEFORE UPDATE ON membership_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_intents_updated_at();

CREATE OR REPLACE FUNCTION cleanup_expired_membership_intents()
RETURNS void AS $$
BEGIN
  UPDATE membership_intents
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'initiated'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
\`\`\`

### PASO 2: Verificar Email API Key

Las notificaciones admin usan Resend con `EMAIL_API_KEY`. Verifica que esté configurada:

\`\`\`bash
# En Vercel > Settings > Environment Variables
EMAIL_API_KEY=re_xxxxxxxxxxxx
\`\`\`

### PASO 3: Deploy del Código Actualizado

He actualizado `app/api/checkout/create-intent/route.ts` para que **automáticamente envíe notificaciones** a mailbox@semzoprive.com cuando un usuario inicia una membresía.

## Flujo Correcto

1. **Usuario inicia checkout** → Se crea `membership_intent` con estado `initiated` → **Notificación enviada a admin**
2. **Usuario paga** → Webhook actualiza a `paid_pending_verification`
3. **Usuario verifica identidad** → Webhook actualiza a `active`
4. **Dashboard** → Lee desde `membership_intents`, no desde Stripe

## Cómo Probar

1. Ejecuta el SQL en Supabase
2. Deploy del código actualizado
3. Crea una cuenta de prueba
4. Inicia el flujo de checkout
5. Verifica que llegue email a mailbox@semzoprive.com

## Contactar a Maria Hurtado Sanchez

Email: mariahurtadasanchez5@gmail.com

Envíale un mensaje explicando que hubo un problema técnico temporal y que ya está resuelto. Ofrécele asistencia para completar su membresía.

## Próximos Pasos

- Ejecutar el SQL AHORA
- Verificar EMAIL_API_KEY
- Deploy del código
- Contactar a Maria
