-- 🔧 POLÍTICAS RLS: Configurar acceso a tabla qr_codes
-- Ejecuta este script en Supabase para permitir acceso completo

-- 1. Deshabilitar RLS temporalmente para testing (SOLO PARA DESARROLLO)
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

-- 2. Si quieres habilitar RLS después, usa estas políticas:
/*
-- Habilitar RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Política para leer QRs (público)
CREATE POLICY "Permitir lectura pública de QRs" ON qr_codes
    FOR SELECT USING (true);

-- Política para insertar QRs (público)
CREATE POLICY "Permitir inserción pública de QRs" ON qr_codes
    FOR INSERT WITH CHECK (true);

-- Política para actualizar QRs (público) 
CREATE POLICY "Permitir actualización pública de QRs" ON qr_codes
    FOR UPDATE USING (true);

-- Política para eliminar QRs (público)
CREATE POLICY "Permitir eliminación pública de QRs" ON qr_codes
    FOR DELETE USING (true);
*/

-- 3. Verificar acceso
SELECT 'Políticas RLS configuradas para qr_codes' as resultado;
SELECT COUNT(*) as total_qrs_accesibles FROM qr_codes;