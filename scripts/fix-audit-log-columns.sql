-- Script para agregar columnas faltantes a audit_log si no existen
-- Ejecutar este script una vez para corregir la tabla

-- Verificar y agregar columna metadata si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_log' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE audit_log ADD COLUMN metadata JSONB;
    RAISE NOTICE 'Columna metadata agregada a audit_log';
  END IF;
END $$;

-- Verificar y agregar columna old_data si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_log' AND column_name = 'old_data'
  ) THEN
    ALTER TABLE audit_log ADD COLUMN old_data JSONB;
    RAISE NOTICE 'Columna old_data agregada a audit_log';
  END IF;
END $$;

-- Verificar y agregar columna new_data si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_log' AND column_name = 'new_data'
  ) THEN
    ALTER TABLE audit_log ADD COLUMN new_data JSONB;
    RAISE NOTICE 'Columna new_data agregada a audit_log';
  END IF;
END $$;

-- Confirmar estructura actual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_log'
ORDER BY ordinal_position;
