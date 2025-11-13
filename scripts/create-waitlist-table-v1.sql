-- Crear tabla waitlist para registrar usuarios que quieren ser notificados
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bag_id UUID NOT NULL REFERENCES public.bags(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bag_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON public.waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_bag_id ON public.waitlist(bag_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON public.waitlist(notified);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias entradas en la waitlist
CREATE POLICY "Users can view their own waitlist entries"
  ON public.waitlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias entradas en la waitlist
CREATE POLICY "Users can insert their own waitlist entries"
  ON public.waitlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias entradas en la waitlist
CREATE POLICY "Users can delete their own waitlist entries"
  ON public.waitlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.waitlist IS 'Tabla para registrar usuarios que quieren ser notificados cuando un bolso esté disponible';
COMMENT ON COLUMN public.waitlist.user_id IS 'ID del usuario que quiere ser notificado';
COMMENT ON COLUMN public.waitlist.bag_id IS 'ID del bolso que el usuario está esperando';
COMMENT ON COLUMN public.waitlist.email IS 'Email del usuario para enviar la notificación';
COMMENT ON COLUMN public.waitlist.notified IS 'Indica si el usuario ya fue notificado';
COMMENT ON COLUMN public.waitlist.created_at IS 'Fecha y hora en que se registró en la lista de espera';
