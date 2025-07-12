-- Script para diagnosticar y corregir los datos de imágenes en productos para ellos
-- Ejecutar en Supabase SQL Editor paso a paso

-- 1. DIAGNÓSTICO: Ver el estado actual de los productos para ellos
SELECT 
    id,
    nombre,
    marca,
    categoria,
    precio,
    imagen,
    imagen_url,
    CASE 
        WHEN imagen_url IS NOT NULL AND imagen_url != '' THEN 'imagen_url disponible'
        WHEN imagen IS NOT NULL AND imagen != '' THEN 'solo imagen disponible'
        ELSE 'sin imagen'
    END as estado_imagen
FROM productos 
WHERE categoria = 'para-ellos' OR categoria = 'para ellos'
ORDER BY nombre;

-- 2. VERIFICAR si hay productos con categoría mal escrita
SELECT DISTINCT categoria FROM productos WHERE categoria LIKE '%para%ellos%' OR categoria LIKE '%ellos%';

-- 3. MIGRAR datos del campo imagen al campo imagen_url si es necesario
UPDATE productos 
SET imagen_url = imagen 
WHERE categoria = 'para-ellos' 
  AND (imagen_url IS NULL OR imagen_url = '') 
  AND imagen IS NOT NULL 
  AND imagen != '';

-- 4. CORREGIR la categoría si hay inconsistencias (cambiar 'para ellos' por 'para-ellos')
UPDATE productos 
SET categoria = 'para-ellos' 
WHERE categoria = 'para ellos';

-- 5. VERIFICAR que las rutas de imagen sean correctas
-- Asegurar que las rutas apunten a los archivos existentes
UPDATE productos 
SET imagen_url = CASE
    WHEN nombre ILIKE '%212%' AND marca ILIKE '%carolina%herrera%' THEN 'LOCIONES_PARA _ELLOS/212_CAROLINA_HERRERA.png'
    WHEN marca ILIKE '%versace%' AND nombre ILIKE '%eros%blue%' THEN 'LOCIONES_PARA _ELLOS/VERSACE_EROS_BLUE.png'
    WHEN nombre ILIKE '%one million%' AND marca ILIKE '%paco%rabanne%' THEN 'LOCIONES_PARA _ELLOS/ONE_MILLON_PACO_RABANE.png'
    WHEN marca ILIKE '%montblanc%' AND nombre ILIKE '%legend%night%' THEN 'LOCIONES_PARA _ELLOS/MONTBLACK_LEGEND_NIGH.png'
    WHEN marca ILIKE '%givenchy%' AND nombre ILIKE '%blue%label%' THEN 'LOCIONES_PARA _ELLOS/GIVENCHY_BLUE_LABEL.png'
    ELSE imagen_url
END
WHERE categoria = 'para-ellos';

-- 6. RESULTADO FINAL: Verificar el estado después de las correcciones
SELECT 
    id,
    nombre,
    marca,
    categoria,
    precio,
    imagen,
    imagen_url,
    CASE 
        WHEN imagen_url IS NOT NULL AND imagen_url != '' THEN '✅ OK'
        ELSE '❌ SIN IMAGEN'
    END as estado
FROM productos 
WHERE categoria = 'para-ellos'
ORDER BY nombre;

-- 7. CONTAR resultados
SELECT 
    COUNT(*) as total_productos,
    COUNT(CASE WHEN imagen_url IS NOT NULL AND imagen_url != '' THEN 1 END) as con_imagen_url,
    COUNT(CASE WHEN imagen_url IS NULL OR imagen_url = '' THEN 1 END) as sin_imagen_url
FROM productos 
WHERE categoria = 'para-ellos';
