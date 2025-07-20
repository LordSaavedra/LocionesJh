# 🏠 HOSTING COMPLETO EN SUPABASE - GUÍA PASO A PASO

## 📋 MÉTODO 1: SUPABASE STORAGE (HOSTING ESTÁTICO)

### Paso 1: Configurar Storage en Supabase
```sql
-- En tu Supabase SQL Editor, ejecuta:

-- Crear bucket público para el sitio web
INSERT INTO storage.buckets (id, name, public) 
VALUES ('website', 'website', true);

-- Política para lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'website');
```

### Paso 2: Estructura de Archivos para Upload
```
Tu proyecto debe organizarse así:
website/
├── index.html
├── css/
│   ├── style.css
│   ├── admin-panel.css
│   └── ...
├── js/
│   ├── admin-panel-mejorado.js
│   ├── supabase-config-optimized.js
│   └── ...
├── html/
│   ├── admin-panel.html (renombrar a admin-panel.html)
│   ├── para_ellas.html
│   └── ...
├── IMAGENES/
└── assets/
```

### Paso 3: Script de Upload Automático
```javascript
// upload-to-supabase.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://xelobsbzytdxrrxgmlta.supabase.co',
  'TU_SERVICE_ROLE_KEY' // ¡No la anon key!
);

async function uploadFolder(folderPath, bucketName) {
  const files = getAllFiles(folderPath);
  
  for (const file of files) {
    const relativePath = path.relative(folderPath, file);
    const fileContent = fs.readFileSync(file);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(relativePath, fileContent, {
        contentType: getContentType(file),
        upsert: true
      });
    
    if (error) {
      console.error(`Error uploading ${relativePath}:`, error);
    } else {
      console.log(`✅ Uploaded: ${relativePath}`);
    }
  }
}

// Ejecutar
uploadFolder('./PaginaLociones', 'website');
```

### Paso 4: URLs de Acceso
```
Tu sitio estará disponible en:
https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/website/index.html

Admin Panel:
https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/website/html/admin-panel.html
```

---

## 🚀 MÉTODO 2: SUPABASE EDGE FUNCTIONS (MÁS PROFESIONAL)

### Paso 1: Instalar Supabase CLI
```bash
npm install -g supabase
# O con Homebrew: brew install supabase/tap/supabase
```

### Paso 2: Inicializar Proyecto
```bash
# En tu carpeta del proyecto
supabase init
supabase login
```

### Paso 3: Crear Edge Function para Hosting
```typescript
// supabase/functions/website/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/website', '') || '/index.html'
  
  try {
    // Servir archivos estáticos desde Storage
    const { data, error } = await supabase.storage
      .from('website')
      .download(path.substring(1)) // Remove leading slash
    
    if (error) {
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }
    
    const contentType = getContentType(path)
    
    return new Response(data, {
      headers: { 
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    return new Response('Error serving file', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const mimeTypes: { [key: string]: string } = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
```

### Paso 4: Deploy Edge Function
```bash
supabase functions deploy website --project-ref xelobsbzytdxrrxgmlta
```

### Paso 5: URL Final
```
Tu sitio estará en:
https://xelobsbzytdxrrxgmlta.supabase.co/functions/v1/website

Admin Panel:
https://xelobsbzytdxrrxgmlta.supabase.co/functions/v1/website/html/admin-panel.html
```

---

## 🎯 MÉTODO 3: SUPABASE + VERCEL (RECOMENDADO)

Este es el más fácil y profesional:

### Paso 1: Conectar GitHub con Vercel
1. Tu código en GitHub
2. Vercel detecta automáticamente el proyecto
3. Variables de entorno apuntan a tu Supabase

### Paso 2: Variables de Entorno en Vercel
```env
NEXT_PUBLIC_SUPABASE_URL=https://xelobsbzytdxrrxgmlta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### Paso 3: Configurar Dominio Personalizado
```
En Vercel Dashboard:
- Settings → Domains
- Agregar: aromes-de-dieu.com
- Configurar DNS

En Supabase Dashboard:
- Settings → API → CORS
- Agregar: https://aromes-de-dieu.com
```

---

## 🛠️ CONFIGURACIÓN NECESARIA PARA TU PROYECTO

### 1. Actualizar rutas en tu proyecto
```html
<!-- En todos tus HTML, cambiar rutas absolutas por relativas -->
<!-- Antes -->
<link rel="stylesheet" href="/css/style.css">

<!-- Después -->
<link rel="stylesheet" href="../css/style.css">
```

### 2. Configurar CORS en Supabase
```
Dashboard → Settings → API → CORS Origins:
- https://tu-proyecto.vercel.app
- https://xelobsbzytdxrrxgmlta.supabase.co
- tu-dominio-personalizado.com
```

### 3. Estructura de URLs final
```
https://tu-sitio.com/                    → index.html
https://tu-sitio.com/html/admin-panel.html → Admin Panel
https://tu-sitio.com/html/para_ellas.html  → Para Ellas
https://tu-sitio.com/html/para_ellos.html  → Para Ellos
```

---

## 🚨 CONSIDERACIONES IMPORTANTES

### Ventajas de cada método:
- **Storage**: Simple, solo archivos estáticos
- **Edge Functions**: Más control, lógica server-side
- **Vercel + Supabase**: Profesional, CDN global, fácil

### Limitaciones de Supabase Storage:
- No procesa server-side code
- URLs largas y poco amigables
- Sin optimización automática

### Mi Recomendación:
**Usa Vercel + Supabase** porque obtienes:
- ✅ URLs limpias
- ✅ CDN global
- ✅ SSL automático
- ✅ Deploy automático
- ✅ Backend en Supabase
- ✅ Zero config

---

## 📋 PASOS INMEDIATOS RECOMENDADOS

1. **RÁPIDO**: Vercel + GitHub (5 minutos)
   - Sube a GitHub
   - Conecta Vercel
   - ¡Listo!

2. **TODO EN SUPABASE**: Edge Functions (15 minutos)
   - Instalar Supabase CLI
   - Crear function
   - Deploy

3. **SOLO ARCHIVOS**: Storage (10 minutos)
   - Crear bucket
   - Subir archivos
   - Configurar políticas

¿Con cuál método quieres que te ayude específicamente? ¿El más rápido (Vercel) o quieres todo en Supabase?
