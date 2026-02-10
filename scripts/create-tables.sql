-- Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice en email para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insertar datos de prueba (opcional)
INSERT INTO users (email, full_name, subscription_status) 
VALUES ('test@example.com', 'Usuario de Prueba', 'active')
ON CONFLICT (email) DO NOTHING;
