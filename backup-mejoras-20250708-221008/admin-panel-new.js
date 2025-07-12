// Panel de Administración - JavaScript
class AdminPanel {    constructor() {
        this.currentSection = 'dashboard';
        this.productos = [];
        this.categorias = [];
        this.marcas = [];
        this.dataLoaded = false; // Flag para evitar cargas múltiples
        this.loadingData = false; // Flag para evitar cargas simultáneas
        this.eventsConfigured = false; // Flag para evitar configurar eventos múltiples veces
        this.isSubmitting = false; // Flag para evitar envíos dobles del formulario
        
        // Cache para placeholders y control de errores
        this.placeholderCache = null;
        this.errorLogCache = new Set(); // Para evitar logs repetitivos
        this.errorLogCooldown = 5000; // 5 segundos entre logs del mismo error
        this.placeholderErrorLogged = false; // Flag para controlar log de error de placeholder
        
        this.init();
    }    async init() {
        console.log('🚀 Inicializando Panel de Administración...');
        
        // Activar supresión de errores de placeholder
        this.suppressPlaceholderErrors();
        
        try {
            // Esperar a que todas las dependencias estén disponibles
            await this.waitForDependencies();
            
            // Configurar navegación
            this.setupNavigation();
            
            // Configurar formularios
            this.setupForms();
            
            // Configurar eventos
            this.setupEvents();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Mostrar dashboard por defecto
            this.showSection('dashboard');
            
            console.log('✅ Panel de Administración listo');
              } catch (error) {
            console.error('❌ Error inicializando panel:', error);
            // Continuar con funcionalidad limitada
            this.setupNavigation();
            this.setupForms();
            this.showSection('dashboard');
        }
    }

    // Esperar a que todas las dependencias estén disponibles
    async waitForDependencies() {
        console.log('⏳ Esperando dependencias...');
        
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const hasSupabase = typeof window.supabase !== 'undefined';
            const hasProductosService = typeof ProductosServiceOptimized !== 'undefined';
            const hasSupabaseClient = typeof supabaseClient !== 'undefined';
            
            console.log(`Intento ${attempts + 1}/${maxAttempts}:`, {
                supabase: hasSupabase,
                ProductosServiceOptimized: hasProductosService,
                supabaseClient: hasSupabaseClient
            });
            
            if (hasSupabase && hasProductosService && hasSupabaseClient) {
                console.log('✅ Todas las dependencias disponibles');
                return;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Timeout esperando dependencias, continuando con funcionalidad limitada');
    }

    // Configurar navegación
    setupNavigation() {
        console.log('🔗 Configurando navegación...');
        
        const navLinks = document.querySelectorAll('.sidebar-menu a');
        console.log(`📍 Enlaces de navegación encontrados: ${navLinks.length}`);
        
        navLinks.forEach((link, index) => {
            const href = link.getAttribute('href');
            console.log(`📎 Link ${index + 1}: ${href}`);
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🖱️ Click en navegación: ${href}`);
                
                // Remover active de todos los links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Agregar active al link clickeado
                link.classList.add('active');
                
                // Mostrar sección correspondiente
                const section = href.substring(1);
                console.log(`🎯 Navegando a sección: ${section}`);
                this.showSection(section);
            });
        });
        
        console.log('✅ Navegación configurada');
    }    // Configurar formularios
    setupForms() {        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Evitar envíos dobles
                if (this.isSubmitting) {
                    console.warn('⚠️ Envío ya en progreso, ignorando...');
                    return;
                }
                
                this.handleProductSubmit(e);
            });
            
            // Agregar evento para reset del formulario
            productForm.addEventListener('reset', (e) => {
                console.log('🧹 Formulario reseteado');
                setTimeout(() => {
                    this.setFormEditMode(false); // Asegurar que vuelve a modo agregar
                    this.updateFileInputLabel(); // Limpiar texto del selector de archivo
                    this.clearImagePreview(); // Limpiar preview
                }, 100); // Pequeño delay para que el reset se complete primero
            });
        }
    }// Configurar eventos adicionales
    setupEvents() {
        // Evitar configurar eventos múltiples veces
        if (this.eventsConfigured) {
            console.log('⚠️ Eventos ya configurados, omitiendo...');
            return;
        }
        
        console.log('🔧 Configurando eventos...');
        
        // Configurar búsqueda de productos
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }
          // Configurar botón de actualizar datos
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                console.log('🔄 Refrescando datos generales...');
                await this.refreshAllData();
            });
        }          // Configurar botón específico de recargar productos
        const refreshProductsBtn = document.getElementById('refreshProducts');
        if (refreshProductsBtn) {
            refreshProductsBtn.addEventListener('click', async () => {
                console.log('🔄 Recargando productos...');
                await this.reloadProducts();
            });
        }
        
        // Configurar evento de cambio de estado para mostrar/ocultar descuento
        const estadoSelect = document.getElementById('estado');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', () => {
                this.handleEstadoChange();
            });
        }
        
        // Configurar eventos de cambio de precio y descuento para actualizar vista previa
        const precioInput = document.getElementById('precio');
        const descuentoInput = document.getElementById('descuento');
          if (precioInput) {
            // Configurar evento único para precio con ambas funciones
            precioInput.addEventListener('input', (e) => {
                this.validatePrice(e.target);
                this.updatePrecioConDescuento();
            });
        }
          if (descuentoInput) {
            descuentoInput.addEventListener('input', () => {
                this.updatePrecioConDescuento();
            });
        }
        
        // Configurar eventos de vista previa de imagen
        const imagenUrlInput = document.getElementById('imagen_url');
        if (imagenUrlInput) {
            // Vista previa en tiempo real con debounce
            let previewTimeout;
            imagenUrlInput.addEventListener('input', (e) => {
                clearTimeout(previewTimeout);
                previewTimeout = setTimeout(() => {
                    const url = e.target.value.trim();
                    if (url && (url.startsWith('http://') || url.startsWith('https://') || 
                              url.startsWith('./') || url.startsWith('../') || url.startsWith('/'))) {
                        this.previewImageFromUrl(url);
                    } else if (!url) {
                        this.clearImagePreview();
                    }
                }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir
            });
            
            // También mantener el evento blur como backup
            imagenUrlInput.addEventListener('blur', (e) => {
                const url = e.target.value.trim();
                if (url) {
                    this.previewImageFromUrl(url);
                }
            });
        }
          // Configurar evento de cambio para input de archivo de imagen
        const imageFileInput = document.getElementById('imagen_file');
        if (imageFileInput) {
            imageFileInput.addEventListener('change', (e) => {
                this.previewImageFromFile(e.target);
                // Actualizar texto del selector de archivo
                this.updateFileInputLabel(e.target.files[0]?.name);
            });
        }
        
        // Configurar click en la etiqueta de archivo para abrir selector
        const fileUploadLabel = document.querySelector('label.file-upload-label');
        if (fileUploadLabel && imageFileInput) {
            console.log('✅ Configurando evento click en label de archivo...');
            // No necesitamos agregar evento click porque el label ya está asociado con "for"
        }
        
        // También configurar click en toda el área de upload como backup
        const fileUploadArea = document.querySelector('.file-upload-area');
        if (fileUploadArea && imageFileInput) {
            fileUploadArea.addEventListener('click', (e) => {
                // Solo activar si no se clickeó directamente en el input o en el label
                if (e.target !== imageFileInput && !e.target.closest('label.file-upload-label')) {
                    e.preventDefault();
                    console.log('🖱️ Click en área de archivo, abriendo selector...');
                    imageFileInput.click();
                }
            });
        }
        
        // Configurar tabs de imagen si existen
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        if (tabBtns.length > 0) {
            console.log(`📋 Configurando ${tabBtns.length} tabs de imagen...`);
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetTab = btn.dataset.tab;
                    console.log(`🖱️ Click en tab: ${targetTab}`);
                    
                    // Remover active de todos los tabs
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    // Activar tab seleccionado
                    btn.classList.add('active');
                    const targetContent = document.getElementById(`${targetTab}-tab`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                        console.log(`✅ Tab ${targetTab} activado`);
                    }
                });
            });
        }
        
        // Marcar eventos como configurados
        this.eventsConfigured = true;
        console.log('✅ Eventos configurados correctamente');
    }

    // Mostrar sección
    showSection(sectionName) {
        console.log(`📄 Mostrando sección: ${sectionName}`);
        
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.content-section');
        console.log(`📄 Secciones encontradas: ${sections.length}`);
        
        sections.forEach(section => {
            section.classList.remove('active');
            console.log(`🔸 Ocultando sección: ${section.id}`);
        });

        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            console.log(`✅ Sección ${sectionName} activada`);
            
            // Cargar datos específicos de la sección
            this.loadSectionData(sectionName);
        } else {
            console.error(`❌ No se encontró la sección: ${sectionName}`);
        }
    }

    // Cargar datos específicos de la sección
    async loadSectionData(sectionName) {
        console.log(`🔄 Cargando datos para sección: ${sectionName}`);
        
        // Si los datos no están cargados, cargarlos primero
        if (!this.dataLoaded && !this.loadingData) {
            console.log('📊 Datos no cargados, iniciando carga...');
            await this.loadInitialData();
        }
        
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboardDisplay();
                break;
            case 'productos':
                console.log('📦 Actualizando vista de productos...');
                await this.loadProductsData();
                break;
            case 'configuracion':
                this.checkConnection();
                break;
        }
    }    // Cargar datos iniciales
    async loadInitialData() {
        // Evitar cargas múltiples simultáneas
        if (this.loadingData) {
            console.log('⏳ Ya hay una carga en progreso, esperando...');
            return;
        }
        
        if (this.dataLoaded) {
            console.log('📋 Datos ya cargados, usando cache...');
            return;
        }
        
        console.log('📊 Cargando datos iniciales...');
        this.loadingData = true;
        
        try {
            this.showLoading(true);
            
            // Cargar productos primero
            await this.loadProductos();
            console.log(`✅ Productos cargados: ${this.productos.length}`);
            
            // Cargar categorías y marcas
            await this.loadCategorias();
            await this.loadMarcas();
            
            this.dataLoaded = true;
            console.log('✅ Datos iniciales cargados correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            // No lanzar error, continuar con arrays vacíos
            this.productos = [];
            this.categorias = [];
            this.marcas = [];
        } finally {
            this.loadingData = false;
            this.showLoading(false);
        }
    }    // Cargar productos
    async loadProductos() {
        try {
            console.log('📦 Cargando productos...');
            
            if (typeof ProductosServiceOptimized !== 'undefined') {
                this.productos = await ProductosServiceOptimized.obtenerProductosOptimizado();
                console.log(`✅ ${this.productos.length} productos cargados`);
            } else {
                console.warn('⚠️ ProductosServiceOptimized no disponible');
                this.productos = [];
            }
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.productos = [];
        }
    }

    // Cargar categorías
    async loadCategorias() {
        try {
            if (typeof ProductosServiceOptimized !== 'undefined') {
                this.categorias = await ProductosServiceOptimized.obtenerCategorias();
            } else {
                this.categorias = [
                    { id: 1, nombre: 'Para Ellos', slug: 'para-ellos' },
                    { id: 2, nombre: 'Para Ellas', slug: 'para-ellas' },
                    { id: 3, nombre: 'Unisex', slug: 'unisex' }
                ];
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.categorias = [];
        }
    }

    // Cargar marcas
    async loadMarcas() {
        const marcasUnicas = [...new Set(this.productos.map(p => p.marca).filter(Boolean))];
        this.marcas = marcasUnicas.sort();
    }    // Actualizar visualización del dashboard con datos existentes
    updateDashboardDisplay() {
        console.log('📊 Actualizando dashboard...');
        
        const totalProducts = this.productos.length;
        const activeProducts = this.productos.filter(p => p.activo !== false).length;
        const totalCategories = this.categorias.length;
        const totalBrands = this.marcas.length;

        // Actualizar cards del dashboard
        this.updateDashboardCard('total-productos', totalProducts);
        this.updateDashboardCard('productos-activos', activeProducts);
        this.updateDashboardCard('total-categorias', totalCategories);
        this.updateDashboardCard('total-marcas', totalBrands);
        
        console.log(`✅ Dashboard actualizado: ${totalProducts} productos, ${totalCategories} categorías, ${totalBrands} marcas`);
    }// Actualizar card del dashboard
    updateDashboardCard(cardType, value) {
        const card = document.querySelector(`[data-card="${cardType}"] .number`);
        if (card) {
            card.textContent = value;
        }
    }

    // Recargar productos (forzar desde base de datos)
    async reloadProducts() {
        console.log('🔄 Recargando productos...');
        
        try {
            this.showLoading(true);
            
            // Limpiar cache del servicio
            if (typeof ProductosServiceOptimized !== 'undefined' && ProductosServiceOptimized.clearCache) {
                ProductosServiceOptimized.clearCache();
            }
            
            // Marcar datos como no cargados para forzar recarga
            this.dataLoaded = false;
            
            // Recargar datos
            await this.loadInitialData();
            
            // Actualizar vista actual
            if (this.currentSection === 'productos') {
                await this.loadProductsData();
            } else if (this.currentSection === 'dashboard') {
                this.updateDashboardDisplay();
            }
            
            console.log('✅ Productos recargados correctamente');
            
        } catch (error) {
            console.error('❌ Error recargando productos:', error);
            this.showAlert('Error recargando productos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Refrescar datos (usar cache si está disponible)
    async refreshAllData() {
        console.log('🔄 Refrescando todos los datos...');
        
        try {
            this.showLoading(true);
            
            // Solo recargar si los datos son antiguos
            await this.loadInitialData();
            
            // Actualizar vista actual
            await this.loadSectionData(this.currentSection);
            
            console.log('✅ Datos refrescados correctamente');
            
        } catch (error) {
            console.error('❌ Error refrescando datos:', error);
            this.showAlert('Error refrescando datos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }    // Función auxiliar para obtener la ruta correcta de imagen placeholder
    getPlaceholderImagePath() {
        // Usar cache para evitar regenerar el placeholder cada vez
        if (!this.placeholderCache) {
            this.placeholderCache = this.generatePlaceholderDataURL();
            console.log('🖼️ Placeholder dinámico generado y cacheado');
        }
        return this.placeholderCache;
    }
      // Generar placeholder dinámico como data URL
    generatePlaceholderDataURL(width = 300, height = 300, text = "Sin imagen") {
        try {
            // Crear canvas para generar placeholder
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Fondo gris claro
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, width, height);
            
            // Borde
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, width - 2, height - 2);
            
            // Icono de imagen (más elaborado)
            ctx.strokeStyle = '#adb5bd';
            ctx.fillStyle = '#adb5bd';
            ctx.lineWidth = 2;
            
            const iconSize = Math.min(width, height) * 0.25;
            const iconX = (width - iconSize) / 2;
            const iconY = (height - iconSize) / 2 - 15;
            
            // Marco de imagen
            ctx.strokeRect(iconX, iconY, iconSize, iconSize * 0.75);
            
            // Sol/círculo en la imagen
            ctx.beginPath();
            ctx.arc(iconX + iconSize * 0.3, iconY + iconSize * 0.25, iconSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Montañas
            ctx.beginPath();
            ctx.moveTo(iconX + iconSize * 0.1, iconY + iconSize * 0.6);
            ctx.lineTo(iconX + iconSize * 0.35, iconY + iconSize * 0.4);
            ctx.lineTo(iconX + iconSize * 0.6, iconY + iconSize * 0.6);
            ctx.lineTo(iconX + iconSize * 0.9, iconY + iconSize * 0.45);
            ctx.lineTo(iconX + iconSize, iconY + iconSize * 0.6);
            ctx.lineTo(iconX + iconSize, iconY + iconSize * 0.75);
            ctx.lineTo(iconX, iconY + iconSize * 0.75);
            ctx.closePath();
            ctx.fill();
            
            // Texto
            ctx.fillStyle = '#6c757d';
            ctx.font = `${Math.max(12, width * 0.04)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2 + iconSize * 0.6);
            
            return canvas.toDataURL('image/png');
            
        } catch (error) {
            console.warn('⚠️ Error generando placeholder dinámico, usando fallback simple');
            // Fallback muy simple si hay problema con canvas
            return 'data:image/svg+xml;base64,' + btoa(`
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#6c757d">${text}</text>
                </svg>
            `);
        }
    }

    // Función auxiliar para obtener la ruta correcta de cualquier imagen
    getImagePath(product) {
        // Prioridad: imagen base64 > imagen_url > placeholder
        if (product.imagen) return product.imagen;
        if (product.imagen_url) return product.imagen_url;
        return this.getPlaceholderImagePath();
    }

    // Cargar datos de productos para mostrar
    async loadProductsData() {
        console.log('📦 Cargando datos de productos para mostrar...');
        
        const container = document.querySelector('.products-grid');
        if (!container) {
            console.warn('❌ Contenedor .products-grid no encontrado');
            return;
        }

        try {
            // Si no hay productos cargados, intentar cargarlos
            if (this.productos.length === 0) {
                console.log('🔄 No hay productos, cargando...');
                await this.loadProductos();
            }            if (this.productos.length === 0) {
                container.innerHTML = `
                    <div class="no-products">
                        No hay productos disponibles. 
                        <div style="margin-top: 10px;">
                            <button class="btn btn-secondary" onclick="adminPanel.reloadProducts()">
                                🔄 Recargar Productos
                            </button>
                        </div>
                    </div>`;
                console.log('⚠️ No hay productos para mostrar');
                return;
            }            console.log(`🎨 Renderizando ${this.productos.length} productos...`);            const productsHTML = this.productos.map(product => {
                const imageSrc = this.getImagePath(product);
                const productName = product.nombre || 'Producto sin nombre';
                const placeholderSrc = this.getPlaceholderImagePath();
                
                return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${imageSrc}" 
                             alt="${productName}"
                             onerror="this.src='${placeholderSrc}'; this.alt='Imagen no disponible';"
                             loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${productName}</h3>
                        <p class="product-brand">${product.marca || ''}</p>
                        <div class="product-price">${this.getPrecioInfo(product)}</div>
                        <p class="product-category">${this.getCategoryName(product.categoria)}</p>
                        <div class="product-status">${this.getEstadoBadge(product.estado)}</div>
                        <div class="product-actions">
                            <button class="btn btn-secondary btn-sm" onclick="adminPanel.editProduct(${product.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');

            container.innerHTML = productsHTML;
            console.log(`✅ ${this.productos.length} productos renderizados en la interfaz`);
            
        } catch (error) {
            console.error('❌ Error en loadProductsData:', error);
            container.innerHTML = `<div class="no-products error">Error cargando productos: ${error.message}</div>`;
        }
    }

    // Función auxiliar para obtener nombre de categoría
    getCategoryName(category) {
        const categories = {
            'para-ellos': 'Para Ellos',
            'para-ellas': 'Para Ellas',
            'unisex': 'Unisex'
        };
        return categories[category] || category;
    }

    // Función auxiliar para generar etiqueta de estado
    getEstadoBadge(estado) {
        const estadoMap = {
            'disponible': { text: 'Disponible', class: 'estado-disponible' },
            'agotado': { text: 'Agotado', class: 'estado-agotado' },
            'proximo': { text: 'Próximamente', class: 'estado-proximo' },
            'oferta': { text: 'En Oferta', class: 'estado-oferta' }
        };
        
        const estadoInfo = estadoMap[estado] || estadoMap['disponible'];
        return `<span class="estado-badge ${estadoInfo.class}">${estadoInfo.text}</span>`;
    }
    
    // Función auxiliar para generar información de precio
    getPrecioInfo(product) {
        const precio = product.precio || 0;
        const estado = product.estado || 'disponible';
        const descuento = product.descuento || 0;
        
        if (estado === 'oferta' && descuento > 0) {
            const precioConDescuento = precio - (precio * descuento / 100);
            return `
                <div class="precio-con-descuento">
                    <span class="precio-original">$${this.formatPrice(precio)}</span>
                    <span class="precio-oferta">$${this.formatPrice(precioConDescuento)}</span>
                    <span class="descuento-badge">-${descuento}%</span>
                </div>
            `;
        } else {
            return `$${this.formatPrice(precio)}`;
        }
    }
      // Función auxiliar para formatear precios
    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }    // Función utilitaria para convertir archivo a base64
    async convertirArchivoABase64(file) {
        return new Promise((resolve, reject) => {
            console.log(`🔄 Iniciando conversión a base64 de: ${file.name}`);
            console.log(`📊 Detalles del archivo:`, {
                name: file.name,
                type: file.type,
                size: `${(file.size / 1024).toFixed(1)}KB`,
                lastModified: new Date(file.lastModified).toISOString()
            });
            
            // Validaciones adicionales antes de convertir
            if (!file.type.startsWith('image/')) {
                const error = new Error(`Tipo de archivo inválido: ${file.type}. Solo se permiten imágenes.`);
                console.error('❌ Error de validación:', error);
                reject(error);
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                const error = new Error(`Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo 5MB.`);
                console.error('❌ Error de tamaño:', error);
                reject(error);
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e.target.result;
                
                // Validar que el resultado sea válido
                if (!result || !result.startsWith('data:image/')) {
                    const error = new Error(`Resultado de conversión inválido para: ${file.name}`);
                    console.error('❌ Error de resultado:', error);
                    reject(error);
                    return;
                }
                
                console.log(`✅ Conversión exitosa:`, {
                    originalSize: `${(file.size / 1024).toFixed(1)}KB`,
                    base64Size: `${(result.length / 1024).toFixed(1)}KB`,
                    format: result.substring(0, 50) + '...',
                    mimeType: result.substring(5, result.indexOf(';')),
                    isValidBase64: result.includes('base64,')
                });
                
                resolve(result);
            };
            
            reader.onerror = (e) => {
                const error = new Error(`Error leyendo archivo: ${file.name} - ${e.target.error?.message || 'Error desconocido'}`);
                console.error('❌ Error en conversión a base64:', error);
                reject(error);
            };
            
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentLoaded = Math.round((e.loaded / e.total) * 100);
                    if (percentLoaded % 25 === 0) { // Log cada 25%
                        console.log(`📊 Progreso conversión: ${percentLoaded}%`);
                    }
                }
            };
            
            console.log(`⏳ Iniciando lectura del archivo...`);
            reader.readAsDataURL(file);
        });    }

    // Manejar envío del formulario de producto
    async handleProductSubmit(e) {
        // Evitar envíos dobles
        if (this.isSubmitting) {
            console.warn('⚠️ Ya hay un envío en progreso, cancelando...');
            return;
        }
        
        this.isSubmitting = true;
        
        try {
            this.showLoading(true);
            console.log('📝 Procesando formulario de producto...');
            
            const formData = new FormData(e.target);
            
            // Verificar si estamos editando
            const isEditMode = e.target.dataset.editId;
            const productId = isEditMode ? parseInt(e.target.dataset.editId) : null;
            
            // Validación de campos requeridos antes de procesar
            const nombre = formData.get('nombre');
            const marca = formData.get('marca');
            const precio = formData.get('precio');
            const categoria = formData.get('categoria');
            
            if (!nombre || !marca || !precio || !categoria) {
                throw new Error('Por favor completa todos los campos requeridos: Nombre, Marca, Precio y Categoría');
            }
            
            if (!nombre.trim()) {
                throw new Error('El nombre del producto no puede estar vacío');
            }
            
            if (!marca.trim()) {
                throw new Error('La marca del producto no puede estar vacía');
            }
            
            const precioNum = parseInt(precio);
            if (isNaN(precioNum) || precioNum < 0) {
                throw new Error('El precio debe ser un número válido mayor o igual a 0');
            }            // Recopilar datos del formulario
            const productData = {
                nombre: nombre.trim(),
                marca: marca.trim(),
                precio: precioNum,
                ml: parseInt(formData.get('ml')) || 100,
                categoria: categoria,
                subcategoria: formData.get('subcategoria') || null,
                descripcion: formData.get('descripcion') || '',
                notas: formData.get('notas') || '',
                estado: formData.get('estado') || 'disponible',
                descuento: parseInt(formData.get('descuento')) || null,
                luxury: formData.get('luxury') === 'on',
                activo: formData.get('activo') === 'on'
            };// Manejar imagen con la nueva lógica simple
            console.log('🖼️ Procesando imagen con lógica simple...');
            
            const fileInput = document.getElementById('imagen_file');
            const urlInput = document.getElementById('imagen_url');
            
            console.log('📋 Estado de inputs de imagen:', {
                fileInput: fileInput ? 'Encontrado' : 'No encontrado',
                urlInput: urlInput ? 'Encontrado' : 'No encontrado',
                hasFile: fileInput?.files?.length > 0,
                urlValue: urlInput?.value?.trim() || 'Vacío'
            });
            
            // Prioridad: archivo sobre URL
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                console.log('📁 Procesando archivo de imagen...');
                const file = fileInput.files[0];
                
                console.log('📄 Detalles del archivo:', {
                    name: file.name,
                    type: file.type,
                    size: `${(file.size / 1024).toFixed(1)}KB`,
                    lastModified: new Date(file.lastModified).toLocaleString()
                });
                
                // Validar archivo
                if (!file.type.startsWith('image/')) {
                    throw new Error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)');
                }
                
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error('La imagen es muy grande. Máximo 5MB');
                }
                
                // Convertir archivo a base64
                console.log('🔄 Convirtiendo archivo a base64...');
                const imageData = await this.convertirArchivoABase64(file);
                
                // Asignar tanto a imagen como imagen_url para compatibilidad
                productData.imagen = imageData;
                productData.imagen_url = imageData;
                
                console.log(`✅ Archivo convertido a base64 exitosamente:`, {
                    size: `${(imageData.length / 1024).toFixed(1)}KB`,
                    format: imageData.substring(0, 30) + '...',
                    assignedTo: ['imagen', 'imagen_url']
                });
                
            } else if (urlInput && urlInput.value && urlInput.value.trim()) {
                console.log('🔗 Procesando URL de imagen...');
                const imageUrl = urlInput.value.trim();
                
                console.log('🌐 Detalles de la URL:', {
                    url: imageUrl,
                    length: imageUrl.length,
                    startsWithHttp: imageUrl.startsWith('http'),
                    startsWithHttps: imageUrl.startsWith('https'),
                    isRelative: imageUrl.startsWith('./') || imageUrl.startsWith('../') || imageUrl.startsWith('/')
                });
                
                // Validar URL básica
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || 
                    imageUrl.startsWith('./') || imageUrl.startsWith('../') || 
                    imageUrl.startsWith('/')) {
                    
                    // Asignar tanto a imagen como imagen_url para compatibilidad
                    productData.imagen = imageUrl;
                    productData.imagen_url = imageUrl;
                    
                    console.log(`✅ URL de imagen asignada exitosamente:`, {
                        url: imageUrl.length > 50 ? imageUrl.substring(0, 50) + '...' : imageUrl,
                        fullLength: imageUrl.length,
                        assignedTo: ['imagen', 'imagen_url']
                    });
                } else {
                    console.warn('⚠️ URL de imagen no válida, ignorando:', imageUrl);
                    console.warn('📝 Formatos válidos: http://, https://, ./, ../, /');
                }
                
            } else {
                console.log('ℹ️ No se proporcionó imagen en ningún input');
                productData.imagen = null;
                productData.imagen_url = null;
            }            console.log('📦 Datos del producto validados:', {
                nombre: productData.nombre,
                marca: productData.marca,
                precio: productData.precio,
                categoria: productData.categoria,
                estado: productData.estado,
                imagen: productData.imagen ? 
                    (productData.imagen.startsWith('data:') ? 
                        `Base64 (${(productData.imagen.length / 1024).toFixed(1)}KB)` : 
                        `URL: ${productData.imagen.length > 50 ? productData.imagen.substring(0, 50) + '...' : productData.imagen}`) : 
                    'Sin imagen',
                imagen_url: productData.imagen_url ? 
                    (productData.imagen_url.startsWith('data:') ? 
                        `Base64 (${(productData.imagen_url.length / 1024).toFixed(1)}KB)` : 
                        `URL: ${productData.imagen_url.length > 50 ? productData.imagen_url.substring(0, 50) + '...' : productData.imagen_url}`) : 
                    'Sin imagen_url',
                hasImage: !!(productData.imagen || productData.imagen_url)            });
            
            // Validar datos de imagen antes del envío
            const imageValidation = this.validateImageData(productData);
            if (!imageValidation.valid) {
                throw new Error(`Error en imagen: ${imageValidation.message}`);
            }
            console.log('✅ Validación de imagen exitosa:', imageValidation.message);
            
            let result;
            if (isEditMode) {
                result = await this.updateProduct(productId, productData);
            } else {
                result = await this.saveProduct(productData);
            }            if (result) {
                console.log('🎉 Producto guardado exitosamente:', result);
                  // Limpiar formulario después del éxito
                e.target.reset();
                
                // Restaurar modo agregar si estábamos editando
                if (isEditMode) {
                    this.setFormEditMode(false);
                }
                
                // Recargar datos UNA SOLA VEZ
                await this.loadProductos();
                if (this.currentSection === 'productos') {
                    await this.loadProductsData();
                }
                  // Verificar imagen SIN recargar productos otra vez
                if (productData.imagen && result.id) {
                    console.log('🔍 Ejecutando verificación de imagen guardada...');
                    console.log('📊 Datos enviados para verificación:', {
                        productId: result.id,
                        imagenEnviada: !!productData.imagen,
                        imagenSize: productData.imagen ? productData.imagen.length : 0,
                        imagenType: productData.imagen ? (productData.imagen.startsWith('data:') ? 'base64' : 'url') : 'none'
                    });
                    
                    setTimeout(async () => {
                        const verification = await this.verifyImageSaved(result.id, productData.imagen.length);
                        
                        if (verification.verified) {
                            console.log('✅ Verificación de imagen exitosa:', verification.reason);
                        } else {
                            console.warn('⚠️ Verificación de imagen falló:', verification.reason);
                            this.showAlert(`Advertencia: ${verification.reason}`, 'warning');
                        }
                    }, 1000);
                } else {
                    console.log('ℹ️ No se envió imagen o no se obtuvo ID del producto para verificar');
                }
                
                const action = isEditMode ? 'actualizado' : 'guardado';
                this.showAlert(`Producto ${action} exitosamente`, 'success');
                
                // Navegar a la lista de productos
                this.showSection('productos');
            }
              
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            
            // Mostrar mensaje de error más específico
            let errorMessage = 'Error guardando producto: ';
            
            if (error.message.includes('campos requeridos')) {
                errorMessage = error.message;
            } else if (error.message.includes('número válido')) {
                errorMessage = error.message;
            } else if (error.message.includes('ya existe')) {
                errorMessage = error.message;
            } else if (error.message.includes('demasiado alto')) {
                errorMessage = error.message;
            } else if (error.message.includes('estructura de base de datos')) {
                errorMessage = 'Error de configuración de la base de datos. Contacta al administrador.';
            } else if (error.message.includes('no está configurado')) {
                errorMessage = 'Error de conexión con la base de datos. Verifica tu conexión.';
            } else {
                errorMessage += error.message;
            }
              this.showAlert(errorMessage, 'error');
        } finally {
            this.showLoading(false);
            this.isSubmitting = false; // Resetear flag al final
        }
    }

    // Guardar producto
    async saveProduct(productData) {
        try {
            console.log('💾 Intentando guardar producto...');
            console.log('📋 Datos que se envían al servicio:', {
                nombre: productData.nombre,
                marca: productData.marca,
                precio: productData.precio,
                categoria: productData.categoria,
                hasImagen: !!productData.imagen,
                hasImagenUrl: !!productData.imagen_url,
                imagenType: productData.imagen ? 
                    (productData.imagen.startsWith('data:') ? 'base64' : 'url') : 
                    'none',
                imagenSize: productData.imagen ? 
                    `${(productData.imagen.length / 1024).toFixed(1)}KB` : 
                    'none'
            });
            
            // Log detallado de imagen si es base64
            if (productData.imagen && productData.imagen.startsWith('data:')) {
                const mimeType = productData.imagen.substring(5, productData.imagen.indexOf(';'));
                const base64Data = productData.imagen.split(',')[1];
                console.log('🖼️ Detalles de imagen base64 que se enviará:', {
                    mimeType: mimeType,
                    totalLength: productData.imagen.length,
                    base64DataLength: base64Data.length,
                    isValidFormat: productData.imagen.includes('base64,'),
                    preview: productData.imagen.substring(0, 100) + '...'
                });
            }
              if (typeof ProductosServiceOptimized === 'undefined') {
                throw new Error('ProductosServiceOptimized no está disponible');
            }

            console.log('🚀 Llamando a ProductosServiceOptimized.crearProducto...');
            const result = await ProductosServiceOptimized.crearProducto(productData);
            
            console.log('✅ Producto guardado exitosamente:', {
                result: result,
                hasId: !!result?.id,
                resultType: typeof result,
                savedImageData: result?.imagen ? 'Imagen guardada' : 'Sin imagen'
            });
            
            // Verificar que la imagen se haya guardado correctamente
            if (productData.imagen && result?.id) {
                console.log('🔍 Verificando que la imagen se guardó correctamente...');
                
                if (result.imagen || result.imagen_url) {
                    const savedImageSize = (result.imagen || result.imagen_url).length;
                    console.log('✅ Imagen verificada en resultado:', {
                        hasImagen: !!result.imagen,
                        hasImagenUrl: !!result.imagen_url,
                        savedSize: `${(savedImageSize / 1024).toFixed(1)}KB`,
                        originalSize: `${(productData.imagen.length / 1024).toFixed(1)}KB`,
                        sizeMatch: Math.abs(savedImageSize - productData.imagen.length) < 100 // Tolerancia de 100 chars
                    });
                } else {
                    console.warn('⚠️ ADVERTENCIA: Se envió imagen pero no se encontró en el resultado');
                    console.warn('📊 Datos de verificación:', {
                        sentImage: !!productData.imagen,
                        sentImageSize: productData.imagen ? `${(productData.imagen.length / 1024).toFixed(1)}KB` : 'N/A',
                        receivedImage: !!result.imagen,
                        receivedImageUrl: !!result.imagen_url,
                        resultKeys: Object.keys(result)
                    });
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            console.error('📊 Stack trace completo:', error.stack);
            
            // Log adicional para errores relacionados con imágenes
            if (productData.imagen && error.message.includes('imagen')) {
                console.error('🖼️ Error específico de imagen:', {
                    imagenLength: productData.imagen.length,
                    imagenType: productData.imagen.startsWith('data:') ? 'base64' : 'url',
                    imagenPreview: productData.imagen.substring(0, 100)
                });
            }
            
            throw error;
        }
    }    // Actualizar producto
    async updateProduct(productId, productData) {
        try {
            console.log(`💾 Actualizando producto ID ${productId}...`);
            console.log('📋 Datos que se envían para actualizar:', {
                productId: productId,
                nombre: productData.nombre,
                marca: productData.marca,
                precio: productData.precio,
                categoria: productData.categoria,
                hasImagen: !!productData.imagen,
                hasImagenUrl: !!productData.imagen_url,
                imagenType: productData.imagen ? 
                    (productData.imagen.startsWith('data:') ? 'base64' : 'url') : 
                    'none',
                imagenSize: productData.imagen ? 
                    `${(productData.imagen.length / 1024).toFixed(1)}KB` : 
                    'none'
            });
            
            // Log detallado de imagen si es base64
            if (productData.imagen && productData.imagen.startsWith('data:')) {
                const mimeType = productData.imagen.substring(5, productData.imagen.indexOf(';'));
                const base64Data = productData.imagen.split(',')[1];
                console.log('🖼️ Detalles de imagen base64 para actualización:', {
                    mimeType: mimeType,
                    totalLength: productData.imagen.length,
                    base64DataLength: base64Data.length,
                    isValidFormat: productData.imagen.includes('base64,'),
                    preview: productData.imagen.substring(0, 100) + '...'
                });
            }
              if (typeof ProductosServiceOptimized === 'undefined') {
                throw new Error('ProductosServiceOptimized no está disponible');
            }

            console.log('🚀 Llamando a ProductosServiceOptimized.updateProduct...');
            const result = await ProductosServiceOptimized.updateProduct(productId, productData);
            
            console.log('✅ Producto actualizado exitosamente:', {
                result: result,
                hasId: !!result?.id,
                resultType: typeof result,
                updatedImageData: result?.imagen ? 'Imagen actualizada' : 'Sin imagen'
            });
            
            // Verificar que la imagen se haya actualizado correctamente
            if (productData.imagen && result?.id) {
                console.log('🔍 Verificando que la imagen se actualizó correctamente...');
                
                if (result.imagen || result.imagen_url) {
                    const savedImageSize = (result.imagen || result.imagen_url).length;
                    console.log('✅ Imagen verificada en resultado de actualización:', {
                        hasImagen: !!result.imagen,
                        hasImagenUrl: !!result.imagen_url,
                        savedSize: `${(savedImageSize / 1024).toFixed(1)}KB`,
                        originalSize: `${(productData.imagen.length / 1024).toFixed(1)}KB`,
                        sizeMatch: Math.abs(savedImageSize - productData.imagen.length) < 100
                    });
                } else {
                    console.warn('⚠️ ADVERTENCIA: Se envió imagen para actualizar pero no se encontró en el resultado');
                    console.warn('📊 Datos de verificación de actualización:', {
                        sentImage: !!productData.imagen,
                        sentImageSize: productData.imagen ? `${(productData.imagen.length / 1024).toFixed(1)}KB` : 'N/A',
                        receivedImage: !!result.imagen,
                        receivedImageUrl: !!result.imagen_url,
                        resultKeys: Object.keys(result)
                    });
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            console.error('📊 Stack trace completo:', error.stack);
            
            // Log adicional para errores relacionados con imágenes en actualización
            if (productData.imagen && error.message.includes('imagen')) {
                console.error('🖼️ Error específico de imagen en actualización:', {
                    productId: productId,
                    imagenLength: productData.imagen.length,
                    imagenType: productData.imagen.startsWith('data:') ? 'base64' : 'url',
                    imagenPreview: productData.imagen.substring(0, 100)
                });
            }
            
            throw error;
        }
    }

    // Editar producto
    async editProduct(productId) {
        try {
            console.log(`✏️ Editando producto ID: ${productId}`);
            
            const product = this.productos.find(p => p.id === productId);
            if (!product) {
                this.showAlert('Producto no encontrado', 'error');
                return;
            }
            
            // Cambiar a la sección de agregar producto
            this.showSection('agregar-producto');
            
            // Poblar formulario
            this.populateEditForm(product);
            
            // Marcar como modo edición
            this.setFormEditMode(true, productId);
            
        } catch (error) {
            console.error('❌ Error editando producto:', error);
            this.showAlert('Error editando producto: ' + error.message, 'error');
        }
    }

    // Poblar formulario de edición
    populateEditForm(product) {
        console.log('📝 Poblando formulario con datos del producto:', product);
        
        // Función auxiliar para establecer valor de forma segura
        const safeSetValue = (id, value, defaultValue = '') => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value !== false;
                } else {
                    element.value = value || defaultValue;
                }
            }
        };        // Poblar campos básicos
        safeSetValue('nombre', product.nombre);
        safeSetValue('marca', product.marca);
        safeSetValue('precio', product.precio);
        safeSetValue('ml', product.ml || 100);
        safeSetValue('categoria', product.categoria);
        safeSetValue('subcategoria', product.subcategoria);
        safeSetValue('descripcion', product.descripcion);
        safeSetValue('notas', product.notas);safeSetValue('estado', product.estado, 'disponible');
        safeSetValue('descuento', product.descuento);
        
        // Manejar checkboxes (luxury y activo)
        const luxuryCheckbox = document.getElementById('luxury');
        if (luxuryCheckbox) {
            luxuryCheckbox.checked = product.luxury === true;
        }
        
        const activoCheckbox = document.getElementById('activo');
        if (activoCheckbox) {
            activoCheckbox.checked = product.activo !== false;
        }// Manejar imagen - poblar el campo URL y mostrar preview si existe
        if (product.imagen_url || product.imagen) {
            const imageUrl = product.imagen_url || product.imagen;
            safeSetValue('imagen_url', imageUrl);
            
            // Mostrar preview de la imagen existente
            if (imageUrl && !imageUrl.startsWith('data:')) {
                // Solo hacer preview si no es base64
                this.previewImageFromUrl(imageUrl);
            }
        }

        // Manejar estado y descuento
        this.handleEstadoChange();
    }

    // Establecer modo de edición del formulario
    setFormEditMode(isEditMode, productId = null) {
        const form = document.getElementById('productForm');
        const title = document.querySelector('#agregar-producto .section-title');
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        
        if (isEditMode) {
            form.dataset.editId = productId;
            if (title) title.textContent = 'Editar Producto';
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
        } else {
            delete form.dataset.editId;
            if (title) title.textContent = 'Agregar Nuevo Producto';
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Producto';
        }
    }    // Eliminar producto
    async deleteProduct(productId) {
        const product = this.productos.find(p => p.id === productId);
        const productName = product ? product.nombre : `ID ${productId}`;
        
        if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productName}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            console.log(`🗑️ Eliminando producto ID: ${productId}`);
            this.showLoading(true);
            
            if (typeof ProductosServiceOptimized === 'undefined') {
                throw new Error('ProductosServiceOptimized no está disponible');
            }

            const result = await ProductosServiceOptimized.deleteProduct(productId);
            
            if (result) {
                console.log('✅ Producto eliminado exitosamente');
                this.showAlert('Producto eliminado exitosamente', 'success');
                
                // Recargar datos
                await this.loadProductos();
                if (this.currentSection === 'productos') {
                    await this.loadProductsData();
                }
                
                // Actualizar dashboard
                this.updateDashboardDisplay();
            }
            
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            this.showAlert('Error eliminando producto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Filtrar productos
    filterProducts(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            // Si no hay término de búsqueda, mostrar todos los productos
            this.renderFilteredProducts(this.productos);
            return;
        }

        const filteredProducts = this.productos.filter(product => {
            const term = searchTerm.toLowerCase();
            return (
                (product.nombre && product.nombre.toLowerCase().includes(term)) ||
                (product.marca && product.marca.toLowerCase().includes(term)) ||
                (product.categoria && product.categoria.toLowerCase().includes(term)) ||
                (product.descripcion && product.descripcion.toLowerCase().includes(term))
            );
        });

        console.log(`🔍 Filtrados ${filteredProducts.length} productos de ${this.productos.length} totales`);
        this.renderFilteredProducts(filteredProducts);
    }

    // Renderizar productos filtrados
    renderFilteredProducts(products) {
        const container = document.querySelector('.products-grid');
        if (!container) {
            console.warn('❌ Contenedor .products-grid no encontrado');
            return;
        }

        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    No se encontraron productos que coincidan con la búsqueda.
                    <div style="margin-top: 10px;">
                        <button class="btn btn-secondary" onclick="document.getElementById('searchProducts').value=''; adminPanel.filterProducts('');">
                            🔄 Limpiar Búsqueda
                        </button>
                    </div>
                </div>`;
            return;
        }

        const productsHTML = products.map(product => {
            const imageSrc = this.getImagePath(product);
            const productName = product.nombre || 'Producto sin nombre';
            const placeholderSrc = this.getPlaceholderImagePath();
            
            return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${imageSrc}" 
                         alt="${productName}"
                         onerror="this.src='${placeholderSrc}'; this.alt='Imagen no disponible';"
                         loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${productName}</h3>
                    <p class="product-brand">${product.marca || ''}</p>
                    <div class="product-price">${this.getPrecioInfo(product)}</div>
                    <div class="product-actions">
                        <button class="btn btn-secondary btn-sm" onclick="adminPanel.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        container.innerHTML = productsHTML;
        console.log(`✅ ${products.length} productos filtrados renderizados`);
    }

    // Validar datos de imagen antes del envío
    validateImageData(productData) {
        if (!productData.imagen && !productData.imagen_url) {
            return { valid: true, message: 'Producto sin imagen (válido)' };
        }

        const imageUrl = productData.imagen || productData.imagen_url;
        
        // Validar URLs
        if (!imageUrl.startsWith('data:') && !this.isValidUrl(imageUrl)) {
            return { valid: false, message: 'URL de imagen no válida' };
        }

        // Validar base64
        if (imageUrl.startsWith('data:image/')) {
            if (!imageUrl.includes('base64,')) {
                return { valid: false, message: 'Formato de imagen base64 inválido' };
            }
            
            // Verificar tamaño
            const sizeInMB = imageUrl.length / (1024 * 1024);
            if (sizeInMB > 10) {
                return { valid: false, message: 'Imagen demasiado grande (máximo 10MB)' };
            }
        }

        return { valid: true, message: 'Imagen válida' };
    }

    // Verificar URL válida
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    // Verificar imagen guardada
    async verifyImageSaved(productId, originalImageSize) {
        try {
            // Buscar el producto actualizado en nuestra lista local
            const updatedProduct = this.productos.find(p => p.id === productId);
            
            if (!updatedProduct) {
                return { verified: false, reason: 'Producto no encontrado después de guardar' };
            }

            const savedImage = updatedProduct.imagen || updatedProduct.imagen_url;
            
            if (!savedImage) {
                return { verified: false, reason: 'No se encontró imagen en el producto guardado' };
            }

            // Verificar tamaño (con tolerancia)
            const sizeDifference = Math.abs(savedImage.length - originalImageSize);
            if (sizeDifference > 100) {
                return { 
                    verified: false, 
                    reason: `Tamaño de imagen no coincide (esperado: ${originalImageSize}, guardado: ${savedImage.length})` 
                };
            }

            return { verified: true, reason: 'Imagen verificada correctamente' };

        } catch (error) {
            console.error('❌ Error verificando imagen:', error);
            return { verified: false, reason: `Error en verificación: ${error.message}` };
        }
    }

    // Manejar cambio de estado del producto
    handleEstadoChange() {
        const estadoSelect = document.getElementById('estado');
        const descuentoGroup = document.getElementById('descuentoGroup');
        
        if (!estadoSelect || !descuentoGroup) return;
        
        const estado = estadoSelect.value;
        
        if (estado === 'oferta') {
            descuentoGroup.style.display = 'block';
            const descuentoInput = document.getElementById('descuento');
            if (descuentoInput) {
                descuentoInput.required = true;
            }
        } else {
            descuentoGroup.style.display = 'none';
            const descuentoInput = document.getElementById('descuento');
            if (descuentoInput) {
                descuentoInput.required = false;
                descuentoInput.value = '';
            }
        }
        
        // Actualizar vista previa de precio
        this.updatePrecioConDescuento();
    }

    // Actualizar precio con descuento
    updatePrecioConDescuento() {
        const precioInput = document.getElementById('precio');
        const descuentoInput = document.getElementById('descuento');
        const precioInfo = document.getElementById('precioInfo');
        const precioOriginal = document.getElementById('precioOriginal');
        const precioConDescuento = document.getElementById('precioConDescuento');
        
        if (!precioInput || !descuentoInput || !precioInfo) return;
        
        const precio = parseFloat(precioInput.value) || 0;
        const descuento = parseFloat(descuentoInput.value) || 0;
        
        if (precio > 0 && descuento > 0) {
            const precioFinal = precio - (precio * descuento / 100);
            
            if (precioOriginal) precioOriginal.textContent = `$${this.formatPrice(precio)}`;
            if (precioConDescuento) precioConDescuento.textContent = `$${this.formatPrice(precioFinal)}`;
            
            precioInfo.style.display = 'block';
        } else {
            precioInfo.style.display = 'none';
        }
    }

    // Validar precio
    validatePrice(input) {
        const value = parseInt(input.value);
        
        if (isNaN(value) || value < 0) {
            input.setCustomValidity('El precio debe ser un número válido mayor o igual a 0');
        } else if (value > 10000000) {
            input.setCustomValidity('El precio no puede ser mayor a $10,000,000');
        } else {
            input.setCustomValidity('');
        }
    }

    // Vista previa de imagen desde URL
    previewImageFromUrl(url = null) {
        const urlInput = document.getElementById('imagen_url');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        const imageUrl = url || (urlInput ? urlInput.value.trim() : '');
        
        if (!imageUrl || !imagePreview || !previewImg) {
            return;
        }
        
        // Mostrar loading
        previewImg.src = '';
        previewImg.alt = 'Cargando...';
        imagePreview.style.display = 'block';
        
        // Cargar imagen
        const img = new Image();
        img.onload = () => {
            previewImg.src = imageUrl;
            previewImg.alt = 'Vista previa de imagen';
            console.log('✅ Vista previa de imagen cargada correctamente');
        };
        
        img.onerror = () => {
            previewImg.src = this.getPlaceholderImagePath();
            previewImg.alt = 'Error cargando imagen';
            console.warn('⚠️ Error cargando vista previa de imagen');
        };
        
        img.src = imageUrl;
    }

    // Limpiar vista previa de imagen
    clearImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
        
        if (previewImg) {
            previewImg.src = '';
            previewImg.alt = '';
        }
    }

    // Usar imagen rápida
    useQuickImage(imageUrl) {
        const urlInput = document.getElementById('imagen_url');
        if (urlInput) {
            urlInput.value = imageUrl;
            this.previewImageFromUrl(imageUrl);
            console.log('✅ Imagen rápida seleccionada:', imageUrl);
        }
    }

    // Mostrar alerta
    showAlert(message, type = 'info') {
        // Crear elemento de alerta si no existe
        let alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            alertContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(alertContainer);
        }

        // Crear alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = `
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
            ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
            ${type === 'warning' ? 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' : ''}
            ${type === 'info' ? 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;' : ''}
        `;
        
        alert.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
            </div>
        `;

        alertContainer.appendChild(alert);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // Mostrar/ocultar loading
    showLoading(show) {
        let loadingOverlay = document.getElementById('loadingOverlay');
        
        if (show) {
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.id = 'loadingOverlay';
                loadingOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                `;
                loadingOverlay.innerHTML = `
                    <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                        <p>Cargando...</p>
                    </div>
                `;
                document.body.appendChild(loadingOverlay);
            }
            loadingOverlay.style.display = 'flex';
        } else {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    // Suprimir errores de placeholder
    suppressPlaceholderErrors() {
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const message = args.join(' ');
            if (message.includes('Failed to load resource') && message.includes('placeholder')) {
                if (!this.placeholderErrorLogged) {
                    console.warn('⚠️ Errores de placeholder suprimidos (esperado con imágenes dinámicas)');
                    this.placeholderErrorLogged = true;
                }
                return;
            }
            originalConsoleError.apply(console, args);
        };
    }

    // Verificar conexión
    checkConnection() {
        console.log('🔗 Verificando conexión a la base de datos...');
        
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            this.showAlert('Conexión a la base de datos: ✅ Activa', 'success');
        } else {
            this.showAlert('Conexión a la base de datos: ❌ No disponible', 'error');
        }
    }
}

// Inicializar panel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, esperando inicialización del panel...');
    
    // Esperar un poco para que se carguen los scripts
    setTimeout(() => {
        if (typeof AdminPanel !== 'undefined') {
            window.adminPanel = new AdminPanel();
            console.log('✅ Panel de administración inicializado');
        } else {
            console.error('❌ Clase AdminPanel no disponible');
        }
    }, 1000);
});
