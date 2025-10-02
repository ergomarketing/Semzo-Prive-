-- SCRIPT DE LIMPIEZA Y CONSOLIDACIÓN DE BASE DE DATOS
-- Este script elimina tablas duplicadas y consolida la estructura

-- 1. ELIMINAR TABLAS DUPLICADAS O INNECESARIAS
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.temp_users CASCADE;

-- 2. ASEGURAR QUE EXISTE LA TABLA PROFILES PRINCIPAL
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  member_type TEXT DEFAULT 'free' CHECK (member_type IN ('free', 'essentiel', 'signature', 'prive')),
  email_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR TABLA DE BOLSOS (INVENTARIO)
CREATE TABLE IF NOT EXISTS public.bags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
  condition VARCHAR(50) DEFAULT 'excellent' CHECK (condition IN ('excellent', 'very-good', 'good', 'fair')),
  monthly_price DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  total_rentals INTEGER DEFAULT 0,
  current_renter UUID REFERENCES public.profiles(id),
  rented_until TIMESTAMP WITH TIME ZONE,
  waiting_list JSONB DEFAULT '[]',
  last_maintenance TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREAR TABLA DE RESERVAS
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  bag_id UUID REFERENCES public.bags(id) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREAR TABLA DE WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  bag_id UUID REFERENCES public.bags(id) NOT NULL,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bag_id)
);

-- 6. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- 7. ELIMINAR POLÍTICAS EXISTENTES PARA EVITAR CONFLICTOS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow auth verification" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;

-- 8. CREAR POLÍTICAS LIMPIAS
-- Políticas para profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para bags (catálogo público)
CREATE POLICY "bags_select_all" ON public.bags FOR SELECT USING (true);
CREATE POLICY "bags_admin_all" ON public.bags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email IN ('ergomara@hotmail.com', 'admin@semzoprive.com')
  )
);

-- Políticas para reservations
CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reservations_admin_all" ON public.reservations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email IN ('ergomara@hotmail.com', 'admin@semzoprive.com')
  )
);

-- Políticas para wishlists
CREATE POLICY "wishlists_select_own" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlists_insert_own" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists_delete_own" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- 9. FUNCIÓN Y TRIGGER PARA CREAR PERFILES AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, email_confirmed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente y crear uno nuevo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. INSERTAR DATOS DE EJEMPLO PARA BOLSOS
INSERT INTO public.bags (name, brand, description, status, condition, monthly_price, retail_price) VALUES
('Classic Flap Medium', 'Chanel', 'Icónico bolso Chanel en cuero acolchado negro', 'available', 'excellent', 129.00, 8200.00),
('Speedy 30', 'Louis Vuitton', 'Clásico bolso de mano en canvas monogram', 'available', 'very-good', 89.00, 1350.00),
('Lady Dior Medium', 'Dior', 'Elegante bolso con cannage y charms', 'available', 'excellent', 119.00, 5500.00),
('Birkin 30', 'Hermès', 'Exclusivo bolso Birkin en cuero Togo', 'available', 'excellent', 299.00, 15000.00),
('Neverfull MM', 'Louis Vuitton', 'Espacioso tote en canvas Damier', 'available', 'very-good', 79.00, 1800.00)
ON CONFLICT DO NOTHING;

-- RESUMEN DE LA ESTRUCTURA FINAL:
-- ✅ profiles: Información de usuarios
-- ✅ bags: Inventario de bolsos
-- ✅ reservations: Sistema de reservas
-- ✅ wishlists: Listas de deseos
-- ✅ Políticas RLS configuradas
-- ✅ Trigger para crear perfiles automáticamente
-- ✅ Datos de ejemplo insertados
