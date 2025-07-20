# 🚀 DEPLOY INMEDIATO - PASOS SIMPLES

## MÉTODO MÁS RÁPIDO: NETLIFY DROP & DRAG

### Paso 1: Preparar (1 minuto)
1. Abre tu carpeta `PaginaLociones`
2. Asegúrate que `index.html` está en la raíz ✅ (ya lo tienes)

### Paso 2: Deploy (30 segundos)
1. Ve a https://app.netlify.com/drop
2. Arrastra tu carpeta `PaginaLociones` completa
3. ¡Desplegado! Te dará una URL como: `https://amazing-site-123456.netlify.app`

### Paso 3: Configurar Supabase (2 minutos)
1. Copia tu nueva URL de Netlify
2. Ve a tu Supabase dashboard
3. Settings → API → CORS Origins
4. Agrega tu nueva URL
5. Save

### ¡LISTO! Tu sitio ya funciona al 100%

---

## MÉTODO PROFESIONAL: VERCEL + GITHUB

### Paso 1: GitHub (si no está ya)
```bash
# En terminal, dentro de PaginaLociones:
git init
git add .
git commit -m "Deploy inicial"
git remote add origin https://github.com/TU-USUARIO/aromes-perfumeria.git
git push -u origin main
```

### Paso 2: Vercel
1. Ve a vercel.com → Sign up with GitHub
2. New Project → Import git repository
3. Selecciona tu repo → Deploy
4. URL automática: `https://aromes-perfumeria.vercel.app`

### Paso 3: Dominio Custom (opcional)
- Vercel Settings → Domains
- Agrega tu dominio personalizado

---

## 🔧 CONFIGURACIÓN POST-DEPLOY

### 1. CORS en Supabase
```
Ir a: Supabase Dashboard → Settings → API → CORS Origins
Agregar: 
- https://tu-sitio.netlify.app
- https://tu-sitio.vercel.app
- tu-dominio.com (si tienes uno)
```

### 2. Variables de Entorno (Opcional)
En Vercel/Netlify dashboard:
```
SUPABASE_URL = https://xelobsbzytdxrrxgmlta.supabase.co
SUPABASE_ANON_KEY = tu_clave_publica
```

### 3. Verificar Funcionalidad
- ✅ Página principal carga
- ✅ Para Ellas/Ellos funcionan  
- ✅ Admin panel accesible
- ✅ Base de datos conecta
- ✅ QR generator funciona

---

## 📞 URLs DE TU PROYECTO

### Estructura de URLs después del deploy:
```
https://tu-sitio.com/                    → Página principal
https://tu-sitio.com/html/para_ellas.html → Para Ellas
https://tu-sitio.com/html/para_ellos.html → Para Ellos  
https://tu-sitio.com/html/admin-panel.html → Admin Panel
```

### Admin Panel Testing:
1. Ve a: `https://tu-sitio.com/html/admin-panel.html`
2. Abre consola del navegador
3. Ejecuta: `adminPanel.checkQRStatus('QR_1752965800273_ndwxlrt58')`
4. Verifica que todo funciona

---

## 🛡️ SEGURIDAD RECOMENDADA

### Row Level Security en Supabase:
```sql
-- En Supabase SQL Editor:
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Lectura pública para productos
CREATE POLICY "Public read productos" ON productos FOR SELECT USING (true);

-- Solo admin puede modificar productos
CREATE POLICY "Admin modify productos" ON productos 
FOR ALL USING (auth.role() = 'authenticated');
```

---

## ✅ CHECKLIST FINAL

Después del deploy, verifica:
- [ ] Sitio carga sin errores
- [ ] CSS y JS funcionan
- [ ] Imágenes se ven
- [ ] Admin panel accesible
- [ ] Base de datos conecta
- [ ] QR system funciona
- [ ] CORS configurado
- [ ] SSL activo (HTTPS)

---

¡Tu proyecto está 100% listo para producción! 

**¿Con cuál método quieres empezar? ¿Netlify drag&drop o Vercel+GitHub?**
