-- Script para asegurar que la tabla productos tenga la columna imagen
-- Este script debe ejecutarse en el SQL Editor de Supabase

-- 1. Verificar si la columna imagen existe y agregarla si no existe
DO $$
BEGIN
    -- Intentar agregar la columna imagen
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen'
    ) THEN
        ALTER TABLE productos ADD COLUMN imagen TEXT;
        RAISE NOTICE 'Columna imagen agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna imagen ya existe';
    END IF;
    
    -- Verificar si la columna imagen_url existe y agregarla si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen_url'
    ) THEN
        ALTER TABLE productos ADD COLUMN imagen_url TEXT;
        RAISE NOTICE 'Columna imagen_url agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna imagen_url ya existe';
    END IF;
END $$;

-- 2. Verificar que las columnas tengan el tipo correcto
-- La columna imagen debe ser TEXT para almacenar base64 (que puede ser muy largo)
-- La columna imagen_url debe ser TEXT también para URLs largas

ALTER TABLE productos ALTER COLUMN imagen TYPE TEXT;
ALTER TABLE productos ALTER COLUMN imagen_url TYPE TEXT;

-- 3. Agregar comentarios para documentar el uso de las columnas
COMMENT ON COLUMN productos.imagen IS 'Almacena imágenes en formato base64 (data:image/...)';
COMMENT ON COLUMN productos.imagen_url IS 'Almacena URLs de imágenes externas o locales';

-- 4. Mostrar información de las columnas
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND column_name IN ('imagen', 'imagen_url')
ORDER BY column_name;

-- 5. Mostrar productos existentes con información de imágenes
SELECT 
    id,
    nombre,
    marca,
    CASE 
        WHEN imagen IS NOT NULL THEN 'Base64 (' || LENGTH(imagen) || ' chars)'
        ELSE 'No'
    END as tiene_imagen_base64,
    CASE 
        WHEN imagen_url IS NOT NULL THEN 'URL: ' || LEFT(imagen_url, 50) || '...'
        ELSE 'No'
    END as tiene_imagen_url,
    created_at
FROM productos 
ORDER BY created_at DESC 
LIMIT 10;
