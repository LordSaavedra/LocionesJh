-- 🔧 FIX: Crear vista QR faltante
-- Este script crea la vista qr_codes_with_product_info que conecta QRs con productos

-- PASO 1: Verificar la estructura de las tablas
SELECT 'Estructura de la tabla qr_codes:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

SELECT 'Estructura de la tabla productos:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- PASO 2: Ver datos de ejemplo
SELECT 'Datos de ejemplo de qr_codes (primeras 3 filas):' as info;
SELECT * FROM qr_codes LIMIT 3;

-- PASO 3: Crear la vista (ajustada según estructura real)
-- Nota: Cambiamos qr_id por id (columna estándar de PK)
CREATE OR REPLACE VIEW qr_codes_with_product_info AS
SELECT 
    qr.id as qr_id,  -- La clave primaria suele ser 'id', no 'qr_id'
    qr.producto_id,
    qr.fecha_creacion,
    qr.numero_escaneos,
    qr.ultimo_escaneo,
    qr.lote,
    qr.fecha_produccion,
    qr.notas,
    qr.activo,
    -- Información del producto
    p.nombre as producto_nombre,
    p.marca as producto_marca,
    p.precio as producto_precio,
    p.categoria as producto_categoria,
    p.subcategoria as producto_subcategoria,
    p.descripcion as producto_descripcion,
    p.imagen_url as producto_imagen,
    p.ml as producto_ml,
    p.stock as producto_stock,
    p.estado as producto_estado,
    p.luxury as producto_luxury,
    -- Campos calculados
    CASE 
        WHEN qr.numero_escaneos > 0 THEN true 
        ELSE false 
    END as fue_escaneado,
    CASE 
        WHEN qr.ultimo_escaneo IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (NOW() - qr.ultimo_escaneo))/86400 
        ELSE NULL 
    END as dias_desde_ultimo_escaneo
FROM qr_codes qr
LEFT JOIN productos p ON qr.producto_id = p.id
WHERE qr.activo = true;

-- Crear índices para mejorar el rendimiento (ajustados a nombres correctos)
CREATE INDEX IF NOT EXISTS idx_qr_codes_producto_id ON qr_codes(producto_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_fecha_creacion ON qr_codes(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_qr_codes_numero_escaneos ON qr_codes(numero_escaneos);

-- Comentarios para documentación
COMMENT ON VIEW qr_codes_with_product_info IS 'Vista que combina información de QRs con datos de productos para fácil consulta';

-- PASO 4: Verificar que la vista se creó correctamente
SELECT 'Vista qr_codes_with_product_info creada exitosamente' as resultado;
SELECT COUNT(*) as total_qrs FROM qr_codes_with_product_info;
