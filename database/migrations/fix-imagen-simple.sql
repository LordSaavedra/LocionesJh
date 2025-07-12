-- Script simple para agregar columna imagen_url
-- Ejecutar línea por línea en Supabase SQL Editor

-- Agregar la columna imagen_url
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Verificar que se agregó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND column_name IN ('imagen', 'imagen_url');

-- Si tienes datos existentes con columna 'imagen', migrarlos:
-- UPDATE productos SET imagen_url = imagen WHERE imagen_url IS NULL;
