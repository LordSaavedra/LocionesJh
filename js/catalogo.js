// Catálogo General - Integración con Supabase - REDISEÑADO
class CatalogoManager {
    constructor() {
        this.productos = [];
        this.productosFiltrados = [];
        this.filtroActivo = 'all';
        this.busquedaActiva = '';
        this.vistaActual = 'grid';
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando catálogo rediseñado...');
        await this.cargarProductos();
        this.configurarEventos();
        this.mostrarProductos();
    }

    async cargarProductos() {
        try {
            // Mostrar loading state
            this.mostrarLoading();
            
            this.productos = await ProductosService.obtenerProductos();
            this.productosFiltrados = [...this.productos];
            console.log('🎉 Productos cargados:', this.productos.length);
            
            // Ocultar loading state
            this.ocultarLoading();
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.productos = [];
            this.productosFiltrados = [];
            this.ocultarLoading();
            this.mostrarError();
        }
    }

    configurarEventos() {
        // Filtros de categoría rediseñados
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover clase active de todos los botones
                filterButtons.forEach(b => b.classList.remove('active'));
                
                // Agregar clase active al botón clickeado
                btn.classList.add('active');
                
                // Obtener el filtro
                const filtro = btn.getAttribute('data-filter');
                this.filtroActivo = filtro;
                
                console.log('🔍 Filtro aplicado:', filtro);
                this.aplicarFiltros();
            });
        });

        // Buscador rediseñado
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.busquedaActiva = e.target.value.toLowerCase();
                console.log('🔍 Búsqueda:', this.busquedaActiva);
                this.aplicarFiltros();
            });
        }

        // Cambio de vista
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.vistaActual = btn.getAttribute('data-view');
                this.actualizarVista();
            });
        });

        // Botón reset filtros
        const resetBtn = document.querySelector('.reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetearFiltros();
            });
        }

        // Modal de vista rápida
        this.configurarModal();
    }

    aplicarFiltros() {
        let productosFiltrados = [...this.productos];

        // Filtro por categoría
        if (this.filtroActivo && this.filtroActivo !== 'all') {
            productosFiltrados = productosFiltrados.filter(producto => {
                const categoria = producto.categoria ? producto.categoria.toLowerCase() : '';
                return categoria === this.filtroActivo;
            });
        }

        // Filtro por búsqueda
        if (this.busquedaActiva) {
            productosFiltrados = productosFiltrados.filter(producto => {
                const nombre = producto.nombre ? producto.nombre.toLowerCase() : '';
                const marca = producto.marca ? producto.marca.toLowerCase() : '';
                const descripcion = producto.descripcion ? producto.descripcion.toLowerCase() : '';
                
                return nombre.includes(this.busquedaActiva) ||
                       marca.includes(this.busquedaActiva) ||
                       descripcion.includes(this.busquedaActiva);
            });
        }

        this.productosFiltrados = productosFiltrados;
        this.mostrarProductos();
    }

    resetearFiltros() {
        // Reset filtro de categoría
        this.filtroActivo = 'all';
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');

        // Reset búsqueda
        this.busquedaActiva = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        // Aplicar filtros
        this.aplicarFiltros();
    }

    mostrarProductos() {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) return;

        if (this.productosFiltrados.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = this.productosFiltrados.map(producto => 
            this.crearTarjetaProducto(producto)
        ).join('');

        // Configurar eventos de las tarjetas
        this.configurarEventosProductos();
    }

    crearTarjetaProducto(producto) {
        const imagen = producto.imagen_url || '../IMAGENES/default-perfume.jpg';
        const precio = producto.precio ? `$${Number(producto.precio).toLocaleString()}` : 'Precio no disponible';
        const categoria = producto.categoria || 'Sin categoría';
        const descripcion = producto.descripcion || 'Sin descripción disponible';

        return `
            <div class="product-card" data-id="${producto.id}">
                <div class="product-image-container">
                    <img src="${imagen}" alt="${producto.nombre}" class="product-image" loading="lazy">
                    <span class="product-badge">${categoria}</span>
                    <div class="product-actions">
                        <button class="action-btn quick-view-btn" data-id="${producto.id}" title="Vista rápida">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn wishlist-btn" data-id="${producto.id}" title="Agregar a favoritos">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-brand">${producto.marca || 'Marca Premium'}</div>
                    <h3 class="product-name">${producto.nombre}</h3>
                    <p class="product-description">${descripcion}</p>
                    <div class="product-footer">
                        <span class="product-price">${precio}</span>
                        <button class="add-to-cart-btn" data-id="${producto.id}">
                            <i class="fas fa-shopping-cart"></i>
                            <span>Agregar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    configurarEventosProductos() {
        // Botones de agregar al carrito
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.getAttribute('data-id');
                this.agregarAlCarrito(productId);
            });
        });

        // Botones de vista rápida
        const quickViewBtns = document.querySelectorAll('.quick-view-btn');
        quickViewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.getAttribute('data-id');
                this.mostrarVistaRapida(productId);
            });
        });

        // Botones de wishlist
        const wishlistBtns = document.querySelectorAll('.wishlist-btn');
        wishlistBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.getAttribute('data-id');
                this.toggleWishlist(productId);
            });
        });
    }

    async agregarAlCarrito(productId) {
        try {
            const producto = this.productos.find(p => p.id == productId);
            if (!producto) return;

            // Usar el sistema de carrito existente
            if (window.shoppingCart) {
                await window.shoppingCart.agregarProducto(productId, 1);
                console.log('✅ Producto agregado al carrito:', producto.nombre);
                
                // Mostrar feedback visual
                this.mostrarNotificacion('Producto agregado al carrito', 'success');
            } else {
                console.error('❌ Sistema de carrito no disponible');
                this.mostrarNotificacion('Error al agregar al carrito', 'error');
            }
        } catch (error) {
            console.error('❌ Error agregando al carrito:', error);
            this.mostrarNotificacion('Error al agregar al carrito', 'error');
        }
    }

    mostrarVistaRapida(productId) {
        const producto = this.productos.find(p => p.id == productId);
        if (!producto) return;

        const modal = document.getElementById('quickViewModal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        const imagen = producto.imagen_url || '../IMAGENES/default-perfume.jpg';
        const precio = producto.precio ? `$${Number(producto.precio).toLocaleString()}` : 'Precio no disponible';

        modalContent.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${imagen}" alt="${producto.nombre}">
                </div>
                <div class="quick-view-info">
                    <div class="product-brand">${producto.marca || 'Marca Premium'}</div>
                    <h2>${producto.nombre}</h2>
                    <p class="product-description">${producto.descripcion || 'Sin descripción disponible'}</p>
                    <div class="product-price">${precio}</div>
                    <div class="quick-view-actions">
                        <button class="add-to-cart-btn" data-id="${producto.id}">
                            <i class="fas fa-shopping-cart"></i>
                            <span>Agregar al Carrito</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');

        // Configurar eventos del modal
        modalContent.querySelector('.add-to-cart-btn')?.addEventListener('click', () => {
            this.agregarAlCarrito(productId);
            this.cerrarModal();
        });
    }

    configurarModal() {
        const modal = document.getElementById('quickViewModal');
        const closeBtn = document.getElementById('closeModal');
        const backdrop = modal?.querySelector('.modal-backdrop');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.cerrarModal());
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => this.cerrarModal());
        }

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.classList.contains('active')) {
                this.cerrarModal();
            }
        });
    }

    cerrarModal() {
        const modal = document.getElementById('quickViewModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    toggleWishlist(productId) {
        // Implementar lógica de wishlist
        console.log('💝 Toggle wishlist para producto:', productId);
        this.mostrarNotificacion('Función de favoritos próximamente', 'info');
    }

    actualizarVista() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (this.vistaActual === 'list') {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }
    }

    mostrarLoading() {
        const loadingState = document.getElementById('loadingState');
        const grid = document.getElementById('productsGrid');
        
        if (loadingState) loadingState.style.display = 'flex';
        if (grid) grid.style.display = 'none';
    }

    ocultarLoading() {
        const loadingState = document.getElementById('loadingState');
        const grid = document.getElementById('productsGrid');
        
        if (loadingState) loadingState.style.display = 'none';
        if (grid) grid.style.display = 'grid';
    }

    mostrarError() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Error al cargar productos</h3>
                <p>No se pudieron cargar los productos. Por favor, recarga la página.</p>
                <button class="retry-btn" onclick="location.reload()">
                    <i class="fas fa-refresh"></i>
                    <span>Reintentar</span>
                </button>
            </div>
        `;
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación toast simple
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${tipo === 'success' ? 'check' : tipo === 'error' ? 'times' : 'info'}"></i>
                <span>${mensaje}</span>
            </div>
        `;

        // Agregar estilos inline para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que se carguen las dependencias
    setTimeout(() => {
        if (typeof ProductosService !== 'undefined') {
            window.catalogoManager = new CatalogoManager();
        } else {
            console.error('❌ ProductosService no disponible');
        }
    }, 500);
});
