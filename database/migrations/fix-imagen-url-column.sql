-- Script para agregar columna imagen_url a la tabla productos
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna imagen_url si no existe
DO $$
BEGIN
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

-- 2. Verificar estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- 3. Mostrar algunos registros para verificar
SELECT id, nombre, marca, precio, categoria, imagen_url, activo 
FROM productos 
LIMIT 5;

-- 4. Actualizar registros existentes con imagen_url basada en la columna imagen (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen'
    ) THEN
        UPDATE productos 
        SET imagen_url = imagen 
        WHERE imagen_url IS NULL AND imagen IS NOT NULL;
        RAISE NOTICE 'Columnas imagen migradas a imagen_url';
    END IF;
END $$;
