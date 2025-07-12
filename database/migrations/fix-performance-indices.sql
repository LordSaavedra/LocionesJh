-- Script para optimizar performance de la tabla productos
-- Aromes De Dieu - Corrección de Timeout

-- Crear índices para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_productos_activo_created_at ON productos(activo, created_at DESC);

-- Índice compuesto para la consulta principal (activo=true ordenado por fecha)
CREATE INDEX IF NOT EXISTS idx_productos_main_query ON productos(activo, created_at DESC) WHERE activo = true;

-- Índices para búsquedas de texto
CREATE INDEX IF NOT EXISTS idx_productos_nombre_text ON productos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_productos_descripcion_text ON productos USING gin(to_tsvector('spanish', descripcion));
CREATE INDEX IF NOT EXISTS idx_productos_marca_text ON productos USING gin(to_tsvector('spanish', marca));

-- Verificar estadísticas de la tabla
ANALYZE productos;

-- Mostrar información de índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'productos' 
ORDER BY indexname;

-- Mostrar estadísticas de uso de la tabla
SELECT 
    schemaname,
    relname as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname = 'productos';
