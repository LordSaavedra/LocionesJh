-- 🔍 COMANDOS BÁSICOS PARA VER TUS QRs
-- Usa estos comandos uno por uno en Supabase

-- 1. Contar cuántos QRs tienes
SELECT COUNT(*) as total_qrs FROM qr_codes;

-- 2. Ver TODOS los QRs (sin LIMIT)
SELECT * FROM qr_codes;

-- 3. Ver todas las tablas que tienes
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 4. Ver si tienes datos en productos
SELECT COUNT(*) as total_productos FROM productos;
SELECT nombre, marca FROM productos LIMIT 5;

-- 5. Verificar permisos (por si acaso)
SELECT 
    schemaname,
    tablename,
    tableowner 
FROM pg_tables 
WHERE tablename IN ('qr_codes', 'productos', 'qr_scans');

-- 6. Ver estructura completa de qr_codes
\d qr_codes

-- 7. Si el anterior no funciona, usa este:
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;
