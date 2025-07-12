-- Script SQL para corregir las rutas de imágenes de productos para ellos
-- Ejecutar en Supabase SQL Editor

-- Actualizar rutas de imágenes para que coincidan con los archivos disponibles

-- One Million Paco Rabanne
UPDATE public.productos 
SET imagen_url = 'LOCIONES_PARA _ELLOS/ONE_MILLON_PACO_RABANE.png'
WHERE nombre ILIKE '%one million%' AND nombre ILIKE '%paco%rabanne%'
   OR nombre ILIKE '%one millon%' AND nombre ILIKE '%paco%rabane%';

-- 212 Men Carolina Herrera  
UPDATE public.productos 
SET imagen_url = 'LOCIONES_PARA _ELLOS/212_CAROLINA_HERRERA.png'
WHERE nombre ILIKE '%212%' AND marca ILIKE '%carolina%herrera%';

-- Givenchy Blue Label
UPDATE public.productos 
SET imagen_url = 'LOCIONES_PARA _ELLOS/GIVENCHY_BLUE_LABEL.png'
WHERE marca ILIKE '%givenchy%' AND nombre ILIKE '%blue%label%';

-- Montblanc Legend Night
UPDATE public.productos 
SET imagen_url = 'LOCIONES_PARA _ELLOS/MONTBLACK_LEGEND_NIGH.png'
WHERE marca ILIKE '%montblanc%' AND nombre ILIKE '%legend%night%';

-- Versace Eros Blue
UPDATE public.productos 
SET imagen_url = 'LOCIONES_PARA _ELLOS/VERSACE_EROS_BLUE.png'
WHERE marca ILIKE '%versace%' AND nombre ILIKE '%eros%blue%';

-- Verificar los cambios
SELECT id, nombre, marca, imagen_url 
FROM public.productos 
WHERE categoria = 'para-ellos'
ORDER BY nombre;
