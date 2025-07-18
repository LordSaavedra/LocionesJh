# ANÁLISIS COMPLETO: Estructura de Base de Datos - Admin Panel

**Fecha:** 13 de Enero, 2025  
**Sistema:** Aromes De Dieu - Panel de Administración  
**Estado:** ✅ Completamente documentado

---

## 📋 CAMPOS DE LA BASE DE DATOS

### 🔑 **CAMPOS OBLIGATORIOS**
```sql
id              BIGSERIAL PRIMARY KEY    -- ID único automático
nombre          TEXT NOT NULL           -- Nombre del producto
marca           TEXT NOT NULL           -- Marca del producto  
precio          NUMERIC NOT NULL        -- Precio en pesos colombianos
categoria       TEXT NOT NULL           -- 'para-ellos' | 'para-ellas' | 'unisex'
```

### 📝 **CAMPOS INFORMATIVOS** 
```sql
subcategoria    TEXT                    -- 'designer' | 'arabic' | 'contemporary' | 'vintage'
descripcion     TEXT                    -- Descripción detallada del producto
notas           TEXT                    -- Notas olfativas (ej: "Bergamota, Rosa, Sándalo")
```

### 🖼️ **CAMPOS DE IMAGEN**
```sql
imagen          TEXT                    -- Campo legacy (compatibilidad)
imagen_url      TEXT                    -- Campo principal para URLs de imágenes
```

### 🛍️ **CAMPOS DE PRODUCTO**
```sql
ml              INTEGER DEFAULT 100     -- Tamaño en mililitros (1-1000)
stock           INTEGER DEFAULT 0       -- Cantidad disponible en inventario (≥ 0)
estado          TEXT DEFAULT 'disponible' -- Ver estados disponibles abajo
descuento       INTEGER                 -- Porcentaje de descuento (1-99), NULL si sin descuento
luxury          BOOLEAN DEFAULT false   -- Si es producto de lujo (muestra etiqueta LUXURY)
activo          BOOLEAN DEFAULT true    -- Si está visible en la tienda
```

### ⏰ **CAMPOS DE SISTEMA**
```sql
created_at      TIMESTAMPTZ DEFAULT NOW()    -- Fecha de creación
updated_at      TIMESTAMPTZ DEFAULT NOW()    -- Fecha de última actualización (auto-update)
```

---

## 🎯 VALORES PERMITIDOS

### **Categorías:**
- `para-ellos` - Fragancias masculinas
- `para-ellas` - Fragancias femeninas  
- `unisex` - Fragancias para todos

### **Subcategorías:**
- `designer` - Marcas de Diseñador
- `arabic` - Marcas Árabes
- `contemporary` - Perfumería Contemporánea
- `vintage` - Vintage

### **Estados del Producto:**
- `disponible` - Producto disponible para compra
- `agotado` - Producto sin stock
- `proximo` - Disponible próximamente
- `oferta` - Producto en oferta (requiere campo `descuento`)

---

## 💾 ESTRUCTURA DE DATOS AL CREAR PRODUCTO

### **Objeto JavaScript enviado a Supabase:**
```javascript
const productData = {
    // Campos básicos obligatorios
    nombre: "Nombre del Producto",          // String, requerido
    marca: "Marca del Producto",            // String, requerido  
    precio: 50000,                          // Number, requerido
    categoria: "para-ellos",                // String, requerido
    
    // Campos adicionales
    subcategoria: "designer",               // String opcional
    descripcion: "Descripción del producto", // String opcional
    notas: "Bergamota, Rosa, Sándalo",      // String opcional
    
    // Imagen
    imagen_url: "https://ejemplo.com/img.jpg", // String opcional
    imagen: "https://ejemplo.com/img.jpg",   // String opcional (legacy)
    
    // Configuración del producto
    ml: 100,                                // Number, default 100
    stock: 0,                               // Number, default 0
    estado: "disponible",                   // String, default "disponible"
    descuento: null,                        // Number o null
    luxury: false,                          // Boolean, default false
    activo: true                            // Boolean, default true
};
```

---

## 🔄 FLUJO DE CREACIÓN DE PRODUCTOS

### **1. Formulario HTML → JavaScript**
```javascript
// El formulario HTML captura estos campos:
const formData = new FormData(form);
const nombre = formData.get('nombre');
const marca = formData.get('marca'); 
const precio = parseInt(formData.get('precio'));
const categoria = formData.get('categoria');
const ml = parseInt(formData.get('ml')) || 100;
const stock = parseInt(formData.get('stock')) || 0;
const subcategoria = formData.get('subcategoria') || null;
const descripcion = formData.get('descripcion') || '';
const notas = formData.get('notas') || '';
const estado = formData.get('estado') || 'disponible';
const descuento = parseInt(formData.get('descuento')) || null;
const luxury = formData.get('luxury') === 'on';
const activo = formData.get('activo') === 'on';
const imagen_url = document.getElementById('imagen_url')?.value?.trim();
```

### **2. JavaScript → Supabase**
```javascript
// Se envía a través de ProductosServiceOptimized
await ProductosServiceOptimized.crearProducto(productData);

// Que internamente ejecuta:
const { data, error } = await supabaseClient
    .from('productos')
    .insert([productData])
    .select()
    .single();
```

### **3. Validaciones aplicadas:**
- ✅ Campos obligatorios: nombre, marca, precio, categoria, stock
- ✅ Precio debe ser número positivo
- ✅ ML debe estar entre 1-1000
- ✅ Stock debe ser número no negativo
- ✅ Categoría debe ser válida
- ✅ Estado debe ser válido
- ✅ Descuento debe estar entre 1-99 o ser null
- ✅ URLs de imagen deben ser válidas
- ✅ Optimización automática de URLs de imagen

---

## 🎨 CAMPOS DEL FORMULARIO ADMIN

### **Sección: Información Básica**
- `nombre` - Input text, requerido
- `marca` - Input text, requerido  
- `precio` - Input number, requerido, step=1000
- `ml` - Input number, requerido, default=100
- `stock` - Input number, requerido, default=0

### **Sección: Categorización**
- `categoria` - Select, requerido
- `subcategoria` - Select, opcional

### **Sección: Imagen del Producto**
- `imagen_url` - Input URL, requerido
- Vista previa automática
- Imágenes rápidas predefinidas
- Validación de URL

### **Sección: Descripción y Notas**
- `descripcion` - Textarea, opcional
- `notas` - Textarea, opcional

### **Sección: Estado y Configuración**
- `estado` - Select, default="disponible"
- `descuento` - Input number, opcional (solo visible si estado="oferta")
- `luxury` - Checkbox, default=false
- `activo` - Checkbox, default=true

---

## 🛡️ SEGURIDAD Y POLÍTICAS

### **Row Level Security (RLS):**
- ✅ Habilitado en la tabla productos
- ✅ Políticas públicas para CRUD (ajustables según necesidades)

### **Constraints de base de datos:**
- ✅ Check constraints para categoría, estado, descuento, ml
- ✅ NOT NULL en campos obligatorios  
- ✅ Valores default apropiados

### **Índices para rendimiento:**
- ✅ `idx_productos_categoria` - Para filtros por categoría
- ✅ `idx_productos_activo` - Para productos activos
- ✅ `idx_productos_estado` - Para filtros de disponibilidad
- ✅ `idx_productos_categoria_activo` - Consultas combinadas
- ✅ `idx_productos_nombre_marca` - Búsquedas de texto

---

## 📊 CONSULTAS FRECUENTES

### **Obtener productos por categoría:**
```sql
SELECT * FROM productos 
WHERE categoria = 'para-ellos' 
AND activo = true 
ORDER BY created_at DESC;
```

### **Productos en oferta:**
```sql  
SELECT * FROM productos
WHERE estado = 'oferta'
AND descuento IS NOT NULL
AND activo = true;
```

### **Productos de lujo:**
```sql
SELECT * FROM productos 
WHERE luxury = true 
AND activo = true;
```

### **Productos con stock bajo:**
```sql
SELECT * FROM productos 
WHERE stock <= 5 
AND stock > 0 
AND activo = true 
ORDER BY stock ASC;
```

### **Productos sin stock:**
```sql
SELECT * FROM productos 
WHERE stock = 0 
AND activo = true;
```

### **Estadísticas del dashboard:**
```sql
-- Total productos
SELECT COUNT(*) FROM productos;

-- Productos activos  
SELECT COUNT(*) FROM productos WHERE activo = true;

-- Por categoría
SELECT categoria, COUNT(*) 
FROM productos 
WHERE activo = true 
GROUP BY categoria;
```

---

## 🔧 MANTENIMIENTO

### **Migración requerida:**
Ejecutar: `database/migrations/estructura-completa-admin-panel.sql`

### **Verificación de estructura:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
```

### **Backup recomendado:**
```sql
-- Antes de cualquier migración
CREATE TABLE productos_backup AS SELECT * FROM productos;
```

---

## ✅ ESTADO ACTUAL

| Campo | Estado | Requerido | Funcional |
|-------|--------|-----------|-----------|
| `id` | ✅ Configurado | Sí | ✅ |
| `nombre` | ✅ Configurado | Sí | ✅ |
| `marca` | ✅ Configurado | Sí | ✅ |
| `precio` | ✅ Configurado | Sí | ✅ |
| `categoria` | ✅ Configurado | Sí | ✅ |
| `subcategoria` | ✅ Configurado | No | ✅ |
| `descripcion` | ✅ Configurado | No | ✅ |
| `notas` | ✅ Configurado | No | ✅ |
| `imagen` | ✅ Configurado | No | ✅ |
| `imagen_url` | ✅ Configurado | No | ✅ |
| `ml` | ⚠️ **Verificar** | No | ⚠️ |
| `stock` | ✅ **Agregado** | Sí | ✅ |
| `estado` | ⚠️ **Verificar** | No | ⚠️ |
| `descuento` | ⚠️ **Verificar** | No | ⚠️ |
| `luxury` | ⚠️ **Verificar** | No | ⚠️ |
| `activo` | ✅ Configurado | No | ✅ |
| `created_at` | ✅ Configurado | No | ✅ |
| `updated_at` | ✅ Configurado | No | ✅ |

---

## 🚨 RECOMENDACIONES INMEDIATAS

1. **Ejecutar migración SQL** para asegurar todos los campos
2. **Verificar campos faltantes** (ml, estado, descuento, luxury)
3. **Probar creación de producto** con todos los campos
4. **Validar constraints** de base de datos
5. **Confirmar políticas RLS** apropiadas

---

**📧 Próximos pasos:** Ejecutar la migración SQL y verificar que todos los campos del admin panel funcionen correctamente.
