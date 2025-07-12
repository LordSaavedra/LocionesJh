-- Script simple para agregar columnas faltantes
-- Ejecutar línea por línea en Supabase SQL Editor

-- Agregar columnas básicas
ALTER TABLE productos ADD COLUMN IF NOT EXISTS subcategoria TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Verificar que se agregaron
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
