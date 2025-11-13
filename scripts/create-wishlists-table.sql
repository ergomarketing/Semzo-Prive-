-- Crear tabla wishlists para guardar los bolsos favoritos de los usuarios
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bag_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bag_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_bag_id ON public.wishlists(bag_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios items de wishlist
CREATE POLICY "Users can view their own wishlist items"
  ON public.wishlists
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios items de wishlist
CREATE POLICY "Users can insert their own wishlist items"
  ON public.wishlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios items de wishlist
CREATE POLICY "Users can delete their own wishlist items"
  ON public.wishlists
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.wishlists IS 'Tabla para almacenar los bolsos favoritos de los usuarios';
COMMENT ON COLUMN public.wishlists.user_id IS 'ID del usuario que agregó el bolso a favoritos';
COMMENT ON COLUMN public.wishlists.bag_id IS 'ID del bolso agregado a favoritos';
COMMENT ON COLUMN public.wishlists.created_at IS 'Fecha y hora en que se agregó a favoritos';
