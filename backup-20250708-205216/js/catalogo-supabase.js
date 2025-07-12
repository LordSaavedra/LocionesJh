// Catálogo General - Integración con Supabase
class CatalogoManager {
    constructor() {
        this.productos = [];
        this.productosFiltrados = [];
        this.paginaActual = 1;
        this.productosPorPagina = 12;
        this.filtrosActivos = {
            categoria: '',
            busqueda: '',
            precioMin: 0,
            precioMax: 2000000
        };
        
        this.init();
    }

    async init() {
        await this.cargarProductos();
        this.configurarEventos();
        this.renderizarCatalogo();
        this.configurarFiltros();
    }

    async cargarProductos() {
        try {
            this.productos = await ProductosService.obtenerProductos();
            this.productosFiltrados = [...this.productos];
            console.log('Productos cargados:', this.productos.length);
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.productos = [];
            this.productosFiltrados = [];
        }
    }

    configurarEventos() {
        // Buscador
        const buscador = document.getElementById('buscador');
        if (buscador) {
            buscador.addEventListener('input', (e) => {
                this.filtrosActivos.busqueda = e.target.value;
                this.aplicarFiltros();
            });
        }

        // Filtros de categoría
        const filtrosCategoria = document.querySelectorAll('.filtro-categoria');
        filtrosCategoria.forEach(filtro => {
            filtro.addEventListener('click', (e) => {
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

    renderizarPaginacion() {
        const contenedor = document.getElementById('paginacion');
        if (!contenedor) return;

        const totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
        
        if (totalPaginas <= 1) {
            contenedor.innerHTML = '';
            return;
        }

        let paginacionHTML = '';

        // Botón anterior
        if (this.paginaActual > 1) {
            paginacionHTML += `
                <button class="btn-paginacion" onclick="catalogoManager.irAPagina(${this.paginaActual - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;
        }

        // Números de página
        const inicio = Math.max(1, this.paginaActual - 2);
        const fin = Math.min(totalPaginas, this.paginaActual + 2);

        for (let i = inicio; i <= fin; i++) {
            const activo = i === this.paginaActual ? 'active' : '';
            paginacionHTML += `
                <button class="btn-paginacion ${activo}" onclick="catalogoManager.irAPagina(${i})">
                    ${i}
                </button>
            `;
        }

        // Botón siguiente
        if (this.paginaActual < totalPaginas) {
            paginacionHTML += `
                <button class="btn-paginacion" onclick="catalogoManager.irAPagina(${this.paginaActual + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        contenedor.innerHTML = paginacionHTML;
    }

    irAPagina(pagina) {
        this.paginaActual = pagina;
        this.renderizarCatalogo();
        
        // Scroll suave al inicio del catálogo
        const catalogoElement = document.getElementById('productos-grid');
        if (catalogoElement) {
            catalogoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    actualizarContadores() {
        const contadorResultados = document.getElementById('contador-resultados');
        if (contadorResultados) {
            const total = this.productosFiltrados.length;
            const inicio = (this.paginaActual - 1) * this.productosPorPagina + 1;
            const fin = Math.min(inicio + this.productosPorPagina - 1, total);
            
            contadorResultados.textContent = total > 0 
                ? `Mostrando ${inicio}-${fin} de ${total} productos`
                : 'No se encontraron productos';
        }
    }

    async abrirModal(productoId) {
        try {
            const producto = await ProductosService.obtenerProductoPorId(productoId);
            if (producto) {
                this.mostrarModalProducto(producto);
            }
        } catch (error) {
            console.error('Error cargando producto:', error);
        }
    }

    mostrarModalProducto(producto) {
        const precio = formatearPrecio(producto.precio);
        const imagen = producto.imagen_principal || producto.imagen;
        const marca = producto.marcas?.nombre || producto.marca;
        const categoria = producto.categorias?.nombre || producto.categoria;

        const notasSalida = producto.notas_salida || producto.notasOlfativas?.salida || [];
        const notasCorazon = producto.notas_corazon || producto.notasOlfativas?.corazon || [];
        const notasFondo = producto.notas_fondo || producto.notasOlfativas?.fondo || [];

        const modalHTML = `
            <div class="modal-overlay" id="modal-producto">
                <div class="modal-content">
                    <button class="modal-close" onclick="catalogoManager.cerrarModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-body">
                        <div class="modal-imagen">
                            <img src="${imagen}" alt="${producto.nombre}">
                        </div>
                        <div class="modal-info">
                            <div class="modal-marca">${marca}</div>
                            <h2 class="modal-nombre">${producto.nombre}</h2>
                            <div class="modal-precio">${precio}</div>
                            <div class="modal-categoria">${categoria}</div>
                            <p class="modal-descripcion">${producto.descripcion}</p>
                            
                            ${notasSalida.length > 0 || notasCorazon.length > 0 || notasFondo.length > 0 ? `
                                <div class="notas-olfativas">
                                    <h4>Notas Olfativas</h4>
                                    ${notasSalida.length > 0 ? `
                                        <div class="nota-grupo">
                                            <span class="nota-tipo">Salida:</span>
                                            <span class="nota-lista">${notasSalida.join(', ')}</span>
                                        </div>
                                    ` : ''}
                                    ${notasCorazon.length > 0 ? `
                                        <div class="nota-grupo">
                                            <span class="nota-tipo">Corazón:</span>
                                            <span class="nota-lista">${notasCorazon.join(', ')}</span>
                                        </div>
                                    ` : ''}
                                    ${notasFondo.length > 0 ? `
                                        <div class="nota-grupo">
                                            <span class="nota-tipo">Fondo:</span>
                                            <span class="nota-lista">${notasFondo.join(', ')}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            <div class="modal-acciones">
                                <button class="btn-primary">
                                    <i class="fas fa-shopping-cart"></i>
                                    Añadir al carrito
                                </button>
                                <button class="btn-secondary">
                                    <i class="fas fa-heart"></i>
                                    Favoritos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.classList.add('modal-open');
    }

    cerrarModal() {
        const modal = document.getElementById('modal-producto');
        if (modal) {
            modal.remove();
            document.body.classList.remove('modal-open');
        }
    }

    configurarModales() {
        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.cerrarModal();
            }
        });

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarModal();
            }
        });
    }

    async configurarFiltros() {
        try {
            // Cargar categorías dinámicamente
            const categorias = await ProductosService.obtenerCategorias();
            this.renderizarFiltrosCategorias(categorias);
        } catch (error) {
            console.error('Error configurando filtros:', error);
        }
    }

    renderizarFiltrosCategorias(categorias) {
        const contenedor = document.getElementById('filtros-categoria');
        if (!contenedor) return;

        const categoriasHTML = categorias.map(categoria => `
            <button class="filtro-categoria" data-categoria="${categoria.slug}">
                ${categoria.nombre}
            </button>
        `).join('');

        contenedor.innerHTML = `
            <button class="filtro-categoria active" data-categoria="">
                Todos
            </button>
            ${categoriasHTML}
        `;

        // Reconfigurar eventos
        const filtrosCategoria = contenedor.querySelectorAll('.filtro-categoria');
        filtrosCategoria.forEach(filtro => {
            filtro.addEventListener('click', (e) => {
                e.preventDefault();
                
                filtrosCategoria.forEach(f => f.classList.remove('active'));
                filtro.classList.add('active');
                
                this.filtrosActivos.categoria = filtro.dataset.categoria || '';
                this.aplicarFiltros();
            });
        });
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('productos-grid')) {
        window.catalogoManager = new CatalogoManager();
    }
});
