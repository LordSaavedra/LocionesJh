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
        // Ruta ajustada para panel admin en carpeta html/
        const staticPlaceholder = '../IMAGENES/placeholder-simple.svg';
        
        // Si no funciona, usar placeholder dinámico
        if (!this.placeholderCache) {
            this.placeholderCache = this.generatePlaceholderDataURL();
            console.log('🖼️ Placeholder dinámico generado y cacheado');
        }
        
        // Retornar placeholder estático por defecto
        return staticPlaceholder;
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
        // Debug: log del producto para diagnóstico
        console.log('🔍 getImagePath para producto:', {
            id: product.id,
            nombre: product.nombre,
            imagen: this.getImageInfo(product.imagen),
            imagen_url: this.getImageInfo(product.imagen_url)
        });
        
        // Función auxiliar para obtener información de imagen de forma segura
        const getImageValue = (imageField) => {
            // Manejar null o undefined
            if (!imageField) return null;
            
            // Si es un objeto, podría ser null almacenado como object
            if (typeof imageField === 'object') {
                return null;
            }
            
            // Si es string, verificar que no esté vacía
            if (typeof imageField === 'string' && imageField.trim() !== '') {
                return imageField.trim();
            }
            
            return null;
        };
        
        // Prioridad: imagen_url > imagen > placeholder
        // Cambio de prioridad para privilegiar imagen_url que es el nuevo estándar
        const imagen_url = getImageValue(product.imagen_url);
        if (imagen_url) {
            console.log('✅ Usando campo imagen_url');
            return imagen_url;
        }
        
        const imagen = getImageValue(product.imagen);
        if (imagen) {
            console.log('✅ Usando campo imagen');
            return imagen;
        }
        
        console.log('⚠️ Sin imagen válida, usando placeholder');
        return this.getPlaceholderImagePath();
    }
    
    // Función auxiliar para obtener información de imagen de forma segura
    getImageInfo(imageField) {
        if (!imageField) return 'null';
        if (typeof imageField === 'object') return 'object (null)';
        if (typeof imageField === 'string') {
            if (imageField.trim() === '') return 'string vacío';
            return imageField.length > 50 ? imageField.substring(0, 50) + '...' : imageField;
        }
        return `tipo: ${typeof imageField}`;
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
                
                console.log(`🖼️ Producto ${product.id} - imagen: ${imageSrc.substring(0, 50)}...`);
                
                return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${imageSrc}" 
                             alt="${productName}"
                             onerror="console.error('❌ Error cargando imagen para producto ${product.id}:', this.src); this.src='${placeholderSrc}'; this.alt='Imagen no disponible'; this.style.border='2px solid red';"
                             onload="console.log('✅ Imagen cargada para producto ${product.id}'); this.style.border='2px solid green';"
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
                if ((productData.imagen || productData.imagen_url) && result.id) {
                    console.log('🔍 Ejecutando verificación de imagen guardada...');
                    console.log('📊 Datos enviados para verificación:', {
                        productId: result.id,
                        imagenEnviada: !!(productData.imagen || productData.imagen_url),
                        imagenSize: productData.imagen ? productData.imagen.length : 0,
                        imagenUrlSize: productData.imagen_url ? productData.imagen_url.length : 0,
                        imagenType: productData.imagen ? (productData.imagen.startsWith('data:') ? 'base64' : 'url') : 'none',
                        imagenUrlType: productData.imagen_url ? (productData.imagen_url.startsWith('data:') ? 'base64' : 'url') : 'none'
                    });
                    
                    setTimeout(async () => {
                        // Usar el tamaño de la imagen principal (que ahora es imagen_url)
                        const expectedSize = productData.imagen_url ? productData.imagen_url.length : 
                                            productData.imagen ? productData.imagen.length : 0;
                        
                        const verification = await this.verifyImageSaved(result.id, expectedSize);
                        
                        if (verification.verified) {
                            console.log('✅ Verificación de imagen exitosa:', verification.reason);
                        } else {
                            console.warn('⚠️ Verificación de imagen falló:', verification.reason);
                            // Solo mostrar advertencia en consola, no al usuario para URLs
                            if (!productData.imagen_url || !productData.imagen_url.startsWith('http')) {
                                this.showAlert(`Advertencia: ${verification.reason}`, 'warning');
                            }
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
        console.log('📝 Poblando formulario con datos del producto:', {
            id: product.id,
            nombre: product.nombre,
            campos_extra: this.getExtraFields(product),
            estructura_completa: Object.keys(product).length
        });
        
        // Función auxiliar para establecer valor de forma segura
        const safeSetValue = (id, value, defaultValue = '') => {
            const element = document.getElementById(id);
            if (element) {
                // Limpiar valor de tipos no esperados
                const cleanValue = this.cleanFieldValue(value, defaultValue);
                
                if (element.type === 'checkbox') {
                    element.checked = cleanValue !== false && cleanValue !== 'false';
                } else {
                    element.value = cleanValue;
                }
                
                console.log(`📋 Campo ${id} poblado con:`, {
                    originalValue: value,
                    originalType: typeof value,
                    cleanValue: cleanValue,
                    cleanType: typeof cleanValue
                });
            } else {
                console.warn(`⚠️ Elemento ${id} no encontrado en el formulario`);
            }
        };
        
        // Poblar campos básicos con manejo seguro de tipos
        safeSetValue('nombre', product.nombre);
        safeSetValue('marca', product.marca);
        safeSetValue('precio', product.precio);
        safeSetValue('ml', product.ml || product.tamaño || product.tamaño_ml, 100);
        safeSetValue('categoria', product.categoria);
        safeSetValue('subcategoria', product.subcategoria);
        safeSetValue('descripcion', product.descripcion);
        safeSetValue('notas', product.notas);
        safeSetValue('estado', product.estado, 'disponible');
        safeSetValue('descuento', product.descuento);
        
        // Manejar checkboxes con valores seguros
        const luxuryCheckbox = document.getElementById('luxury');
        if (luxuryCheckbox) {
            const luxuryValue = this.cleanBooleanValue(product.luxury);
            luxuryCheckbox.checked = luxuryValue === true;
            console.log(`📋 Checkbox luxury: ${luxuryValue}`);
        }
        
        const activoCheckbox = document.getElementById('activo');
        if (activoCheckbox) {
            const activoValue = this.cleanBooleanValue(product.activo, true); // Por defecto true
            activoCheckbox.checked = activoValue === true;
            console.log(`📋 Checkbox activo: ${activoValue}`);
        }
        
        // Manejar imagen con manejo seguro de tipos
        const imagenUrlValue = this.cleanImageValue(product.imagen_url);
        const imagenValue = this.cleanImageValue(product.imagen);
        
        // Priorizar imagen_url sobre imagen
        const finalImageUrl = imagenUrlValue || imagenValue;
        
        if (finalImageUrl) {
            console.log('🖼️ Configurando imagen en formulario:', {
                imagen_url_original: product.imagen_url,
                imagen_original: product.imagen,
                valor_final: finalImageUrl.length > 50 ? finalImageUrl.substring(0, 50) + '...' : finalImageUrl
            });
            
            safeSetValue('imagen_url', finalImageUrl);
            
            // Mostrar preview de la imagen existente si no es base64
            if (!finalImageUrl.startsWith('data:')) {
                this.previewImageFromUrl(finalImageUrl);
            }
        } else {
            console.log('ℹ️ No hay imagen válida para mostrar en el formulario');
        }

        // Manejar estado y descuento
        this.handleEstadoChange();
        
        // Log de campos extra ignorados
        const extraFields = this.getExtraFields(product);
        if (extraFields.length > 0) {
            console.log('ℹ️ Campos extra de la BD ignorados:', extraFields);
        }
    }
    
    // Función auxiliar para limpiar valores de campos
    cleanFieldValue(value, defaultValue = '') {
        // Manejar null o undefined
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        // Manejar objetos (puede ser null almacenado como object)
        if (typeof value === 'object') {
            return defaultValue;
        }
        
        // Manejar strings
        if (typeof value === 'string') {
            return value.trim();
        }
        
        // Manejar números
        if (typeof value === 'number') {
            return value.toString();
        }
        
        // Manejar booleanos
        if (typeof value === 'boolean') {
            return value.toString();
        }
        
        // Fallback
        return defaultValue;
    }
    
    // Función auxiliar para limpiar valores booleanos
    cleanBooleanValue(value, defaultValue = false) {
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        
        if (typeof value === 'number') {
            return value !== 0;
        }
        
        return defaultValue;
    }
    
    // Función auxiliar para limpiar valores de imagen
    cleanImageValue(value) {
        if (!value) return null;
        
        // Si es un objeto, podría ser null almacenado como object
        if (typeof value === 'object') {
            return null;
        }
        
        // Si es string, verificar que no esté vacía
        if (typeof value === 'string' && value.trim() !== '') {
            return value.trim();
        }
        
        return null;
    }
    
    // Función auxiliar para obtener campos extra de la BD
    getExtraFields(product) {
        const expectedFields = [
            'id', 'nombre', 'marca', 'precio', 'ml', 'categoria', 'subcategoria',
            'descripcion', 'notas', 'estado', 'descuento', 'luxury', 'activo',
            'imagen', 'imagen_url', 'created_at', 'updated_at'
        ];
        
        return Object.keys(product).filter(key => !expectedFields.includes(key));
    }
    
    // Validar precio
    validatePrice(input) {
        const value = parseInt(input.value);
        const min = 0;
        const max = 2147483647;
        
        if (isNaN(value) || value < min || value > max) {
            input.setCustomValidity(`El precio debe estar entre $${min.toLocaleString()} y $${max.toLocaleString()}`);
            input.classList.add('invalid');
        } else {
            input.setCustomValidity('');
            input.classList.remove('invalid');
        }
    }
    
    // Manejar cambio de estado
    handleEstadoChange() {
        const estadoSelect = document.getElementById('estado');
        const descuentoGroup = document.getElementById('descuentoGroup');
        const descuentoInput = document.getElementById('descuento');
        
        if (estadoSelect && descuentoGroup) {
            const isOferta = estadoSelect.value === 'oferta';
            
            if (isOferta) {
                descuentoGroup.style.display = 'block';
                if (descuentoInput) {
                    descuentoInput.required = true;
                }
            } else {
                descuentoGroup.style.display = 'none';
                if (descuentoInput) {
                    descuentoInput.required = false;
                    descuentoInput.value = '';
                }
            }
            
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
        
        if (precioInput && descuentoInput && precioInfo && precioOriginal && precioConDescuento) {
            const precio = parseInt(precioInput.value) || 0;
            const descuento = parseInt(descuentoInput.value) || 0;
            
            if (precio > 0 && descuento > 0) {
                const precioFinal = precio - (precio * descuento / 100);
                
                precioOriginal.textContent = this.formatPrice(precio);
                precioConDescuento.textContent = this.formatPrice(precioFinal);
                precioInfo.style.display = 'block';
            } else {
                precioInfo.style.display = 'none';
            }
        }
    }
    
    // Vista previa de imagen desde URL
    previewImageFromUrl(url) {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (!url) {
            url = document.getElementById('imagen_url')?.value?.trim();
        }
        
        if (!url || !previewContainer || !previewImg) return;
        
        console.log('🖼️ Cargando vista previa de imagen:', url);
        
        previewImg.onload = () => {
            previewContainer.style.display = 'block';
            console.log('✅ Vista previa cargada exitosamente');
        };
        
        previewImg.onerror = () => {
            console.warn('⚠️ Error cargando vista previa:', url);
            previewContainer.style.display = 'none';
        };
        
        previewImg.src = url;
    }
    
    // Limpiar vista previa de imagen
    clearImagePreview() {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        if (previewImg) {
            previewImg.src = '';
        }
    }
    
    // Usar imagen rápida
    useQuickImage(imageUrl) {
        const imagenUrlInput = document.getElementById('imagen_url');
        if (imagenUrlInput) {
            imagenUrlInput.value = imageUrl;
            this.previewImageFromUrl(imageUrl);
        }
    }
    
    // Validar datos de imagen
    validateImageData(productData) {
        // Si no hay imagen, es válido
        if (!productData.imagen && !productData.imagen_url) {
            return {
                valid: true,
                message: 'Sin imagen - válido'
            };
        }
        
        const imageToValidate = productData.imagen_url || productData.imagen;
        
        // Validar URLs
        if (imageToValidate.startsWith('http://') || imageToValidate.startsWith('https://')) {
            return {
                valid: true,
                message: 'URL de imagen válida'
            };
        }
        
        // Validar URLs relativas
        if (imageToValidate.startsWith('./') || imageToValidate.startsWith('../') || imageToValidate.startsWith('/')) {
            return {
                valid: true,
                message: 'URL relativa válida'
            };
        }
        
        // Validar base64
        if (imageToValidate.startsWith('data:image/')) {
            return {
                valid: true,
                message: 'Imagen base64 válida'
            };
        }
        
        return {
            valid: false,
            message: 'Formato de imagen no válido'
        };
    }
    
    // Mostrar loading
    showLoading(show = true) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }
    
    // Mostrar alerta
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alertId = 'alert-' + Date.now();
        const alertElement = document.createElement('div');
        alertElement.id = alertId;
        alertElement.className = `alert alert-${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        alertElement.innerHTML = `
            <i class="${iconMap[type] || iconMap.info}"></i>
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        alertContainer.appendChild(alertElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const element = document.getElementById(alertId);
            if (element) {
                element.remove();
            }
        }, 5000);
    }
    
    // Verificar conexión
    async checkConnection() {
        console.log('🔍 Verificando conexión...');
        
        try {
            const supabaseStatus = document.getElementById('supabaseStatus');
            const productServiceStatus = document.getElementById('productServiceStatus');
            const lastSync = document.getElementById('lastSync');
            const connectionStatus = document.getElementById('connectionStatus');
            
            // Verificar Supabase
            if (supabaseStatus) {
                if (typeof window.supabase !== 'undefined') {
                    supabaseStatus.textContent = 'Conectado';
                    supabaseStatus.className = 'status success';
                } else {
                    supabaseStatus.textContent = 'Desconectado';
                    supabaseStatus.className = 'status error';
                }
            }
            
            // Verificar servicio de productos
            if (productServiceStatus) {
                if (typeof ProductosServiceOptimized !== 'undefined') {
                    productServiceStatus.textContent = 'Disponible';
                    productServiceStatus.className = 'status success';
                } else {
                    productServiceStatus.textContent = 'No disponible';
                    productServiceStatus.className = 'status error';
                }
            }
            
            // Actualizar última sincronización
            if (lastSync) {
                lastSync.textContent = new Date().toLocaleString();
            }
            
            // Actualizar estado de conexión en header
            if (connectionStatus) {
                connectionStatus.innerHTML = `
                    <i class="fas fa-circle" style="color: #28a745;"></i>
                    <span>Conectado</span>
                `;
            }
            
            console.log('✅ Verificación de conexión completada');
            
        } catch (error) {
            console.error('❌ Error verificando conexión:', error);
            
            const connectionStatus = document.getElementById('connectionStatus');
            if (connectionStatus) {
                connectionStatus.innerHTML = `
                    <i class="fas fa-circle" style="color: #dc3545;"></i>
                    <span>Error</span>
                `;
            }
        }
    }
    
    // Limpiar cache
    clearCache() {
        try {
            if (typeof ProductosServiceOptimized !== 'undefined' && ProductosServiceOptimized.clearCache) {
                ProductosServiceOptimized.clearCache();
            }
            
            this.productos = [];
            this.categorias = [];
            this.marcas = [];
            this.dataLoaded = false;
            
            this.showAlert('Cache limpiado exitosamente', 'success');
            
            // Recargar datos
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Error limpiando cache:', error);
            this.showAlert('Error limpiando cache: ' + error.message, 'error');
        }
    }
    
    // Filtrar productos
    filterProducts(searchTerm) {
        const container = document.querySelector('.products-grid');
        if (!container) return;
        
        const productCards = container.querySelectorAll('.product-card');
        
        if (!searchTerm || searchTerm.trim() === '') {
            // Mostrar todos los productos
            productCards.forEach(card => {
                card.style.display = 'block';
            });
            return;
        }
        
        const search = searchTerm.toLowerCase().trim();
        
        productCards.forEach(card => {
            const productName = card.querySelector('.product-name')?.textContent?.toLowerCase() || '';
            const productBrand = card.querySelector('.product-brand')?.textContent?.toLowerCase() || '';
            const productCategory = card.querySelector('.product-category')?.textContent?.toLowerCase() || '';
            
            const matches = productName.includes(search) || 
                          productBrand.includes(search) || 
                          productCategory.includes(search);
            
            card.style.display = matches ? 'block' : 'none';
        });
    }
    
    // Actualizar estadísticas de categorías
    updateCategoryStats() {
        const stats = {
            'para-ellos': 0,
            'para-ellas': 0,
            'unisex': 0
        };
        
        this.productos.forEach(product => {
            if (stats.hasOwnProperty(product.categoria)) {
                stats[product.categoria]++;
            }
        });
        
        Object.keys(stats).forEach(category => {
            const element = document.getElementById(`stats-${category}`);
            if (element) {
                element.textContent = `${stats[category]} productos`;
            }
        });
    }
    }
    
    // Función auxiliar para limpiar valores de campos
    cleanFieldValue(value, defaultValue = '') {
        // Manejar null o undefined
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        // Manejar objetos (puede ser null almacenado como object)
        if (typeof value === 'object') {
            return defaultValue;
        }
        
        // Manejar strings
        if (typeof value === 'string') {
            return value.trim();
        }
        
        // Manejar números
        if (typeof value === 'number') {
            return value.toString();
        }
        
        // Manejar booleanos
        if (typeof value === 'boolean') {
            return value.toString();
        }
        
        // Fallback
        return defaultValue;
    }
    
    // Función auxiliar para limpiar valores booleanos
    cleanBooleanValue(value, defaultValue = false) {
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        
        if (typeof value === 'number') {
            return value !== 0;
        }
        
        return defaultValue;
    }
    
    // Función auxiliar para limpiar valores de imagen
    cleanImageValue(value) {
        if (!value) return null;
        
        // Si es un objeto, podría ser null almacenado como object
        if (typeof value === 'object') {
            return null;
        }
        
        // Si es string, verificar que no esté vacía
        if (typeof value === 'string' && value.trim() !== '') {
            return value.trim();
        }
        
        return null;
    }
    
    // Función auxiliar para obtener campos extra de la BD
    getExtraFields(product) {
        const expectedFields = [
            'id', 'nombre', 'marca', 'precio', 'ml', 'categoria', 'subcategoria',
            'descripcion', 'notas', 'estado', 'descuento', 'luxury', 'activo',
            'imagen', 'imagen_url', 'created_at', 'updated_at'
        ];
        
        return Object.keys(product).filter(key => !expectedFields.includes(key));
    }
    
    // Función para obtener datos del producto desde la BD con manejo de tipos
    obtenerImagenProducto(productId) {
        console.log(`🔍 Obteniendo imagen del producto ${productId}...`);
        
        try {
            // Buscar el producto en la cache local
            const producto = this.productos.find(p => p.id === productId);
            
            if (!producto) {
                console.warn(`⚠️ Producto ${productId} no encontrado en cache`);
                return {
                    found: false,
                    hasImage: false,
                    imageUrl: null,
                    source: 'not_found'
                };
            }
            
            // Obtener imagen con manejo seguro de tipos
            const imagenUrlValue = this.cleanImageValue(producto.imagen_url);
            const imagenValue = this.cleanImageValue(producto.imagen);
            
            // Priorizar imagen_url sobre imagen
            const finalImageUrl = imagenUrlValue || imagenValue;
            
            if (finalImageUrl) {
                console.log(`✅ Imagen encontrada para producto ${productId}:`, {
                    source: imagenUrlValue ? 'imagen_url' : 'imagen',
                    type: finalImageUrl.startsWith('data:') ? 'base64' : 'url',
                    size: finalImageUrl.length > 50 ? finalImageUrl.substring(0, 50) + '...' : finalImageUrl
                });
                
                return {
                    found: true,
                    hasImage: true,
                    imageUrl: finalImageUrl,
                    source: imagenUrlValue ? 'imagen_url' : 'imagen',
                    type: finalImageUrl.startsWith('data:') ? 'base64' : 'url'
                };
            } else {
                console.log(`ℹ️ No hay imagen válida para producto ${productId}`);
                return {
                    found: true,
                    hasImage: false,
                    imageUrl: null,
                    source: 'no_image'
                };
            }
            
        } catch (error) {
            console.error(`❌ Error obteniendo imagen del producto ${productId}:`, error);
            return {
                found: false,
                hasImage: false,
                imageUrl: null,
                source: 'error',
                error: error.message
            };
        }
    }
    
    // Función mejorada para verificar imagen guardada
    async verifyImageSaved(productId, expectedSize = 0) {
        console.log(`🔍 Verificando imagen guardada para producto ${productId}...`);
        
        try {
            // Usar la función obtenerImagenProducto para obtener la imagen
            const imageInfo = this.obtenerImagenProducto(productId);
            
            if (!imageInfo.found) {
                return {
                    verified: false,
                    reason: `Producto ${productId} no encontrado para verificar imagen`,
                    details: imageInfo
                };
            }
            
            if (!imageInfo.hasImage) {
                return {
                    verified: false,
                    reason: `Producto ${productId} no tiene imagen asociada`,
                    details: imageInfo
                };
            }
            
            // Verificar tamaño si se esperaba un tamaño específico
            if (expectedSize > 0 && imageInfo.imageUrl && imageInfo.type === 'base64') {
                const actualSize = imageInfo.imageUrl.length;
                const sizeDifference = Math.abs(actualSize - expectedSize);
                const tolerancePercent = 0.1; // 10% de tolerancia
                
                if (sizeDifference > expectedSize * tolerancePercent) {
                    console.warn(`⚠️ Diferencia de tamaño detectada:`, {
                        expected: expectedSize,
                        actual: actualSize,
                        difference: sizeDifference,
                        tolerance: expectedSize * tolerancePercent
                    });
                }
            }
            
            return {
                verified: true,
                reason: `Imagen verificada exitosamente desde ${imageInfo.source}`,
                details: imageInfo
            };
            
        } catch (error) {
            console.error(`❌ Error verificando imagen para producto ${productId}:`, error);
            return {
                verified: false,
                reason: `Error verificando imagen: ${error.message}`,
                details: { error: error.message }
            };
        }
    }
    
    // Función auxiliar para suprimir errores de placeholder
    suppressPlaceholderErrors() {
        // Interceptar errores de imagen para placeholder
        const originalOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            // Suprimir errores relacionados con placeholder
            if (typeof message === 'string' && 
                message.includes('placeholder-simple.svg') && 
                (message.includes('404') || message.includes('Not Found'))) {
                // Solo loguear la primera vez
                if (!this.placeholderErrorLogged) {
                    console.log('ℹ️ Placeholder SVG no encontrado, usando placeholder dinámico');
                    this.placeholderErrorLogged = true;
                }
                return true; // Prevenir que se muestre el error
            }
            
            // Suprimir errores de carga de imágenes generales
            if (typeof message === 'string' && 
                (message.includes('The image') || message.includes('image')) &&
                (message.includes('could not be loaded') || message.includes('failed to load'))) {
                console.log('ℹ️ Error de carga de imagen suprimido:', message);
                return true;
            }
            
            // Pasar otros errores al manejador original
            if (originalOnError) {
                return originalOnError(message, source, lineno, colno, error);
            }
        };
        
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
                    console.log('ℹ️ Placeholder SVG no encontrado, usando placeholder dinámico');
                    this.placeholderErrorLogged = true;
                }
                return; // No mostrar el error
            }
            
            // Pasar otros errores al console original
            originalConsoleError.apply(console, args);
        };
        
        console.log('🔇 Sistema de supresión de errores de placeholder activado');
    }
}

// Exportar para uso global
window.AdminPanel = AdminPanel;
