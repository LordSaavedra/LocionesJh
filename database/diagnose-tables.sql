-- 🔍 DIAGNÓSTICO: Verificar estructura de tablas QR
-- Ejecuta este script PRIMERO para ver la estructura exacta

-- PASO 1: Ver todas las tablas disponibles
SELECT 'Tablas disponibles en la base de datos:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%qr%' OR table_name LIKE '%product%';

-- PASO 2: Estructura completa de qr_codes
SELECT 'Columnas de la tabla qr_codes:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- PASO 3: Estructura completa de productos  
SELECT 'Columnas de la tabla productos:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- PASO 4: Ver datos reales (si existen)
SELECT 'Muestra de datos de qr_codes:' as info;
SELECT * FROM qr_codes LIMIT 2;

SELECT 'Muestra de datos de productos:' as info;  
SELECT id, nombre, marca FROM productos LIMIT 2;

-- PASO 5: Contar registros
SELECT 'Conteos de registros:' as info;
SELECT 
    (SELECT COUNT(*) FROM qr_codes) as total_qrs,
    (SELECT COUNT(*) FROM productos) as total_productos;
