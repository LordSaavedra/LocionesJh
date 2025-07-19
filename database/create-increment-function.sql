-- 🔧 FUNCIÓN SQL: Incrementar contador de escaneos
-- Ejecuta este script en Supabase para crear la función SQL necesaria

-- Crear función para incrementar scan_count
CREATE OR REPLACE FUNCTION increment_scan_count()
RETURNS INTEGER
LANGUAGE SQL
AS $$
  SELECT scan_count + 1;
$$;

-- Comentario para la función
COMMENT ON FUNCTION increment_scan_count() IS 'Función para incrementar el contador de escaneos de QR';

-- Verificar que la función se creó
SELECT 'Función increment_scan_count creada exitosamente' as resultado;
