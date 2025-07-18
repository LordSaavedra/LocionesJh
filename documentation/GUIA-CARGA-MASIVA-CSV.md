# Guía de Carga Masiva de Productos CSV

## 📋 Descripción General

La funcionalidad de **Carga Masiva CSV** permite importar múltiples productos simultáneamente desde un archivo CSV, agilizando significativamente el proceso de gestión del inventario. Esta herramienta puede procesar hasta **1000 productos** por archivo y incluye validación automática, vista previa de datos, y reportes detallados.

## 🚀 Características Principales

### ✅ Capacidades
- **Carga masiva**: Hasta 1000 productos por archivo
- **Validación automática**: Verificación de campos requeridos y formatos
- **Vista previa**: Muestra los primeros 5 registros antes de la carga
- **Procesamiento por lotes**: Configurable (10, 25, 50, 100 productos por lote)
- **Drag & Drop**: Arrastra archivos directamente al área de carga
- **Progreso en tiempo real**: Estadísticas y barra de progreso
- **Manejo de errores**: Continúa procesando aunque haya errores individuales
- **Actualización de existentes**: Opción para actualizar productos duplicados
- **Validación de imágenes**: Verificación opcional de URLs de imágenes
- **Reportes detallados**: Descarga de reportes de carga completos

### 🎨 Interfaz Elegante
- **Paleta de colores**: Champagne, Rosey, Gris, Carbon
- **Animaciones suaves**: Transiciones y efectos visuales
- **Diseño responsivo**: Funciona en desktop, tablet y móvil
- **Indicadores visuales**: Estados de carga, errores y éxito

## 📁 Formato del Archivo CSV

### Estructura Requerida
El archivo CSV debe tener **exactamente** estas columnas en este orden:

```csv
nombre,marca,precio,categoria,subcategoria,descripcion,notas,imagen_url,ml,stock,estado,descuento,luxury,activo
```

### Descripción de Campos

| Campo | Tipo | Requerido | Descripción | Valores Válidos |
|-------|------|-----------|-------------|-----------------|
| **nombre** | Texto | ✅ Sí | Nombre del producto | Cualquier texto |
| **marca** | Texto | ✅ Sí | Marca del producto | Cualquier texto |
| **precio** | Número | ✅ Sí | Precio en pesos | Número > 0 |
| **categoria** | Texto | ✅ Sí | Categoría principal | `para-ellos`, `para-ellas`, `unisex` |
| **subcategoria** | Texto | ❌ No | Subcategoría del producto | `designer`, `arabic`, `contemporary`, `vintage` |
| **descripcion** | Texto | ❌ No | Descripción del producto | Cualquier texto |
| **notas** | Texto | ❌ No | Notas olfativas | Cualquier texto |
| **imagen_url** | URL | ❌ No | URL de la imagen | URL válida |
| **ml** | Número | ❌ No | Tamaño en mililitros | 1-1000 (default: 100) |
| **stock** | Número | ❌ No | Cantidad disponible | ≥ 0 (default: 0) |
| **estado** | Texto | ❌ No | Estado del producto | `disponible`, `agotado`, `proximo`, `oferta` |
| **descuento** | Número | ❌ No | Porcentaje de descuento | 1-99 (vacío si no hay) |
| **luxury** | Booleano | ❌ No | Producto de lujo | `true`, `false`, `1`, `0` (default: false) |
| **activo** | Booleano | ❌ No | Producto activo | `true`, `false`, `1`, `0` (default: true) |

## 📝 Ejemplo de Archivo CSV

```csv
nombre,marca,precio,categoria,subcategoria,descripcion,notas,imagen_url,ml,stock,estado,descuento,luxury,activo
"Polo Blue","Ralph Lauren","89000","para-ellos","contemporary","Fragancia fresca y marina","Notas acuáticas, melón, mandarina","https://example.com/polo-blue.jpg","125","15","disponible","","false","true"
"Black Opium","Yves Saint Laurent","165000","para-ellas","designer","Perfume oriental y seductor","Café negro, vainilla, flor de naranja","https://example.com/black-opium.jpg","90","8","disponible","15","true","true"
"Aventus","Creed","285000","para-ellos","designer","Fragancia sofisticada y única","Piña, abedul, pachulí, vainilla","https://example.com/aventus.jpg","100","5","disponible","","true","true"
```

## 🔧 Proceso de Carga Paso a Paso

### 1. Preparación del Archivo
1. Crea tu archivo CSV con la estructura correcta
2. Asegúrate de que la primera fila contenga los nombres de las columnas
3. Verifica que no supere los 5MB de tamaño
4. Máximo 1000 productos por archivo

### 2. Acceso a la Funcionalidad
1. Accede al **Panel de Administración**
2. Haz clic en **"Carga Masiva CSV"** en el menú lateral
3. Se abrirá la interfaz de carga masiva

### 3. Carga del Archivo
**Opción A - Drag & Drop:**
- Arrastra tu archivo CSV al área de carga
- El archivo se procesará automáticamente

**Opción B - Selección Manual:**
- Haz clic en "Seleccionar Archivo"
- Elige tu archivo CSV desde el explorador

### 4. Configuración
Configura las opciones según tus necesidades:
- **Saltar filas con errores**: Continúa aunque haya errores
- **Actualizar productos existentes**: Sobrescribe productos duplicados
- **Validar URLs de imágenes**: Verifica que las imágenes sean accesibles
- **Tamaño de lote**: Productos a procesar simultáneamente

### 5. Vista Previa y Validación
1. Revisa la vista previa de los primeros 5 productos
2. Haz clic en "Validar Datos" para verificar todo el archivo
3. Revisa cualquier error de validación mostrado
4. Corrige errores en tu archivo CSV si es necesario

### 6. Iniciar Carga
1. Haz clic en "Iniciar Carga Masiva"
2. Observa el progreso en tiempo real
3. Puedes pausar o cancelar el proceso si es necesario

### 7. Revisión de Resultados
1. Revisa las estadísticas finales
2. Descarga el reporte detallado si lo necesitas
3. Haz clic en "Nueva Carga" para procesar otro archivo

## ⚠️ Consideraciones Importantes

### Limitaciones
- **Tamaño máximo**: 5MB por archivo
- **Cantidad máxima**: 1000 productos por archivo
- **Formato soportado**: Solo archivos .csv
- **Encoding**: UTF-8 recomendado

### Recomendaciones
- **Prueba pequeña**: Primero prueba con 5-10 productos
- **Backup**: Siempre haz respaldo de tu base de datos antes de cargas masivas
- **Internet estable**: Asegúrate de tener conexión estable durante la carga
- **URLs de imágenes**: Verifica que las URLs sean accesibles públicamente

### Manejo de Errores
- **Errores de validación**: Se muestran antes de la carga
- **Errores de carga**: El sistema continúa con los siguientes productos
- **Productos duplicados**: Se actualizan si está habilitada la opción
- **Reporte detallado**: Descargable al finalizar el proceso

## 📊 Estadísticas y Reportes

### Información en Tiempo Real
- **Productos procesados**: Cantidad exitosamente cargada
- **Errores**: Cantidad de productos con problemas
- **Tiempo transcurrido**: Duración del proceso
- **Progreso**: Porcentaje completado

### Reporte Descargable
El reporte incluye:
- Timestamp del proceso
- Estadísticas completas
- Lista de productos válidos procesados
- Detalle de errores encontrados
- Configuración utilizada

## 🛠️ Solución de Problemas

### Errores Comunes

**"Faltan columnas requeridas"**
- Verifica que el archivo tenga todas las columnas obligatorias
- Asegúrate de que la primera fila contenga los nombres exactos

**"Archivo demasiado grande"**
- Divide tu archivo en archivos más pequeños (máximo 5MB)
- Usa menos de 1000 productos por archivo

**"Formato de precio inválido"**
- Los precios deben ser números sin símbolos
- Usa punto (.) como separador decimal

**"Categoría inválida"**
- Solo acepta: `para-ellos`, `para-ellas`, `unisex`
- Revisa mayúsculas y minúsculas

**"Error de conexión"**
- Verifica tu conexión a internet
- Intenta nuevamente en unos minutos

### Mejores Prácticas

1. **Plantilla**: Usa siempre la plantilla descargable como base
2. **Validación previa**: Valida datos antes de la carga final
3. **Lotes pequeños**: Para archivos grandes, usa lotes de 25-50 productos
4. **Backup regular**: Respalda la base de datos periódicamente
5. **Pruebas**: Siempre prueba con datos de ejemplo primero

## 🎯 Casos de Uso

### Carga Inicial de Inventario
- Importa todo tu catálogo inicial
- Configura productos masivamente
- Establece precios y stock iniciales

### Actualización de Precios
- Actualiza precios de múltiples productos
- Aplica descuentos masivos
- Modifica información estacional

### Gestión de Stock
- Actualiza inventarios masivamente
- Marca productos como agotados
- Reactiva productos discontinuados

### Nuevas Colecciones
- Agrega líneas completas de productos
- Importa colecciones estacionales
- Carga productos de nuevas marcas

## 🔐 Seguridad

### Validaciones Implementadas
- Verificación de formato de archivo
- Validación de tamaño y cantidad
- Sanitización de datos de entrada
- Verificación de campos requeridos

### Protección de Datos
- No se almacenan archivos CSV en el servidor
- Procesamiento en memoria únicamente
- Limpieza automática de datos temporales
- Logs seguros de operaciones

---

## 📞 Soporte

Si encuentras problemas o necesitas ayuda:
1. Revisa esta documentación completa
2. Verifica los mensajes de error específicos
3. Prueba con la plantilla de ejemplo
4. Contacta al equipo de desarrollo con detalles específicos

**¡La carga masiva CSV está lista para hacer tu gestión de productos mucho más eficiente!** 🚀
