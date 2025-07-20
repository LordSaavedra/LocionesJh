// Panel de Administración - JavaScript Mejorado
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.productos = [];
        this.categorias = [];
        this.marcas = [];
        this.dataLoaded = false;
        this.loadingData = false;
        this.eventsConfigured = false;
        this.qrEventsConfigured = false; // Nueva bandera para eventos QR
        this.isSubmitting = false;
        this.isGeneratingQR = false; // Nueva bandera para generación QR
        
        // Cache para placeholders y control de errores
        this.placeholderCache = null;
        this.errorLogCache = new Set();
        this.errorLogCooldown = 5000;
        this.placeholderErrorLogged = false;
        
        // Sistema de ordenamiento temporal (pre-guardado)
        this.isOrderingMode = false;
        this.originalProductsOrder = [];
        this.tempProductsOrder = [];
        this.hasUnsavedChanges = false;
        
        this.init();
    }

    // Helper para obtener el cliente Supabase correcto
    getSupabaseClient() {
        // Orden de prioridad para encontrar el cliente
        const clients = [
            window.supabaseClient,
            window.supabase,
            typeof supabaseClient !== 'undefined' ? supabaseClient : null
        ];
        
        for (const client of clients) {
            if (client && typeof client.from === 'function') {
                console.log('✅ Cliente Supabase encontrado:', client.constructor?.name || 'Unknown');
                return client;
            }
        }
        
        console.error('❌ Clientes disponibles:', {
            'window.supabaseClient': typeof window.supabaseClient,
            'window.supabase': typeof window.supabase,
            'supabaseClient (global)': typeof supabaseClient
        });
        
        throw new Error('Cliente Supabase no está disponible o no inicializado correctamente');
    }

    async init() {
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
            
            // Inicializar controles de vista
            this.initViewControls();
            
            // Configurar generador QR
            this.setupQREvents();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Mostrar dashboard por defecto
            this.showSection('dashboard');
            
            console.log('✅ Panel de Administración listo');
            
        } catch (error) {
            console.error('❌ Error inicializando panel:', error);
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
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover active de todos los links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Agregar active al link clickeado
                link.classList.add('active');
                
                // Mostrar sección correspondiente
                const href = link.getAttribute('href');
                const section = href.substring(1);
                this.showSection(section);
            });
        });
    }

    // Configurar formularios
    setupForms() {
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                if (this.isSubmitting) {
                    console.warn('⚠️ Envío ya en progreso, ignorando...');
                    return;
                }
                
                this.handleProductSubmit(e);
            });
            
            productForm.addEventListener('reset', (e) => {
                setTimeout(() => {
                    this.setFormEditMode(false);
                    this.clearImagePreview();
                }, 100);
            });
        }
    }

    // Configurar eventos
    setupEvents() {
        if (this.eventsConfigured) return;
        
        // Configurar búsqueda
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }
        
        // Configurar botones de actualización
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllData());
        }
        
        const refreshProductsBtn = document.getElementById('refreshProducts');
        if (refreshProductsBtn) {
            refreshProductsBtn.addEventListener('click', () => this.reloadProducts());
        }
        
        // Configurar eventos de formulario
        const estadoSelect = document.getElementById('estado');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', () => this.handleEstadoChange());
        }
        
        const precioInput = document.getElementById('precio');
        if (precioInput) {
            precioInput.addEventListener('input', (e) => {
                this.validatePrice(e.target);
                this.updatePrecioConDescuento();
            });
        }
        
        const descuentoInput = document.getElementById('descuento');
        if (descuentoInput) {
            descuentoInput.addEventListener('input', () => this.updatePrecioConDescuento());
        }
        
        // Configurar vista previa de imagen
        const imagenUrlInput = document.getElementById('imagen_url');
        if (imagenUrlInput) {
            let previewTimeout;
            imagenUrlInput.addEventListener('input', (e) => {
                clearTimeout(previewTimeout);
                previewTimeout = setTimeout(() => {
                    const url = e.target.value.trim();
                    if (url) {
                        this.previewImageFromUrl(url);
                    } else {
                        this.clearImagePreview();
                    }
                }, 1000);
            });
        }
        
        // Inicializar controles de vista
        this.initViewControls();
        
        this.eventsConfigured = true;
    }

    // Mostrar sección
    showSection(sectionName) {
        console.log(`📄 Mostrando sección: ${sectionName}`);
        
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));

        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            this.loadSectionData(sectionName);
        }
    }

    // Cargar datos específicos de la sección
    async loadSectionData(sectionName) {
        if (!this.dataLoaded && !this.loadingData) {
            await this.loadInitialData();
        }
        
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboardDisplay();
                this.updateCategoryStats();
                break;
            case 'productos':
                await this.loadProductsData();
                break;
            case 'generador-qr':
                await this.loadProductsForQR();
                break;
            case 'configuracion':
                this.checkConnection();
                break;
            case 'categorias':
                this.updateCategoryStats();
                break;
        }
    }

    // Cargar datos iniciales
    async loadInitialData() {
        if (this.loadingData || this.dataLoaded) return;
        
        this.loadingData = true;
        
        try {
            this.showLoading(true);
            
            await this.loadProductos();
            await this.loadCategorias();
            await this.loadMarcas();
            
            this.dataLoaded = true;
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.productos = [];
            this.categorias = [];
            this.marcas = [];
        } finally {
            this.loadingData = false;
            this.showLoading(false);
        }
    }

    // Cargar productos
    async loadProductos() {
        try {
            if (typeof ProductosServiceOptimized !== 'undefined') {
                console.log('🔄 Cargando TODOS los productos para admin...');
                
                // Usar método específico para admin que carga todos los productos
                this.productos = await ProductosServiceOptimized.obtenerProductosAdmin(0);
                
                console.log('✅ Productos cargados en admin:', this.productos.length);
                
                // Si no se cargaron suficientes productos, intentar con el método genérico
                if (this.productos.length < 20) {
                    console.log('⚠️ Pocos productos cargados, intentando método alternativo...');
                    this.productos = await ProductosServiceOptimized.obtenerProductosOptimizado({ 
                        admin: true,
                        page: 0,
                        forceRefresh: true 
                    });
                    console.log('✅ Productos cargados (método alternativo):', this.productos.length);
                }
                
                // Ordenar productos por orden_display (si existe), luego por fecha_creacion
                this.productos.sort((a, b) => {
                    // Si ambos tienen orden_display, ordenar por ese campo
                    if (a.orden_display !== null && a.orden_display !== undefined &&
                        b.orden_display !== null && b.orden_display !== undefined) {
                        return a.orden_display - b.orden_display;
                    }
                    
                    // Si solo uno tiene orden_display, ese va primero
                    if (a.orden_display !== null && a.orden_display !== undefined) return -1;
                    if (b.orden_display !== null && b.orden_display !== undefined) return 1;
                    
                    // Si ninguno tiene orden_display, ordenar por fecha (más recientes primero)
                    const dateA = new Date(a.fecha_creacion || 0);
                    const dateB = new Date(b.fecha_creacion || 0);
                    return dateB - dateA;
                });
                
                console.log('📋 Productos ordenados:', this.productos.length);
                
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
        this.categorias = [
            { id: 1, nombre: 'Para Ellos', slug: 'para-ellos' },
            { id: 2, nombre: 'Para Ellas', slug: 'para-ellas' },
            { id: 3, nombre: 'Unisex', slug: 'unisex' }
        ];
    }

    // Cargar marcas
    async loadMarcas() {
        const marcasUnicas = [...new Set(this.productos.map(p => p.marca).filter(Boolean))];
        this.marcas = marcasUnicas.sort();
    }

    // Actualizar dashboard
    updateDashboardDisplay() {
        const totalProducts = this.productos.length;
        const activeProducts = this.productos.filter(p => this.cleanBooleanValue(p.activo, true)).length;
        const totalCategories = this.categorias.length;
        const totalBrands = this.marcas.length;

        this.updateDashboardCard('total-productos', totalProducts);
        this.updateDashboardCard('productos-activos', activeProducts);
        this.updateDashboardCard('total-categorias', totalCategories);
        this.updateDashboardCard('total-marcas', totalBrands);
        
        // Actualizar info del sistema
        const loadedProducts = document.getElementById('loadedProducts');
        if (loadedProducts) {
            loadedProducts.textContent = totalProducts;
        }
    }

    // Actualizar card del dashboard
    updateDashboardCard(cardType, value) {
        const card = document.querySelector(`[data-card="${cardType}"] .number`);
        if (card) {
            card.textContent = value;
        }
    }

    // Recargar productos
    async reloadProducts() {
        try {
            this.showLoading(true);
            
            if (typeof ProductosServiceOptimized !== 'undefined' && ProductosServiceOptimized.clearCache) {
                ProductosServiceOptimized.clearCache();
            }
            
            this.dataLoaded = false;
            await this.loadInitialData();
            
            if (this.currentSection === 'productos') {
                await this.loadProductsData();
            } else if (this.currentSection === 'dashboard') {
                this.updateDashboardDisplay();
            }
            
            this.showAlert('Productos recargados correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error recargando productos:', error);
            this.showAlert('Error recargando productos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Refrescar todos los datos
    async refreshAllData() {
        try {
            this.showLoading(true);
            
            await this.loadInitialData();
            await this.loadSectionData(this.currentSection);
            
            this.showAlert('Datos actualizados correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error refrescando datos:', error);
            this.showAlert('Error refrescando datos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Obtener placeholder
    getPlaceholderImagePath() {
        const staticPlaceholder = './IMAGENES/placeholder-simple.svg';
        
        if (!this.placeholderCache) {
            this.placeholderCache = this.generatePlaceholderDataURL();
        }
        
        return staticPlaceholder;
    }

    // Generar placeholder dinámico
    generatePlaceholderDataURL(width = 300, height = 300, text = "Sin imagen") {
        try {
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
            
            // Texto
            ctx.fillStyle = '#6c757d';
            ctx.font = `${Math.max(12, width * 0.04)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2);
            
            return canvas.toDataURL('image/png');
            
        } catch (error) {
            return 'data:image/svg+xml;base64,' + btoa(`
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#6c757d">${text}</text>
                </svg>
            `);
        }
    }

    // Obtener ruta de imagen
    getImagePath(product) {
        const getImageValue = (imageField) => {
            if (!imageField) return null;
            if (typeof imageField === 'object') return null;
            if (typeof imageField === 'string' && imageField.trim() !== '') {
                return imageField.trim();
            }
            return null;
        };
        
        const imagen_url = getImageValue(product.imagen_url);
        if (imagen_url) return imagen_url;
        
        const imagen = getImageValue(product.imagen);
        if (imagen) return imagen;
        
        return this.getPlaceholderImagePath();
    }

    // Cargar datos de productos para mostrar
    async loadProductsData() {
        if (this.currentView === 'grid') {
            await this.loadProductsGrid();
        } else {
            await this.loadProductsTable();
        }
    }

    // Cargar productos en vista de grid (tarjetas)
    async loadProductsGrid() {
        const container = document.querySelector('.products-grid');
        if (!container) return;

        try {
            if (this.productos.length === 0) {
                await this.loadProductos();
            }

            console.log('🔍 Productos cargados en grid:', this.productos.length);

            if (this.productos.length === 0) {
                container.innerHTML = `
                    <div class="no-products">
                        No hay productos disponibles.
                        <div style="margin-top: 10px;">
                            <button class="btn btn-secondary" onclick="adminPanel.reloadProducts()">
                                🔄 Recargar Productos
                            </button>
                        </div>
                    </div>`;
                return;
            }

            const productsHTML = this.productos.map(product => {
                const imageSrc = this.getImagePath(product);
                const productName = this.cleanFieldValue(product.nombre, 'Producto sin nombre');
                const productBrand = this.cleanFieldValue(product.marca, '');
                const placeholderSrc = this.getPlaceholderImagePath();
                
                return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${imageSrc}" 
                             alt="${productName}"
                             onerror="this.src='${placeholderSrc}'"
                             loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${productName}</h3>
                        <p class="product-brand">${productBrand}</p>
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
            this.updateProductsCount(this.productos.length);
            
        } catch (error) {
            console.error('❌ Error en loadProductsGrid:', error);
            container.innerHTML = `<div class="no-products error">Error cargando productos: ${error.message}</div>`;
        }
    }

    // Cargar productos en vista de tabla
    async loadProductsTable() {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;

        try {
            if (this.productos.length === 0) {
                await this.loadProductos();
            }

            console.log('🔍 Productos cargados en tabla:', this.productos.length);

            if (this.productos.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="no-products">
                                No hay productos disponibles.
                                <div style="margin-top: 10px;">
                                    <button class="btn btn-secondary" onclick="adminPanel.reloadProducts()">
                                        🔄 Recargar Productos
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>`;
                return;
            }

            const productsHTML = this.productos.map(product => {
                const imageSrc = this.getImagePath(product);
                const productName = this.cleanFieldValue(product.nombre, 'Producto sin nombre');
                const productBrand = this.cleanFieldValue(product.marca, '');
                const placeholderSrc = this.getPlaceholderImagePath();
                const stockClass = this.getStockClass(product.stock);
                
                return `
                <tr>
                    <td>
                        ${imageSrc ? 
                            `<img src="${imageSrc}" 
                                 alt="${productName}"
                                 class="table-product-image"
                                 onerror="this.src='${placeholderSrc}'"
                                 loading="lazy">` :
                            `<div class="table-product-image no-image">
                                <i class="fas fa-image"></i>
                            </div>`
                        }
                    </td>
                    <td>
                        <div class="table-product-name">${productName}</div>
                        <div class="table-product-description">${this.cleanFieldValue(product.descripcion, '')}</div>
                    </td>
                    <td class="table-product-brand">${productBrand}</td>
                    <td>
                        <div class="table-product-price">$${this.formatPrice(product.precio)}</div>
                        ${product.descuento ? `<div class="table-product-discount">-${product.descuento}%</div>` : ''}
                    </td>
                    <td>
                        <span class="table-category-badge ${product.categoria}">${this.getCategoryName(product.categoria)}</span>
                    </td>
                    <td>
                        <span class="table-stock ${stockClass}">${product.stock || 0}</span>
                    </td>
                    <td>
                        <span class="table-status-badge ${product.estado}">${product.estado || 'disponible'}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="table-action-btn edit" onclick="adminPanel.editProduct(${product.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="table-action-btn delete" onclick="adminPanel.deleteProduct(${product.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');

            tableBody.innerHTML = productsHTML;
            this.updateProductsCount(this.productos.length);
            this.updateProductsCount(this.productos.length);
            
        } catch (error) {
            console.error('❌ Error en loadProductsTable:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center error">Error cargando productos: ${error.message}</td></tr>`;
        }
    }

    // Obtener clase CSS para el stock
    getStockClass(stock) {
        const stockNum = parseInt(stock) || 0;
        if (stockNum <= 5) return 'low-stock';
        if (stockNum <= 15) return 'medium-stock';
        return 'high-stock';
    }

    // Obtener nombre de categoría
    getCategoryName(category) {
        const categories = {
            'para-ellos': 'Para Ellos',
            'para-ellas': 'Para Ellas',
            'unisex': 'Unisex'
        };
        return categories[category] || category;
    }

    // Obtener badge de estado
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

    // Obtener información de precio
    getPrecioInfo(product) {
        const precio = this.cleanFieldValue(product.precio, 0);
        const estado = this.cleanFieldValue(product.estado, 'disponible');
        const descuento = this.cleanFieldValue(product.descuento, 0);
        
        const precioNum = parseInt(precio) || 0;
        const descuentoNum = parseInt(descuento) || 0;
        
        if (estado === 'oferta' && descuentoNum > 0) {
            const precioConDescuento = precioNum - (precioNum * descuentoNum / 100);
            return `
                <div class="precio-con-descuento">
                    <span class="precio-original">$${this.formatPrice(precioNum)}</span>
                    <span class="precio-oferta">$${this.formatPrice(precioConDescuento)}</span>
                    <span class="descuento-badge">-${descuentoNum}%</span>
                </div>
            `;
        } else {
            return `$${this.formatPrice(precioNum)}`;
        }
    }

    // Formatear precio
    formatPrice(price) {
        if (!price) return '0';
        return new Intl.NumberFormat('es-CO').format(price);
    }

    // Manejar envío del formulario
    async handleProductSubmit(e) {
        if (this.isSubmitting) return;
        
        this.isSubmitting = true;
        
        try {
            this.showLoading(true);
            
            const formData = new FormData(e.target);
            const isEditMode = e.target.dataset.editId;
            const productId = isEditMode ? parseInt(e.target.dataset.editId) : null;
            
            // Validar campos requeridos
            const nombre = formData.get('nombre');
            const marca = formData.get('marca');
            const precio = formData.get('precio');
            const categoria = formData.get('categoria');
            
            if (!nombre || !marca || !precio || !categoria) {
                throw new Error('Por favor completa todos los campos requeridos');
            }
            
            // Preparar datos del producto
            const productData = {
                nombre: nombre.trim(),
                marca: marca.trim(),
                precio: parseInt(precio),
                ml: parseInt(formData.get('ml')) || 100,
                stock: parseInt(formData.get('stock')) || 0,
                categoria: categoria,
                subcategoria: formData.get('subcategoria') || null,
                descripcion: formData.get('descripcion') || '',
                notas: formData.get('notas') || '',
                estado: formData.get('estado') || 'disponible',
                descuento: parseInt(formData.get('descuento')) || null,
                luxury: formData.get('luxury') === 'on',
                activo: formData.get('activo') === 'on'
            };
            
            // Manejar imagen
            const imagenUrl = document.getElementById('imagen_url')?.value?.trim();
            if (imagenUrl) {
                productData.imagen = imagenUrl;
                productData.imagen_url = imagenUrl;
            }
            
            // Guardar o actualizar producto
            let result;
            if (isEditMode) {
                result = await this.updateProduct(productId, productData);
            } else {
                result = await this.saveProduct(productData);
            }
            
            if (result) {
                e.target.reset();
                
                if (isEditMode) {
                    this.setFormEditMode(false);
                }
                
                await this.loadProductos();
                if (this.currentSection === 'productos') {
                    await this.loadProductsData();
                }
                
                this.updateDashboardDisplay();
                this.updateCategoryStats();
                
                const action = isEditMode ? 'actualizado' : 'guardado';
                this.showAlert(`Producto ${action} exitosamente`, 'success');
                
                this.showSection('productos');
            }
            
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            this.showAlert('Error guardando producto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            this.isSubmitting = false;
        }
    }

    // Guardar producto
    async saveProduct(productData) {
        try {
            if (typeof ProductosServiceOptimized === 'undefined') {
                throw new Error('Servicio de productos no disponible');
            }
            
            const result = await ProductosServiceOptimized.crearProducto(productData);
            return result;
            
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            throw error;
        }
    }

    // Actualizar producto
    async updateProduct(productId, productData) {
        try {
            if (typeof ProductosServiceOptimized === 'undefined') {
                throw new Error('Servicio de productos no disponible');
            }
            
            const result = await ProductosServiceOptimized.updateProduct(productId, productData);
            return result;
            
        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            throw error;
        }
    }

    // Editar producto
    async editProduct(productId) {
        try {
            const product = this.productos.find(p => p.id === productId);
            if (!product) {
                this.showAlert('Producto no encontrado', 'error');
                return;
            }
            
            this.showSection('agregar-producto');
            this.populateEditForm(product);
            this.setFormEditMode(true, productId);
            
        } catch (error) {
            console.error('❌ Error editando producto:', error);
            this.showAlert('Error editando producto: ' + error.message, 'error');
        }
    }

    // Poblar formulario de edición
    populateEditForm(product) {
        const safeSetValue = (id, value, defaultValue = '') => {
            const element = document.getElementById(id);
            if (element) {
                const cleanValue = this.cleanFieldValue(value, defaultValue);
                
                if (element.type === 'checkbox') {
                    element.checked = this.cleanBooleanValue(cleanValue);
                } else {
                    element.value = cleanValue;
                }
            }
        };
        
        // Poblar campos básicos
        safeSetValue('nombre', product.nombre);
        safeSetValue('marca', product.marca);
        safeSetValue('precio', product.precio);
        safeSetValue('ml', product.ml || 100);
        safeSetValue('categoria', product.categoria);
        safeSetValue('subcategoria', product.subcategoria);
        safeSetValue('descripcion', product.descripcion);
        safeSetValue('notas', product.notas);
        safeSetValue('estado', product.estado, 'disponible');
        safeSetValue('descuento', product.descuento);
        
        // Manejar checkboxes
        const luxuryCheckbox = document.getElementById('luxury');
        if (luxuryCheckbox) {
            luxuryCheckbox.checked = this.cleanBooleanValue(product.luxury);
        }
        
        const activoCheckbox = document.getElementById('activo');
        if (activoCheckbox) {
            activoCheckbox.checked = this.cleanBooleanValue(product.activo, true);
        }
        
        // Manejar imagen
        const imagenUrl = this.cleanImageValue(product.imagen_url) || this.cleanImageValue(product.imagen);
        if (imagenUrl) {
            safeSetValue('imagen_url', imagenUrl);
            if (!imagenUrl.startsWith('data:')) {
                this.previewImageFromUrl(imagenUrl);
            }
        }
        
        this.handleEstadoChange();
    }

    // Establecer modo de edición
    setFormEditMode(isEditMode, productId = null) {
        const form = document.getElementById('productForm');
        const title = document.querySelector('#agregar-producto .section-title');
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        
        if (isEditMode) {
            form.dataset.editId = productId;
            if (title) title.innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
        } else {
            delete form.dataset.editId;
            if (title) title.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Nuevo Producto';
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Producto';
        }
    }

    // Eliminar producto
    async deleteProduct(productId) {
        const product = this.productos.find(p => p.id === productId);
        const productName = product ? product.nombre : `ID ${productId}`;
        
        // Mostrar modal de confirmación personalizado
        const confirmed = await this.showDeleteConfirmModal(productName, productId);
        if (!confirmed) {
            return;
        }

        try {
            this.showLoading(true);
            
            if (typeof ProductosServiceOptimized === 'undefined') {
                throw new Error('Servicio de productos no disponible');
            }

            const result = await ProductosServiceOptimized.deleteProduct(productId);
            
            if (result) {
                this.showAlert('Producto eliminado exitosamente', 'success');
                
                await this.loadProductos();
                if (this.currentSection === 'productos') {
                    await this.loadProductsData();
                }
                
                this.updateDashboardDisplay();
                this.updateCategoryStats();
            }
            
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            this.showAlert('Error eliminando producto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Funciones auxiliares para limpiar datos
    cleanFieldValue(value, defaultValue = '') {
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'object') return defaultValue;
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        return defaultValue;
    }

    cleanBooleanValue(value, defaultValue = false) {
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.toLowerCase() === 'true';
        if (typeof value === 'number') return value !== 0;
        return defaultValue;
    }

    cleanImageValue(value) {
        if (!value) return null;
        if (typeof value === 'object') return null;
        if (typeof value === 'string' && value.trim() !== '') return value.trim();
        return null;
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
            
            descuentoGroup.style.display = isOferta ? 'block' : 'none';
            if (descuentoInput) {
                descuentoInput.required = isOferta;
                if (!isOferta) descuentoInput.value = '';
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

    // Actualizar indicador de cantidad de productos
    updateProductsCount(count) {
        const indicator = document.getElementById('productsCountIndicator');
        const countText = document.getElementById('productsCountText');
        
        if (indicator && countText) {
            if (count > 0) {
                countText.textContent = `Mostrando ${count} producto${count === 1 ? '' : 's'} en vista ${this.currentView === 'grid' ? 'de tarjetas' : 'de lista'}`;
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        }
    }

    // Vista previa de imagen
    previewImageFromUrl(url) {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (!url) {
            url = document.getElementById('imagen_url')?.value?.trim();
        }
        
        if (!url || !previewContainer || !previewImg) return;
        
        previewImg.onload = () => {
            previewContainer.style.display = 'block';
        };
        
        previewImg.onerror = () => {
            previewContainer.style.display = 'none';
        };
        
        previewImg.src = url;
    }

    // Limpiar vista previa
    clearImagePreview() {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) previewImg.src = '';
    }

    // Usar imagen rápida
    useQuickImage(imageUrl) {
        const imagenUrlInput = document.getElementById('imagen_url');
        if (imagenUrlInput) {
            imagenUrlInput.value = imageUrl;
            this.previewImageFromUrl(imageUrl);
        }
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
        
        setTimeout(() => {
            const element = document.getElementById(alertId);
            if (element) element.remove();
        }, 5000);
    }

    // Modal de confirmación de eliminación
    showDeleteConfirmModal(productName, productId) {
        return new Promise((resolve) => {
            const modal = document.getElementById('deleteConfirmModal');
            const productNameElement = document.getElementById('deleteProductName');
            const confirmBtn = document.getElementById('confirmDelete');
            const cancelBtn = document.getElementById('cancelDelete');
            
            if (!modal || !productNameElement || !confirmBtn || !cancelBtn) {
                console.error('Elementos del modal de confirmación no encontrados');
                resolve(false);
                return;
            }
            
            // Configurar el nombre del producto
            productNameElement.textContent = productName;
            
            // Mostrar modal con animación
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // Función para cerrar modal
            const closeModal = (confirmed) => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
                resolve(confirmed);
                
                // Limpiar event listeners
                confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            };
            
            // Event listeners
            document.getElementById('confirmDelete').addEventListener('click', () => {
                closeModal(true);
            });
            
            document.getElementById('cancelDelete').addEventListener('click', () => {
                closeModal(false);
            });
            
            // Cerrar al hacer click en el overlay
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(false);
                }
            });
            
            // Cerrar con Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    // Verificar conexión
    async checkConnection() {
        try {
            const supabaseStatus = document.getElementById('supabaseStatus');
            const productServiceStatus = document.getElementById('productServiceStatus');
            const lastSync = document.getElementById('lastSync');
            const connectionStatus = document.getElementById('connectionStatus');
            
            // Verificar Supabase más detalladamente
            const isSupabaseAvailable = this.isSupabaseAvailable();
            
            if (supabaseStatus) {
                supabaseStatus.textContent = isSupabaseAvailable ? 'Conectado' : 'Desconectado';
                supabaseStatus.className = isSupabaseAvailable ? 'status success' : 'status error';
            }
            
            if (productServiceStatus) {
                productServiceStatus.textContent = typeof ProductosServiceOptimized !== 'undefined' ? 'Disponible' : 'No disponible';
                productServiceStatus.className = typeof ProductosServiceOptimized !== 'undefined' ? 'status success' : 'status error';
            }
            
            if (lastSync) {
                lastSync.textContent = new Date().toLocaleString();
            }
            
            if (connectionStatus) {
                connectionStatus.innerHTML = `
                    <i class="fas fa-circle" style="color: ${isSupabaseAvailable ? '#28a745' : '#dc3545'};"></i>
                    <span>${isSupabaseAvailable ? 'Conectado' : 'Desconectado'}</span>
                `;
            }
            
        } catch (error) {
            console.error('❌ Error verificando conexión:', error);
        }
    }

    // Verificar si Supabase está disponible y correctamente inicializado
    isSupabaseAvailable() {
        return typeof window.supabase !== 'undefined' && 
               window.supabase !== null && 
               typeof window.supabase.from === 'function';
    }

    // Diagnosticar estado de Supabase (para debugging)
    diagnoseSupabaseStatus() {
        const status = {
            isDefined: typeof window.supabase !== 'undefined',
            isNotNull: window.supabase !== null,
            hasFromFunction: false,
            hasAuthProperty: false,
            actualType: typeof window.supabase,
            keys: []
        };

        if (window.supabase) {
            status.hasFromFunction = typeof window.supabase.from === 'function';
            status.hasAuthProperty = 'auth' in window.supabase;
            status.keys = Object.keys(window.supabase);
        }

        console.log('🔍 Diagnóstico de Supabase:', status);
        return status;
    }

    // Función de prueba para diagnosticar Supabase
    testSupabaseConnection() {
        console.log('🧪 === PRUEBA DE CONEXIÓN SUPABASE ===');
        
        // Diagnosticar estado
        const diagnosis = this.diagnoseSupabaseStatus();
        
        // Mostrar información detallada
        console.log('📊 Estado detallado:', {
            windowSupabase: window.supabase,
            isAvailable: this.isSupabaseAvailable(),
            diagnosis: diagnosis
        });

        // Intentar una consulta simple si está disponible
        if (this.isSupabaseAvailable()) {
            console.log('✅ Supabase parece estar disponible, intentando consulta de prueba...');
            
            window.supabase
                .from('productos')
                .select('id, nombre')
                .limit(1)
                .then(({ data, error }) => {
                    if (error) {
                        console.error('❌ Error en consulta de prueba:', error);
                    } else {
                        console.log('✅ Consulta de prueba exitosa:', data);
                    }
                })
                .catch((err) => {
                    console.error('❌ Error ejecutando consulta:', err);
                });
        } else {
            console.error('❌ Supabase no está disponible');
            this.showAlert('Supabase no está inicializado correctamente. Verifica la configuración.', 'error');
        }
        
        console.log('🧪 === FIN PRUEBA SUPABASE ===');
        return diagnosis;
    }

    // Buscar QR específico con debugging detallado
    async searchQRById(qrId) {
        console.log('🔍 === BÚSQUEDA DETALLADA DE QR ===');
        console.log('🎯 QR ID a buscar:', qrId);
        
        const searchResults = {
            qrService: null,
            supabase: null,
            localStorage: null,
            found: false,
            activeStatus: null
        };

        // 1. Buscar en QRService
        if (typeof window.QRService !== 'undefined') {
            try {
                console.log('🔍 Buscando en QRService...');
                const allQRs = await window.QRService.getAllQRs();
                console.log('📊 Total QRs en QRService:', allQRs.length);
                
                const qrFound = allQRs.find(qr => qr.id === qrId);
                searchResults.qrService = qrFound || 'No encontrado';
                
                if (qrFound) {
                    console.log('✅ QR encontrado en QRService:', qrFound);
                    searchResults.found = true;
                    searchResults.activeStatus = qrFound.activo;
                }
            } catch (error) {
                console.error('❌ Error buscando en QRService:', error);
                searchResults.qrService = 'Error: ' + error.message;
            }
        } else {
            console.log('⚠️ QRService no disponible');
            searchResults.qrService = 'Servicio no disponible';
        }

        // 2. Buscar en Supabase
        if (this.isSupabaseAvailable()) {
            try {
                console.log('🔍 Buscando en Supabase...');
                const { data, error } = await window.supabase
                    .from('qr_codes')
                    .select(`
                        codigo_qr,
                        url_verificacion,
                        lote,
                        fecha_produccion,
                        notas,
                        activo,
                        producto_id
                    `)
                    .eq('codigo_qr', qrId);

                if (error) {
                    console.error('❌ Error consultando Supabase:', error);
                    searchResults.supabase = 'Error: ' + error.message;
                } else {
                    console.log('📊 Resultado Supabase:', data);
                    
                    if (data && data.length > 0) {
                        const qrData = data[0];
                        searchResults.supabase = qrData;
                        searchResults.found = true;
                        searchResults.activeStatus = qrData.activo;
                        console.log('✅ QR encontrado en Supabase:', qrData);
                        console.log('🔒 Estado activo:', qrData.activo);
                    } else {
                        searchResults.supabase = 'No encontrado';
                        console.log('❌ QR no encontrado en Supabase');
                    }
                }
            } catch (error) {
                console.error('❌ Error accediendo a Supabase:', error);
                searchResults.supabase = 'Error de conexión: ' + error.message;
            }
        } else {
            console.log('⚠️ Supabase no disponible');
            searchResults.supabase = 'Supabase no disponible';
        }

        // 3. Buscar en localStorage
        try {
            console.log('🔍 Buscando en localStorage...');
            const qrHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');
            console.log('📊 Total QRs en localStorage:', qrHistory.length);
            
            if (qrHistory.length > 0) {
                console.log('📋 Lista de QR IDs en localStorage:', qrHistory.map(qr => qr.id));
            }
            
            const localQR = qrHistory.find(qr => qr.id === qrId);
            searchResults.localStorage = localQR || 'No encontrado';
            
            if (localQR) {
                console.log('✅ QR encontrado en localStorage:', localQR);
                searchResults.found = true;
                searchResults.activeStatus = localQR.activo !== undefined ? localQR.activo : true;
            } else {
                console.log('❌ QR no encontrado en localStorage');
            }
        } catch (error) {
            console.error('❌ Error accediendo a localStorage:', error);
            searchResults.localStorage = 'Error: ' + error.message;
        }

        // Resumen final
        console.log('📊 === RESUMEN DE BÚSQUEDA ===');
        console.log('🎯 QR ID:', qrId);
        console.log('✅ Encontrado:', searchResults.found);
        console.log('🔒 Estado activo:', searchResults.activeStatus);
        console.log('📍 Resultados por fuente:', searchResults);
        console.log('🔍 === FIN BÚSQUEDA DETALLADA ===');

        return searchResults;
    }

    // Verificar estado específico de un QR (para usar desde consola)
    async checkQRStatus(qrId) {
        console.log(`🔍 === VERIFICACIÓN DE ESTADO QR: ${qrId} ===`);
        
        const results = await this.searchQRById(qrId);
        
        // Mostrar resumen en formato fácil de leer
        if (results.found) {
            console.log('✅ QR ENCONTRADO');
            console.log('🔒 Estado activo:', results.activeStatus);
            
            if (results.activeStatus === false) {
                console.log('❌ PROBLEMA: El QR está marcado como INACTIVO');
                console.log('💡 Solución: Activar el QR en la base de datos');
            } else if (results.activeStatus === true) {
                console.log('✅ El QR está ACTIVO y debería funcionar');
            } else if (results.activeStatus === null || results.activeStatus === undefined) {
                console.log('⚠️ Estado activo no definido (se asume ACTIVO)');
            }
            
            // Mostrar dónde se encontró
            const sources = [];
            if (results.qrService && typeof results.qrService === 'object') sources.push('QRService');
            if (results.supabase && typeof results.supabase === 'object') sources.push('Supabase');
            if (results.localStorage && typeof results.localStorage === 'object') sources.push('localStorage');
            
            console.log('📍 Fuentes donde se encontró:', sources.join(', '));
        } else {
            console.log('❌ QR NO ENCONTRADO en ninguna fuente');
            console.log('💡 Posibles causas:');
            console.log('  - ID incorrecto');
            console.log('  - QR eliminado');
            console.log('  - Problemas de conectividad');
        }
        
        console.log('🔍 === FIN VERIFICACIÓN ===');
        
        // Mostrar alerta visual también
        if (results.found) {
            let productInfo = '';
            // Obtener información del producto para mostrar en la alerta
            if (results.qrService && typeof results.qrService === 'object') {
                const qrData = results.qrService;
                if (typeof qrData.producto === 'object') {
                    productInfo = qrData.producto.nombre || 'Producto desconocido';
                } else {
                    productInfo = qrData.producto || 'Producto desconocido';
                }
            } else if (results.supabase && typeof results.supabase === 'object') {
                productInfo = 'Producto en Supabase';
            } else if (results.localStorage && typeof results.localStorage === 'object') {
                const qrData = results.localStorage;
                if (typeof qrData.producto === 'object') {
                    productInfo = qrData.producto.nombre || 'Producto desconocido';
                } else {
                    productInfo = qrData.producto || 'Producto desconocido';
                }
            }
            
            if (results.activeStatus === false) {
                this.showAlert(`QR "${qrId}" encontrado pero está INACTIVO - Producto: ${productInfo}`, 'warning');
            } else {
                this.showAlert(`QR "${qrId}" encontrado y está ACTIVO - Producto: ${productInfo}`, 'success');
            }
        } else {
            this.showAlert(`QR "${qrId}" NO ENCONTRADO en ninguna fuente`, 'error');
        }
        
        return results;
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
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Error limpiando cache:', error);
            this.showAlert('Error limpiando cache: ' + error.message, 'error');
        }
    }

    // Filtrar productos
    filterProducts(searchTerm) {
        // Detectar vista activa
        const gridContainer = document.querySelector('.products-grid');
        const tableBody = document.getElementById('productsTableBody');
        
        if (!searchTerm || searchTerm.trim() === '') {
            // Mostrar todos los elementos
            if (gridContainer) {
                const productCards = gridContainer.querySelectorAll('.product-card');
                productCards.forEach(card => card.style.display = 'block');
            }
            if (tableBody) {
                const tableRows = tableBody.querySelectorAll('tr');
                tableRows.forEach(row => row.style.display = '');
            }
            return;
        }
        
        const search = searchTerm.toLowerCase().trim();
        
        // Filtrar vista de tarjetas
        if (gridContainer) {
            const productCards = gridContainer.querySelectorAll('.product-card');
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
        
        // Filtrar vista de tabla
        if (tableBody) {
            const tableRows = tableBody.querySelectorAll('tr');
            tableRows.forEach(row => {
                const productName = row.querySelector('.table-product-name')?.textContent?.toLowerCase() || '';
                const productBrand = row.querySelector('.table-product-brand')?.textContent?.toLowerCase() || '';
                const categoryBadge = row.querySelector('.table-category-badge')?.textContent?.toLowerCase() || '';
                const productDescription = row.querySelector('.table-product-description')?.textContent?.toLowerCase() || '';
                
                const matches = productName.includes(search) || 
                              productBrand.includes(search) || 
                              categoryBadge.includes(search) ||
                              productDescription.includes(search);
                
                row.style.display = matches ? '' : 'none';
            });
        }
    }

    // Actualizar estadísticas de categorías
    updateCategoryStats() {
        const stats = {
            'para-ellos': 0,
            'para-ellas': 0,
            'unisex': 0
        };
        
        this.productos.forEach(product => {
            const categoria = this.cleanFieldValue(product.categoria);
            if (stats.hasOwnProperty(categoria)) {
                stats[categoria]++;
            }
        });
        
        Object.keys(stats).forEach(category => {
            const element = document.getElementById(`stats-${category}`);
            if (element) {
                element.textContent = `${stats[category]} productos`;
            }
        });
    }

    // Suprimir errores de placeholder
    suppressPlaceholderErrors() {
        const originalOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            if (typeof message === 'string' && 
                message.includes('placeholder-simple.svg') && 
                (message.includes('404') || message.includes('Not Found'))) {
                if (!this.placeholderErrorLogged) {
                    console.log('ℹ️ Placeholder SVG no encontrado, usando placeholder dinámico');
                    this.placeholderErrorLogged = true;
                }
                return true;
            }
            
            if (originalOnError) {
                return originalOnError(message, source, lineno, colno, error);
            }
        };
    }

    // Inicializar controles de vista
    initViewControls() {
        this.currentView = 'grid'; // Vista por defecto
        
        // Configurar eventos de cambio de vista
        const gridViewBtn = document.getElementById('gridView');
        const tableViewBtn = document.getElementById('tableView');
        
        if (gridViewBtn && tableViewBtn) {
            gridViewBtn.addEventListener('click', () => this.switchView('grid'));
            tableViewBtn.addEventListener('click', () => this.switchView('table'));
        }
    }

    // Cambiar vista entre grid y table
    switchView(view) {
        this.currentView = view;
        
        // Actualizar botones activos
        document.querySelectorAll('.view-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (view === 'grid') {
            document.getElementById('gridView').classList.add('active');
            document.getElementById('productsGrid').style.display = 'grid';
            document.getElementById('productsTable').style.display = 'none';
        } else {
            document.getElementById('tableView').classList.add('active');
            document.getElementById('productsGrid').style.display = 'none';
            document.getElementById('productsTable').style.display = 'block';
        }
        
        // Recargar productos en la vista actual
        this.loadProductsData();
    }

    // ===============================================
    // FUNCIONES DEL GENERADOR QR
    // ===============================================

    // Configurar eventos del generador QR
    setupQREvents() {
        if (this.qrEventsConfigured) return; // Evitar configurar múltiples veces
        
        console.log('🔧 Configurando eventos del generador QR...');
        
        // Formulario de generación QR
        const qrForm = document.getElementById('qrGeneratorForm');
        if (qrForm) {
            qrForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateQRCode();
            });
        }

        this.qrEventsConfigured = true; // Marcar como configurado
        
        // Cargar productos en el selector
        this.loadProductsForQR();
    }

    // Cargar productos en el selector QR
    async loadProductsForQR() {
        const select = document.getElementById('qr-producto');
        if (!select) return;

        try {
            if (this.productos.length === 0) {
                await this.loadProductos();
            }

            // Limpiar opciones existentes excepto la primera
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            // Agregar productos
            this.productos.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.nombre} - ${product.marca}`;
                select.appendChild(option);
            });

            console.log(`✅ ${this.productos.length} productos cargados en selector QR`);

        } catch (error) {
            console.error('❌ Error cargando productos para QR:', error);
        }
    }

    // Generar código QR
    async generateQRCode() {
        // Evitar ejecuciones múltiples simultáneas
        if (this.isGeneratingQR) {
            console.warn('⚠️ Generación QR ya en progreso, ignorando...');
            return;
        }
        
        this.isGeneratingQR = true;
        
        try {
            console.log('🔄 Iniciando generación de QR...');
            this.showLoading(true);

            // Verificar que la librería QR esté disponible
            const QRCodeLib = window.QRCodeLib || window.QRCode || window.qrcode;
            if (!QRCodeLib) {
                throw new Error('Librería QR no encontrada. Por favor, recarga la página e intenta nuevamente.');
            }
            console.log('✅ Librería QR disponible:', typeof QRCodeLib);

            const form = document.getElementById('qrGeneratorForm');
            const formData = new FormData(form);
            
            const productId = formData.get('producto');
            const lote = formData.get('lote') || '';
            const fechaProduccion = formData.get('fecha_produccion') || '';
            const cantidad = parseInt(formData.get('cantidad')) || 1;
            const notas = formData.get('notas') || '';

            if (!productId) {
                throw new Error('Debe seleccionar un producto');
            }

            const product = this.productos.find(p => p.id == productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            // Generar ID único para el QR
            const qrId = typeof window.QRService !== 'undefined' ? 
                window.QRService.generateQRId() : 
                this.generateUniqueQRId();
            
            // Crear URL de verificación
            const verificationUrl = typeof window.QRService !== 'undefined' ?
                window.QRService.createVerificationURL(qrId, productId) :
                this.createVerificationURL(qrId, productId);

            // Generar código QR visual
            const canvas = document.getElementById('qrCanvas');
            
            await QRCodeLib.toCanvas(canvas, verificationUrl, {
                width: 300,
                height: 300,
                color: {
                    dark: '#2c3e50',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
            });

            // Mostrar información del QR generado
            this.displayQRResult(product, qrId, verificationUrl, lote, fechaProduccion);

            // Guardar registro del QR (opcional - aquí podrías guardarlo en Supabase)
            await this.saveQRRecord({
                id: qrId,
                productId: productId,
                producto: product.nombre,
                marca: product.marca,
                lote: lote,
                fechaProduccion: fechaProduccion,
                fechaCreacion: new Date().toISOString(),
                url: verificationUrl,
                cantidad: cantidad,
                notas: notas,
                escaneado: false,
                contadorEscaneos: 0
            });

            this.showAlert(`QR generado exitosamente para ${product.nombre}`, 'success');

        } catch (error) {
            console.error('❌ Error generando QR:', error);
            console.error('Stack trace:', error.stack);
            console.error('Detalles del error:', {
                message: error.message,
                name: error.name,
                qrLibraryAvailable: !!(window.QRCodeLib || window.QRCode || window.qrcode),
                availableLibraries: {
                    QRCodeLib: typeof window.QRCodeLib,
                    QRCode: typeof window.QRCode,
                    qrcode: typeof window.qrcode,
                    QRious: typeof window.QRious
                }
            });
            
            let errorMessage = 'Error generando QR: ' + error.message;
            if (error.message.includes('QRCode is not defined') || error.message.includes('Librería QR no encontrada')) {
                errorMessage = 'Error: No se pudo cargar la librería de códigos QR. Por favor, recarga la página e intenta nuevamente.';
            }
            
            this.showAlert(errorMessage, 'error');
        } finally {
            this.showLoading(false);
            this.isGeneratingQR = false; // Limpiar bandera
        }
    }

    // Generar ID único para QR (fallback)
    generateUniqueQRId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `QR${timestamp}${random}`.toUpperCase();
    }

    // Crear URL de verificación (fallback)
    createVerificationURL(qrId, productId) {
        const baseUrl = window.location.origin + window.location.pathname.replace('admin-panel-estructura-mejorada.html', '');
        return `${baseUrl}verificacion-qr.html?qr=${qrId}&product=${productId}`;
    }

    // Mostrar resultado del QR generado
    displayQRResult(product, qrId, url, lote, fechaProduccion) {
        const resultDiv = document.getElementById('qrResult');
        const productNombre = document.getElementById('qr-producto-nombre');
        const productMarca = document.getElementById('qr-producto-marca');
        const codigoId = document.getElementById('qr-codigo-id');
        const qrUrl = document.getElementById('qr-url');

        if (productNombre) productNombre.textContent = product.nombre;
        if (productMarca) productMarca.textContent = product.marca;
        if (codigoId) codigoId.textContent = qrId;
        if (qrUrl) qrUrl.value = url;

        // Guardar información del QR actual para descargas
        this.currentQR = {
            id: qrId,
            product: product,
            url: url,
            lote: lote,
            fechaProduccion: fechaProduccion,
            fechaCreacion: new Date().toISOString(),
            canvas: document.getElementById('qrCanvas') // Agregar referencia al canvas
        };

        // Mostrar el contenedor de resultado
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Guardar registro del QR
    async saveQRRecord(qrData) {
        try {
            // Usar el nuevo QRService
            if (typeof window.QRService !== 'undefined') {
                await window.QRService.createQRCode(qrData);
                console.log('✅ Registro QR guardado usando QRService:', qrData.id);
                return true;
            }

            // Fallback si QRService no está disponible
            if (typeof window.supabase === 'undefined' || !window.supabase.from) {
                console.warn('⚠️ Supabase no está disponible o no inicializado correctamente');
                throw new Error('Supabase no está disponible');
            }

            // Datos para Supabase
            const qrRecord = {
                codigo_qr: qrData.id,
                producto_id: parseInt(qrData.productId),
                url_verificacion: qrData.url,
                lote: qrData.lote || null,
                fecha_produccion: qrData.fechaProduccion || null,
                notas: qrData.notas || null,
                activo: true
            };

            const { data, error } = await window.supabase
                .from('qr_codes')
                .insert([qrRecord]);

            if (error) {
                throw error;
            }

            console.log('✅ Registro QR guardado en Supabase:', qrData.id);
            return data;
            
        } catch (error) {
            console.error('❌ Error guardando registro QR:', error);
            // Fallback a localStorage si falla todo lo demás
            try {
                if (typeof window.QRService !== 'undefined') {
                    window.QRService.saveQRToLocalStorage(qrData);
                    console.log('✅ Registro QR guardado en localStorage como fallback');
                }
            } catch (fallbackError) {
                console.error('❌ Error guardando en fallback:', fallbackError);
                throw error;
            }
        }
    }

    // Copiar URL del QR
    copyQRUrl(url = null) {
        let urlToCopy = url;
        
        // Si no se proporciona URL, usar la del campo de entrada actual
        if (!urlToCopy) {
            const urlInput = document.getElementById('qr-url');
            if (urlInput) {
                urlToCopy = urlInput.value;
            }
        }
        
        if (!urlToCopy) {
            this.showAlert('No hay URL para copiar', 'error');
            return;
        }
        
        try {
            // Usar la API moderna de clipboard
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(urlToCopy).then(() => {
                    this.showAlert('URL copiada al portapapeles', 'success');
                }).catch(() => {
                    this.fallbackCopyText(urlToCopy);
                });
            } else {
                this.fallbackCopyText(urlToCopy);
            }
        } catch (error) {
            console.error('Error copiando URL:', error);
            this.showAlert('No se pudo copiar la URL', 'error');
        }
    }
    
    // Método fallback para copiar texto
    fallbackCopyText(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showAlert('URL copiada al portapapeles', 'success');
            } else {
                this.showAlert('No se pudo copiar la URL', 'error');
            }
        } catch (error) {
            console.error('Error en fallback copy:', error);
            this.showAlert('No se pudo copiar la URL', 'error');
        }
    }

    // Regenerar QR código existente
    async regenerateQR(qrId) {
        try {
            let qrRecord = null;
            
            // Usar QRService si está disponible
            if (typeof window.QRService !== 'undefined') {
                try {
                    const allQRs = await window.QRService.getAllQRs();
                    qrRecord = allQRs.find(qr => qr.id === qrId);
                } catch (serviceError) {
                    console.warn('⚠️ Error usando QRService:', serviceError);
                }
            }
            
            // Fallback a localStorage si no encontramos con QRService
            if (!qrRecord) {
                const qrHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');
                qrRecord = qrHistory.find(qr => qr.id === qrId);
            }
            
            if (!qrRecord) {
                this.showAlert('QR no encontrado', 'error');
                return;
            }

            // Confirmar regeneración
            let productName;
            if (typeof qrRecord.producto === 'object' && qrRecord.producto !== null) {
                productName = qrRecord.producto.nombre || 'Producto desconocido';
            } else if (typeof qrRecord.producto === 'string') {
                productName = qrRecord.producto;
            } else {
                productName = 'Producto desconocido';
            }
            
            if (!confirm(`¿Estás seguro de que quieres regenerar el QR para "${productName}"?`)) {
                return;
            }

            // Poblar formulario con datos existentes
            document.getElementById('qr-producto').value = qrRecord.productId;
            document.getElementById('qr-lote').value = qrRecord.lote || '';
            document.getElementById('qr-fecha').value = qrRecord.fechaProduccion || '';
            document.getElementById('qr-notas').value = qrRecord.notas || '';

            // Eliminar el registro anterior
            await this.deleteQR(qrId);

            // Regenerar el QR
            await this.generateQRCode();
            
            this.showAlert('QR regenerado exitosamente', 'success');
            
            // Actualizar la tabla de historial
            await this.loadQRHistory();
            
        } catch (error) {
            console.error('❌ Error regenerando QR:', error);
            this.showAlert('Error al regenerar QR: ' + error.message, 'error');
        }
    }

    // Eliminar QR código
    async deleteQR(qrId) {
        try {
            let qrRecord = null;
            
            // Buscar QR usando QRService
            if (typeof window.QRService !== 'undefined') {
                try {
                    const allQRs = await window.QRService.getAllQRs();
                    qrRecord = allQRs.find(qr => qr.id === qrId);
                } catch (serviceError) {
                    console.warn('⚠️ Error buscando QR con QRService:', serviceError);
                }
            }
            
            // Fallback a localStorage
            if (!qrRecord) {
                const qrHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');
                qrRecord = qrHistory.find(qr => qr.id === qrId);
            }
            
            if (!qrRecord) {
                this.showAlert('QR no encontrado', 'error');
                return;
            }

            // Confirmar eliminación
            let productName;
            if (typeof qrRecord.producto === 'object' && qrRecord.producto !== null) {
                productName = qrRecord.producto.nombre || 'Producto desconocido';
            } else if (typeof qrRecord.producto === 'string') {
                productName = qrRecord.producto;
            } else {
                productName = 'Producto desconocido';
            }
            
            if (!confirm(`¿Estás seguro de que quieres eliminar el QR para "${productName}"?\n\nEsta acción no se puede deshacer.`)) {
                return;
            }

            // Eliminar usando QRService
            if (typeof window.QRService !== 'undefined') {
                const success = await window.QRService.deleteQR(qrId);
                if (!success) {
                    throw new Error('QRService no pudo eliminar el QR');
                }
                console.log('✅ QR eliminado usando QRService');
            } else {
                // Fallback: eliminar del localStorage
                const qrHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');
                const updatedHistory = qrHistory.filter(qr => qr.id !== qrId);
                localStorage.setItem('qrHistory', JSON.stringify(updatedHistory));
                console.log('✅ QR eliminado del localStorage');
            }
            
            this.showAlert('QR eliminado exitosamente', 'success');
            
            // Actualizar la tabla de historial
            await this.loadQRHistory();
            
        } catch (error) {
            console.error('❌ Error eliminando QR:', error);
            this.showAlert('Error al eliminar QR: ' + error.message, 'error');
        }
    }

    // Mostrar vista previa del QR
    async showQRPreview(qrId) {
        try {
            console.log('🔍 Mostrando vista previa de QR:', qrId);
            
            // Usar nuestra función de búsqueda detallada
            const searchResults = await this.searchQRById(qrId);
            
            let qrRecord = null;
            
            // Determinar cuál fuente usar basándose en los resultados
            if (searchResults.qrService && typeof searchResults.qrService === 'object') {
                const serviceData = searchResults.qrService;
                
                // Normalizar datos de QRService
                let productoNombre, productoMarca;
                
                if (typeof serviceData.producto === 'object') {
                    productoNombre = serviceData.producto.nombre || 'Producto desconocido';
                    productoMarca = serviceData.producto.marca || '';
                } else if (typeof serviceData.producto === 'string') {
                    productoNombre = serviceData.producto;
                    productoMarca = serviceData.marca || '';
                } else {
                    productoNombre = 'Producto desconocido';
                    productoMarca = '';
                }
                
                qrRecord = {
                    id: serviceData.id,
                    producto: productoNombre,
                    marca: productoMarca,
                    lote: serviceData.lote,
                    fechaProduccion: serviceData.fechaProduccion,
                    url: serviceData.url,
                    activo: serviceData.activo !== undefined ? serviceData.activo : true
                };
                console.log('✅ Usando datos de QRService:', { producto: productoNombre, marca: productoMarca });
            } else if (searchResults.supabase && typeof searchResults.supabase === 'object') {
                // Convertir datos de Supabase al formato esperado
                const supabaseData = searchResults.supabase;
                
                // Obtener información del producto si está disponible
                let productInfo = null;
                if (supabaseData.producto_id && this.isSupabaseAvailable()) {
                    try {
                        const { data: productData, error: productError } = await window.supabase
                            .from('productos')
                            .select('id, nombre, marca')
                            .eq('id', supabaseData.producto_id)
                            .single();
                        
                        if (!productError && productData) {
                            productInfo = productData;
                        }
                    } catch (productErr) {
                        console.warn('⚠️ Error obteniendo info del producto:', productErr);
                    }
                }

                qrRecord = {
                    id: supabaseData.codigo_qr,
                    producto: productInfo?.nombre || 'Producto desconocido',
                    marca: productInfo?.marca || '',
                    lote: supabaseData.lote,
                    fechaProduccion: supabaseData.fecha_produccion,
                    url: supabaseData.url_verificacion,
                    activo: supabaseData.activo
                };
                console.log('✅ Usando datos de Supabase');
            } else if (searchResults.localStorage && typeof searchResults.localStorage === 'object') {
                const localData = searchResults.localStorage;
                
                // Normalizar datos de localStorage
                let productoNombre, productoMarca;
                
                if (typeof localData.producto === 'object') {
                    productoNombre = localData.producto.nombre || 'Producto desconocido';
                    productoMarca = localData.producto.marca || '';
                } else if (typeof localData.producto === 'string') {
                    productoNombre = localData.producto;
                    productoMarca = localData.marca || '';
                } else {
                    productoNombre = 'Producto desconocido';
                    productoMarca = '';
                }
                
                qrRecord = {
                    id: localData.id,
                    producto: productoNombre,
                    marca: productoMarca,
                    lote: localData.lote,
                    fechaProduccion: localData.fechaProduccion,
                    url: localData.url,
                    activo: localData.activo !== undefined ? localData.activo : true
                };
                console.log('✅ Usando datos de localStorage:', { producto: productoNombre, marca: productoMarca });
            }
            
            if (!qrRecord) {
                console.error('❌ QR no encontrado en ninguna fuente:', qrId);
                this.showAlert(
                    `QR "${qrId}" no encontrado.\n\nBúsqueda realizada en:\n- QRService: ${typeof searchResults.qrService === 'string' ? searchResults.qrService : 'OK'}\n- Supabase: ${typeof searchResults.supabase === 'string' ? searchResults.supabase : 'OK'}\n- LocalStorage: ${typeof searchResults.localStorage === 'string' ? searchResults.localStorage : 'OK'}`, 
                    'error'
                );
                return;
            }

            // Verificar que esté activo
            if (qrRecord.activo === false) {
                console.warn('⚠️ QR encontrado pero está inactivo:', qrRecord);
                this.showAlert(`El QR "${qrId}" está marcado como inactivo y no puede mostrarse.`, 'warning');
                return;
            }

            // Verificar que la librería QR esté disponible
            const QRCodeLib = window.QRCodeLib || window.QRCode || window.qrcode;
            if (!QRCodeLib) {
                console.error('❌ Librería QR no disponible');
                this.showAlert('La librería de códigos QR no está disponible. Por favor, recarga la página.', 'error');
                return;
            }

            console.log('🔄 Generando vista previa del QR...');
            // Cambiar a la sección del generador QR
            this.showSection('generador-qr');

            // Regenerar el QR en el canvas principal
            const canvas = document.getElementById('qrCanvas');
            if (!canvas) {
                console.error('❌ Canvas QR no encontrado');
                this.showAlert('Canvas de QR no encontrado', 'error');
                return;
            }

            // Generar QR en canvas
            try {
                await QRCodeLib.toCanvas(canvas, qrRecord.url, {
                    width: 300,
                    height: 300,
                    color: {
                        dark: '#2c3e50',
                        light: '#ffffff'
                    },
                    errorCorrectionLevel: 'M'
                });

                console.log('✅ QR generado exitosamente en vista previa');
                
                // Mostrar información del QR
                this.displayQRResult(
                    { nombre: qrRecord.producto, marca: qrRecord.marca },
                    qrRecord.id,
                    qrRecord.url,
                    qrRecord.lote,
                    qrRecord.fechaProduccion
                );
                
                // Guardar referencia para descargas
                this.currentQR = {
                    canvas: canvas,
                    url: qrRecord.url,
                    product: { nombre: qrRecord.producto, marca: qrRecord.marca },
                    id: qrRecord.id,
                    lote: qrRecord.lote,
                    fechaProduccion: qrRecord.fechaProduccion
                };
                
                // Mensaje mejorado para la alerta
                const productoInfo = qrRecord.marca ? 
                    `${qrRecord.producto} (${qrRecord.marca})` : 
                    qrRecord.producto;
                this.showAlert(`Vista previa de QR: ${productoInfo}`, 'success');
                
            } catch (canvasError) {
                console.error('❌ Error generando QR en canvas:', canvasError);
                this.showAlert('Error mostrando el código QR: ' + canvasError.message, 'error');
            }
            
        } catch (error) {
            console.error('❌ Error en showQRPreview:', error);
            this.showAlert('Error mostrando vista previa del QR: ' + error.message, 'error');
        }
    }

    // Descargar QR en diferentes formatos
    downloadQR(format) {
        if (!this.currentQR) {
            this.showAlert('No hay QR generado para descargar', 'error');
            return;
        }

        // Obtener canvas, ya sea de la referencia guardada o del DOM
        let canvas = this.currentQR.canvas;
        if (!canvas) {
            canvas = document.getElementById('qrCanvas');
        }
        
        if (!canvas) {
            this.showAlert('No se encontró el código QR para descargar', 'error');
            return;
        }

        const filename = `QR_${this.currentQR.product.nombre.replace(/\s+/g, '_')}_${this.currentQR.id}`;

        try {
            switch (format) {
                case 'png':
                    this.downloadCanvasAsPNG(canvas, filename);
                    break;
                case 'svg':
                    this.downloadQRAsSVG(filename);
                    break;
                case 'pdf':
                    this.downloadQRAsPDF(filename);
                    break;
                default:
                    throw new Error('Formato no soportado');
            }
            
            this.showAlert(`QR descargado como ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('❌ Error descargando QR:', error);
            this.showAlert('Error descargando QR: ' + error.message, 'error');
        }
    }

    // Descargar canvas como PNG
    downloadCanvasAsPNG(canvas, filename) {
        try {
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            
            // Agregar el link al DOM temporalmente
            document.body.appendChild(link);
            
            // Hacer click para descargar
            link.click();
            
            // Remover el link del DOM
            document.body.removeChild(link);
            
            console.log(`✅ PNG descargado: ${filename}.png`);
        } catch (error) {
            console.error('❌ Error descargando PNG:', error);
            throw error;
        }
    }

    // Descargar QR como SVG
    downloadQRAsSVG(filename) {
        if (!this.currentQR) return;
        
        const QRCodeLib = window.QRCodeLib || window.QRCode || window.qrcode;
        if (!QRCodeLib) {
            console.error('Librería QR no encontrada');
            this.showAlert('Librería QR no disponible para SVG', 'error');
            return;
        }
        
        try {
            QRCodeLib.toString(this.currentQR.url, {
                type: 'svg',
                width: 300,
                height: 300,
                color: {
                    dark: '#2c3e50',
                    light: '#ffffff'
                }
            }, (err, svg) => {
                if (err) {
                    console.error('Error generando SVG:', err);
                    this.showAlert('Error generando SVG: ' + err.message, 'error');
                    return;
                }
                
                const blob = new Blob([svg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${filename}.svg`;
                link.href = url;
                
                // Agregar al DOM temporalmente
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Limpiar URL
                URL.revokeObjectURL(url);
                
                console.log(`✅ SVG descargado: ${filename}.svg`);
            });
        } catch (error) {
            console.error('❌ Error descargando SVG:', error);
            this.showAlert('Error descargando SVG: ' + error.message, 'error');
        }
    }

    // Descargar QR como PDF
    downloadQRAsPDF(filename) {
        try {
            // Para una solución simple, convertimos el canvas a PNG y lo descargamos
            // En el futuro se puede implementar con jsPDF
            let canvas = this.currentQR.canvas;
            if (!canvas) {
                canvas = document.getElementById('qrCanvas');
            }
            
            if (!canvas) {
                throw new Error('No se encontró el canvas del QR');
            }
            
            // Por ahora, descargar como PNG con sufijo PDF
            this.downloadCanvasAsPNG(canvas, filename + '_PDF');
            this.showAlert('PDF básico descargado como PNG. Para PDF real, se necesita librería adicional.', 'info');
            
        } catch (error) {
            console.error('❌ Error descargando PDF:', error);
            this.showAlert('Error descargando PDF: ' + error.message, 'error');
        }
    }

    // Imprimir QR
    printQR() {
        if (!this.currentQR) {
            this.showAlert('No hay QR generado para imprimir', 'error');
            return;
        }

        // Obtener canvas
        let canvas = this.currentQR.canvas;
        if (!canvas) {
            canvas = document.getElementById('qrCanvas');
        }
        
        if (!canvas) {
            this.showAlert('No se encontró el código QR para imprimir', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        const dataUrl = canvas.toDataURL('image/png');

        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code - ${this.currentQR.product.nombre}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 20px;
                        }
                        .qr-container {
                            max-width: 400px;
                            margin: 0 auto;
                            border: 2px solid #333;
                            padding: 20px;
                            border-radius: 10px;
                        }
                        .qr-image {
                            margin: 20px 0;
                        }
                        .product-info {
                            margin: 10px 0;
                            font-size: 14px;
                        }
                        @media print {
                            body { margin: 0; }
                            .qr-container { border: 1px solid #000; }
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <h2>AROME DE DIEU</h2>
                        <h3>Código de Verificación</h3>
                        <div class="qr-image">
                            <img src="${dataUrl}" alt="QR Code" style="max-width: 300px;">
                        </div>
                        <div class="product-info">
                            <strong>${this.currentQR.product.nombre}</strong><br>
                            ${this.currentQR.product.marca}<br>
                            Código: ${this.currentQR.id}
                        </div>
                        ${this.currentQR.lote ? `<div class="additional-info">Lote: ${this.currentQR.lote}</div>` : ''}
                        ${this.currentQR.fechaProduccion ? `<div class="additional-info">Fecha: ${this.currentQR.fechaProduccion}</div>` : ''}
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    // Cargar sección de datos específica con QR
    async loadSectionData(sectionName) {
        if (!this.dataLoaded && !this.loadingData) {
            await this.loadInitialData();
        }
        
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboardDisplay();
                this.updateCategoryStats();
                break;
            case 'productos':
                await this.loadProductsData();
                break;
            case 'generador-qr':
                await this.loadProductsForQR();
                await this.loadQRHistory();
                break;
            case 'configuracion':
                this.checkConnection();
                break;
            case 'categorias':
                this.updateCategoryStats();
                break;
        }
    }

    // Cargar historial de QRs
    async loadQRHistory() {
        try {
            let qrRecords = [];

            // Usar QRService si está disponible
            if (typeof window.QRService !== 'undefined') {
                qrRecords = await window.QRService.getAllQRs();
                console.log('✅ QR records cargados usando QRService:', qrRecords.length);
            } else if (typeof window.supabase !== 'undefined' && window.supabase.from) {
                try {
                    console.log('🔍 Cargando QRs desde Supabase...');
                    // Primero intentamos usar la vista, si existe
                    let { data, error } = await window.supabase
                        .from('qr_codes_with_product_info')
                        .select('*')
                        .order('fecha_creacion', { ascending: false });

                    // Si la vista no existe, usar consulta directa
                    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
                        console.log('🔄 Vista no encontrada, usando consulta directa...');
                        ({ data, error } = await window.supabase
                            .from('qr_codes')
                            .select(`
                                codigo_qr,
                                producto_id,
                                url_verificacion,
                                lote,
                                fecha_produccion,
                                fecha_creacion,
                                notas,
                                activo,
                                productos (
                                    nombre,
                                    marca
                                )
                            `)
                            .order('fecha_creacion', { ascending: false }));
                    }

                    if (error) {
                        throw error;
                    }

                    // Transformar datos de Supabase al formato esperado
                    qrRecords = data.map(qr => ({
                        id: qr.codigo_qr,
                        productId: qr.producto_id,
                        producto: qr.producto_nombre || qr.productos?.nombre || 'Producto desconocido',
                        marca: qr.producto_marca || qr.productos?.marca || '',
                        lote: qr.lote,
                        fechaProduccion: qr.fecha_produccion,
                        fechaCreacion: qr.fecha_creacion,
                        url: qr.url_verificacion,
                        notas: qr.notas,
                        escaneado: qr.total_escaneos > 0,
                        contadorEscaneos: qr.total_escaneos || 0,
                        ultimaVerificacion: qr.ultima_verificacion,
                        activo: qr.activo
                    }));

                    console.log('✅ QR records cargados desde Supabase:', qrRecords.length);
                } catch (supabaseError) {
                    console.warn('⚠️ Error cargando desde Supabase:', supabaseError.message);
                    throw supabaseError;
                }
            } else if (typeof window.supabase !== 'undefined' && !window.supabase.from) {
                console.warn('⚠️ Supabase está definido pero no inicializado correctamente');
                throw new Error('Supabase no está inicializado correctamente');
            } else {
                // Fallback final a localStorage
                qrRecords = JSON.parse(localStorage.getItem('qrHistory') || '[]');
                console.log('✅ QR records cargados desde localStorage:', qrRecords.length);
            }

            this.updateQRStats(qrRecords);
            this.displayQRHistory(qrRecords);
            
        } catch (error) {
            console.error('❌ Error cargando historial QR:', error);
            // Fallback a localStorage en caso de error
            try {
                const qrRecords = JSON.parse(localStorage.getItem('qrHistory') || '[]');
                this.updateQRStats(qrRecords);
                this.displayQRHistory(qrRecords);
                console.log('✅ Usando fallback localStorage');
            } catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
                this.displayQRHistory([]);
            }
        }
    }

    // Actualizar estadísticas QR
    updateQRStats(qrRecords = null) {
        try {
            // Si no se pasan registros, intentar cargarlos
            if (!qrRecords) {
                // No hacer llamada async aquí, solo mostrar 0s temporalmente
                const updateStat = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = value;
                };
                updateStat('total-qrs', '0');
                updateStat('qrs-escaneados', '0');
                updateStat('qrs-hoy', '0');
                updateStat('qrs-semana', '0');
                return;
            }
            
            const totalQRs = qrRecords.length;
            const escaneados = qrRecords.filter(qr => qr.escaneado || qr.contadorEscaneos > 0).length;
            
            const today = new Date().toDateString();
            const qrsHoy = qrRecords.filter(qr => {
                const fechaCreacion = qr.fechaCreacion || qr.fecha_creacion;
                return new Date(fechaCreacion).toDateString() === today;
            }).length;
            
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const qrsSemana = qrRecords.filter(qr => {
                const fechaCreacion = qr.fechaCreacion || qr.fecha_creacion;
                return new Date(fechaCreacion) >= weekAgo;
            }).length;

            // Actualizar elementos del DOM
            const updateStat = (id, value) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            };

            updateStat('total-qrs', totalQRs);
            updateStat('qrs-escaneados', escaneados);
            updateStat('qrs-hoy', qrsHoy);
            updateStat('qrs-semana', qrsSemana);
            
        } catch (error) {
            console.error('❌ Error actualizando estadísticas QR:', error);
        }
    }

    // Mostrar historial de QRs en tabla
    displayQRHistory(qrRecords) {
        const tableBody = document.getElementById('qrHistoryTable');
        if (!tableBody) return;

        if (qrRecords.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="no-qrs">
                            <i class="fas fa-qrcode" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                            <p>No hay códigos QR generados</p>
                            <button class="btn btn-primary" onclick="adminPanel.showSection('generador-qr')">
                                <i class="fas fa-plus"></i> Generar Primer QR
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const qrRows = qrRecords.map(qr => {
            // Normalizar información del producto
            let productoNombre, productoMarca;
            
            if (typeof qr.producto === 'object' && qr.producto !== null) {
                productoNombre = qr.producto.nombre || 'Producto desconocido';
                productoMarca = qr.producto.marca || '';
            } else if (typeof qr.producto === 'string') {
                productoNombre = qr.producto;
                productoMarca = qr.marca || '';
            } else {
                productoNombre = 'Producto desconocido';
                productoMarca = '';
            }
            
            return `
            <tr>
                <td>
                    <div class="qr-mini" onclick="adminPanel.showQRPreview('${qr.id}')">
                        <i class="fas fa-qrcode" title="Ver QR"></i>
                    </div>
                </td>
                <td>
                    <div class="product-cell">
                        <strong>${productoNombre}</strong><br>
                        <small>${productoMarca}</small>
                    </div>
                </td>
                <td><code>${qr.id}</code></td>
                <td>${qr.lote || '-'}</td>
                <td>${new Date(qr.fechaCreacion || qr.fecha_creacion).toLocaleDateString('es-CO')}</td>
                <td>
                    <span class="badge ${qr.escaneado || (qr.contadorEscaneos || qr.totalEscaneos || 0) > 0 ? 'badge-success' : 'badge-secondary'}">
                        ${qr.escaneado || (qr.contadorEscaneos || qr.totalEscaneos || 0) > 0 ? `Sí (${qr.contadorEscaneos || qr.totalEscaneos || 0})` : 'No'}
                    </span>
                </td>
                <td>${qr.ultimaVerificacion || qr.ultima_verificacion ? 
                    new Date(qr.ultimaVerificacion || qr.ultima_verificacion).toLocaleDateString('es-CO') : '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-info" onclick="adminPanel.copyQRUrl('${qr.url}')" title="Copiar URL">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="adminPanel.regenerateQR('${qr.id}')" title="Regenerar">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteQR('${qr.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');

        tableBody.innerHTML = qrRows;
    }

    // Registrar escaneo de QR (para usar en página de verificación)
    async registerQRScan(qrId, additionalData = {}) {
        try {
            if (typeof window.supabase === 'undefined') {
                console.log('ℹ️ Supabase no disponible para registrar escaneo');
                return false;
            }

            // Registrar el escaneo
            const scanData = {
                codigo_qr: qrId,
                ip_address: additionalData.ip || null,
                user_agent: additionalData.userAgent || navigator.userAgent || null,
                referrer: additionalData.referrer || document.referrer || null,
                ubicacion: additionalData.location || null
            };

            const { error } = await window.supabase
                .from('qr_scans')
                .insert([scanData]);

            if (error) {
                throw error;
            }

            console.log('✅ Escaneo QR registrado:', qrId);
            return true;

        } catch (error) {
            console.error('❌ Error registrando escaneo QR:', error);
            return false;
        }
    }

    // Obtener información de QR para verificación
    async getQRInfo(qrId) {
        try {
            if (typeof window.supabase === 'undefined') {
                throw new Error('Supabase no está disponible');
            }

            const { data, error } = await window.supabase
                .from('qr_codes_with_product_info')
                .select('*')
                .eq('codigo_qr', qrId)
                .eq('activo', true)
                .single();

            if (error) {
                throw error;
            }

            if (!data) {
                return null;
            }

            return {
                qr: {
                    id: data.codigo_qr,
                    lote: data.lote,
                    fechaProduccion: data.fecha_produccion,
                    fechaCreacion: data.fecha_creacion,
                    notas: data.notas,
                    totalEscaneos: data.total_escaneos,
                    ultimaVerificacion: data.ultima_verificacion
                },
                producto: {
                    id: data.producto_id,
                    nombre: data.producto_nombre,
                    marca: data.producto_marca,
                    precio: data.producto_precio,
                    ml: data.producto_ml,
                    categoria: data.producto_categoria,
                    descripcion: data.producto_descripcion,
                    imagen_url: data.producto_imagen_url,
                    luxury: data.producto_luxury
                }
            };

        } catch (error) {
            console.error('❌ Error obteniendo información QR:', error);
            throw error;
        }
    }

    // ===== FUNCIONES DE ORDENAMIENTO =====
    
    // Toggle del modo de ordenamiento
    async toggleOrderMode() {
        console.log('🔀 Iniciando toggle del modo ordenamiento...');
        
        const orderBtn = document.getElementById('orderProductsBtn');
        const gridContainer = document.querySelector('.products-grid');
        const tableContainer = document.querySelector('.products-table-container');
        
        if (!orderBtn) {
            console.error('❌ Botón de ordenamiento no encontrado');
            return;
        }
        
        // Prevenir interacción si está guardando
        if (orderBtn.disabled || orderBtn.classList.contains('saving')) {
            console.log('⚠️ Operación en progreso, ignorando clic');
            this.showAlert('Por favor espera a que termine la operación actual', 'warning', 2000);
            return;
        }
        
        const isOrderMode = orderBtn.classList.contains('active');
        
        if (isOrderMode) {
            // Verificar cliente Supabase antes de guardar
            try {
                const client = this.getSupabaseClient();
                console.log('✅ Cliente Supabase verificado para guardar orden');
                // Salir del modo ordenamiento
                await this.exitOrderMode();
            } catch (error) {
                console.error('❌ Error verificando Supabase:', error);
                this.showAlert('Error: No se puede conectar con la base de datos. Verifica tu conexión.', 'error');
                return;
            }
        } else {
            // Entrar en modo ordenamiento (no necesita Supabase)
            this.enterOrderMode();
        }
    }
    
    // Entrar en modo ordenamiento
    async enterOrderMode() {
        console.log('🔀 Entrando en modo ordenamiento...');
        
        // Guardar el orden original como respaldo
        this.originalProductsOrder = [...this.productos];
        this.tempProductsOrder = [...this.productos];
        this.isOrderingMode = true;
        this.hasUnsavedChanges = false;
        
        const orderBtn = document.getElementById('orderProductsBtn');
        const gridView = document.getElementById('gridView');
        const tableView = document.getElementById('tableView');
        const searchInput = document.getElementById('searchProducts');
        const productsSection = document.querySelector('.products-section');
        
        // Cambiar estilo del botón
        orderBtn.classList.add('active');
        orderBtn.innerHTML = `
            <i class="fas fa-check"></i>
            Guardar Orden
        `;
        
        // Deshabilitar otros controles
        if (gridView) gridView.disabled = true;
        if (tableView) tableView.disabled = true;
        if (searchInput) searchInput.disabled = true;
        
        // Mostrar mensaje de instrucciones
        this.showOrderInstructions();
        
        // Crear vista de lista especial para ordenamiento
        await this.createOrderingListView();
        
        console.log('✅ Modo ordenamiento activado - Orden temporal guardado');
    }
    
    // Salir del modo ordenamiento
    async exitOrderMode() {
        console.log('� Saliendo del modo ordenamiento...');
        
        this.isOrderingMode = false;
        
        const orderBtn = document.getElementById('orderProductsBtn');
        const gridView = document.getElementById('gridView');
        const tableView = document.getElementById('tableView');
        const searchInput = document.getElementById('searchProducts');
        
        // Prevenir múltiples clics
        if (orderBtn.disabled || orderBtn.classList.contains('saving')) {
            console.log('⚠️ Ya se está guardando el orden, ignorando clic adicional');
            return;
        }
        
        try {
            // Mostrar estado de carga y deshabilitar botón
            orderBtn.disabled = true;
            orderBtn.classList.add('saving');
            orderBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Guardando...
            `;
            
            // Mostrar alerta de progreso
            const progressAlertId = this.showAlert(
                'Actualizando orden de productos, por favor espera...', 
                'info', 
                10000 // 10 segundos de duración máxima
            );
            
            // Deshabilitar otros controles
            if (gridView) gridView.disabled = true;
            if (tableView) tableView.disabled = true;
            if (searchInput) searchInput.disabled = true;
            
            // Si hay cambios sin guardar, actualizamos la base de datos
            if (this.hasUnsavedChanges) {
                await this.saveProductOrder();
                this.productos = [...this.tempProductsOrder]; // Actualizar productos principales
            }
            
            // Cerrar alerta de progreso
            this.closeAlert(progressAlertId, 'manual');
            
            // Limpiar estado temporal
            this.originalProductsOrder = [];
            this.tempProductsOrder = [];
            this.hasUnsavedChanges = false;
            
            // Restaurar botón
            orderBtn.classList.remove('saving');
            orderBtn.innerHTML = `
                <i class="fas fa-sort"></i>
                Ordenar
            `;
            orderBtn.disabled = false;
            
            // Rehabilitar controles
            if (gridView) gridView.disabled = false;
            if (tableView) tableView.disabled = false;
            if (searchInput) searchInput.disabled = false;
            
            // Remover sortable
            this.removeSortable();
            
            // Limpiar vista de ordenamiento
            this.cleanupOrderingView();
            
            // Ocultar instrucciones
            this.hideOrderInstructions();
            
            // Recargar productos con el nuevo orden
            await this.reloadProducts();
            
            // Mostrar mensaje de éxito
            this.showAlert('Orden de productos guardado exitosamente', 'success', 4000);
            
        } catch (error) {
            console.error('❌ Error guardando orden:', error);
            
            // Restaurar botón en caso de error
            orderBtn.classList.remove('saving');
            orderBtn.innerHTML = `
                <i class="fas fa-sort"></i>
                Ordenar
            `;
            orderBtn.disabled = false;
            
            // Rehabilitar controles
            if (gridView) gridView.disabled = false;
            if (tableView) tableView.disabled = false;
            if (searchInput) searchInput.disabled = false;
            
            // Mostrar error
            this.showAlert('Error guardando el orden de productos: ' + error.message, 'error', 6000);
        }
    }
    
    // Mostrar instrucciones de ordenamiento
    showOrderInstructions() {
        const instructionsHtml = `
            <div class="order-instructions" id="orderInstructions">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <strong>Modo Ordenamiento Activo:</strong> 
                    Usa las flechas ⬆️ ⬇️ para cambiar el orden de los productos. 
                    El número indica la posición actual. Haz clic en "Guardar Orden" cuando termines.
                </div>
            </div>
        `;
        
        const productsGrid = document.querySelector('.products-grid');
        if (productsGrid) {
            productsGrid.insertAdjacentHTML('beforebegin', instructionsHtml);
        }
    }
    
    // Ocultar instrucciones de ordenamiento
    hideOrderInstructions() {
        const instructions = document.getElementById('orderInstructions');
        if (instructions) {
            instructions.remove();
        }
    }
    
    // Crear vista de lista especial para ordenamiento
    async createOrderingListView() {
        const gridContainer = document.querySelector('.products-grid');
        const tableContainer = document.querySelector('.products-table-container');
        
        if (!gridContainer) return;
        
        // Ocultar containers existentes
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'none';
        
        // Crear container para la lista de ordenamiento
        let orderingContainer = document.getElementById('ordering-list-container');
        if (!orderingContainer) {
            orderingContainer = document.createElement('div');
            orderingContainer.id = 'ordering-list-container';
            orderingContainer.className = 'ordering-list-container';
            
            // Insertarlo después del grid container
            gridContainer.parentNode.insertBefore(orderingContainer, gridContainer.nextSibling);
        }
        
        // Generar HTML de la lista de ordenamiento usando el estado temporal
        const orderingHTML = this.tempProductsOrder.map((product, index) => {
            const imageSrc = this.getImagePath(product);
            const productName = this.cleanFieldValue(product.nombre, 'Producto sin nombre');
            const productBrand = this.cleanFieldValue(product.marca, '');
            const placeholderSrc = this.getPlaceholderImagePath();
            
            return `
                <div class="ordering-item" data-product-id="${product.id}" data-original-index="${index}">
                    <div class="ordering-item-content">
                        <div class="ordering-item-image">
                            <img src="${imageSrc}" 
                                 alt="${productName}"
                                 onerror="this.src='${placeholderSrc}'"
                                 loading="lazy">
                        </div>
                        <div class="ordering-item-info">
                            <h4 class="ordering-item-name">${productName}</h4>
                            <p class="ordering-item-brand">${productBrand}</p>
                            <span class="ordering-item-price">${this.getPrecioInfo(product)}</span>
                            <span class="ordering-item-category">${this.getCategoryName(product.categoria)}</span>
                        </div>
                    </div>
                    <div class="ordering-controls">
                        <div class="ordering-position" onclick="adminPanel.editPosition(${index})" title="Clic para editar posición">
                            <span class="position-number" id="position-${index}">${index + 1}</span>
                            <input type="number" 
                                   class="position-input" 
                                   id="input-${index}" 
                                   value="${index + 1}" 
                                   min="1" 
                                   max="${this.tempProductsOrder.length}"
                                   onblur="adminPanel.savePosition(${index}, this.value)"
                                   onkeypress="adminPanel.handlePositionKeypress(event, ${index}, this.value)"
                                   style="display: none;">
                        </div>
                        <div class="ordering-buttons">
                            <button class="ordering-btn ordering-btn-up" 
                                    onclick="adminPanel.moveProductUp(${index})" 
                                    ${index === 0 ? 'disabled' : ''}
                                    title="Subir posición">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="ordering-btn ordering-btn-down" 
                                    onclick="adminPanel.moveProductDown(${index})" 
                                    ${index === this.tempProductsOrder.length - 1 ? 'disabled' : ''}
                                    title="Bajar posición">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        orderingContainer.innerHTML = `
            <div class="ordering-header">
                <h3><i class="fas fa-sort"></i> Ordenar Productos</h3>
                <p>Usa las flechas para cambiar el orden o haz clic en el número para editar la posición directamente</p>
            </div>
            <div class="ordering-list">
                ${orderingHTML}
            </div>
        `;
        
        orderingContainer.style.display = 'block';
        console.log('✅ Vista de lista de ordenamiento creada');
    }
    
    // Mover producto hacia arriba
    moveProductUp(currentIndex) {
        if (currentIndex <= 0) return;
        
        console.log(`⬆️ Moviendo producto de posición ${currentIndex + 1} a ${currentIndex}`);
        
        // Intercambiar productos en el array temporal
        [this.tempProductsOrder[currentIndex], this.tempProductsOrder[currentIndex - 1]] = 
        [this.tempProductsOrder[currentIndex - 1], this.tempProductsOrder[currentIndex]];
        
        // Marcar cambios sin guardar
        this.hasUnsavedChanges = true;
        
        // ACTUALIZACIÓN INTELIGENTE: Solo actualizar los elementos que cambiaron
        this.updateSpecificOrderingItems(currentIndex, currentIndex - 1);
    }
    
    // Mover producto hacia abajo
    moveProductDown(currentIndex) {
        if (currentIndex >= this.tempProductsOrder.length - 1) return;
        
        console.log(`⬇️ Moviendo producto de posición ${currentIndex + 1} a ${currentIndex + 2}`);
        
        // Intercambiar productos en el array temporal
        [this.tempProductsOrder[currentIndex], this.tempProductsOrder[currentIndex + 1]] = 
        [this.tempProductsOrder[currentIndex + 1], this.tempProductsOrder[currentIndex]];
        
        // Marcar cambios sin guardar
        this.hasUnsavedChanges = true;
        
        // ACTUALIZACIÓN INTELIGENTE: Solo actualizar los elementos que cambiaron
        this.updateSpecificOrderingItems(currentIndex, currentIndex + 1);
    }
    
    // FUNCIONES PARA EDICIÓN MANUAL DE POSICIÓN
    editPosition(index) {
        console.log(`🔢 Editando posición para índice: ${index}`);
        
        const positionSpan = document.getElementById(`position-${index}`);
        const positionInput = document.getElementById(`input-${index}`);
        
        if (positionSpan && positionInput) {
            positionSpan.style.display = 'none';
            positionInput.style.display = 'block';
            positionInput.focus();
            positionInput.select();
        }
    }
    
    savePosition(index, newPosition) {
        console.log(`💾 Solicitando cambio de posición ${index + 1} → ${newPosition}`);
        
        const positionSpan = document.getElementById(`position-${index}`);
        const positionInput = document.getElementById(`input-${index}`);
        
        if (!positionSpan || !positionInput) return;
        
        const position = parseInt(newPosition);
        const maxPosition = this.productos.length;
        const currentPosition = index + 1;
        
        // Validar posición
        if (isNaN(position) || position < 1 || position > maxPosition) {
            this.showAlert(`❌ Posición inválida. Debe ser entre 1 y ${maxPosition}`, 'error');
            positionInput.value = currentPosition; // Restaurar valor original
            positionSpan.style.display = 'block';
            positionInput.style.display = 'none';
            return;
        }
        
        // Si la posición es la misma, no hacer nada
        if (position === currentPosition) {
            console.log('📍 Misma posición, no se requiere cambio');
            positionSpan.style.display = 'block';
            positionInput.style.display = 'none';
            return;
        }
        
        // Mostrar información del intercambio que se va a realizar
        const fromProductName = this.cleanFieldValue(this.productos[index].nombre, 'Producto sin nombre');
        const toProductName = this.cleanFieldValue(this.productos[position - 1].nombre, 'Producto sin nombre');
        
        console.log(`🔄 Intercambiando:`);
        console.log(`  - "${fromProductName}" (posición ${currentPosition})`);
        console.log(`  - "${toProductName}" (posición ${position})`);
        
        // Realizar el intercambio (convertir de posición 1-based a índice 0-based)
        this.moveProductToPosition(index, position - 1);
        
        // Ocultar input y mostrar span
        positionSpan.style.display = 'block';
        positionInput.style.display = 'none';
    }
    
    handlePositionKeypress(event, index, value) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.savePosition(index, value);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            const positionSpan = document.getElementById(`position-${index}`);
            const positionInput = document.getElementById(`input-${index}`);
            
            if (positionSpan && positionInput) {
                positionInput.value = index + 1; // Restaurar valor original
                positionSpan.style.display = 'block';
                positionInput.style.display = 'none';
            }
        }
    }
    
    moveProductToPosition(fromIndex, toIndex) {
        console.log(`🔄 Intercambiando producto de posición ${fromIndex + 1} con posición ${toIndex + 1}`);
        
        if (fromIndex === toIndex) return;
        
        // Validar índices
        if (fromIndex < 0 || fromIndex >= this.tempProductsOrder.length || 
            toIndex < 0 || toIndex >= this.tempProductsOrder.length) {
            console.error('❌ Índices inválidos:', { fromIndex, toIndex, total: this.tempProductsOrder.length });
            this.showAlert('❌ Error: posición inválida', 'error');
            return;
        }
        
        // INTERCAMBIO DIRECTO: Intercambiar las posiciones sin afectar otros productos
        const temp = this.tempProductsOrder[fromIndex];
        this.tempProductsOrder[fromIndex] = this.tempProductsOrder[toIndex];
        this.tempProductsOrder[toIndex] = temp;
        
        // Marcar cambios sin guardar
        this.hasUnsavedChanges = true;
        
        console.log(`✅ Intercambio completado entre posiciones ${fromIndex + 1} y ${toIndex + 1}`);
        
        // ACTUALIZACIÓN INTELIGENTE: Solo actualizar los elementos que cambiaron
        this.updateSpecificOrderingItems(fromIndex, toIndex);
        
        this.showAlert('✅ Posiciones intercambiadas correctamente', 'success');
    }
    
    // Actualizar solo los elementos específicos que cambiaron (SIN recargar toda la vista)
    updateSpecificOrderingItems(index1, index2) {
        console.log(`🔄 Intercambiando elementos DOM en posiciones ${index1 + 1} y ${index2 + 1}`);
        
        const orderingList = document.querySelector('.ordering-list');
        if (!orderingList) {
            console.warn('⚠️ Lista de ordenamiento no encontrada');
            return;
        }
        
        const items = orderingList.querySelectorAll('.ordering-item');
        if (!items || items.length <= Math.max(index1, index2)) {
            console.warn('⚠️ Elementos insuficientes para intercambio');
            return;
        }
        
        const item1 = items[index1];
        const item2 = items[index2];
        
        if (!item1 || !item2) {
            console.warn('⚠️ No se encontraron elementos para intercambiar');
            return;
        }
        
        // Crear elementos temporales para marcar las posiciones
        const temp1 = document.createElement('div');
        const temp2 = document.createElement('div');
        
        // Insertar marcadores temporales
        item1.parentNode.insertBefore(temp1, item1);
        item2.parentNode.insertBefore(temp2, item2);
        
        // Intercambiar físicamente los elementos DOM
        temp1.parentNode.insertBefore(item2, temp1);
        temp2.parentNode.insertBefore(item1, temp2);
        
        // Remover marcadores temporales
        temp1.remove();
        temp2.remove();
        
        // Actualizar los números de posición y event handlers
        this.updateAllPositionNumbers();
        
        console.log(`✅ Elementos DOM intercambiados correctamente`);
    }
    
    // Actualizar todos los números de posición sin recargar la vista completa
    updateAllPositionNumbers() {
        console.log('🔢 Actualizando números de posición...');
        
        const orderingItems = document.querySelectorAll('.ordering-item');
        orderingItems.forEach((item, visualIndex) => {
            // Actualizar atributo data-original-index para reflejar nuevo orden
            item.setAttribute('data-original-index', visualIndex);
            
            // Actualizar número de posición
            const positionSpan = item.querySelector('.position-number');
            if (positionSpan) {
                positionSpan.textContent = visualIndex + 1;
                positionSpan.id = `position-${visualIndex}`; // Actualizar ID
            }
            
            // Actualizar input de posición
            const positionInput = item.querySelector('.position-input');
            if (positionInput) {
                positionInput.value = visualIndex + 1;
                positionInput.max = this.tempProductsOrder.length;
                positionInput.id = `input-${visualIndex}`; // Actualizar ID
            }
            
            // Actualizar atributos onclick para reflejar nuevos índices
            const editButton = item.querySelector('.ordering-position');
            if (editButton) {
                editButton.setAttribute('onclick', `adminPanel.editPosition(${visualIndex})`);
            }
            
            // Actualizar botones de flecha
            const upButton = item.querySelector('.ordering-btn-up');
            const downButton = item.querySelector('.ordering-btn-down');
            
            if (upButton) {
                upButton.setAttribute('onclick', `adminPanel.moveProductUp(${visualIndex})`);
                upButton.disabled = visualIndex === 0;
            }
            
            if (downButton) {
                downButton.setAttribute('onclick', `adminPanel.moveProductDown(${visualIndex})`);
                downButton.disabled = visualIndex === this.tempProductsOrder.length - 1;
            }
            
            // Actualizar inputs de posición con eventos correctos
            const positionInputElement = item.querySelector('.position-input');
            if (positionInputElement) {
                positionInputElement.setAttribute('onblur', `adminPanel.savePosition(${visualIndex}, this.value)`);
                positionInputElement.setAttribute('onkeypress', `adminPanel.handlePositionKeypress(event, ${visualIndex}, this.value)`);
            }
        });
        
        console.log('✅ Números de posición e índices actualizados correctamente');
    }
    
    // Actualizar la vista de lista de ordenamiento
    updateOrderingListView() {
        const orderingList = document.querySelector('.ordering-list');
        if (!orderingList) return;
        
        // Regenerar HTML con las nuevas posiciones
        const orderingHTML = this.productos.map((product, index) => {
            const imageSrc = this.getImagePath(product);
            const productName = this.cleanFieldValue(product.nombre, 'Producto sin nombre');
            const productBrand = this.cleanFieldValue(product.marca, '');
            const placeholderSrc = this.getPlaceholderImagePath();
            
            return `
                <div class="ordering-item" data-product-id="${product.id}" data-original-index="${index}">
                    <div class="ordering-item-content">
                        <div class="ordering-item-image">
                            <img src="${imageSrc}" 
                                 alt="${productName}"
                                 onerror="this.src='${placeholderSrc}'"
                                 loading="lazy">
                        </div>
                        <div class="ordering-item-info">
                            <h4 class="ordering-item-name">${productName}</h4>
                            <p class="ordering-item-brand">${productBrand}</p>
                            <span class="ordering-item-price">${this.getPrecioInfo(product)}</span>
                            <span class="ordering-item-category">${this.getCategoryName(product.categoria)}</span>
                        </div>
                    </div>
                    <div class="ordering-controls">
                        <div class="ordering-position">
                            <span class="position-number">${index + 1}</span>
                        </div>
                        <div class="ordering-buttons">
                            <button class="ordering-btn ordering-btn-up" 
                                    onclick="adminPanel.moveProductUp(${index})" 
                                    ${index === 0 ? 'disabled' : ''}
                                    title="Subir posición">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="ordering-btn ordering-btn-down" 
                                    onclick="adminPanel.moveProductDown(${index})" 
                                    ${index === this.productos.length - 1 ? 'disabled' : ''}
                                    title="Bajar posición">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        orderingList.innerHTML = orderingHTML;
        
        // Añadir efecto de actualización
        orderingList.style.opacity = '0.7';
        setTimeout(() => {
            orderingList.style.opacity = '1';
        }, 150);
    }
    
    // Limpiar vista de ordenamiento
    cleanupOrderingView() {
        const orderingContainer = document.getElementById('ordering-list-container');
        const gridContainer = document.querySelector('.products-grid');
        const tableContainer = document.querySelector('.products-table-container');
        
        // Ocultar container de ordenamiento
        if (orderingContainer) {
            orderingContainer.style.display = 'none';
        }
        
        // Mostrar containers originales
        if (gridContainer) gridContainer.style.display = '';
        if (tableContainer) tableContainer.style.display = '';
    }
    
    // Hacer la grid sorteable con drag & drop
    async makeSortable() {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;
        
        // Agregar clases CSS para el ordenamiento
        productsGrid.classList.add('sortable-grid');
        
        // Agregar event listeners para drag & drop
        const productCards = productsGrid.querySelectorAll('.product-card');
        
        productCards.forEach((card, index) => {
            card.draggable = true;
            card.classList.add('sortable-item');
            card.dataset.originalIndex = index;
            
            // Agregar indicador visual
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
            card.insertBefore(dragHandle, card.firstChild);
            
            // Event listeners
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragover', this.handleDragOver.bind(this));
            card.addEventListener('drop', this.handleDrop.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
        
        console.log('✅ Grid convertida a sorteable');
    }
    
    // Remover funcionalidad sorteable
    removeSortable() {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;
        
        productsGrid.classList.remove('sortable-grid');
        
        const productCards = productsGrid.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.draggable = false;
            card.classList.remove('sortable-item', 'dragging');
            
            // Remover indicador de arrastre
            const dragHandle = card.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.remove();
            }
            
            // Remover event listeners
            card.removeEventListener('dragstart', this.handleDragStart);
            card.removeEventListener('dragover', this.handleDragOver);
            card.removeEventListener('drop', this.handleDrop);
            card.removeEventListener('dragend', this.handleDragEnd);
        });
    }
    
    // Manejadores de eventos drag & drop
    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
        e.currentTarget.classList.add('dragging');
        this.draggedElement = e.currentTarget;
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const grid = e.currentTarget.closest('.products-grid');
        const afterElement = this.getDragAfterElement(grid, e.clientY);
        const dragging = grid.querySelector('.dragging');
        
        if (afterElement == null) {
            grid.appendChild(dragging);
        } else {
            grid.insertBefore(dragging, afterElement);
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedHTML = e.dataTransfer.getData('text/html');
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
        }
        
        return false;
    }
    
    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        this.draggedElement = null;
    }
    
    // Obtener el elemento después del cual insertar
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.product-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Guardar el nuevo orden en la base de datos
    async saveProductOrder() {
        try {
            console.log('🔍 Verificando cliente Supabase...');
            
            // Debugging: Verificar qué clientes están disponibles
            console.log('window.supabaseClient:', typeof window.supabaseClient);
            console.log('window.supabase:', typeof window.supabase);
            console.log('supabaseClient global:', typeof supabaseClient);
            
            // Intentar obtener el cliente con múltiples opciones
            let client = null;
            if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
                client = window.supabaseClient;
                console.log('✅ Usando window.supabaseClient');
            } else if (window.supabase && typeof window.supabase.from === 'function') {
                client = window.supabase;
                console.log('✅ Usando window.supabase');
            } else if (typeof supabaseClient !== 'undefined' && typeof supabaseClient.from === 'function') {
                client = supabaseClient;
                console.log('✅ Usando supabaseClient global');
            } else {
                throw new Error('No se encontró un cliente Supabase válido');
            }
            
            const productCards = document.querySelectorAll('.ordering-item');
            const updates = [];
            
            // Si no hay items de ordenamiento, usar el array temporal de productos
            if (productCards.length === 0) {
                this.tempProductsOrder.forEach((product, index) => {
                    if (product && product.id) {
                        updates.push({
                            id: product.id,
                            orden_display: index + 1
                        });
                    }
                });
            } else {
                // Usar los items de la vista de ordenamiento
                productCards.forEach((item, index) => {
                    const productId = parseInt(item.dataset.productId);
                    if (productId && !isNaN(productId)) {
                        updates.push({
                            id: productId,
                            orden_display: index + 1
                        });
                    }
                });
            }
            
            console.log('💾 Guardando orden de productos:', updates.length, 'productos');
            
            // Actualizar orden en la base de datos
            let successCount = 0;
            for (const update of updates) {
                try {
                    console.log(`📝 Actualizando producto ${update.id} -> orden ${update.orden_display}`);
                    
                    const { error } = await client
                        .from('productos')
                        .update({ orden_display: update.orden_display })
                        .eq('id', update.id);
                    
                    if (error) {
                        console.error(`❌ Error actualizando producto ${update.id}:`, error);
                        throw error;
                    }
                    
                    successCount++;
                    console.log(`✅ Producto ${update.id} actualizado correctamente`);
                    
                } catch (productError) {
                    console.error(`❌ Error en producto individual ${update.id}:`, productError);
                    throw new Error(`Error actualizando producto ${update.id}: ${productError.message}`);
                }
            }
            
            console.log(`✅ Orden de productos guardado exitosamente: ${successCount}/${updates.length} productos`);
            
        } catch (error) {
            console.error('❌ Error completo guardando orden:', error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    // Extraer ID del producto desde la tarjeta
    extractProductIdFromCard(card) {
        // Buscar el botón de editar que contiene el ID
        const editButton = card.querySelector('button[onclick*="editProduct"]');
        if (editButton) {
            const onclickValue = editButton.getAttribute('onclick');
            const match = onclickValue.match(/editProduct\((\d+)\)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return null;
    }
    
    // Mostrar alerta temporal
    showAlert(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alertContainer') || document.body;
        const alertId = 'alert-' + Date.now();
        
        // Iconos según el tipo
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            info: 'info-circle',
            warning: 'exclamation-circle'
        };
        
        const icon = icons[type] || icons.info;
        
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-temporary" style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 420px;
                min-width: 300px;
                animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            ">
                <i class="fas fa-${icon}"></i>
                <div class="alert-message">${message}</div>
                <button class="alert-close" onclick="adminPanel.closeAlert('${alertId}')" title="Cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remover después del tiempo especificado
        const autoRemoveTimer = setTimeout(() => {
            this.closeAlert(alertId, 'auto');
        }, duration);
        
        // Guardar referencia del timer para poder cancelarlo si se cierra manualmente
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.dataset.autoRemoveTimer = autoRemoveTimer;
        }
        
        console.log(`✅ Alerta ${type} mostrada:`, message);
        return alertId;
    }
    
    // Cerrar alerta específica
    closeAlert(alertId, source = 'manual') {
        const alert = document.getElementById(alertId);
        if (!alert) return;
        
        // Cancelar auto-remove si se cierra manualmente
        if (source === 'manual' && alert.dataset.autoRemoveTimer) {
            clearTimeout(parseInt(alert.dataset.autoRemoveTimer));
        }
        
        console.log(`🔽 Cerrando alerta (${source}):`, alertId);
        
        // Animación de salida
        alert.style.animation = source === 'manual' ? 
            'fadeOut 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53)' : 
            'slideOutRight 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
        
        // Remover después de la animación
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, source === 'manual' ? 300 : 400);
    }
    
    // Cerrar todas las alertas
    closeAllAlerts() {
        const alerts = document.querySelectorAll('.alert-temporary');
        alerts.forEach(alert => {
            if (alert.id) {
                this.closeAlert(alert.id, 'manual');
            }
        });
    }
    
    // Limpiar estado de guardado en caso de emergencia
    resetOrderButtonState() {
        const orderBtn = document.getElementById('orderProductsBtn');
        const gridView = document.getElementById('gridView');
        const tableView = document.getElementById('tableView');
        const searchInput = document.getElementById('searchProducts');
        
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.classList.remove('saving', 'active');
            orderBtn.innerHTML = `
                <i class="fas fa-sort"></i>
                Ordenar
            `;
        }
        
        // Rehabilitar controles
        if (gridView) gridView.disabled = false;
        if (tableView) tableView.disabled = false;
        if (searchInput) searchInput.disabled = false;
        
        console.log('🔄 Estado del botón de ordenamiento restablecido');
    }
}

// Exportar para uso global
window.AdminPanel = AdminPanel;
