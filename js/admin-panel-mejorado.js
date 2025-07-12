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
        this.isSubmitting = false;
        
        // Cache para placeholders y control de errores
        this.placeholderCache = null;
        this.errorLogCache = new Set();
        this.errorLogCooldown = 5000;
        this.placeholderErrorLogged = false;
        
        this.init();
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
                console.log('🔄 Cargando productos con filtros admin...');
                this.productos = await ProductosServiceOptimized.obtenerProductosOptimizado({ 
                    admin: true,
                    page: 0,
                    forceRefresh: true 
                });
                console.log('✅ Productos cargados:', this.productos.length);
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
        const container = document.querySelector('.products-grid');
        if (!container) return;

        try {
            if (this.productos.length === 0) {
                await this.loadProductos();
            }

            console.log('🔍 Productos cargados:', this.productos.length);
            
            // Debug: mostrar primera imagen de cada producto
            if (this.productos.length > 0) {
                console.log('📸 Debug imágenes:', this.productos.slice(0, 3).map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    imagen_url: p.imagen_url,
                    imagen: p.imagen,
                    resultado: this.getImagePath(p)
                })));
            }

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
            
        } catch (error) {
            console.error('❌ Error en loadProductsData:', error);
            container.innerHTML = `<div class="no-products error">Error cargando productos: ${error.message}</div>`;
        }
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
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
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
        
        if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productName}"?`)) {
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

    // Verificar conexión
    async checkConnection() {
        try {
            const supabaseStatus = document.getElementById('supabaseStatus');
            const productServiceStatus = document.getElementById('productServiceStatus');
            const lastSync = document.getElementById('lastSync');
            const connectionStatus = document.getElementById('connectionStatus');
            
            if (supabaseStatus) {
                supabaseStatus.textContent = typeof window.supabase !== 'undefined' ? 'Conectado' : 'Desconectado';
                supabaseStatus.className = typeof window.supabase !== 'undefined' ? 'status success' : 'status error';
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
                    <i class="fas fa-circle" style="color: #28a745;"></i>
                    <span>Conectado</span>
                `;
            }
            
        } catch (error) {
            console.error('❌ Error verificando conexión:', error);
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
            productCards.forEach(card => card.style.display = 'block');
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
}

// Exportar para uso global
window.AdminPanel = AdminPanel;
