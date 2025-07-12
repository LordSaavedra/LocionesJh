// Para Ellos - Versión Integrada con ImageHandler
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
        
        // Inicializar ImageHandler
        this.imageHandler = new ImageHandler();
        
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
            ProductosService: typeof ProductosService !== 'undefined',
            ImageHandler: typeof ImageHandler !== 'undefined'
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
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page)) {
                    this.goToPage(page);
                }
            }
        });
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) {
            console.warn('❌ Contenedor de productos no encontrado');
            return;
        }

        if (this.filteredProducts.length === 0) {
            container.innerHTML = '<div class="no-products">No se encontraron productos</div>';
            this.renderPagination(0);
            return;
        }

        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        const html = productsToShow.map(product => this.createProductCard(product)).join('');
        container.innerHTML = html;

        this.renderPagination(this.filteredProducts.length);
    }

    createProductCard(product) {
        // Usar ImageHandler para obtener la ruta correcta de la imagen
        const imageSrc = this.imageHandler.getImagePath(product.imagen_url || product.imagen);
        const placeholderSrc = this.imageHandler.getPlaceholder();
        
        const precioOriginal = parseFloat(product.precio) || 0;
        const descuento = parseInt(product.descuento) || 0;
        const precioFinal = descuento > 0 ? precioOriginal * (1 - descuento / 100) : precioOriginal;

        const estadoClass = this.getEstadoClass(product.estado);
        const estadoText = this.getEstadoText(product.estado);

        return `
            <div class="product-card ${estadoClass}" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${imageSrc}" 
                         alt="${product.nombre}" 
                         loading="lazy"
                         onerror="this.src='${placeholderSrc}'; this.setAttribute('data-error-handled', 'true')">
                    ${product.estado === 'oferta' && descuento > 0 ? 
                        `<div class="discount-badge">-${descuento}%</div>` : ''}
                    ${product.estado === 'agotado' ? 
                        '<div class="status-overlay">AGOTADO</div>' : ''}
                    ${product.estado === 'proximamente' ? 
                        '<div class="status-overlay">PRÓXIMAMENTE</div>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.nombre}</h3>
                    <p class="product-brand">${product.marca}</p>
                    ${product.subcategoria ? `<p class="product-subcategory">${product.subcategoria}</p>` : ''}
                    
                    <div class="price-section">
                        ${descuento > 0 ? `
                            <span class="original-price">$${precioOriginal.toFixed(2)}</span>
                            <span class="final-price">$${precioFinal.toFixed(2)}</span>
                        ` : `
                            <span class="price">$${precioOriginal.toFixed(2)}</span>
                        `}
                    </div>
                    
                    <div class="product-status ${estadoClass}">
                        ${estadoText}
                    </div>
                </div>
            </div>
        `;
    }

    getEstadoClass(estado) {
        const classes = {
            'disponible': 'available',
            'agotado': 'out-of-stock',
            'proximamente': 'coming-soon',
            'oferta': 'on-sale'
        };
        return classes[estado] || 'available';
    }

    getEstadoText(estado) {
        const texts = {
            'disponible': 'Disponible',
            'agotado': 'Agotado',
            'proximamente': 'Próximamente',
            'oferta': 'En Oferta'
        };
        return texts[estado] || 'Disponible';
    }

    renderPagination(totalProducts) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalProducts / this.productsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';
        
        // Botón anterior
        if (this.currentPage > 1) {
            html += `<button class="page-btn prev" data-page="${this.currentPage - 1}">‹ Anterior</button>`;
        }

        // Números de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            html += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Botón siguiente
        if (this.currentPage < totalPages) {
            html += `<button class="page-btn next" data-page="${this.currentPage + 1}">Siguiente ›</button>`;
        }

        paginationContainer.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
        
        // Scroll al inicio del contenedor
        const container = document.getElementById('products-container');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    applyFilters() {
        let filtered = [...this.productos];

        // Filtro de búsqueda
        if (this.activeFilters.search) {
            const searchTerm = this.activeFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.nombre.toLowerCase().includes(searchTerm) ||
                product.marca.toLowerCase().includes(searchTerm) ||
                (product.subcategoria && product.subcategoria.toLowerCase().includes(searchTerm))
            );
        }

        // Filtro de marca
        if (this.activeFilters.brand) {
            filtered = filtered.filter(product => 
                product.marca.toLowerCase() === this.activeFilters.brand.toLowerCase()
            );
        }

        // Filtro de subcategoría
        if (this.activeFilters.subcategoria) {
            filtered = filtered.filter(product => 
                product.subcategoria && 
                product.subcategoria.toLowerCase() === this.activeFilters.subcategoria.toLowerCase()
            );
        }

        // Filtro de precio
        filtered = filtered.filter(product => {
            const precio = parseFloat(product.precio) || 0;
            const descuento = parseInt(product.descuento) || 0;
            const precioFinal = descuento > 0 ? precio * (1 - descuento / 100) : precio;
            
            return precioFinal >= this.activeFilters.priceMin && 
                   precioFinal <= this.activeFilters.priceMax;
        });

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderProducts();
        this.updateFilterInfo();
    }

    setupFilters() {
        // Filtro de marca
        const brandFilter = document.getElementById('brand-filter');
        if (brandFilter) {
            this.populateBrandFilter(brandFilter);
            brandFilter.addEventListener('change', (e) => {
                this.activeFilters.brand = e.target.value;
                this.applyFilters();
            });
        }

        // Filtro de subcategoría
        const subcategoryFilter = document.getElementById('subcategory-filter');
        if (subcategoryFilter) {
            this.populateSubcategoryFilter(subcategoryFilter);
            subcategoryFilter.addEventListener('change', (e) => {
                this.activeFilters.subcategoria = e.target.value;
                this.applyFilters();
            });
        }

        // Botón limpiar filtros
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    setupPriceFilter() {
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        const applyPriceFilter = document.getElementById('apply-price-filter');

        if (minPriceInput && maxPriceInput && applyPriceFilter) {
            applyPriceFilter.addEventListener('click', () => {
                const minPrice = parseFloat(minPriceInput.value) || 0;
                const maxPrice = parseFloat(maxPriceInput.value) || 10000000;

                if (minPrice > maxPrice) {
                    alert('El precio mínimo no puede ser mayor al precio máximo');
                    return;
                }

                this.activeFilters.priceMin = minPrice;
                this.activeFilters.priceMax = maxPrice;
                this.applyFilters();
            });
        }
    }

    populateBrandFilter(select) {
        const brands = [...new Set(this.productos.map(p => p.marca))].sort();
        
        select.innerHTML = '<option value="">Todas las marcas</option>';
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            select.appendChild(option);
        });
    }

    populateSubcategoryFilter(select) {
        const subcategories = [...new Set(this.productos
            .map(p => p.subcategoria)
            .filter(sub => sub && sub.trim())
        )].sort();
        
        select.innerHTML = '<option value="">Todas las subcategorías</option>';
        subcategories.forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            select.appendChild(option);
        });
    }

    clearAllFilters() {
        this.activeFilters = {
            search: '',
            brand: '',
            subcategoria: '',
            priceMin: 0,
            priceMax: 10000000
        };

        // Limpiar inputs
        const searchInput = document.getElementById('searchInput');
        const brandFilter = document.getElementById('brand-filter');
        const subcategoryFilter = document.getElementById('subcategory-filter');
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');

        if (searchInput) searchInput.value = '';
        if (brandFilter) brandFilter.value = '';
        if (subcategoryFilter) subcategoryFilter.value = '';
        if (minPriceInput) minPriceInput.value = '';
        if (maxPriceInput) maxPriceInput.value = '';

        this.applyFilters();
    }

    updateFilterInfo() {
        const filterInfo = document.getElementById('filter-info');
        if (!filterInfo) return;

        const total = this.productos.length;
        const filtered = this.filteredProducts.length;

        if (filtered === total) {
            filterInfo.textContent = `Mostrando ${total} productos`;
        } else {
            filterInfo.textContent = `Mostrando ${filtered} de ${total} productos`;
        }
    }

    async refreshProducts() {
        console.log('🔄 Refrescando productos...');
        await this.loadProducts();
        this.applyFilters();
        console.log('✅ Productos refrescados');
    }

    // Método público para recargar productos
    async reload() {
        await this.refreshProducts();
    }

    // Obtener estadísticas de productos
    getProductStats() {
        const stats = {
            total: this.productos.length,
            disponibles: 0,
            agotados: 0,
            ofertas: 0,
            proximamente: 0
        };

        this.productos.forEach(product => {
            switch (product.estado) {
                case 'disponible':
                    stats.disponibles++;
                    break;
                case 'agotado':
                    stats.agotados++;
                    break;
                case 'oferta':
                    stats.ofertas++;
                    break;
                case 'proximamente':
                    stats.proximamente++;
                    break;
            }
        });

        return stats;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.paraEllosManager = new ParaEllosManager();
});

// Función para recargar productos (compatibilidad)
function reloadProducts() {
    if (window.paraEllosManager) {
        window.paraEllosManager.reload();
    }
}
