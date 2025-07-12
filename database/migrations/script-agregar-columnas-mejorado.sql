-- Script MEJORADO para agregar columnas de estado y descuento a la tabla productos
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- PASO 1: Verificar si la tabla productos existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'productos' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La tabla productos no existe. Créala primero.';
    ELSE
        RAISE NOTICE 'La tabla productos existe, continuando...';
    END IF;
END $$;

-- PASO 2: Agregar columna 'estado' si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'estado' 
                   AND table_schema = 'public') THEN
        
        -- Agregar la columna
        ALTER TABLE public.productos ADD COLUMN estado varchar(20) DEFAULT 'disponible';
        
        -- Agregar constraint para valores válidos
        ALTER TABLE public.productos ADD CONSTRAINT productos_estado_check 
        CHECK (estado IN ('disponible', 'agotado', 'proximo', 'oferta'));
        
        RAISE NOTICE '✅ Columna estado agregada exitosamente con valores permitidos: disponible, agotado, proximo, oferta';
    ELSE
        RAISE NOTICE '⚠️ Columna estado ya existe';
    END IF;
END $$;

-- PASO 3: Agregar columna 'descuento' si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' 
                   AND column_name = 'descuento' 
                   AND table_schema = 'public') THEN
        
        -- Agregar la columna
        ALTER TABLE public.productos ADD COLUMN descuento integer;
        
        -- Agregar constraint para valores válidos (1-99%)
        ALTER TABLE public.productos ADD CONSTRAINT productos_descuento_check 
        CHECK (descuento IS NULL OR (descuento >= 1 AND descuento <= 99));
        
        RAISE NOTICE '✅ Columna descuento agregada exitosamente (valores permitidos: NULL o 1-99)';
    ELSE
        RAISE NOTICE '⚠️ Columna descuento ya existe';
    END IF;
END $$;

-- PASO 4: Actualizar productos existentes para tener estado 'disponible' por defecto
UPDATE public.productos 
SET estado = 'disponible' 
WHERE estado IS NULL;

-- PASO 5: Agregar comentarios a las columnas para documentación
DO $$
BEGIN
    -- Comentario para estado
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'productos' AND column_name = 'estado' AND table_schema = 'public') THEN
        EXECUTE 'COMMENT ON COLUMN public.productos.estado IS ''Estado del producto: disponible, agotado, proximo, oferta''';
    END IF;
    
    -- Comentario para descuento
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'productos' AND column_name = 'descuento' AND table_schema = 'public') THEN
        EXECUTE 'COMMENT ON COLUMN public.productos.descuento IS ''Porcentaje de descuento (1-99), NULL si no tiene descuento''';
    END IF;
END $$;

-- PASO 6: Verificar que las columnas se agregaron correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND table_schema = 'public'
AND column_name IN ('estado', 'descuento')
ORDER BY column_name;

-- PASO 7: Verificar constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'productos' 
AND tc.table_schema = 'public'
AND tc.constraint_name LIKE '%estado%' OR tc.constraint_name LIKE '%descuento%'
ORDER BY tc.constraint_name;

-- PASO 8: Ver algunos registros de ejemplo con las nuevas columnas
SELECT 
    id,
    nombre,
    marca,
    precio,
    categoria,
    estado,
    descuento,
    CASE 
        WHEN estado = 'oferta' AND descuento IS NOT NULL THEN 
            precio - (precio * descuento / 100)
        ELSE precio
    END as precio_final
FROM public.productos 
ORDER BY id 
LIMIT 5;

-- PASO 9: Estadísticas de la tabla actualizada
SELECT 
    COUNT(*) as total_productos,
    COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as disponibles,
    COUNT(CASE WHEN estado = 'oferta' THEN 1 END) as en_oferta,
    COUNT(CASE WHEN estado = 'agotado' THEN 1 END) as agotados,
    COUNT(CASE WHEN descuento IS NOT NULL THEN 1 END) as con_descuento,
    AVG(CASE WHEN descuento IS NOT NULL THEN descuento END) as descuento_promedio
FROM public.productos;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SCRIPT COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '📋 Las columnas estado y descuento han sido agregadas a la tabla productos';
    RAISE NOTICE '🔧 Tu panel de administración ahora debería funcionar sin errores';
    RAISE NOTICE '⚡ Recarga el panel para ver los cambios';
    RAISE NOTICE '';
END $$;
