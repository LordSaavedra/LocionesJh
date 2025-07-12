-- Script para agregar columnas de estado y descuento a la tabla productos
-- Ejecutar en el SQL Editor de Supabase

-- 1. Agregar columna 'estado' si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' AND column_name = 'estado') THEN
        ALTER TABLE productos ADD COLUMN estado varchar(20) DEFAULT 'disponible';
        
        -- Agregar constraint para valores válidos
        ALTER TABLE productos ADD CONSTRAINT productos_estado_check 
        CHECK (estado IN ('disponible', 'agotado', 'proximo', 'oferta'));
        
        RAISE NOTICE 'Columna estado agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna estado ya existe';
    END IF;
END $$;

-- 2. Agregar columna 'descuento' si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' AND column_name = 'descuento') THEN
        ALTER TABLE productos ADD COLUMN descuento integer;
        
        -- Agregar constraint para valores válidos (1-99%)
        ALTER TABLE productos ADD CONSTRAINT productos_descuento_check 
        CHECK (descuento IS NULL OR (descuento >= 1 AND descuento <= 99));
        
        RAISE NOTICE 'Columna descuento agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna descuento ya existe';
    END IF;
END $$;

-- 3. Actualizar productos existentes para tener estado 'disponible' por defecto
UPDATE productos SET estado = 'disponible' WHERE estado IS NULL;

-- 4. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND column_name IN ('estado', 'descuento')
ORDER BY column_name;

-- 5. Ver algunos registros de ejemplo
SELECT id, nombre, estado, descuento, precio
FROM productos 
LIMIT 5;
