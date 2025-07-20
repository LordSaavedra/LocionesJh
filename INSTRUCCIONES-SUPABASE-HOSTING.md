# 🏠 HOSTING EN SUPABASE - PASOS ESPECÍFICOS PARA TU PROYECTO

## 🎯 OPCIÓN RECOMENDADA: SUPABASE STORAGE

### PASO 1: OBTENER SERVICE ROLE KEY (2 minutos)

1. Ve a tu **Supabase Dashboard**: https://app.supabase.com/project/xelobsbzytdxrrxgmlta
2. Navega a **Settings → API**
3. Copia tu **service_role key** (NO la anon key)
4. Pégala en el archivo `deploy-to-supabase.js` línea 12

### PASO 2: INSTALAR DEPENDENCIAS (1 minuto)

```bash
# En tu carpeta PaginaLociones, ejecuta:
cd "c:\Users\crist\OneDrive\Escritorio\PaginaLociones"
npm init -y
npm install @supabase/supabase-js
```

### PASO 3: EJECUTAR DEPLOY (1 minuto)

```bash
node deploy-to-supabase.js
```

### PASO 4: CONFIGURAR CORS (30 segundos)

1. Dashboard → **Settings → API**
2. En **CORS Origins**, agrega:
   ```
   https://xelobsbzytdxrrxgmlta.supabase.co
   ```

### PASO 5: CONFIGURAR POLÍTICAS DE STORAGE

En tu **SQL Editor** de Supabase, ejecuta:

```sql
-- Crear bucket público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('website', 'website', true)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública
CREATE POLICY "Public read access for website" ON storage.objects
FOR SELECT USING (bucket_id = 'website');

-- Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

---

## 🌐 URLS FINALES DE TU SITIO

Después del deploy, tu sitio estará disponible en:

### 📱 URLs Públicas:
```
🏠 Página Principal:
https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/website/index.html

👥 Para Ellas:
https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/website/para-ellas.html

👨 Para Ellos:
https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/website/para-ellos.html

🔧 Admin Panel:
https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/website/admin.html
```

### 🎨 Assets:
```
CSS: /storage/v1/object/public/website/css/style.css
JS:  /storage/v1/object/public/website/js/admin-panel-mejorado.js
IMG: /storage/v1/object/public/website/IMAGENES/perfume1.jpg
```

---

## 🚀 ALTERNATIVA MÁS SIMPLE: MANUAL

Si prefieres hacerlo manual (sin script):

### Paso 1: Crear Bucket
1. Dashboard → **Storage**
2. **Create bucket** → Nombre: `website` → Public: ✅

### Paso 2: Subir Archivos
1. **Upload files** en el bucket `website`
2. Sube estos archivos clave:
   - `index.html`
   - `admin-panel-estructura-mejorada.html` (renombrar a `admin.html`)
   - Carpeta `css/` completa
   - Carpeta `js/` completa
   - Carpeta `html/` completa
   - Carpeta `IMAGENES/` completa

### Paso 3: Configurar URLs
Actualiza rutas en tus archivos HTML para usar URLs absolutas de Supabase.

---

## 🔧 CONFIGURACIÓN POST-DEPLOY

### 1. Actualizar CORS en Supabase:
```
Dashboard → Settings → API → CORS Origins:
https://xelobsbzytdxrrxgmlta.supabase.co
```

### 2. Verificar Funcionalidad:
- ✅ Página principal carga
- ✅ Admin panel accesible
- ✅ Base de datos conecta
- ✅ QR system funciona
- ✅ Imágenes se ven

### 3. Optimizar URLs (Opcional):
Crear un dominio personalizado que redirija a las URLs de Supabase Storage.

---

## 🆘 TROUBLESHOOTING

### Error: "Bucket not found"
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('website', 'website', true);
```

### Error: "Access denied"
```sql
CREATE POLICY "Public access" ON storage.objects
FOR SELECT USING (bucket_id = 'website');
```

### CSS/JS no cargan
- Verifica que las rutas sean correctas
- Confirma que los archivos se subieron

### Admin panel no funciona
- Verifica que `admin-panel-mejorado.js` se subió
- Confirma configuración de Supabase

---

## ✅ CHECKLIST FINAL

Después del deploy:
- [ ] Sitio principal carga sin errores
- [ ] CSS y JS funcionan correctamente
- [ ] Admin panel es accesible
- [ ] Base de datos conecta
- [ ] QR generator funciona
- [ ] Imágenes se muestran
- [ ] CORS configurado
- [ ] Políticas de storage activas

---

## 💡 VENTAJAS DE ESTA SOLUCIÓN

✅ **Todo en Supabase**: Base de datos + Frontend  
✅ **URLs directas**: Sin configuración adicional  
✅ **SSL incluido**: HTTPS automático  
✅ **Sin costo extra**: Incluido en tu plan Supabase  
✅ **Backup automático**: Tus archivos están respaldados  

## ❌ DESVENTAJAS

❌ **URLs largas**: No tan limpias como un dominio personalizado  
❌ **Sin CDN**: Puede ser más lento que Vercel/Netlify  
❌ **Sin optimización**: No comprime automáticamente archivos  

---

¿Quieres que te ayude a ejecutar alguno de estos pasos específicamente?
