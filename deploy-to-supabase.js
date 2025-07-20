// 🚀 SCRIPT DE DEPLOY AUTOMÁTICO A SUPABASE STORAGE
// Guarda este archivo como: deploy-to-supabase.js

const fs = require('fs');
const path = require('path');

// ⚠️ IMPORTANTE: Necesitas instalar la librería de Supabase
// npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

// 🔧 CONFIGURACIÓN
const SUPABASE_URL = 'https://xelobsbzytdxrrxgmlta.supabase.co';
const SUPABASE_SERVICE_KEY = 'TU_SERVICE_ROLE_KEY_AQUÍ'; // ¡Obtén esta clave del dashboard!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 📁 ARCHIVOS A SUBIR (específicos de tu proyecto)
const PROJECT_FILES = {
  // Página principal
  'index.html': 'index.html',
  
  // Admin Panel (renombrar para URL más limpia)
  'admin-panel-estructura-mejorada.html': 'admin.html',
  'html/admin-panel.html': 'admin-panel.html',
  
  // Páginas principales
  'html/para_ellas.html': 'para-ellas.html',
  'html/para_ellos.html': 'para-ellos.html',
  'html/contacto.html': 'contacto.html',
  
  // JavaScript crítico
  'js/admin-panel-mejorado.js': 'js/admin-panel-mejorado.js',
  'js/supabase-config-optimized.js': 'js/supabase-config-optimized.js',
  'js/qr-service-fixed.js': 'js/qr-service-fixed.js',
  'js/app.js': 'js/app.js',
  'js/cart.js': 'js/cart.js',
  
  // CSS
  'css/style.css': 'css/style.css',
  'css/admin-panel.css': 'css/admin-panel.css',
  'css/navbar.css': 'css/navbar.css',
  'css/cart.css': 'css/cart.css',
};

// 🎨 MIME TYPES
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 📤 FUNCIÓN DE UPLOAD
async function uploadFile(localPath, remotePath) {
  try {
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Archivo no encontrado: ${localPath}`);
      return false;
    }

    const fileContent = fs.readFileSync(localPath);
    const contentType = getContentType(localPath);

    console.log(`📤 Subiendo: ${localPath} → ${remotePath}`);

    const { data, error } = await supabase.storage
      .from('website')
      .upload(remotePath, fileContent, {
        contentType: contentType,
        upsert: true // Sobrescribir si existe
      });

    if (error) {
      console.error(`❌ Error subiendo ${remotePath}:`, error.message);
      return false;
    }

    console.log(`✅ Subido exitosamente: ${remotePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error procesando ${localPath}:`, error.message);
    return false;
  }
}

// 🏗️ FUNCIÓN PARA CREAR BUCKET
async function createBucket() {
  console.log('🏗️  Creando bucket "website"...');
  
  const { data, error } = await supabase.storage.createBucket('website', {
    public: true
  });

  if (error && !error.message.includes('already exists')) {
    console.error('❌ Error creando bucket:', error.message);
    return false;
  }

  console.log('✅ Bucket "website" listo');
  return true;
}

// 🔐 CONFIGURAR POLÍTICAS DE ACCESO
async function setupPolicies() {
  console.log('🔐 Configurando políticas de acceso...');
  
  try {
    // Esta query debe ejecutarse manualmente en el SQL Editor de Supabase
    const policySQL = `
-- Política para acceso público de lectura
CREATE POLICY "Public read access for website" ON storage.objects
FOR SELECT USING (bucket_id = 'website');

-- Política para subida desde admin
CREATE POLICY "Admin upload access for website" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'website' AND auth.role() = 'service_role');

-- Política para actualización desde admin
CREATE POLICY "Admin update access for website" ON storage.objects
FOR UPDATE USING (bucket_id = 'website' AND auth.role() = 'service_role');
    `;
    
    console.log('📋 Ejecuta este SQL en tu dashboard de Supabase:');
    console.log(policySQL);
    
  } catch (error) {
    console.error('❌ Error configurando políticas:', error.message);
  }
}

// 🚀 FUNCIÓN PRINCIPAL DE DEPLOY
async function deployToSupabase() {
  console.log('🚀 INICIANDO DEPLOY A SUPABASE STORAGE...\n');

  // Verificar configuración
  if (SUPABASE_SERVICE_KEY === 'TU_SERVICE_ROLE_KEY_AQUÍ') {
    console.error('❌ DEBES CONFIGURAR TU SERVICE_ROLE_KEY');
    console.log('📋 Obtén tu Service Role Key desde:');
    console.log('   Dashboard → Settings → API → service_role key');
    process.exit(1);
  }

  // Crear bucket
  await createBucket();
  
  // Configurar políticas
  await setupPolicies();

  let uploadedCount = 0;
  let totalFiles = Object.keys(PROJECT_FILES).length;

  // Subir archivos específicos
  console.log(`\n📤 Subiendo ${totalFiles} archivos principales...\n`);
  
  for (const [localPath, remotePath] of Object.entries(PROJECT_FILES)) {
    const success = await uploadFile(localPath, remotePath);
    if (success) uploadedCount++;
  }

  // Subir carpeta de imágenes completa
  console.log('\n🖼️  Subiendo carpeta IMAGENES...');
  await uploadFolder('IMAGENES', 'IMAGENES');

  console.log('\n🎬 Subiendo carpeta VIDEOS...');
  await uploadFolder('VIDEOS', 'VIDEOS');

  // Resultados finales
  console.log('\n' + '='.repeat(50));
  console.log('🎉 DEPLOY COMPLETADO');
  console.log('='.repeat(50));
  console.log(`✅ Archivos subidos: ${uploadedCount}/${totalFiles}`);
  console.log('\n🌐 URLs de tu sitio:');
  console.log(`   Página principal: ${SUPABASE_URL}/storage/v1/object/public/website/index.html`);
  console.log(`   Admin Panel:      ${SUPABASE_URL}/storage/v1/object/public/website/admin.html`);
  console.log(`   Para Ellas:       ${SUPABASE_URL}/storage/v1/object/public/website/para-ellas.html`);
  console.log(`   Para Ellos:       ${SUPABASE_URL}/storage/v1/object/public/website/para-ellos.html`);
  console.log('\n📋 SIGUIENTE PASO: Configurar CORS en Supabase Dashboard');
  console.log(`   Settings → API → CORS Origins → Agregar: ${SUPABASE_URL}`);
}

// 📁 FUNCIÓN AUXILIAR PARA SUBIR CARPETAS COMPLETAS
async function uploadFolder(folderPath, remoteFolder) {
  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  Carpeta no encontrada: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  
  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const remotePath = `${remoteFolder}/${file}`;
    
    if (fs.statSync(fullPath).isFile()) {
      await uploadFile(fullPath, remotePath);
    }
  }
}

// 🚀 EJECUTAR DEPLOY
if (require.main === module) {
  deployToSupabase().catch(console.error);
}

module.exports = { deployToSupabase };
