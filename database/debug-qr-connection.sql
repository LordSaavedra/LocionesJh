-- 🔧 DEBUG: Verificar conexión QRService con Supabase
-- Ejecuta este script en Supabase para verificar estado

-- 1. Ver todas las tablas relacionadas con QR
SELECT 'Tablas QR encontradas:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%qr%' OR table_name = 'qr_codes' OR table_name = 'qr_scans')
ORDER BY table_name;

-- 2. Estructura COMPLETA de qr_codes
SELECT 'Estructura de qr_codes:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- 3. Ver datos actuales
SELECT 'Datos en qr_codes:' as info;
SELECT COUNT(*) as total_registros FROM qr_codes;

-- 4. Mostrar algunas filas si existen
SELECT * FROM qr_codes LIMIT 2;

-- 5. NO INSERTAR - solo mostrar estructura
SELECT 'Análisis completado - revisar nombres de columnas arriba' as resultado;
