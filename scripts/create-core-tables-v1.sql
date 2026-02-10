-- CREAR TABLAS PRINCIPALES

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  member_type TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bolsos
CREATE TABLE IF NOT EXISTS public.bags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  monthly_price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
