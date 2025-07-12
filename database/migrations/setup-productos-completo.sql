-- Script completo para configurar tabla productos
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla productos si no existe (con estructura completa)
CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    marca TEXT NOT NULL,
    precio NUMERIC NOT NULL,
    categoria TEXT NOT NULL,
    subcategoria TEXT,
    descripcion TEXT,
    notas TEXT,
    imagen TEXT,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agregar columnas que podrían faltar (si la tabla ya existe)
DO $$
BEGIN
    -- Subcategoría
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'subcategoria') THEN
        ALTER TABLE productos ADD COLUMN subcategoria TEXT;
    END IF;
    
    -- Descripción
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'descripcion') THEN
        ALTER TABLE productos ADD COLUMN descripcion TEXT;
    END IF;
    
    -- Notas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'notas') THEN
        ALTER TABLE productos ADD COLUMN notas TEXT;
    END IF;
    
    -- Imagen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'imagen') THEN
        ALTER TABLE productos ADD COLUMN imagen TEXT;
    END IF;
    
    -- Imagen URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'imagen_url') THEN
        ALTER TABLE productos ADD COLUMN imagen_url TEXT;
    END IF;
    
    -- Activo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'activo') THEN
        ALTER TABLE productos ADD COLUMN activo BOOLEAN DEFAULT true;
    END IF;
    
    -- Created at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'created_at') THEN
        ALTER TABLE productos ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Updated at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'updated_at') THEN
        ALTER TABLE productos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Habilitar Row Level Security
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas para acceso público (ajustar según necesidades)
DO $$
BEGIN
    -- Política de lectura pública
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_productos') THEN
        CREATE POLICY public_read_productos ON productos FOR SELECT USING (true);
    END IF;
    
    -- Política de inserción pública (cambiar si quieres restringir)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_productos') THEN
        CREATE POLICY public_insert_productos ON productos FOR INSERT WITH CHECK (true);
    END IF;
    
    -- Política de actualización pública (cambiar si quieres restringir)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_update_productos') THEN
        CREATE POLICY public_update_productos ON productos FOR UPDATE USING (true);
    END IF;
END $$;

-- 5. Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- 6. Insertar datos de prueba si la tabla está vacía
INSERT INTO productos (nombre, marca, precio, categoria, descripcion, imagen_url, activo)
SELECT 'Producto de Prueba', 'Marca Test', 50000, 'para-ellos', 'Producto para verificar funcionamiento', 'https://via.placeholder.com/300x400', true
WHERE NOT EXISTS (SELECT 1 FROM productos LIMIT 1);
