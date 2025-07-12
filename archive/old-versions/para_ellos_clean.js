// Para Ellos - Versión Limpia y Optimizada
class ParaEllosManager {
    constructor() {
        this.productos = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.activeFilters = {
            search: '',
            brand: '',
            subcategoria: '',
            priceMin: 0,
            priceMax: 10000000
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando ParaEllosManager...');
        
        // Inicializar Supabase si es necesario
        if (typeof window.supabase === 'undefined' && typeof initSupabase === 'function') {
            console.log('🔄 Inicializando Supabase...');
            initSupabase();
        }
        
        // Verificar dependencias críticas
        if (!this.checkDependencies()) {
            console.error('❌ Dependencias no disponibles');
            return;
        }
        
        await this.loadProducts();
        this.setupEventListeners();
        this.renderProducts();
        this.setupFilters();
        this.setupPriceFilter();
        
        console.log('✅ ParaEllosManager inicializado');
    }

    checkDependencies() {
        const dependencies = {
            supabase: typeof window.supabase !== 'undefined',
            initSupabase: typeof initSupabase !== 'undefined',
            ProductosService: typeof ProductosService !== 'undefined'
        };
        
        const allAvailable = Object.values(dependencies).every(dep => dep);
        if (!allAvailable) {
            console.warn('⚠️ Dependencias faltantes:', dependencies);
        }
        
        return allAvailable;
    }

    async loadProducts() {
        try {
            console.log('📦 Cargando productos para ellos...');
            
            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no disponible');
            }
            
            this.productos = await ProductosService.obtenerProductosPorCategoria('para-ellos');
            this.filteredProducts = [...this.productos];
            
            console.log(`✅ ${this.productos.length} productos cargados`);
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.productos = [];
            this.filteredProducts = [];
        }
    }

    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activeFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Limpiar búsqueda
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.activeFilters.search = '';
                    this.applyFilters();
                }
            });
        }

        // Paginación
        this.setupPagination();
    }

    applyFilters() {
        let filtered = [...this.productos];

        // Filtro de búsqueda
        if (this.activeFilters.search) {
            const searchTerm = this.activeFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.nombre?.toLowerCase().includes(searchTerm) ||
                product.marca?.toLowerCase().includes(searchTerm) ||
                product.descripcion?.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de marca
        if (this.activeFilters.brand) {
            filtered = filtered.filter(product => product.marca === this.activeFilters.brand);
        }

        // Filtro de subcategoría
        if (this.activeFilters.subcategoria) {
            filtered = filtered.filter(product => product.subcategoria === this.activeFilters.subcategoria);
        }

        // Filtro de precio
        filtered = filtered.filter(product => {
            const price = product.precio || 0;
            return price >= this.activeFilters.priceMin && price <= this.activeFilters.priceMax;
        });

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderProducts();
        this.updateSearchResults();
    }

    renderProducts() {
        console.log('🎨 Renderizando productos...');
        
        const container = document.querySelector('.index-grid');
        if (!container) {
            console.error('❌ Contenedor .index-grid no encontrado');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const currentProducts = this.filteredProducts.slice(startIndex, endIndex);

        if (currentProducts.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <h3>No se encontraron productos</h3>
                    <p>Total disponible: ${this.productos.length}</p>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        const productsHTML = currentProducts.map(product => {
            // Generar badge de estado (disponible, agotado, próximo, oferta)
            const estadoBadge = this.getEstadoBadge(product.estado || 'disponible');
            
            // Calcular precios con descuentos
            const precioInfo = this.getPrecioInfo(product);
            
            // Obtener imagen con manejo de errores
            const imageSrc = this.getImagePath(product.imagen_url || product.imagen);
            const productName = product.nombre || 'Producto sin nombre';
            
            return `
            <div class="index-item" data-product-id="${product.id}">
                <div class="item-image">
                    <img src="${imageSrc}" 
                         alt="${productName}"
                         loading="lazy"
                         onerror="window.paraEllosManager.handleImageError(this, '${productName}');">
                    ${estadoBadge}
                    <div class="item-overlay">
                        <button class="quick-view-btn" onclick="window.paraEllosManager.showQuickView(${product.id})">
                            Vista Rápida
                        </button>
                    </div>
                </div>
                <div class="item-content">
                    <h3 class="item-title">${product.nombre || 'Sin nombre'}</h3>
                    <p class="item-brand">${product.marca || 'Sin marca'}</p>
                    <div class="item-price">${precioInfo}</div>
                    <div class="item-category">${product.subcategoria || product.categoria || 'Sin categoría'}</div>
                </div>
            </div>
            `;
        }).join('');

        container.innerHTML = productsHTML;
        this.updatePagination();        
        console.log(`✅ ${currentProducts.length} productos renderizados`);
    }

    showQuickView(productId) {
        const product = this.productos.find(p => p.id === productId);
        if (!product) return;

        const modal = document.querySelector('.quick-view-modal');
        if (!modal) return;
        
        const modalBody = modal.querySelector('.modal-body');
        const imageSrc = this.getImagePath(product.imagen_url || product.imagen);
        const productName = product.nombre || 'Producto sin nombre';

        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${imageSrc}" 
                         alt="${productName}"
                         onerror="window.paraEllosManager.handleImageError(this, '${productName}')"
                         loading="lazy">
                </div>
                <div class="quick-view-info">
                    <h2>${product.nombre}</h2>
                    <p class="brand">${product.marca || ''}</p>
                    <div class="price">${this.getPrecioInfo(product)}</div>
                    <p class="description">${product.descripcion || ''}</p>
                    ${product.notas ? `
                        <div class="notes">
                            <h4>Notas:</h4>
                            <p>${Array.isArray(product.notas) ? product.notas.join(', ') : product.notas}</p>
                        </div>
                    ` : ''}
                    <div class="actions">
                        <button class="add-to-cart-btn" onclick="window.paraEllosManager.addToCart(${product.id})">
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Cerrar modal
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeQuickView();
        }

        modal.onclick = (e) => {
            if (e.target === modal) this.closeQuickView();
        };
    }

    closeQuickView() {
        const modal = document.querySelector('.quick-view-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    addToCart(productId) {
        const product = this.productos.find(p => p.id === productId);
        if (!product) return;

        console.log('Producto agregado al carrito:', product);
        this.showNotification(`${product.nombre} agregado al carrito`);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);

        // Mostrar notificación
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Ocultar y remover
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    setupPriceFilter() {
        const minSlider = document.getElementById('minPriceSlider');
        const maxSlider = document.getElementById('maxPriceSlider');
        const priceDisplay = document.getElementById('priceRangeDisplay');
        const resetButton = document.getElementById('resetPriceFilter');

        if (!minSlider || !maxSlider) return;

        // Configurar rango de precios
        const prices = this.productos.map(p => p.precio || 0).filter(p => p > 0);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            minSlider.min = minPrice;
            minSlider.max = maxPrice;
            minSlider.value = minPrice;
            
            maxSlider.min = minPrice;
            maxSlider.max = maxPrice;
            maxSlider.value = maxPrice;
            
            this.activeFilters.priceMin = minPrice;
            this.activeFilters.priceMax = maxPrice;
            
            if (priceDisplay) {
                priceDisplay.textContent = `$${this.formatPrice(minPrice)} - $${this.formatPrice(maxPrice)}`;
            }
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

        // Actualizar información de paginación
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalProducts} fragancias`;
        }

        // Actualizar botones
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;

        // Actualizar números de página
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

        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.style.display = this.activeFilters.search ? 'block' : 'none';
        }
    }

    async setupFilters() {
        if (this.productos.length === 0) return;

        // Obtener marcas y subcategorías únicas
        const brands = [...new Set(this.productos.map(p => p.marca).filter(Boolean))].sort();
        const subcategorias = [...new Set(this.productos.map(p => p.subcategoria).filter(Boolean))].sort();

        // Crear filtros de marca
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

        // Crear filtros de subcategoría
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

        // Event listeners para filtros
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

    // FUNCIONES AUXILIARES

    // Generar badge de estado (disponible, agotado, próximo, oferta)
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
    
    // Generar información de precio con descuentos
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

    // Obtener ruta de imagen con manejo de URLs, locales y base64
    getImagePath(imagePath) {
        if (!imagePath) return this.getPlaceholderImagePath();
        
        imagePath = imagePath.trim();
        
        // URL externa
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // Base64
        if (imagePath.startsWith('data:image/')) {
            return imagePath;
        }
        
        // Ruta relativa
        if (imagePath.startsWith('../')) {
            return imagePath;
        }
        
        // Ruta local - ajustar según contexto
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/') || currentPath.includes('\\html\\');
        
        return isInHtmlFolder && !imagePath.startsWith('../') 
            ? `../${imagePath}` 
            : imagePath;
    }

    // Placeholder de imagen
    getPlaceholderImagePath() {
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/') || currentPath.includes('\\html\\');
        
        return isInHtmlFolder 
            ? '../IMAGENES/placeholder-simple.svg' 
            : 'IMAGENES/placeholder-simple.svg';
    }

    // Manejo de errores de imagen
    handleImageError(imgElement, productName = '') {
        if (imgElement.hasAttribute('data-error-handled')) return;
        
        imgElement.setAttribute('data-error-handled', 'true');
        
        console.warn(`⚠️ Error cargando imagen para ${productName}`);
        
        // Usar SVG placeholder universal
        setTimeout(() => {
            imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOGY5ZmEiIHN0cm9rZT0iI2RlZTJlNiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iNzAiIGN5PSI3MCIgcj0iMTIiIGZpbGw9IiNhZGI1YmQiLz48cGF0aCBkPSJtNTUgMTMwIDMwLTMwIDMwIDMwIDMwLTMwIDMwIDMwIiBzdHJva2U9IiNhZGI1YmQiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY3ODkzIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
            imgElement.alt = `Imagen no disponible${productName ? ` - ${productName}` : ''}`;
        }, 50);
    }

    // Formatear precio
    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    // Recargar productos (útil para actualizaciones)
    async forceReloadProducts() {
        console.log('🔄 Recargando productos...');
        try {
            await this.loadProducts();
            this.applyFilters();
            this.renderProducts();
            console.log('✅ Productos recargados');
        } catch (error) {
            console.error('❌ Error recargando productos:', error);
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando...');
    
    const checkAndInit = () => {
        const container = document.querySelector('.index-grid');
        const hasSupabase = typeof window.supabase !== 'undefined' || typeof initSupabase === 'function';
        const hasService = typeof ProductosService !== 'undefined';
        
        if (container && hasSupabase && hasService) {
            console.log('✅ Dependencias listas, inicializando...');
            setTimeout(() => {
                window.paraEllosManager = new ParaEllosManager();
            }, 200);
        } else {
            console.log('⏳ Esperando dependencias...', { 
                container: !!container, 
                supabase: hasSupabase, 
                service: hasService 
            });
            setTimeout(checkAndInit, 100);
        }
    };
    
    checkAndInit();
});
