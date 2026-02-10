-- Crear tabla de pagos con relaciones correctas
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  stripe_payment_id TEXT,
  stripe_payment_intent_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON public.payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "payments_select_own" ON public.payments 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_admin_all" ON public.payments 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email IN ('ergomara@hotmail.com', 'admin@semzoprive.com')
    )
  );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.payments IS 'Tabla de pagos y transacciones';
COMMENT ON COLUMN public.payments.user_id IS 'Usuario que realizó el pago';
COMMENT ON COLUMN public.payments.reservation_id IS 'Reserva asociada al pago (opcional)';
COMMENT ON COLUMN public.payments.stripe_payment_id IS 'ID del pago en Stripe';
COMMENT ON COLUMN public.payments.stripe_payment_intent_id IS 'ID del payment intent en Stripe';
