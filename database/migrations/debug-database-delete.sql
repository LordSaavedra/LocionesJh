-- Script para verificar y solucionar problemas de eliminación en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si RLS está habilitado en la tabla productos
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'productos' AND schemaname = 'public';

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'productos' AND schemaname = 'public';

-- 3. Si RLS está habilitado pero no hay políticas para DELETE, créalas
-- IMPORTANTE: Ejecutar solo si es necesario

-- Deshabilitar RLS temporalmente para pruebas (CUIDADO: Solo para desarrollo)
-- ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;

-- O crear política permisiva para DELETE (opción más segura)
-- CREATE POLICY "Allow all DELETE operations" ON public.productos
-- FOR DELETE USING (true);

-- O crear política específica para DELETE solo para usuarios autenticados
-- CREATE POLICY "Allow DELETE for authenticated users" ON public.productos
-- FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Verificar si hay triggers que puedan estar interfiriendo
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'productos' 
AND event_object_schema = 'public';

-- 5. Probar eliminación directa (para verificar que funciona a nivel SQL)
-- IMPORTANTE: Reemplazar 'ID_DEL_PRODUCTO' con un ID real
-- DELETE FROM public.productos WHERE id = ID_DEL_PRODUCTO;

-- 6. Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar índices y constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'public.productos'::regclass;
