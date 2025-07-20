-- MIGRACIÓN: Agregar columna orden_display para ordenamiento personalizado
-- Fecha: 2025-01-20
-- Descripción: Permite a los administradores ordenar manualmente los productos

-- Agregar columna orden_display si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'orden_display') THEN
        ALTER TABLE productos ADD COLUMN orden_display INTEGER;
        RAISE NOTICE 'Columna orden_display agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna orden_display ya existe';
    END IF;
END $$;

-- Crear índice para mejorar el rendimiento de las consultas ordenadas
CREATE INDEX IF NOT EXISTS idx_productos_orden_display ON productos(orden_display) WHERE orden_display IS NOT NULL;

-- Crear índice compuesto para ordenamiento híbrido (orden_display + fecha_creacion)
CREATE INDEX IF NOT EXISTS idx_productos_display_order ON productos(orden_display ASC NULLS LAST, created_at DESC);

RAISE NOTICE '✅ Migración completada: Columna orden_display y índices agregados';
