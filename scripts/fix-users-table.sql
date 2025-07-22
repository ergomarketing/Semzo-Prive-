-- Eliminar tabla existente si tiene problemas
DROP TABLE IF EXISTS users;

-- Crear tabla users correcta
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  membership_status VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción
CREATE POLICY "Allow insert for authenticated users" ON users
  FOR INSERT WITH CHECK (true);

-- Política para ver propios datos
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
