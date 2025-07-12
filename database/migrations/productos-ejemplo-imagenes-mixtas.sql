-- Script para insertar productos de ejemplo con diferentes tipos de imágenes
-- Ejecutar en Supabase SQL Editor

-- 1. PRODUCTOS CON IMÁGENES LOCALES (ya existentes)
-- Actualizar productos existentes con rutas locales correctas
UPDATE productos 
SET imagen_url = CASE
    WHEN nombre ILIKE '%212%' AND marca ILIKE '%carolina%herrera%' THEN 'LOCIONES_PARA _ELLOS/212_CAROLINA_HERRERA.png'
    WHEN marca ILIKE '%versace%' AND nombre ILIKE '%eros%blue%' THEN 'LOCIONES_PARA _ELLOS/VERSACE_EROS_BLUE.png'
    WHEN nombre ILIKE '%one million%' AND marca ILIKE '%paco%rabanne%' THEN 'LOCIONES_PARA _ELLOS/ONE_MILLON_PACO_RABANE.png'
    WHEN marca ILIKE '%montblanc%' AND nombre ILIKE '%legend%night%' THEN 'LOCIONES_PARA _ELLOS/MONTBLACK_LEGEND_NIGH.png'
    WHEN marca ILIKE '%givenchy%' AND nombre ILIKE '%blue%label%' THEN 'LOCIONES_PARA _ELLOS/GIVENCHY_BLUE_LABEL.png'
    ELSE imagen_url
END,
categoria = 'para-ellos'
WHERE categoria IN ('para-ellos', 'para ellos');

-- 2. INSERTAR PRODUCTOS DE EJEMPLO CON URLs EXTERNAS
-- Estos productos usarán imágenes de internet para probar URLs externas
INSERT INTO productos (nombre, marca, categoria, precio, imagen_url, descripcion, activo) VALUES
('Hugo Boss The Scent', 'Hugo Boss', 'para-ellos', 95000, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&h=400&fit=crop', 'Fragancia magnética y seductora', true),
('Armani Code', 'Giorgio Armani', 'para-ellos', 105000, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&h=400&fit=crop', 'Elegancia italiana en una botella', true),
('Dior Sauvage', 'Christian Dior', 'para-ellos', 115000, 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=300&h=400&fit=crop', 'Frescura salvaje y natural', true)
ON CONFLICT DO NOTHING;

-- 3. INSERTAR PRODUCTOS CON IMÁGENES BASE64 (ejemplo pequeño)
-- Nota: En producción, evita base64 para imágenes grandes
INSERT INTO productos (nombre, marca, categoria, precio, imagen_url, descripcion, activo) VALUES
('Producto Demo Base64', 'Demo Brand', 'para-ellos', 50000, 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMzAwIDQwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiM2NzRlYTciLz48dGV4dCB4PSIxNTAiIHk9IjIwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCI+REVNTIBCQEJTQVNFNJQ8L3RleHQ+PC9zdmc+', 'Producto de demostración con imagen base64', true)
ON CONFLICT DO NOTHING;

-- 4. VERIFICAR TODOS LOS TIPOS DE IMAGEN
SELECT 
    id,
    nombre,
    marca,
    categoria,
    precio,
    imagen_url,
    CASE 
        WHEN imagen_url IS NULL OR imagen_url = '' THEN '❌ Sin imagen'
        WHEN imagen_url LIKE 'http%' THEN '🌐 URL externa'
        WHEN imagen_url LIKE 'data:image%' THEN '📄 Base64'
        ELSE '📂 Imagen local'
    END as tipo_imagen,
    CASE 
        WHEN activo = true THEN '✅ Activo'
        WHEN activo = false THEN '❌ Inactivo'
        ELSE '⚠️ Sin estado'
    END as estado
FROM productos 
WHERE categoria = 'para-ellos'
ORDER BY 
    CASE 
        WHEN imagen_url LIKE 'http%' THEN 1
        WHEN imagen_url LIKE 'data:image%' THEN 2
        WHEN imagen_url IS NOT NULL AND imagen_url != '' THEN 3
        ELSE 4
    END,
    nombre;

-- 5. ESTADÍSTICAS POR TIPO DE IMAGEN
SELECT 
    CASE 
        WHEN imagen_url IS NULL OR imagen_url = '' THEN 'Sin imagen'
        WHEN imagen_url LIKE 'http%' THEN 'URL externa'
        WHEN imagen_url LIKE 'data:image%' THEN 'Base64'
        ELSE 'Imagen local'
    END as tipo_imagen,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM productos WHERE categoria = 'para-ellos'), 2) as porcentaje
FROM productos 
WHERE categoria = 'para-ellos'
GROUP BY 
    CASE 
        WHEN imagen_url IS NULL OR imagen_url = '' THEN 'Sin imagen'
        WHEN imagen_url LIKE 'http%' THEN 'URL externa'
        WHEN imagen_url LIKE 'data:image%' THEN 'Base64'
        ELSE 'Imagen local'
    END
ORDER BY cantidad DESC;

-- 6. ASEGURAR QUE TODOS LOS PRODUCTOS ESTÉN ACTIVOS
UPDATE productos 
SET activo = true 
WHERE categoria = 'para-ellos' AND (activo IS NULL OR activo = false);
