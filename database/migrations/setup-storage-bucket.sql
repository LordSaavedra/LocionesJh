-- Script para crear el bucket de imágenes en Supabase Storage
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear el bucket para imágenes (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes', 'imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear política para permitir INSERT (subir archivos)
CREATE POLICY "Allow authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'imagenes' 
  AND auth.role() = 'authenticated'
);

-- 3. Crear política para permitir SELECT (leer archivos públicos)
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'imagenes');

-- 4. Crear política para permitir DELETE (eliminar archivos)
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'imagenes' 
  AND auth.role() = 'authenticated'
);

-- 5. Crear política para permitir UPDATE (actualizar archivos)
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'imagenes' 
  AND auth.role() = 'authenticated'
);

-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE id = 'imagenes';
