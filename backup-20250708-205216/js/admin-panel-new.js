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
            const hasProductosService = typeof ProductosService !== 'undefined';
            const hasSupabaseClient = typeof supabaseClient !== 'undefined';
            
            console.log(`Intento ${attempts + 1}/${maxAttempts}:`, {
                supabase: hasSupabase,
                ProductosService: hasProductosService,
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
            
            if (typeof ProductosService !== 'undefined') {
                this.productos = await ProductosService.obtenerProductos();
                console.log(`✅ ${this.productos.length} productos cargados`);
            } else {
                console.warn('⚠️ ProductosService no disponible');
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
            if (typeof ProductosService !== 'undefined') {
                this.categorias = await ProductosService.obtenerCategorias();
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
            if (typeof ProductosService !== 'undefined' && ProductosService.clearCache) {
                ProductosService.clearCache();
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
            const productId = isEditMode ? parseInt(isEditMode) : null;
            
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
            
            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no está disponible');
            }
            
            console.log('🚀 Llamando a ProductosService.crearProducto...');
            const result = await ProductosService.crearProducto(productData);
            
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
            
            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no está disponible');
            }
            
            console.log('🚀 Llamando a ProductosService.updateProduct...');
            const result = await ProductosService.updateProduct(productId, productData);
            
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
            
            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no está disponible');
            }
            
            let result = null;
            let eliminationSuccessful = false;
            
            // Intentar eliminación con múltiples métodos para mayor robustez
            try {
                console.log('🔄 Intentando método principal...');
                result = await ProductosService.deleteProduct(productId);
                eliminationSuccessful = result && result.success;
                console.log('✅ Método principal completado:', result);
            } catch (normalError) {
                console.warn('⚠️ Método principal falló:', normalError.message);
                
                // Si el método principal falla, intentar con el método alternativo
                try {
                    console.log('🔄 Intentando método alternativo...');
                    result = await ProductosService.deleteProductSimple(productId);
                    eliminationSuccessful = result && result.success;
                    console.log('✅ Método alternativo completado:', result);
                } catch (simpleError) {
                    console.error('❌ Método alternativo también falló:', simpleError.message);
                    throw simpleError;
                }
            }
            
            // Verificar si la eliminación fue exitosa
            if (eliminationSuccessful) {
                console.log('🎉 Eliminación confirmada como exitosa');
                
                // Forzar recarga de productos para sincronizar el estado
                console.log('🔄 Recargando productos para sincronizar...');
                await this.loadProductos();
                
                // Actualizar vista si estamos en la sección de productos
                if (this.currentSection === 'productos') {
                    await this.loadProductsData();
                }
                  // Actualizar dashboard
                this.updateDashboardDisplay();
                
                // Mostrar mensaje de éxito
                const successMessage = result.message || `Producto "${productName}" eliminado exitosamente`;
                this.showAlert(successMessage, 'success');
                console.log('✅ Proceso de eliminación completado exitosamente');
                
            } else {
                throw new Error('No se recibió confirmación de eliminación exitosa');
            }
            
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            
            // Independientemente del error, intentar recargar productos para sincronizar estado
            try {
                console.log('🔄 Recargando productos después del error para sincronizar...');
                await this.loadProductos();
                if (this.currentSection === 'productos') {
                    await this.loadProductsData();
                }
                this.updateDashboardDisplay();
            } catch (reloadError) {
                console.warn('⚠️ Error recargando después del fallo:', reloadError.message);
            }
            
            // Determinar el mensaje de error apropiado
            let errorMessage = 'Error eliminando producto: ';
            
            if (error.message.includes('no existe') || error.message.includes('ya fue eliminado')) {
                errorMessage += 'El producto no existe o ya fue eliminado.';
                // En este caso, mostrar como warning en lugar de error
                this.showAlert(errorMessage.replace('Error eliminando producto: ', ''), 'warning');
                return; // Salir sin mostrar error grave
            } else if (error.message.includes('aún existe después')) {
                errorMessage += 'No se pudo completar la eliminación. Esto puede deberse a restricciones de la base de datos o problemas de permisos.';
            } else if (error.message.includes('referenciado en otras tablas')) {
                errorMessage += 'No se puede eliminar porque está siendo utilizado en otras partes del sistema.';
            } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
                errorMessage += 'No se pudo conectar a la base de datos. Verifica tu conexión a internet.';
            } else if (error.message.includes('403')) {
                errorMessage += 'No tienes permisos para eliminar este producto.';
            } else if (error.message.includes('500')) {
                errorMessage += 'Error interno del servidor. Intenta nuevamente más tarde.';
            } else {
                errorMessage += error.message;
            }
            
            this.showAlert(errorMessage, 'error');
            
        } finally {
            this.showLoading(false);
        }
    }

    // Filtrar productos
    filterProducts(searchTerm) {
        const filteredProducts = this.productos.filter(product => 
            product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.marca && product.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
            product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredProducts(filteredProducts);
    }    // Renderizar productos filtrados
    renderFilteredProducts(products) {
        const container = document.querySelector('.products-grid');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div class="no-products">No se encontraron productos</div>';
            return;
        }        const productsHTML = products.map(product => {
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
    }

    // Manejar cambio de estado
    handleEstadoChange() {
        const estadoSelect = document.getElementById('estado');
        const descuentoGroup = document.getElementById('descuentoGroup');
        const descuentoInput = document.getElementById('descuento');
        
        if (!estadoSelect || !descuentoGroup) return;
        
        const selectedEstado = estadoSelect.value;
        
        if (selectedEstado === 'oferta') {
            descuentoGroup.style.display = 'block';
            descuentoInput.required = true;
        } else {
            descuentoGroup.style.display = 'none';
            descuentoInput.required = false;
            descuentoInput.value = '';
            this.updatePrecioConDescuento();
        }
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
            
            precioOriginal.textContent = `$${this.formatPrice(precio)}`;
            precioConDescuento.textContent = `$${this.formatPrice(precioFinal)}`;
            precioInfo.style.display = 'block';
        } else {
            precioInfo.style.display = 'none';
        }
    }    // Validar precio
    validatePrice(input) {
        const value = parseInt(input.value);
        const PRECIO_MAXIMO = 2147483647;
        
        if (value > PRECIO_MAXIMO) {
            input.value = PRECIO_MAXIMO;
            this.showAlert(`Precio ajustado al máximo permitido: $${this.formatPrice(PRECIO_MAXIMO)}`, 'warning');
        }
        
        if (value < 0) {
            input.value = 0;
        }
    }    // Validar datos de imagen antes del envío
    validateImageData(productData) {
        console.log('🔍 Validando datos de imagen...');
        console.log('📊 Estado de imágenes:', {
            hasImagen: !!productData.imagen,
            hasImagenUrl: !!productData.imagen_url,
            imagenLength: productData.imagen ? productData.imagen.length : 0,
            imagenUrlLength: productData.imagen_url ? productData.imagen_url.length : 0
        });
        
        const hasImagen = !!productData.imagen;
        const hasImagenUrl = !!productData.imagen_url;
        
        if (!hasImagen && !hasImagenUrl) {
            console.log('ℹ️ Producto sin imagen - esto es válido');
            return { valid: true, message: 'Producto sin imagen' };
        }
        
        if (hasImagen) {
            const imagen = productData.imagen;
            
            // Si es base64, validar formato y contenido
            if (imagen.startsWith('data:')) {
                console.log('🔍 Validando imagen base64...');
                
                if (!imagen.includes('image/')) {
                    console.error('❌ Base64 no contiene tipo de imagen válido');
                    return { valid: false, message: 'Formato de imagen base64 inválido - no contiene tipo MIME de imagen' };
                }
                
                if (!imagen.includes('base64,')) {
                    console.error('❌ Base64 no contiene marcador base64');
                    return { valid: false, message: 'Formato de imagen base64 inválido - no contiene marcador base64' };
                }
                
                // Validar tipos de imagen permitidos
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                const mimeType = imagen.substring(5, imagen.indexOf(';'));
                
                if (!allowedTypes.some(type => imagen.includes(type))) {
                    console.error('❌ Tipo de imagen no permitido:', mimeType);
                    return { valid: false, message: `Tipo de imagen no permitido: ${mimeType}. Permitidos: JPG, PNG, WEBP, GIF` };
                }
                
                // Validar tamaño del base64 (aproximadamente)
                const base64Data = imagen.split(',')[1];
                const estimatedSize = (base64Data.length * 3) / 4; // Tamaño aproximado en bytes
                
                if (estimatedSize > 5 * 1024 * 1024) {
                    console.error('❌ Imagen base64 muy grande:', `${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);
                    return { valid: false, message: `Imagen muy grande: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB. Máximo 5MB` };
                }
                
                console.log('✅ Imagen base64 válida:', {
                    mimeType: mimeType,
                    estimatedSize: `${(estimatedSize / 1024).toFixed(1)}KB`,
                    base64Length: imagen.length,
                    dataLength: base64Data.length
                });
                
                return { 
                    valid: true, 
                    message: `Imagen base64 válida (${mimeType}, ${(estimatedSize / 1024).toFixed(1)}KB)` 
                };
            }
            
            // Si es URL, validar formato básico
            if (imagen.startsWith('http://') || imagen.startsWith('https://') || 
                imagen.startsWith('./') || imagen.startsWith('../') || imagen.startsWith('/')) {
                console.log('✅ URL de imagen válida detectada');
                return { valid: true, message: `URL de imagen: ${imagen.substring(0, 50)}...` };
            }
            
            console.warn('⚠️ Formato de imagen no reconocido:', imagen.substring(0, 100));
            return { valid: false, message: 'Formato de imagen no válido - debe ser base64 (data:) o URL válida' };
        }
        
        return { valid: true, message: 'Validación de imagen completada' };
    }

    // Verificar conexión
    checkConnection() {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        if (typeof ProductosService !== 'undefined') {
            statusElement.textContent = 'Conectado ✅';
            statusElement.style.color = 'green';
        } else {
            statusElement.textContent = 'Desconectado ❌';
            statusElement.style.color = 'red';
        }
    }

    // Mostrar loading
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // Mostrar alerta
    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(alert);

        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '10001';
        alert.style.maxWidth = '400px';
        alert.style.padding = '12px 16px';
        alert.style.borderRadius = '4px';
        alert.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        if (type === 'success') {
            alert.style.backgroundColor = '#d4edda';
            alert.style.color = '#155724';
            alert.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            alert.style.backgroundColor = '#f8d7da';
            alert.style.color = '#721c24';
            alert.style.border = '1px solid #f5c6cb';
        } else if (type === 'warning') {
            alert.style.backgroundColor = '#fff3cd';
            alert.style.color = '#856404';
            alert.style.border = '1px solid #ffeaa7';
        } else {
            alert.style.backgroundColor = '#d1ecf1';
            alert.style.color = '#0c5460';
            alert.style.border = '1px solid #bee5eb';
        }        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    // Vista previa de imagen desde archivo
    previewImageFromFile(input) {
        if (!input || !input.files || input.files.length === 0) {
            this.clearImagePreview();
            return;
        }
        const file = input.files[0];
        if (!file.type.startsWith('image/')) {
            this.showAlert('El archivo seleccionado no es una imagen válida.', 'warning');
            this.clearImagePreview();
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            // Mostrar preview
            const previewDiv = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            if (previewDiv && previewImg) {
                previewImg.src = dataUrl;
                previewDiv.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }

    // Vista previa de imagen desde URL
    previewImageFromUrl(url) {
        let imageUrl = url;
        if (!imageUrl) {
            const urlInput = document.getElementById('imagen_url');
            imageUrl = urlInput ? urlInput.value.trim() : '';
        }
        if (!imageUrl) {
            this.clearImagePreview();
            return;
        }
        const previewDiv = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        if (previewDiv && previewImg) {
            previewImg.src = imageUrl;
            previewDiv.style.display = 'block';
        }
    }

    // Limpiar preview de imagen
    clearImagePreview() {
        const previewDiv = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        if (previewDiv && previewImg) {
            previewImg.src = '';
            previewDiv.style.display = 'none';
        }
    }

    // Actualizar texto del selector de archivo
    updateFileInputLabel(filename = null) {
        const fileUploadLabel = document.querySelector('label.file-upload-label');
        const spanElement = fileUploadLabel?.querySelector('span:first-of-type');
        
        if (spanElement) {
            if (filename) {
                spanElement.textContent = `Archivo seleccionado: ${filename}`;
                fileUploadLabel.classList.add('file-selected');
                console.log(`✅ Archivo seleccionado mostrado: ${filename}`);
            } else {
                spanElement.textContent = 'Haz clic para seleccionar una imagen';
                fileUploadLabel.classList.remove('file-selected');
            }
        }
    }

    // Función para controlar logs repetitivos
    logError(message, type = 'error') {
        const errorKey = `${type}:${message}`;
        const now = Date.now();
        
        // Verificar si ya logueamos este error recientemente
        if (this.errorLogCache.has(errorKey)) {
            return false; // No loguear
        }
        
        // Agregar al cache y programar limpieza
        this.errorLogCache.add(errorKey);
        setTimeout(() => {
            this.errorLogCache.delete(errorKey);
        }, this.errorLogCooldown);
        
        // Loguear el error
        if (type === 'error') {
            console.error(message);
        } else if (type === 'warn') {
            console.warn(message);        } else {
            console.log(message);
        }
        
        return true; // Logueado exitosamente
    }

    // Verificar que la imagen se haya guardado correctamente después del guardado
    async verifyImageSaved(productId, expectedImageSize = null) {
        try {
            console.log(`🔍 Verificando imagen guardada para producto ID ${productId}...`);
            
            // Buscar el producto en nuestra lista local
            const localProduct = this.productos.find(p => p.id === productId);
            
            if (!localProduct) {
                console.warn(`⚠️ Producto ID ${productId} no encontrado en lista local`);
                return { verified: false, reason: 'Producto no encontrado en lista local' };
            }
            
            const hasLocalImage = !!(localProduct.imagen || localProduct.imagen_url);
            
            if (!hasLocalImage) {
                console.log(`ℹ️ Producto ID ${productId} no tiene imagen asignada`);
                return { verified: true, reason: 'Producto sin imagen' };
            }
            
            const imageData = localProduct.imagen || localProduct.imagen_url;
            const actualSize = imageData.length;
            
            console.log(`📊 Verificación de imagen:`, {
                productId: productId,
                hasImagen: !!localProduct.imagen,
                hasImagenUrl: !!localProduct.imagen_url,
                actualSize: `${(actualSize / 1024).toFixed(1)}KB`,
                expectedSize: expectedImageSize ? `${(expectedImageSize / 1024).toFixed(1)}KB` : 'No especificado',
                isBase64: imageData.startsWith('data:'),
                isURL: imageData.startsWith('http') || imageData.startsWith('./') || imageData.startsWith('../')
            });
            
            // Verificar tamaño si se especificó
            if (expectedImageSize && Math.abs(actualSize - expectedImageSize) > 100) {
                console.warn(`⚠️ Tamaño de imagen no coincide: esperado ${expectedImageSize}, actual ${actualSize}`);
                return { 
                    verified: false, 
                    reason: `Tamaño no coincide: esperado ${(expectedImageSize / 1024).toFixed(1)}KB, actual ${(actualSize / 1024).toFixed(1)}KB` 
                };
            }
            
            // Verificar formato de base64 si aplica
            if (imageData.startsWith('data:')) {
                if (!imageData.includes('image/') || !imageData.includes('base64,')) {
                    console.error(`❌ Formato base64 inválido para producto ID ${productId}`);
                    return { verified: false, reason: 'Formato base64 inválido' };
                }
            }
            
            console.log(`✅ Imagen verificada correctamente para producto ID ${productId}`);
            return { 
                verified: true, 
                reason: 'Imagen guardada y verificada correctamente',
                imageSize: actualSize,
                imageType: imageData.startsWith('data:') ? 'base64' : 'url'
            };
            
        } catch (error) {
            console.error(`❌ Error verificando imagen para producto ID ${productId}:`, error);
            return { verified: false, reason: `Error en verificación: ${error.message}` };
        }
    }

    // Suprimir errores 404 repetitivos del placeholder
    suppressPlaceholderErrors() {
        // Interceptar errores de red para placeholder
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const message = args.join(' ');
            
            // Suprimir errores relacionados con placeholder
            if (message.includes('placeholder-simple.svg') && 
                message.includes('404') && 
                message.includes('Not Found')) {
                // Solo loguear la primera vez
                if (!this.placeholderErrorLogged) {
                    originalConsoleError('🔇 [SUPRIMIDO] Errores de placeholder-simple.svg serán silenciados para evitar spam en consola');
                    this.placeholderErrorLogged = true;
                }
                return;
            }
            
            // Llamar al console.error original para otros errores
            originalConsoleError.apply(console, args);
        };
        
        // También interceptar window.onerror para errores de red
        const originalOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            if (typeof message === 'string' && 
                message.includes('placeholder-simple.svg')) {
                return true; // Suprimir el error
            }
            
            if (originalOnError) {
                return originalOnError(message, source, lineno, colno, error);
            }
        };
        
        console.log('🔇 Sistema de supresión de errores de placeholder activado');
    }
}

// Exportar para uso global
window.AdminPanel = AdminPanel;
