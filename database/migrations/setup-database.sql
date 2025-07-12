-- SQL para configurar la base de datos de tu perfumería
-- Ejecuta este script en tu panel de Supabase: https://xelobsbzytdxrrxgmlta.supabase.co

-- 1. Crear tabla de marcas
CREATE TABLE IF NOT EXISTS marcas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    descripcion_corta VARCHAR(500),
    marca_id BIGINT REFERENCES marcas(id),
    categoria_id BIGINT REFERENCES categorias(id),
    precio DECIMAL(10,2) NOT NULL,
    imagen_principal VARCHAR(500),
    notas_salida TEXT[],
    notas_corazon TEXT[],
    notas_fondo TEXT[],
    stock INTEGER DEFAULT 0,
    disponible BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos(precio);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_disponible ON productos(disponible);

-- 5. Insertar categorías iniciales
INSERT INTO categorias (nombre, slug, descripcion) VALUES
('Para Ellos', 'para-ellos', 'Fragancias masculinas elegantes y sofisticadas'),
('Para Ellas', 'para-ellas', 'Fragancias femeninas delicadas y envolventes'),
('Unisex', 'unisex', 'Fragancias para todas las personas'),
('Clásicas', 'clasicas', 'Fragancias atemporales y tradicionales'),
('Exclusivas', 'exclusivas', 'Fragancias de lujo y edición limitada'),
('Vintage', 'vintage', 'Fragancias con historia y tradición')
ON CONFLICT (slug) DO NOTHING;

-- 6. Insertar marcas iniciales
INSERT INTO marcas (nombre, descripcion) VALUES
('Carolina Herrera', 'Elegancia y sofisticación neoyorquina'),
('Givenchy', 'Lujo francés y haute couture'),
('Montblanc', 'Tradición alemana y craftsmanship'),
('Paco Rabanne', 'Innovación y audacia española'),
('Versace', 'Glamour y pasión italiana'),
('Chanel', 'Icono francés de elegancia atemporal'),
('Dior', 'Lujo y refinamiento parisino'),
('Tom Ford', 'Sensualidad y modernidad americana')
ON CONFLICT (nombre) DO NOTHING;

-- 7. Habilitar Row Level Security (RLS) para mayor seguridad
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas de acceso público para lectura
DROP POLICY IF EXISTS "Permitir lectura pública de marcas" ON marcas;
CREATE POLICY "Permitir lectura pública de marcas" ON marcas
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura pública de categorías" ON categorias;
CREATE POLICY "Permitir lectura pública de categorías" ON categorias
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON productos;
CREATE POLICY "Permitir lectura pública de productos" ON productos
    FOR SELECT USING (activo = true);

-- 9. Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Trigger para actualizar automáticamente el campo updated_at
DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at 
    BEFORE UPDATE ON productos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ✅ ¡Base de datos configurada correctamente!
-- Ahora puedes migrar tus productos usando el script de migración.
