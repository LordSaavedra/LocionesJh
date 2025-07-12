-- Script simplificado para crear bucket público de imágenes
-- Para desarrollo sin autenticación

-- 1. Crear el bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes', 'imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política permisiva para desarrollo (SOLO PARA DESARROLLO)
CREATE POLICY "Allow all operations" ON storage.objects
FOR ALL USING (bucket_id = 'imagenes');

-- Verificar que el bucket se creó
SELECT * FROM storage.buckets WHERE id = 'imagenes';
