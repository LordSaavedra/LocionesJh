-- Script SQL para agregar columnas de estado y descuento a la tabla productos
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna estado con valores por defecto
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'disponible';

-- 2. Agregar columna descuento (porcentaje)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS descuento INTEGER DEFAULT NULL;

-- 3. Crear tipo ENUM para los estados (opcional, para validación)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_producto') THEN
        CREATE TYPE estado_producto AS ENUM ('disponible', 'agotado', 'proximo', 'oferta');
    END IF;
END $$;

-- 4. Agregar restricción check para el estado
ALTER TABLE productos 
ADD CONSTRAINT IF NOT EXISTS check_estado 
CHECK (estado IN ('disponible', 'agotado', 'proximo', 'oferta'));

-- 5. Agregar restricción check para el descuento (debe estar entre 1 y 99)
ALTER TABLE productos 
ADD CONSTRAINT IF NOT EXISTS check_descuento 
CHECK (descuento IS NULL OR (descuento >= 1 AND descuento <= 99));

-- 6. Crear índice para mejorar consultas por estado
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);

-- 7. Agregar comentarios para documentación
COMMENT ON COLUMN productos.estado IS 'Estado del producto: disponible, agotado, proximo (disponible próximamente), oferta';
COMMENT ON COLUMN productos.descuento IS 'Porcentaje de descuento (1-99). Solo aplicable cuando estado = oferta';

-- 8. Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND column_name IN ('estado', 'descuento')
ORDER BY column_name;

-- 9. Script de ejemplo para actualizar productos existentes
-- (Opcional - ejecutar solo si quieres poner algunos productos en oferta de ejemplo)
/*
UPDATE productos 
SET estado = 'oferta', descuento = 15 
WHERE nombre ILIKE '%212%' OR nombre ILIKE '%versace%';

UPDATE productos 
SET estado = 'agotado' 
WHERE nombre ILIKE '%agotado%';

UPDATE productos 
SET estado = 'proximo' 
WHERE nombre ILIKE '%proximo%';
*/

-- 10. Verificar algunos productos después de la actualización
SELECT id, nombre, precio, estado, descuento, activo
FROM productos 
ORDER BY id 
LIMIT 10;
