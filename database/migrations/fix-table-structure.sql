-- Script para corregir la estructura de la tabla productos
-- Ejecuta este SQL en Supabase para solucionar el error de columnas

-- 1. Verificar estructura actual
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Agregar columnas faltantes si no existen
DO $$ 
BEGIN
    -- Agregar columna categoria si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'categoria' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN categoria VARCHAR(255);
    END IF;
    
    -- Agregar columna marca si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'marca' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN marca VARCHAR(255);
    END IF;
    
    -- Agregar columna imagen si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'imagen' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN imagen VARCHAR(500);
    END IF;
    
    -- Agregar columna precio si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'precio' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN precio DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Agregar columna descripcion si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'descripcion' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN descripcion TEXT;
    END IF;
    
    -- Agregar columna activo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'activo' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN activo BOOLEAN DEFAULT true;
    END IF;
    
    -- Agregar columna disponible si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'disponible' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN disponible BOOLEAN DEFAULT true;
    END IF;
    
    -- Agregar columna created_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'created_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE productos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Verificar estructura después de los cambios
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Insertar productos de ejemplo para probar
INSERT INTO productos (nombre, marca, categoria, precio, imagen, descripcion) VALUES
('212 Men Carolina Herrera', 'Carolina Herrera', 'para-ellos', 89000, 'LOCIONES_PARA _ELLOS/212_CAROLINA_HERRERA.png', 'Fragancia fresca y urbana para el hombre moderno'),
('Versace Eros Blue', 'Versace', 'para-ellos', 120000, 'LOCIONES_PARA _ELLOS/VERSACE_EROS_BLUE.png', 'Frescura mediterránea con notas aromáticas'),
('One Million Paco Rabanne', 'Paco Rabanne', 'para-ellos', 110000, 'LOCIONES_PARA _ELLOS/ONE_MILLON_PACO_RABANE.png', 'El aroma del éxito y la seducción')
ON CONFLICT DO NOTHING;

-- 5. Verificar que los productos se insertaron
SELECT id, nombre, marca, categoria, precio FROM productos LIMIT 5;
