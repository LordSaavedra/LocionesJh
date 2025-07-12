-- Verificar y crear tablas para la perfumería
-- Ejecuta este SQL en tu panel de Supabase

-- 1. Verificar si las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('productos', 'categorias', 'marcas');

-- 2. Crear tabla de marcas
DROP TABLE IF EXISTS marcas CASCADE;
CREATE TABLE marcas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de categorías
DROP TABLE IF EXISTS categorias CASCADE;
CREATE TABLE categorias (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de productos
DROP TABLE IF EXISTS productos CASCADE;
CREATE TABLE productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    descripcion TEXT,
    marca VARCHAR(255),
    categoria VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    imagen VARCHAR(500),
    disponible BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insertar categorías básicas
INSERT INTO categorias (nombre, slug, descripcion) VALUES
('Para Ellos', 'para-ellos', 'Fragancias masculinas'),
('Para Ellas', 'para-ellas', 'Fragancias femeninas'),
('Unisex', 'unisex', 'Fragancias para todos'),
('Clásicas', 'clasicas', 'Fragancias clásicas y atemporales'),
('Vintage', 'vintage', 'Fragancias vintage y de colección')
ON CONFLICT (slug) DO NOTHING;

-- 6. Insertar marcas básicas
INSERT INTO marcas (nombre, descripcion) VALUES
('Chanel', 'Lujo y elegancia francesa'),
('Dior', 'Sofisticación parisina'),
('Tom Ford', 'Lujo contemporáneo'),
('Versace', 'Glamour italiano'),
('Paco Rabanne', 'Innovación y modernidad'),
('Carolina Herrera', 'Elegancia neoyorquina'),
('Givenchy', 'Alta costura francesa'),
('Montblanc', 'Tradición y calidad'),
('Guerlain', 'Historia y perfección')
ON CONFLICT (nombre) DO NOTHING;

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas de acceso público
DROP POLICY IF EXISTS "allow_public_read_marcas" ON marcas;
CREATE POLICY "allow_public_read_marcas" ON marcas FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_read_categorias" ON categorias;
CREATE POLICY "allow_public_read_categorias" ON categorias FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_read_productos" ON productos;
CREATE POLICY "allow_public_read_productos" ON productos FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_productos" ON productos;
CREATE POLICY "allow_public_insert_productos" ON productos FOR INSERT WITH CHECK (true);

-- 9. Crear índices
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca);
CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos(precio);

-- 10. Verificar que las tablas se crearon
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('productos', 'categorias', 'marcas');

-- 11. Insertar algunos productos de prueba
INSERT INTO productos (nombre, marca, categoria, precio, imagen, descripcion) VALUES
('212 Men', 'Carolina Herrera', 'para-ellos', 89000, 'LOCIONES_PARA _ELLOS/212_CAROLINA_HERRERA.png', 'Fragancia fresca y urbana para el hombre moderno'),
('Versace Eros Blue', 'Versace', 'para-ellos', 120000, 'LOCIONES_PARA _ELLOS/VERSACE_EROS_BLUE.png', 'Frescura mediterránea con notas aromáticas'),
('One Million', 'Paco Rabanne', 'para-ellos', 110000, 'LOCIONES_PARA _ELLOS/ONE_MILLON_PACO_RABANE.png', 'El aroma del éxito y la seducción'),
('Montblanc Legend Night', 'Montblanc', 'para-ellos', 95000, 'LOCIONES_PARA _ELLOS/MONTBLACK_LEGEND_NIGH.png', 'Elegancia nocturna y sofisticación'),
('Givenchy Blue Label', 'Givenchy', 'para-ellos', 85000, 'LOCIONES_PARA _ELLOS/GIVENCHY_BLUE_LABEL.png', 'Frescura azul con carácter masculino')
ON CONFLICT DO NOTHING;
