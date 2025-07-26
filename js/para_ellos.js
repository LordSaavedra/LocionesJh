// Para Ellos - Integración con Supabase (Versión Final)
class ParaEllosManager {
    constructor() {
        this.productos = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.activeFilters = {
            category: '',
            search: '',
            brand: '',
            subcategoria: '',
            priceMin: 0,
            priceMax: 10000000
        };
        
        this.init();
        this.initVideoHero();
    }

    // Inicializar el video hero
    initVideoHero() {
        document.addEventListener('DOMContentLoaded', () => {
            const video = document.querySelector('.hero-video');
            const overlay = document.querySelector('.video-overlay');
            const textContent = document.querySelector('.video-text-content');
            
            if (video) {
                // Asegurar que el video se reproduce automáticamente
                video.addEventListener('loadeddata', () => {
                    console.log('Video cargado correctamente');
                    video.play().catch(e => {
                        console.log('Error al reproducir video:', e);
                    });
                });
                
                // Forzar visibilidad del overlay
                if (overlay && textContent) {
                    overlay.style.display = 'flex';
                    overlay.style.zIndex = '10';
                    textContent.style.color = 'white';
                    textContent.style.visibility = 'visible';
                    textContent.style.opacity = '1';
                    
                    console.log('Overlay configurado correctamente');
                }
            }
        });
    }async init() {
        console.log('🚀 Inicializando ParaEllosManager...');
        
        // Hacer el manager disponible globalmente para reintentos
        window.paraEllosManager = this;
        
        this.showLoadingIndicator('Verificando dependencias...');
        
        // Verificar que Supabase esté disponible sin crear múltiples instancias
        if (typeof window.supabase === 'undefined' && typeof initSupabase === 'function') {
            console.log('🔄 Inicializando Supabase...');
            this.updateLoadingDetails('Configurando conexión a la base de datos...');
            initSupabase();
        }
        
        // Verificar dependencias
        const dependencies = this.checkDependencies();
        if (Object.values(dependencies).some(dep => !dep)) {
            console.error('❌ Algunas dependencias no están disponibles:', dependencies);
            this.hideLoadingIndicator();
            this.showError('Error de configuración', 'Faltan dependencias requeridas para cargar los productos');
            return;
        }
        
        this.updateLoadingDetails('Configurando eventos...');
        await this.loadProducts();
        
        this.updateLoadingDetails('Configurando interfaz...');
        this.setupEventListeners();
        this.renderProducts();
        this.setupFilters();
        this.updatePriceFilter();
        
        console.log('✅ ParaEllosManager inicializado completamente');
    }async loadProducts() {
        try {
            console.log('📦 Cargando productos para ellos...');
            this.showLoadingIndicator('Conectando con la base de datos...');
            
            // Verificar que ProductosService esté disponible
            if (typeof ProductosService === 'undefined') {
                console.error('❌ ProductosService no está disponible');
                this.hideLoadingIndicator();
                this.showError('Servicio de productos no disponible', 'ProductosService no está cargado correctamente');
                this.productos = [];
                this.filteredProducts = [];
                return;
            }
            
            this.updateLoadingDetails('Obteniendo productos para hombres...');
            
            // Medir tiempo de carga
            const startTime = performance.now();
            
            // Cargar productos específicos para hombres
            this.productos = await ProductosService.obtenerProductosPorCategoria('para-ellos');
            this.filteredProducts = [...this.productos];
            
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            console.log(`✅ ${this.productos.length} productos cargados en ${loadTime.toFixed(2)}ms`);
            
            this.hideLoadingIndicator();
            
            if (this.productos.length === 0) {
                console.warn('⚠️ No se encontraron productos para la categoría "para-ellos"');
                this.showError('No se encontraron productos', 'No hay productos disponibles para la categoría "para-ellos"');
            } else {
                console.log(`✅ Productos cargados exitosamente:`, this.productos.slice(0, 3));
            }
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.hideLoadingIndicator();
            this.showError('Error cargando productos', error.message);
            this.productos = [];
            this.filteredProducts = [];
        }
    }

    showLoadingIndicator(message = 'Cargando productos...') {
        const indicator = document.getElementById('loadingIndicator');
        const loadingText = indicator?.querySelector('.loading-text');
        
        if (indicator) {
            indicator.style.display = 'flex';
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
        
        // También marcar el grid como loading
        const grid = document.querySelector('.index-grid');
        if (grid) {
            grid.classList.add('loading');
        }
    }

    updateLoadingDetails(details) {
        const loadingDetails = document.getElementById('loadingDetails');
        if (loadingDetails) {
            loadingDetails.textContent = details;
        }
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        
        // Remover clase loading del grid
        const grid = document.querySelector('.index-grid');
        if (grid) {
            grid.classList.remove('loading');
        }
    }

    showError(title, message) {
        const container = document.querySelector('.index-grid');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-message">
                <h3>${title}</h3>
                <p>${message}</p>
                <p>Tiempo de carga: ${new Date().toLocaleTimeString()}</p>
                <button class="retry-button" onclick="window.paraEllosManager?.init()">
                    Reintentar carga
                </button>
            </div>
        `;
    }

    checkDependencies() {
        console.log('🔍 Verificando dependencias...');
        
        const dependencies = {
            'Supabase JS': typeof window.supabase !== 'undefined',
            'initSupabase': typeof initSupabase !== 'undefined',
            'ProductosService': typeof ProductosService !== 'undefined',
            'supabaseClient': typeof supabaseClient !== 'undefined'
        };
        
        Object.entries(dependencies).forEach(([name, available]) => {
            console.log(`${available ? '✅' : '❌'} ${name}: ${available ? 'Disponible' : 'NO DISPONIBLE'}`);
        });
        
        return dependencies;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activeFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Clear search button
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = '';
                    this.activeFilters.search = '';
                    this.applyFilters();
                }
            });
        }

        // Category filters
        const categoryFilters = document.querySelectorAll('.index-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                e.preventDefault();
                
                categoryFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                
                this.activeFilters.category = filter.dataset.category || '';
                this.applyFilters();
            });
        });

        // Pagination
        this.setupPagination();
    }    applyFilters() {
        // Mostrar indicador de filtrado si hay muchos productos
        if (this.productos.length > 50) {
            this.showLoadingIndicator('Aplicando filtros...');
        }
        
        const startTime = performance.now();
        let filtered = [...this.productos];

        // Search filter
        if (this.activeFilters.search) {
            const searchTerm = this.activeFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.nombre?.toLowerCase().includes(searchTerm) ||
                product.marca?.toLowerCase().includes(searchTerm) ||
                product.descripcion?.toLowerCase().includes(searchTerm)
            );
        }

        // Category filter
        if (this.activeFilters.category && this.activeFilters.category !== 'all') {
            filtered = filtered.filter(product => 
                product.subcategoria === this.activeFilters.category ||
                product.tipo === this.activeFilters.category
            );
        }

        // Brand filter
        if (this.activeFilters.brand) {
            filtered = filtered.filter(product => product.marca === this.activeFilters.brand);
        }

        // Subcategory filter
        if (this.activeFilters.subcategoria) {
            filtered = filtered.filter(product => product.subcategoria === this.activeFilters.subcategoria);
        }

        // Price filter
        filtered = filtered.filter(product => {
            const price = product.precio || 0;
            return price >= this.activeFilters.priceMin && price <= this.activeFilters.priceMax;
        });

        this.filteredProducts = filtered;
        this.currentPage = 1;
        
        const endTime = performance.now();
        const filterTime = endTime - startTime;
        
        console.log(`🔍 Filtros aplicados en ${filterTime.toFixed(2)}ms: ${filtered.length}/${this.productos.length} productos`);
        
        // Ocultar indicador de carga si se mostró
        if (this.productos.length > 50) {
            this.hideLoadingIndicator();
        }
        
        this.renderProducts();
        this.updateSearchResults();
    }renderProducts() {
        console.log('🎨 Renderizando productos...');
        
        const container = document.querySelector('.index-grid');
        if (!container) {
            console.error('❌ Contenedor .index-grid no encontrado');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const currentProducts = this.filteredProducts.slice(startIndex, endIndex);

        console.log(`📄 Página ${this.currentPage}: mostrando ${currentProducts.length} de ${this.filteredProducts.length} productos`);

        if (currentProducts.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <h3>No se encontraron productos</h3>
                    <p>Total de productos disponibles: ${this.productos.length}</p>
                    <p>Productos filtrados: ${this.filteredProducts.length}</p>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }        const productsHTML = currentProducts.map(product => {            // Generar etiqueta de estado
            const estado = product.estado || 'disponible';
            const isOnSale = estado === 'oferta';
            
            // Calcular precios si hay descuento
            const precioInfo = this.getPrecioInfo(product);
            
            // Obtener imagen
            const imageSrc = this.getImagePath(product.imagen_url || product.imagen);
            const productName = product.nombre || 'Producto sin nombre';
            
            // Generar descripción corta
            const description = this.generateDescription(product);
            
            // Generar opciones de tamaño (simuladas - puedes conectar con datos reales)
            const sizeOptions = this.generateSizeOptions(product);
            
            // Generar etiquetas dinámicas
            const badges = this.generateProductBadges(product);
            
            return `
            <div class="index-item" data-product-id="${product.id}">
                ${badges}
                
                <div class="item-image">
                    <img src="${imageSrc}" 
                         alt="${productName}"
                         loading="lazy"
                         onerror="window.paraEllosManager.handleImageError(this, '${productName}');">
                    
                    ${sizeOptions}
                    
                    <div class="item-overlay">
                        <button class="quick-view-btn" onclick="window.paraEllosManager.showQuickView(${product.id})">
                            Vista Rápida
                        </button>
                    </div>
                </div>                <div class="item-content">
                    <h3 class="item-title">${product.nombre || 'Sin nombre'}</h3>
                    <p class="item-size">${product.ml || 100} ML</p>
                    <p class="item-description">${description}</p>
                    
                    <div class="item-price">${precioInfo}</div>
                    
                    ${this.generateAddToCartButton(product)}
                </div>
                
                <div class="product-badges">
                    ${badges}
                </div>
            </div>
            `;
        }).join('');

        container.innerHTML = productsHTML;
        this.updatePagination();        
        console.log(`✅ ${currentProducts.length} productos renderizados exitosamente`);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    showQuickView(productId) {
        const product = this.productos.find(p => p.id === productId);
        if (!product) return;

        const modal = document.querySelector('.quick-view-modal');
        const modalBody = modal.querySelector('.modal-body');        const imageSrc = this.getImagePath(product.imagen_url || product.imagen);
        const productName = product.nombre || 'Producto sin nombre';        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${imageSrc}" 
                         alt="${productName}"
                         onload="this.style.opacity='1';"
                         onerror="window.paraEllosManager.handleImageError(this, '${productName}');"
                         loading="lazy"
                         style="opacity: 0; transition: opacity 0.3s ease;">
                </div>
                <div class="quick-view-info">
                    <h2>${product.nombre}</h2>
                    <p class="brand">${product.marca || ''}</p>
                    <p class="size">Tamaño: ${product.ml || 100} ML</p>
                    <p class="price">$${this.formatPrice(product.precio || 0)}</p>
                    <p class="description">${product.descripcion || ''}</p>
                    ${product.notas ? `
                        <div class="notes">
                            <h4>Notas:</h4>
                            <p>${Array.isArray(product.notas) ? product.notas.join(', ') : product.notas}</p>
                        </div>
                    ` : ''}
                    <div class="actions">
                        ${this.generateAddToCartButton(product)}
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => this.closeQuickView();

        modal.onclick = (e) => {
            if (e.target === modal) this.closeQuickView();
        };
    }

    closeQuickView() {
        const modal = document.querySelector('.quick-view-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Métodos para integración con carrito de compras
    addToCart(productId) {
        const product = this.productos.find(p => p.id === productId);
        if (!product) {
            console.error('❌ Producto no encontrado:', productId);
            return;
        }

        // ✅ VALIDAR STOCK - Si está agotado, mostrar alerta
        if (product.stock <= 0 || product.estado === 'agotado') {
            console.warn('⚠️ Producto agotado:', product.nombre);
            this.showTemporaryMessage('🚫 Producto agotado - No disponible para agregar al carrito', 'error');
            return;
        }
        
        if (product.estado === 'proximo') {
            console.warn('⚠️ Producto próximo - no disponible aún');
            this.showTemporaryMessage('� Producto próximamente disponible', 'warning');
            return;
        }

        console.log('�🛒 [ParaEllos] Agregando producto al carrito:', product.nombre, product.id);

        // Función para agregar el producto de forma segura
        const addProductSafely = () => {
            if (window.shoppingCart && window.shoppingCart.isInitialized) {
                console.log('✅ [ParaEllos] Carrito disponible y inicializado');
                
                // ✅ CALCULAR PRECIO CON DESCUENTO SI APLICA
                let finalPrice = parseFloat(product.precio);
                if (product.descuento && product.descuento > 0) {
                    finalPrice = finalPrice * (1 - product.descuento / 100);
                    console.log(`💰 Aplicando descuento ${product.descuento}%: $${product.precio} → $${finalPrice.toFixed(0)}`);
                }
                
                const productForCart = {
                    ...product,
                    precio: finalPrice, // ✅ Usar precio con descuento
                    precio_original: product.precio // Guardar precio original para referencia
                };
                
                window.shoppingCart.addItem(productForCart);
                
                // Verificar que se agregó correctamente
                setTimeout(() => {
                    const cartStatus = window.shoppingCart.getCartStatus();
                    console.log(`🔍 [ParaEllos] Verificación post-agregado: ${cartStatus.totalItems} items en carrito`);
                }, 200);
                
            } else {
                console.warn('⚠️ [ParaEllos] Carrito no disponible o no inicializado');
                console.log('🔧 [ParaEllos] Estado del carrito:', {
                    exists: !!window.shoppingCart,
                    initialized: window.shoppingCart ? window.shoppingCart.isInitialized : false,
                    singleton: !!window.getShoppingCartInstance
                });
                
                // Intentar obtener/inicializar usando singleton
                if (window.getShoppingCartInstance) {
                    console.log('🔄 [ParaEllos] Usando función singleton...');
                    const cart = window.getShoppingCartInstance();
                    if (cart && cart.isInitialized) {
                        console.log('✅ [ParaEllos] Carrito obtenido via singleton');
                        
                        // ✅ CALCULAR PRECIO CON DESCUENTO SI APLICA
                        let finalPrice = parseFloat(product.precio);
                        if (product.descuento && product.descuento > 0) {
                            finalPrice = finalPrice * (1 - product.descuento / 100);
                            console.log(`💰 Aplicando descuento ${product.descuento}%: $${product.precio} → $${finalPrice.toFixed(0)}`);
                        }
                        
                        const productForCart = {
                            ...product,
                            precio: finalPrice, // ✅ Usar precio con descuento
                            precio_original: product.precio // Guardar precio original para referencia
                        };
                        
                        cart.addItem(productForCart);
                    } else {
                        console.error('❌ [ParaEllos] Singleton no funcionó');
                        this.showTemporaryMessage('Error: Carrito no disponible');
                    }
                } else {
                    console.error('❌ [ParaEllos] Función singleton no disponible');
                    this.showTemporaryMessage('Error: Sistema de carrito no disponible');
                }
            }
        };

        // Verificar si el carrito está disponible inmediatamente
        if (window.shoppingCart && window.shoppingCart.isInitialized) {
            addProductSafely();
        } else {
            // Esperar un poco y reintentar
            console.log('⏳ [ParaEllos] Esperando inicialización del carrito...');
            let attempts = 0;
            const maxAttempts = 5;
            
            const checkAndAdd = () => {
                attempts++;
                console.log(`🔄 [ParaEllos] Intento ${attempts}/${maxAttempts} de agregar producto`);
                
                if (window.shoppingCart && window.shoppingCart.isInitialized) {
                    console.log('✅ [ParaEllos] Carrito listo después de esperar');
                    addProductSafely();
                } else if (attempts < maxAttempts) {
                    console.log(`⏳ [ParaEllos] Reintentando en 500ms...`);
                    setTimeout(checkAndAdd, 500);
                } else {
                    console.error('❌ [ParaEllos] Carrito no se inicializó después de múltiples intentos');
                    // Último recurso: forzar inicialización
                    if (window.forceInitCart) {
                        console.log('🔧 [ParaEllos] Forzando inicialización del carrito...');
                        window.forceInitCart();
                        setTimeout(() => {
                            if (window.shoppingCart) {
                                addProductSafely();
                            } else {
                                this.showTemporaryMessage('Error: No se pudo inicializar el carrito');
                            }
                        }, 1000);
                    } else {
                        this.showTemporaryMessage('Producto agregado: ' + product.nombre + ' (Solo en memoria)');
                    }
                }
            };
            
            checkAndAdd();
        }
    }

    // Método legacy para compatibilidad
    addToBag(productId) {
        this.addToCart(productId);
    }

    showTemporaryMessage(message, type = 'info') {
        const notification = document.createElement('div');
        
        // Definir colores según el tipo
        let backgroundColor, borderColor;
        switch(type) {
            case 'error':
                backgroundColor = '#dc3545';
                borderColor = '#dc3545';
                break;
            case 'warning':
                backgroundColor = '#ffc107';
                borderColor = '#ffc107';
                break;
            case 'success':
                backgroundColor = '#28a745';
                borderColor = '#28a745';
                break;
            default:
                backgroundColor = '#2c2c2c';
                borderColor = '#2c2c2c';
        }
        
        notification.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 10000;
            background: ${backgroundColor}; color: white; padding: 12px 20px;
            border-radius: 8px; font-family: 'Montserrat', sans-serif;
            font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 4px solid ${borderColor};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    updatePriceFilter() {
        // Primero verificar si existe el nuevo filtro rediseñado
        const newFilterExists = document.getElementById('minPriceInput');
        
        if (newFilterExists) {
            this.initializeRedesignedPriceFilter();
        } else {
            // Fallback al filtro antiguo
            this.initializeLegacyPriceFilter();
        }
    }

    initializeRedesignedPriceFilter() {
        console.log('🎨 Inicializando filtro de precio rediseñado');
        
        // Elementos del nuevo filtro
        const minPriceInput = document.getElementById('minPriceInput');
        const maxPriceInput = document.getElementById('maxPriceInput');
        const minSlider = document.getElementById('minPriceSlider');
        const maxSlider = document.getElementById('maxPriceSlider');
        const minThumb = document.getElementById('minThumb');
        const maxThumb = document.getElementById('maxThumb');
        const sliderRange = document.getElementById('priceSliderRange');
        const resetButton = document.getElementById('resetPriceFilter');
        const applyButton = document.getElementById('applyPriceFilter');
        const toggleButton = document.getElementById('priceFilterToggle');
        const filterContent = document.getElementById('priceFilterContent');
        const presetButtons = document.querySelectorAll('.preset-btn');

        if (!minPriceInput || !maxPriceInput) return;

        // Obtener rango de precios
        const prices = this.productos.map(p => p.precio || 0).filter(p => p > 0);
        if (prices.length === 0) return;

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Configurar sliders
        minSlider.min = minPrice;
        minSlider.max = maxPrice;
        minSlider.value = minPrice;
        maxSlider.min = minPrice;
        maxSlider.max = maxPrice;
        maxSlider.value = maxPrice;

        // Configurar filtros activos
        this.activeFilters.priceMin = minPrice;
        this.activeFilters.priceMax = maxPrice;

        // Formatear valores iniciales
        minPriceInput.value = this.formatPriceForInput(minPrice);
        maxPriceInput.value = this.formatPriceForInput(maxPrice);

        // Función para actualizar thumbs y rango visual
        const updateVisualElements = () => {
            const minVal = parseInt(minSlider.value);
            const maxVal = parseInt(maxSlider.value);
            const range = maxPrice - minPrice;

            const minPercent = ((minVal - minPrice) / range) * 100;
            const maxPercent = ((maxVal - minPrice) / range) * 100;

            if (minThumb) minThumb.style.left = `${minPercent}%`;
            if (maxThumb) maxThumb.style.left = `${maxPercent}%`;
            if (sliderRange) {
                sliderRange.style.left = `${minPercent}%`;
                sliderRange.style.width = `${maxPercent - minPercent}%`;
            }
        };

        // Función para sincronizar todos los elementos
        const syncAllElements = (source) => {
            let minVal = parseInt(minSlider.value);
            let maxVal = parseInt(maxSlider.value);

            // Asegurar que min <= max
            if (minVal > maxVal) {
                if (source === 'min') {
                    maxVal = minVal;
                    maxSlider.value = maxVal;
                } else {
                    minVal = maxVal;
                    minSlider.value = minVal;
                }
            }

            // Actualizar inputs
            minPriceInput.value = this.formatPriceForInput(minVal);
            maxPriceInput.value = this.formatPriceForInput(maxVal);

            // Actualizar filtros
            this.activeFilters.priceMin = minVal;
            this.activeFilters.priceMax = maxVal;

            // Actualizar elementos visuales
            updateVisualElements();

            // Limpiar selección de presets
            presetButtons.forEach(btn => btn.classList.remove('active'));
        };

        // Event listeners para sliders
        minSlider.addEventListener('input', () => syncAllElements('min'));
        maxSlider.addEventListener('input', () => syncAllElements('max'));

        // Event listeners para inputs de texto
        const handleInputChange = (input, isMin) => {
            const value = this.parsePriceFromInput(input.value);
            if (value !== null && value >= minPrice && value <= maxPrice) {
                if (isMin) {
                    minSlider.value = value;
                    syncAllElements('min');
                } else {
                    maxSlider.value = value;
                    syncAllElements('max');
                }
            }
        };

        minPriceInput.addEventListener('blur', () => handleInputChange(minPriceInput, true));
        maxPriceInput.addEventListener('blur', () => handleInputChange(maxPriceInput, false));

        // Event listeners para presets
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const minVal = parseInt(btn.getAttribute('data-min'));
                const maxVal = parseInt(btn.getAttribute('data-max'));
                
                minSlider.value = Math.max(minVal, minPrice);
                maxSlider.value = Math.min(maxVal, maxPrice);
                
                syncAllElements();
                
                // Marcar como activo
                presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Reset button
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                minSlider.value = minPrice;
                maxSlider.value = maxPrice;
                syncAllElements();
            });
        }

        // Apply button
        if (applyButton) {
            applyButton.addEventListener('click', () => {
                this.applyFilters();
                console.log('🔍 Filtros de precio aplicados:', {
                    min: this.activeFilters.priceMin,
                    max: this.activeFilters.priceMax
                });
            });
        }

        // Toggle functionality
        if (toggleButton && filterContent) {
            toggleButton.addEventListener('click', () => {
                const isCollapsed = filterContent.classList.contains('collapsed');
                
                if (isCollapsed) {
                    filterContent.classList.remove('collapsed');
                    toggleButton.querySelector('svg').style.transform = 'rotate(180deg)';
                } else {
                    filterContent.classList.add('collapsed');
                    toggleButton.querySelector('svg').style.transform = 'rotate(0deg)';
                }
            });
        }

        // Inicializar elementos visuales
        updateVisualElements();
        
        console.log('✅ Filtro de precio rediseñado inicializado');
    }

    initializeLegacyPriceFilter() {
        const minSlider = document.getElementById('minPriceSliderEllos');
        const maxSlider = document.getElementById('maxPriceSliderEllos');
        const priceDisplay = document.getElementById('priceRangeDisplayEllos');
        const resetButton = document.getElementById('resetPriceFilter');

        if (!minSlider || !maxSlider) return;

        // Obtener rango de precios de los productos
        const prices = this.productos.map(p => p.precio || 0).filter(p => p > 0);
        console.log(`🏷️ Precios encontrados en ${this.productos.length} productos:`, prices.sort((a,b) => a-b));
        
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            console.log(`💰 Rango de precios calculado: $${this.formatPrice(minPrice)} - $${this.formatPrice(maxPrice)}`);
            
            minSlider.min = minPrice;
            minSlider.max = maxPrice;
            minSlider.value = minPrice;
            
            maxSlider.min = minPrice;
            maxSlider.max = maxPrice;
            maxSlider.value = maxPrice;
            
            // Actualizar los filtros activos
            this.activeFilters.priceMin = minPrice;
            this.activeFilters.priceMax = maxPrice;
            
            // Actualizar la visualización inicial
            if (priceDisplay) {
                priceDisplay.textContent = `$${this.formatPrice(minPrice)} - $${this.formatPrice(maxPrice)}`;
            }
            
            // Inicializar la barra visual
            this.updateSliderRangeVisual(minSlider, maxSlider);
        }

        const updatePriceRange = () => {
            const min = parseInt(minSlider.value);
            const max = parseInt(maxSlider.value);

            if (min > max) {
                minSlider.value = max;
                maxSlider.value = min;
            }

            this.activeFilters.priceMin = parseInt(minSlider.value);
            this.activeFilters.priceMax = parseInt(maxSlider.value);

            if (priceDisplay) {
                priceDisplay.textContent = `$${this.formatPrice(this.activeFilters.priceMin)} - $${this.formatPrice(this.activeFilters.priceMax)}`;
            }

            // Actualizar la barra visual del rango
            this.updateSliderRangeVisual(minSlider, maxSlider);

            this.applyFilters();
        };

        minSlider.addEventListener('input', updatePriceRange);
        maxSlider.addEventListener('input', updatePriceRange);

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                minSlider.value = minSlider.min;
                maxSlider.value = maxSlider.max;
                updatePriceRange();
            });
        }

        // Inicializar y aplicar filtros
        updatePriceRange();
        this.applyFilters();
    }

    // Función helper para formatear precio para input
    formatPriceForInput(price) {
        return new Intl.NumberFormat('es-CO').format(price);
    }

    // Función helper para parsear precio desde input
    parsePriceFromInput(inputValue) {
        const cleaned = inputValue.replace(/[^\d]/g, '');
        const parsed = parseInt(cleaned);
        return isNaN(parsed) ? null : parsed;
    }

    updateSliderRangeVisual(minSlider, maxSlider) {
        const rangeElement = document.getElementById('priceSliderRangeEllos');
        if (!rangeElement) return;

        const min = parseInt(minSlider.min);
        const max = parseInt(minSlider.max);
        const minVal = parseInt(minSlider.value);
        const maxVal = parseInt(maxSlider.value);

        const minPercent = ((minVal - min) / (max - min)) * 100;
        const maxPercent = ((maxVal - min) / (max - min)) * 100;

        rangeElement.style.left = `${minPercent}%`;
        rangeElement.style.width = `${maxPercent - minPercent}%`;
    }

    setupPagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderProducts();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderProducts();
                }
            });
        }
    }

    updatePagination() {
        const totalProducts = this.filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / this.productsPerPage);
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = Math.min(startIndex + this.productsPerPage, totalProducts);

        // Update pagination info
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalProducts} fragancias`;
        }

        // Update pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        // Update pagination numbers
        const paginationNumbers = document.getElementById('paginationNumbers');
        if (paginationNumbers && totalPages > 1) {
            let numbersHTML = '';
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                    numbersHTML += `
                        <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" 
                                onclick="window.paraEllosManager.goToPage(${i})">
                            ${i}
                        </button>
                    `;
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    numbersHTML += '<span class="pagination-ellipsis">...</span>';
                }
            }
            
            paginationNumbers.innerHTML = numbersHTML;
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
    }

    updateSearchResults() {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (this.activeFilters.search) {
            searchResults.style.display = 'block';
            searchResults.textContent = `${this.filteredProducts.length} resultados para "${this.activeFilters.search}"`;
        } else {
            searchResults.style.display = 'none';
        }

        // Show/hide clear search button
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.style.display = this.activeFilters.search ? 'block' : 'none';
        }
    }

    async setupFilters() {
        // Configurar filtros dinámicos basados en los productos
        if (this.productos.length === 0) return;

        // Obtener marcas únicas
        const brands = [...new Set(this.productos.map(p => p.marca).filter(Boolean))].sort();
        
        // Obtener subcategorías únicas
        const subcategorias = [...new Set(this.productos.map(p => p.subcategoria).filter(Boolean))].sort();

        // Crear filtros de marca si hay contenedor
        const brandContainer = document.querySelector('.filter-brands');
        if (brandContainer && brands.length > 0) {
            const brandsHTML = brands.map(brand => `
                <button class="filter-btn" data-filter-type="marca" data-filter-value="${brand}">
                    ${brand}
                </button>
            `).join('');

            brandContainer.innerHTML = `
                <h4>Marcas</h4>
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter-type="marca" data-filter-value="">
                        Todas
                    </button>
                    ${brandsHTML}
                </div>
            `;
        }

        // Crear filtros de subcategoría si hay contenedor
        const subcategoryContainer = document.querySelector('.filter-subcategories');
        if (subcategoryContainer && subcategorias.length > 0) {
            const subcategoriasHTML = subcategorias.map(sub => `
                <button class="filter-btn" data-filter-type="subcategoria" data-filter-value="${sub}">
                    ${sub}
                </button>
            `).join('');

            subcategoryContainer.innerHTML = `
                <h4>Tipos</h4>
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter-type="subcategoria" data-filter-value="">
                        Todos
                    </button>
                    ${subcategoriasHTML}
                </div>
            `;
        }

        // Agregar event listeners a los filtros dinámicos
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const filterType = btn.dataset.filterType;
                const filterValue = btn.dataset.filterValue;
                
                // Remover active de botones del mismo tipo
                const sameTypeButtons = document.querySelectorAll(`[data-filter-type="${filterType}"]`);
                sameTypeButtons.forEach(b => b.classList.remove('active'));
                
                // Agregar active al botón clickeado
                btn.classList.add('active');
                
                // Aplicar filtro
                if (filterType === 'marca') {
                    this.activeFilters.brand = filterValue;
                } else if (filterType === 'subcategoria') {
                    this.activeFilters.subcategoria = filterValue;
                }
                
                this.applyFilters();
            });
        });
    }

    // Método para forzar recarga de productos (útil después de agregar nuevos productos)
    async forceReloadProducts() {
        console.log('🔄 Forzando recarga de productos...');
        try {
            this.productos = [];
            this.filteredProducts = [];
            
            // Recargar productos
            await this.loadProducts();
            this.updatePriceFilter();
            this.applyFilters();
            this.renderProducts();
            
            console.log('✅ Productos recargados exitosamente');
        } catch (error) {
            console.error('❌ Error recargando productos:', error);
        }
    }

    // Función de debug para verificar los rangos de precios
    debugPriceRange() {
        console.group('🔍 DEBUG RANGOS DE PRECIOS PARA ELLOS');
        
        const prices = this.productos.map(p => p.precio || 0).filter(p => p > 0);
        console.log('📊 Total de productos:', this.productos.length);
        console.log('💰 Productos con precio válido:', prices.length);
        console.log('🏷️ Todos los precios:', prices.sort((a,b) => a-b));
        
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            console.log(`📉 Precio mínimo: $${this.formatPrice(minPrice)}`);
            console.log(`📈 Precio máximo: $${this.formatPrice(maxPrice)}`);
            
            // Verificar elementos del filtro
            const minSlider = document.getElementById('minPriceSliderEllos');
            const maxSlider = document.getElementById('maxPriceSliderEllos');
            const display = document.getElementById('priceRangeDisplayEllos');
            
            console.log('🎛️ Estado de los sliders:');
            console.log('- Min slider:', minSlider ? `${minSlider.min} a ${minSlider.max}, valor: ${minSlider.value}` : 'No encontrado');
            console.log('- Max slider:', maxSlider ? `${maxSlider.min} a ${maxSlider.max}, valor: ${maxSlider.value}` : 'No encontrado');
            console.log('- Display:', display ? display.textContent : 'No encontrado');
        }
        
        console.groupEnd();
        return { productCount: this.productos.length, priceCount: prices.length, prices: prices.sort((a,b) => a-b) };
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

    // Función auxiliar para obtener la ruta correcta de imagen placeholder
    getPlaceholderImagePath() {
        // Detectar si estamos en la carpeta html/ o en la raíz
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/') || currentPath.includes('\\html\\');
        
        if (isInHtmlFolder) {
            return '../IMAGENES/placeholder-simple.svg';
        } else {
            return 'IMAGENES/placeholder-simple.svg';
        }
    }    // Función auxiliar para obtener la ruta correcta de cualquier imagen
    getImagePath(imagePath) {
        if (!imagePath) return this.getPlaceholderImagePath();
        
        // Limpiar espacios y caracteres extraños
        imagePath = imagePath.trim();
        
        // Si es una URL completa (http/https), usarla tal como está
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            console.log(`🌐 Usando URL externa: ${imagePath}`);
            return imagePath;
        }
        
        // Si es data URL (base64), usarla tal como está
        if (imagePath.startsWith('data:image/')) {
            console.log(`📄 Usando imagen base64: ${imagePath.substring(0, 50)}...`);
            return imagePath;
        }
        
        // Si es una ruta relativa que empieza con ../, usarla tal como está
        if (imagePath.startsWith('../')) {
            console.log(`📂 Usando ruta relativa: ${imagePath}`);
            return imagePath;
        }
        
        // Para rutas locales, determinar el contexto actual
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/') || currentPath.includes('\\html\\');
        
        let finalPath;
        
        if (isInHtmlFolder && !imagePath.startsWith('../')) {
            // Estamos en html/ y la imagen no tiene ../, agregar ../
            finalPath = `../${imagePath}`;
        } else {
            finalPath = imagePath;
        }
        
        console.log(`🖼️ Ruta de imagen local procesada: ${imagePath} → ${finalPath}`);
        return finalPath;
    }    // Función auxiliar para manejar errores de imagen de forma inteligente
    handleImageError(imgElement, productName = '') {
        // Evitar bucles infinitos de error
        if (imgElement.hasAttribute('data-error-handled')) {
            return;
        }
        
        imgElement.setAttribute('data-error-handled', 'true');
        
        const originalSrc = imgElement.src;
        
        console.warn(`⚠️ Error cargando imagen${productName ? ` para ${productName}` : ''}`);
        console.warn(`   Ruta original: ${originalSrc}`);
        
        // Asegurar que la imagen se muestre con fade-in incluso con placeholder
        setTimeout(() => {
            // Usar SVG como placeholder universal que siempre funciona
            imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMzAwIDQwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmOGY5ZmEiIHN0cm9rZT0iI2RlZTJlNiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMTQwIiByPSIyMCIgZmlsbD0iI2FkYjViZCIvPjxwYXRoIGQ9Im0xMDAgMjIwIDUwLTUwIDUwIDUwIDUwLTUwIDUwIDUwIiBzdHJva2U9IiNhZGI1YmQiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjE1MCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY3ODkzIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
            imgElement.alt = `Imagen no disponible${productName ? ` - ${productName}` : ''}`;
            imgElement.style.opacity = '1';
        }, 50);
    }

    // Función auxiliar para detectar el tipo de imagen
    detectImageType(imagePath) {
        if (!imagePath) return 'Sin imagen';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return 'URL externa';
        if (imagePath.startsWith('data:image/')) return 'Base64';
        return 'Imagen local';
    }    // Métodos auxiliares para el diseño Tom Ford
    generateDescription(product) {
        // Usar la descripción real del producto si existe, sino generar una basada en las notas
        if (product.descripcion && product.descripcion.trim()) {
            return product.descripcion.trim();
        }
        
        // Si tiene notas, usar las notas como descripción
        if (product.notas && product.notas.trim()) {
            const notas = product.notas.trim();
            return `Con notas de ${notas}`;
        }
        
        // Solo como último recurso, usar descripciones genéricas por marca
        const descriptions = {
            'Tom Ford': 'Un envolvente aroma de notas de vainilla, flores blancas y sándalo.',
            'Chanel': 'Una beguiling, deeply seductive scent of vanilla resinoid, mahogany wood accord and roasted barley.',
            'Dior': 'Una fragancia elegante y sofisticada con notas florales y especiadas.',
            'Versace': 'Un aroma fresco y vibrante con notas mediterráneas.',
            'Armani': 'Una composición moderna y masculina con notas amaderadas.',
            'Givenchy': 'Una fragancia intensa y carismática con notas orientales.',
            'Paco Rabanne': 'Un perfume audaz y seductor con notas metálicas.',
            'Calvin Klein': 'Una fragancia fresca y contemporánea.',
            'Hugo Boss': 'Un aroma elegante y profesional.',
            'Carolina Herrera': 'Una fragancia sofisticada con notas florales y especiadas.'
        };
        
        const marca = product.marca || 'Fragancia';
        return descriptions[marca] || 'Una fragancia única y cautivadora con notas distintivas.';
    }
    
    generateSizeOptions(product) {
        // Generar opciones de tamaño comunes
        const sizes = ['30 ml', '50 ml', '100 ml'];
        const availableSizes = sizes.slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 tamaños
        
        if (availableSizes.length <= 1) return '';
        
        const sizeHTML = availableSizes.map(size => 
            `<a href="#" class="size-option" onclick="window.paraEllosManager.selectSize('${size}', ${product.id}); return false;">${size}</a>`
        ).join('');
        
        return `<div class="size-options">${sizeHTML}</div>`;
    }
    
    // Método para manejar selección de tamaño
    selectSize(size, productId) {
        console.log(`Tamaño seleccionado: ${size} para producto ${productId}`);
        // Aquí puedes agregar lógica para manejar la selección de tamaño
        // Por ejemplo, actualizar el precio o mostrar disponibilidad
    }
    
    // Método para agregar al carrito/bolsa
    addToBag(productId) {
        const product = this.productos.find(p => p.id === productId);
        if (!product) {
            console.error('Producto no encontrado');
            return;
        }
        
        console.log('Agregando al carrito:', product.nombre);
        
        // Simular agregado al carrito
        alert(`${product.nombre} agregado al carrito`);
        
        // Aquí puedes agregar la lógica real del carrito:
        // - Guardar en localStorage
        // - Enviar a API
        // - Actualizar contador del carrito
        // - Mostrar notificación
    }
    
    // Generar etiquetas dinámicas para todos los productos
    generateProductBadges(product) {
        const badges = [];
        
        // Etiqueta por estado (SALE, AGOTADO, etc.)
        const estado = product.estado || 'disponible';
        switch (estado) {
            case 'oferta':
                badges.push({ text: 'SALE', class: 'sale-badge' });
                break;
            case 'agotado':
                badges.push({ text: 'AGOTADO', class: 'sold-out-badge' });
                break;
            case 'proximo':
                badges.push({ text: 'PRÓXIMAMENTE', class: 'coming-soon-badge' });
                break;
            case 'nuevo':
                badges.push({ text: 'NUEVO', class: 'new-badge' });
                break;
        }        // Etiqueta por marca premium
        const marca = product.marca || '';
        const marcasPremium = ['Tom Ford', 'Chanel', 'Dior', 'Creed', 'Maison Margiela'];
        if (marcasPremium.includes(marca)) {
            badges.push({ text: 'PREMIUM', class: 'premium-badge' });
        }
        
        // Etiqueta LUXURY - priorizar campo luxury de BD sobre precio alto
        if (product.luxury === true) {
            badges.push({ text: 'LUXURY', class: 'luxury-badge' });
        } else {
            // Solo si no está marcado como luxury en BD, usar precio como criterio
            const precio = product.precio || 0;
            if (precio > 500000) {
                badges.push({ text: 'LUXURY', class: 'luxury-badge' });
            }
        }
        
        // Etiqueta de descuento
        if (product.descuento && product.descuento > 0) {
            badges.push({ text: `-${product.descuento}%`, class: 'discount-badge' });
        }
        
        // Etiqueta especial para productos destacados (basado en popularidad simulada)
        const isPopular = (product.id % 7) === 0; // Cada 7mo producto
        if (isPopular) {
            badges.push({ text: 'POPULAR', class: 'popular-badge' });
        }
        
        // Etiqueta por edición limitada (simulada)
        const isLimited = marca === 'Tom Ford' && (product.id % 10) === 0;
        if (isLimited) {
            badges.push({ text: 'LIMITED', class: 'limited-badge' });
        }
        
        // Generar HTML para las etiquetas (máximo 2 para no sobrecargar)
        const maxBadges = badges.slice(0, 2);
        return maxBadges.map((badge, index) => 
            `<div class="${badge.class}" style="top: ${10 + (index * 35)}px;">${badge.text}</div>`
        ).join('');
    }

    generateAddToCartButton(product) {
        const isOutOfStock = product.stock <= 0 || product.estado === 'agotado';
        const isComingSoon = product.estado === 'proximo';
        
        if (isOutOfStock) {
            return `
                <button class="add-to-bag-btn disabled" disabled>
                    🚫 AGOTADO
                </button>
            `;
        }
        
        if (isComingSoon) {
            return `
                <button class="add-to-bag-btn disabled" disabled>
                    🔜 PRÓXIMAMENTE
                </button>
            `;
        }
        
        return `
            <button class="add-to-bag-btn" onclick="window.paraEllosManager.addToCart(${product.id})">
                AGREGAR AL CARRITO
            </button>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, verificando dependencias...');
    
    // Verificar que el contenedor exista antes de inicializar
    const checkContainer = () => {
        const container = document.querySelector('.index-grid');
        if (container) {
            console.log('✅ Contenedor encontrado, inicializando ParaEllosManager...');
            setTimeout(() => {
                window.paraEllosManager = new ParaEllosManager();
                
                // Agregar botón de recarga para debugging
                addDebugControls();
            }, 200);
        } else {
            console.log('⏳ Esperando contenedor .index-grid...');
            setTimeout(checkContainer, 100);
        }
    };
    
    // Verificar dependencias antes de inicializar
    const checkDependencies = () => {
        const hasSupabase = typeof window.supabase !== 'undefined';
        const hasConfig = typeof initSupabase === 'function';
        const hasService = typeof ProductosService !== 'undefined';
        
        if (hasSupabase && hasConfig && hasService) {
            console.log('✅ Todas las dependencias disponibles');
            checkContainer();
        } else {
            console.log('⏳ Esperando dependencias...', {
                supabase: hasSupabase,
                config: hasConfig,
                service: hasService
            });
            setTimeout(checkDependencies, 100);
        }
    };
    
    checkDependencies();
});

// Función para agregar controles de debugging
function addDebugControls() {
    // Solo agregar en modo debug (si hay parámetro en URL)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
        `;
        
        debugDiv.innerHTML = `
            <div>Debug Controls</div>
            <button onclick="window.paraEllosManager.forceReloadProducts()" style="margin: 5px; padding: 5px;">🔄 Recargar</button>
            <button onclick="console.log('Productos:', window.paraEllosManager.productos)" style="margin: 5px; padding: 5px;">📦 Log Productos</button>
            <button onclick="window.paraEllosManager.debugPriceRange()" style="margin: 5px; padding: 5px;">💰 Debug Precios</button>
        `;
        
        document.body.appendChild(debugDiv);
        console.log('🛠️ Controles de debug agregados. Accede con ?debug=true');
    }
}
