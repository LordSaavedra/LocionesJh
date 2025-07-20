# 🚀 GUÍA COMPLETA DE DESPLIEGUE - AROMES DE DIEU

## 📋 PREPARACIÓN PREVIA

### 1. Estructura del Proyecto
Tu proyecto debe tener esta estructura para despliegue:
```
/
├── index.html (página principal)
├── css/
│   ├── style.css
│   ├── admin-panel.css
│   └── ...
├── js/
│   ├── admin-panel-mejorado.js
│   ├── supabase-config-optimized.js
│   └── ...
├── html/
│   ├── admin-panel.html
│   ├── para_ellas.html
│   └── ...
├── IMAGENES/
└── assets/
```

### 2. Verificar Configuración de Supabase
Asegúrate que tu archivo `supabase-config-optimized.js` tenga:
- ✅ URL correcta de Supabase
- ✅ API Key pública (no la secreta)
- ✅ Configuraciones de seguridad

### 3. Archivos Necesarios para Despliegue
- ✅ `index.html` como página principal
- ✅ Todas las rutas relativas correctas
- ✅ Imágenes optimizadas
- ✅ CSS minificado (opcional)

---

## 🌐 OPCIÓN 1: DESPLIEGUE EN SUPABASE

### Paso 1: Subir a GitHub
```bash
# En tu terminal
git add .
git commit -m "Preparar para despliegue"
git push origin main
```

### Paso 2: Configurar Supabase Edge Functions (Hosting)
1. Ve a tu dashboard de Supabase
2. Navega a "Edge Functions" o "Storage"
3. Sigue las instrucciones para subir archivos estáticos

### Paso 3: Configurar Dominio
- Supabase te dará una URL como: `https://tuproyecto.supabase.co`
- Puedes configurar un dominio personalizado

---

## 🚀 OPCIÓN 2: DESPLIEGUE EN VERCEL (MÁS FÁCIL)

### Paso 1: Crear cuenta en Vercel
- Ve a vercel.com
- Conecta tu cuenta de GitHub

### Paso 2: Importar Proyecto
- Click "New Project"
- Selecciona tu repositorio
- Vercel detectará automáticamente que es un sitio estático

### Paso 3: Configurar Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_publica
```

### Paso 4: Deploy
- Click "Deploy"
- ¡Listo! Tu sitio estará en `https://tu-proyecto.vercel.app`

---

## 📱 OPCIÓN 3: NETLIFY (TAMBIÉN MUY FÁCIL)

### Método 1: Drag & Drop
1. Ve a netlify.com
2. Arrastra tu carpeta del proyecto
3. ¡Desplegado!

### Método 2: Git Integration
1. Conecta tu GitHub
2. Selecciona repositorio
3. Configura build settings:
   - Build command: (vacío para sitio estático)
   - Publish directory: `/`

---

## 🛠️ CONFIGURACIONES NECESARIAS

### 1. Archivo de Configuración (.env o config)
```javascript
// supabase-config-optimized.js
const SUPABASE_CONFIG = {
    url: 'https://tu-proyecto.supabase.co',
    anonKey: 'tu_clave_publica_aqui'
};
```

### 2. Verificar Rutas
Todas las rutas deben ser relativas:
```html
<!-- ✅ Correcto -->
<link rel="stylesheet" href="./css/style.css">
<script src="./js/app.js"></script>

<!-- ❌ Incorrecto -->
<link rel="stylesheet" href="/css/style.css">
```

### 3. Configurar CORS en Supabase
En tu dashboard de Supabase:
1. Ve a Settings → API
2. Agrega tu dominio a "CORS origins"
3. Ejemplo: `https://tu-proyecto.vercel.app`

---

## 🔒 SEGURIDAD Y OPTIMIZACIÓN

### 1. Environment Variables
- Nunca expongas claves secretas
- Usa solo la clave pública de Supabase
- Configura Row Level Security (RLS)

### 2. Optimización
```bash
# Minificar CSS (opcional)
# Comprimir imágenes
# Verificar performance
```

### 3. Row Level Security en Supabase
```sql
-- Ejemplo para tabla productos
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública
CREATE POLICY "Public read access" ON productos
FOR SELECT USING (true);

-- Solo admin puede escribir
CREATE POLICY "Admin write access" ON productos
FOR ALL USING (auth.role() = 'admin');
```

---

## ✅ CHECKLIST PRE-DESPLIEGUE

### Archivos y Estructura
- [ ] `index.html` existe y funciona
- [ ] Todas las rutas son relativas
- [ ] CSS y JS cargando correctamente
- [ ] Imágenes optimizadas

### Configuración
- [ ] Supabase URL y Key configurados
- [ ] CORS configurado en Supabase
- [ ] Variables de entorno definidas
- [ ] RLS configurado (opcional)

### Testing
- [ ] Sitio funciona localmente
- [ ] Admin panel accesible
- [ ] QR generator funciona
- [ ] Base de datos conecta

### Post-Despliegue
- [ ] Dominio personalizado (opcional)
- [ ] Analytics configurado
- [ ] Backups automáticos
- [ ] SSL activo

---

## 🆘 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Failed to fetch"
- Verifica CORS en Supabase
- Confirma URLs correctas

### CSS/JS no cargan
- Revisa rutas relativas
- Verifica nombres de archivos

### Base de datos no conecta
- Verifica credenciales Supabase
- Confirma RLS settings

### Admin panel no funciona
- Verifica que admin-panel-mejorado.js carga
- Confirma permisos de escritura

---

## 📞 PASOS SIGUIENTES

1. **Elige tu plataforma** (recomiendo Vercel para empezar)
2. **Prepara archivos** según checklist
3. **Sube a GitHub** si no lo has hecho
4. **Configura despliegue**
5. **Prueba todo** en producción
6. **Configura dominio** personalizado (opcional)

¿Con cuál plataforma quieres que te ayude específicamente?
