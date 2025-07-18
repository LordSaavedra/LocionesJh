-- MIGRACIÓN COMPLETA: Estructura de Base de Datos para Admin Panel
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-13

-- =============================================
-- 1. CREAR/VERIFICAR TABLA PRODUCTOS COMPLETA
-- =============================================

-- Crear tabla productos con estructura completa si no existe
CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    marca TEXT NOT NULL,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    categoria TEXT NOT NULL CHECK (categoria IN ('para-ellos', 'para-ellas', 'unisex')),
    
    -- Campos adicionales básicos
    subcategoria TEXT,
    descripcion TEXT,
    notas TEXT,
    
    -- Campos de imagen (dual para compatibilidad)
    imagen TEXT,
    imagen_url TEXT,
    
    -- Campos de producto
    ml INTEGER DEFAULT 100 CHECK (ml > 0 AND ml <= 1000),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'agotado', 'proximo', 'oferta')),
    descuento INTEGER CHECK (descuento IS NULL OR (descuento >= 1 AND descuento <= 99)),
    luxury BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    
    -- Campos de sistema
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. AGREGAR COLUMNAS FALTANTES SI NO EXISTEN
-- =============================================

DO $$ 
BEGIN 
    -- Subcategoría
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'subcategoria') THEN
        ALTER TABLE productos ADD COLUMN subcategoria TEXT;
        RAISE NOTICE 'Columna subcategoria agregada';
    END IF;
    
    -- Descripción
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'descripcion') THEN
        ALTER TABLE productos ADD COLUMN descripcion TEXT;
        RAISE NOTICE 'Columna descripcion agregada';
    END IF;
    
    -- Notas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'notas') THEN
        ALTER TABLE productos ADD COLUMN notas TEXT;
        RAISE NOTICE 'Columna notas agregada';
    END IF;
    
    -- Imagen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'imagen') THEN
        ALTER TABLE productos ADD COLUMN imagen TEXT;
        RAISE NOTICE 'Columna imagen agregada';
    END IF;
    
    -- Imagen URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'imagen_url') THEN
        ALTER TABLE productos ADD COLUMN imagen_url TEXT;
        RAISE NOTICE 'Columna imagen_url agregada';
    END IF;
    
    -- ML (tamaño)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'ml') THEN
        ALTER TABLE productos ADD COLUMN ml INTEGER DEFAULT 100 CHECK (ml > 0 AND ml <= 1000);
        RAISE NOTICE 'Columna ml agregada';
    END IF;
    
    -- Stock
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'stock') THEN
        ALTER TABLE productos ADD COLUMN stock INTEGER DEFAULT 0 CHECK (stock >= 0);
        RAISE NOTICE 'Columna stock agregada';
    END IF;
    
    -- Estado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'estado') THEN
        ALTER TABLE productos ADD COLUMN estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'agotado', 'proximo', 'oferta'));
        RAISE NOTICE 'Columna estado agregada';
    END IF;
    
    -- Descuento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'descuento') THEN
        ALTER TABLE productos ADD COLUMN descuento INTEGER CHECK (descuento IS NULL OR (descuento >= 1 AND descuento <= 99));
        RAISE NOTICE 'Columna descuento agregada';
    END IF;
    
    -- Luxury
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'luxury') THEN
        ALTER TABLE productos ADD COLUMN luxury BOOLEAN DEFAULT false;
        RAISE NOTICE 'Columna luxury agregada';
    END IF;
    
    -- Activo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'activo') THEN
        ALTER TABLE productos ADD COLUMN activo BOOLEAN DEFAULT true;
        RAISE NOTICE 'Columna activo agregada';
    END IF;
    
    -- Created at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'created_at') THEN
        ALTER TABLE productos ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Columna created_at agregada';
    END IF;
    
    -- Updated at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'updated_at') THEN
        ALTER TABLE productos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada';
    END IF;
    
END $$;

-- =============================================
-- 3. ACTUALIZAR CONSTRAINTS Y DEFAULTS
-- =============================================

-- Actualizar constraints existentes si es necesario
DO $$
BEGIN
    -- Verificar constraint de categoria
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name LIKE '%categoria%' AND table_name = 'productos') THEN
        ALTER TABLE productos ADD CONSTRAINT productos_categoria_check 
        CHECK (categoria IN ('para-ellos', 'para-ellas', 'unisex'));
    END IF;
    
    -- Verificar constraint de estado
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name LIKE '%estado%' AND table_name = 'productos') THEN
        ALTER TABLE productos ADD CONSTRAINT productos_estado_check 
        CHECK (estado IN ('disponible', 'agotado', 'proximo', 'oferta'));
    END IF;
    
    -- Verificar constraint de descuento
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name LIKE '%descuento%' AND table_name = 'productos') THEN
        ALTER TABLE productos ADD CONSTRAINT productos_descuento_check 
        CHECK (descuento IS NULL OR (descuento >= 1 AND descuento <= 99));
    END IF;
    
    -- Verificar constraint de ml
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name LIKE '%ml%' AND table_name = 'productos') THEN
        ALTER TABLE productos ADD CONSTRAINT productos_ml_check 
        CHECK (ml > 0 AND ml <= 1000);
    END IF;
    
END $$;

-- =============================================
-- 4. CONFIGURAR SEGURIDAD (RLS)
-- =============================================

-- Habilitar Row Level Security
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad si no existen
DO $$
BEGIN
    -- Política de lectura pública
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_productos' AND tablename = 'productos') THEN
        CREATE POLICY public_read_productos ON productos FOR SELECT USING (true);
        RAISE NOTICE 'Política de lectura creada';
    END IF;
    
    -- Política de inserción pública
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_productos' AND tablename = 'productos') THEN
        CREATE POLICY public_insert_productos ON productos FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Política de inserción creada';
    END IF;
    
    -- Política de actualización pública
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_update_productos' AND tablename = 'productos') THEN
        CREATE POLICY public_update_productos ON productos FOR UPDATE USING (true);
        RAISE NOTICE 'Política de actualización creada';
    END IF;
    
    -- Política de eliminación pública
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_delete_productos' AND tablename = 'productos') THEN
        CREATE POLICY public_delete_productos ON productos FOR DELETE USING (true);
        RAISE NOTICE 'Política de eliminación creada';
    END IF;
END $$;

-- =============================================
-- 5. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índice para categoría (búsquedas frecuentes)
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- Índice para activo (filtrado en frontend)
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- Índice para estado (filtros de disponibilidad)
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_productos_categoria_activo ON productos(categoria, activo);

-- Índice para búsquedas de texto
CREATE INDEX IF NOT EXISTS idx_productos_nombre_marca ON productos(nombre, marca);

-- =============================================
-- 6. CREAR TRIGGER PARA updated_at
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. VERIFICAR ESTRUCTURA FINAL
-- =============================================

-- Mostrar estructura completa de la tabla
SELECT 
    column_name as "Campo", 
    data_type as "Tipo",
    CASE 
        WHEN is_nullable = 'YES' THEN 'Sí'
        ELSE 'No'
    END as "Nulo",
    COALESCE(column_default, 'Sin valor') as "Default"
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- Mostrar constraints
SELECT 
    constraint_name as "Constraint",
    constraint_type as "Tipo"
FROM information_schema.table_constraints 
WHERE table_name = 'productos' 
ORDER BY constraint_type;

-- Mostrar índices
SELECT 
    indexname as "Índice",
    indexdef as "Definición"
FROM pg_indexes 
WHERE tablename = 'productos' 
ORDER BY indexname;

-- =============================================
-- 8. DATOS DE EJEMPLO (OPCIONAL)
-- =============================================

-- Insertar productos de ejemplo si la tabla está vacía
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM productos LIMIT 1) THEN
        INSERT INTO productos (
            nombre, marca, precio, categoria, subcategoria, descripcion, notas,
            imagen_url, ml, estado, luxury, activo
        ) VALUES 
        (
            'Ejemplo Fragancia Masculina',
            'Aromes Demo',
            75000,
            'para-ellos',
            'designer',
            'Fragancia de ejemplo para probar el sistema',
            'Bergamota, Cedro, Amaderado',
            'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
            100,
            'disponible',
            false,
            true
        ),
        (
            'Ejemplo Fragancia Femenina',
            'Aromes Demo',
            65000,
            'para-ellas',
            'contemporary',
            'Fragancia femenina de ejemplo',
            'Rosa, Jazmín, Vainilla',
            'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=400&fit=crop',
            50,
            'disponible',
            true,
            true
        );
        
        RAISE NOTICE 'Productos de ejemplo insertados';
    ELSE
        RAISE NOTICE 'La tabla ya contiene datos, no se insertan ejemplos';
    END IF;
END $$;

-- =============================================
-- RESUMEN DE CAMPOS DISPONIBLES
-- =============================================

/*
CAMPOS DISPONIBLES EN LA TABLA PRODUCTOS:

CAMPOS BÁSICOS:
- id (BIGSERIAL, PK)
- nombre (TEXT, NOT NULL)
- marca (TEXT, NOT NULL)  
- precio (NUMERIC, NOT NULL, >= 0)
- categoria (TEXT, NOT NULL, IN: 'para-ellos', 'para-ellas', 'unisex')

CAMPOS ADICIONALES:
- subcategoria (TEXT, NULLABLE)
- descripcion (TEXT, NULLABLE)
- notas (TEXT, NULLABLE)

CAMPOS DE IMAGEN:
- imagen (TEXT, NULLABLE) - Campo legacy
- imagen_url (TEXT, NULLABLE) - Campo principal

CAMPOS DE PRODUCTO:
- ml (INTEGER, DEFAULT 100, CHECK 1-1000)
- estado (TEXT, DEFAULT 'disponible', IN: 'disponible', 'agotado', 'proximo', 'oferta')
- descuento (INTEGER, NULLABLE, CHECK 1-99)
- luxury (BOOLEAN, DEFAULT false)
- activo (BOOLEAN, DEFAULT true)

CAMPOS DE SISTEMA:
- created_at (TIMESTAMPTZ, DEFAULT NOW())
- updated_at (TIMESTAMPTZ, DEFAULT NOW(), AUTO-UPDATE)

SUBCATEGORÍAS DISPONIBLES:
- designer: Marcas de Diseñador
- arabic: Marcas Árabes  
- contemporary: Perfumería Contemporánea
- vintage: Vintage

ESTADOS DISPONIBLES:
- disponible: Producto disponible para compra
- agotado: Producto sin stock
- proximo: Disponible próximamente
- oferta: Producto en oferta (requiere campo descuento)
*/
