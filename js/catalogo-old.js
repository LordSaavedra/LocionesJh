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
        await this.cargarProductos();
        this.configurarEventos();
        this.renderizarCatalogo();
        this.configurarFiltros();
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
                
                this.aplicarFiltros();
            });
        });

        // Buscador rediseñado
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.busquedaActiva = e.target.value.toLowerCase();
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
                e.preventDefault();
                
                // Remover active de todos
                filtrosCategoria.forEach(f => f.classList.remove('active'));
                
                // Activar el clickeado
                filtro.classList.add('active');
                
                this.filtrosActivos.categoria = filtro.dataset.categoria || '';
                this.aplicarFiltros();
            });
        });

        // Slider de precio
        const sliderPrecio = document.getElementById('slider-precio');
        if (sliderPrecio && typeof noUiSlider !== 'undefined') {
            noUiSlider.create(sliderPrecio, {
                start: [0, 2000000],
                connect: true,
                range: {
                    'min': 0,
                    'max': 2000000
                },
                format: {
                    to: function (value) {
                        return Math.round(value);
                    },
                    from: function (value) {
                        return Number(value);
                    }
                }
            });

            sliderPrecio.noUiSlider.on('update', (values) => {
                this.filtrosActivos.precioMin = parseInt(values[0]);
                this.filtrosActivos.precioMax = parseInt(values[1]);
                
                // Actualizar labels
                const precioMinEl = document.getElementById('precio-min');
                const precioMaxEl = document.getElementById('precio-max');
                if (precioMinEl) precioMinEl.textContent = formatearPrecio(parseInt(values[0]));
                if (precioMaxEl) precioMaxEl.textContent = formatearPrecio(parseInt(values[1]));
            });

            sliderPrecio.noUiSlider.on('change', () => {
                this.aplicarFiltros();
            });
        }

        // Botón limpiar filtros
        const btnLimpiar = document.getElementById('limpiar-filtros');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                this.limpiarFiltros();
            });
        }
    }

    async aplicarFiltros() {
        try {
            this.productosFiltrados = await ProductosService.obtenerProductos(this.filtrosActivos);
            this.paginaActual = 1;
            this.renderizarCatalogo();
            this.actualizarContadores();
        } catch (error) {
            console.error('Error aplicando filtros:', error);
        }
    }

    limpiarFiltros() {
        // Resetear filtros
        this.filtrosActivos = {
            categoria: '',
            busqueda: '',
            precioMin: 0,
            precioMax: 2000000
        };

        // Resetear UI
        const buscador = document.getElementById('buscador');
        if (buscador) buscador.value = '';

        const filtrosCategoria = document.querySelectorAll('.filtro-categoria');
        filtrosCategoria.forEach(f => f.classList.remove('active'));
        
        const filtroTodos = document.querySelector('.filtro-categoria[data-categoria=""]');
        if (filtroTodos) filtroTodos.classList.add('active');

        const sliderPrecio = document.getElementById('slider-precio');
        if (sliderPrecio && sliderPrecio.noUiSlider) {
            sliderPrecio.noUiSlider.set([0, 2000000]);
        }

        this.aplicarFiltros();
    }

    renderizarCatalogo() {
        const contenedor = document.getElementById('productos-grid');
        if (!contenedor) return;

        const inicio = (this.paginaActual - 1) * this.productosPorPagina;
        const fin = inicio + this.productosPorPagina;
        const productosEnPagina = this.productosFiltrados.slice(inicio, fin);

        if (productosEnPagina.length === 0) {
            contenedor.innerHTML = `
                <div class="no-productos">
                    <div class="no-productos-content">
                        <i class="fas fa-search"></i>
                        <h3>No se encontraron productos</h3>
                        <p>Intenta ajustar los filtros o realiza una nueva búsqueda</p>
                        <button class="btn-primary" onclick="catalogoManager.limpiarFiltros()">
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const productosHTML = productosEnPagina.map(producto => this.crearTarjetaProducto(producto)).join('');
        contenedor.innerHTML = productosHTML;

        this.renderizarPaginacion();
        this.configurarModales();
    }

    crearTarjetaProducto(producto) {
        const precio = formatearPrecio(producto.precio);
        const imagen = producto.imagen_principal || producto.imagen;
        const marca = producto.marcas?.nombre || producto.marca;
        const categoria = producto.categorias?.nombre || producto.categoria;

        return `
            <div class="producto-card" data-id="${producto.id}">
                <div class="producto-imagen">
                    <img src="${imagen}" alt="${producto.nombre}" loading="lazy">
                    <div class="producto-overlay">
                        <button class="btn-ver-mas" onclick="catalogoManager.abrirModal(${producto.id})">
                            <i class="fas fa-eye"></i>
                            Ver detalles
                        </button>
                    </div>
                </div>
                <div class="producto-info">
                    <div class="producto-marca">${marca}</div>
                    <h3 class="producto-nombre">${producto.nombre}</h3>
                    <p class="producto-descripcion">${producto.descripcion_corta || producto.descripcionCorta || ''}</p>
                    <div class="producto-precio">${precio}</div>
                    <div class="producto-categoria">${categoria}</div>
                </div>
            </div>
        `;
    }
    },
    {
        id: 5,
        name: 'Versace Eros',
        description: 'El poder y la seducción del mediterráneo en estado puro.',
        category: 'homme',
        image: '../LOCIONES_PARA _ELLOS/VERSACE_EROS_BLUE.png',
        notes: ['Menta', 'Vainilla', 'Tonka']
    }
];

function initializeCollectionIndex() {
    const indexGrid = document.querySelector('.index-grid');
    if (!indexGrid) return;
    
    // Filtros
    document.querySelectorAll('.index-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.dataset.filter;
            
            // Actualizar filtros activos
            document.querySelectorAll('.index-filter').forEach(f => {
                f.classList.remove('active');
            });
            this.classList.add('active');
            
            // Filtrar y renderizar
            renderIndexGrid(category);
        });
    });
    
    // Renderizar grid inicial
    renderIndexGrid('all');
}

function renderIndexGrid(category) {
    const indexGrid = document.querySelector('.index-grid');
    const filtered = category === 'all' ? fragrances : fragrances.filter(f => f.category === category);
    
    indexGrid.innerHTML = '';
    filtered.forEach(fragrance => {
        const indexItem = document.createElement('div');
        indexItem.className = 'index-item';
        indexItem.innerHTML = `
            <div class="index-image">
                <img src="${fragrance.image}" alt="${fragrance.name}">
            </div>
            <div class="index-info">
                <h3>${fragrance.name}</h3>
                <p class="index-category">${getCategoryName(fragrance.category)}</p>
                <p class="index-description">${fragrance.description}</p>
                <p class="index-notes">${fragrance.notes.join(' · ')}</p>
            </div>
        `;
        
        // Quick view
        indexItem.addEventListener('click', () => showQuickView(fragrance));
        
        indexGrid.appendChild(indexItem);
    });
}

function getCategoryName(category) {
    return {
        'homme': 'Pour Homme',
        'femme': 'Pour Femme',
        'unisexe': 'Unisexe'
    }[category] || category;
}

function initializeModal() {
    const modal = document.querySelector('.quick-view-modal');
    const closeBtn = modal.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
    
    // Cerrar al hacer click fuera del contenido
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function showQuickView(fragrance) {
    const modal = document.querySelector('.quick-view-modal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="modal-left">
            <img src="${fragrance.image}" alt="${fragrance.name}" class="modal-image">
        </div>
        <div class="modal-right">
            <h2>${fragrance.name}</h2>
            <p class="modal-category">${getCategoryName(fragrance.category)}</p>
            <p class="modal-description">${fragrance.description}</p>
            <div class="modal-notes">
                <h4>Notes de Tête</h4>
                <p>${fragrance.notes.join(' · ')}</p>
            </div>
            <div class="modal-actions">
                <button class="modal-btn discover">Découvrir</button>
                <button class="modal-btn reserve">Réserver</button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}
