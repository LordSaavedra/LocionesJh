// Panel de Administración - Versión Integrada con ImageHandler
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.productos = [];
        this.categorias = [];
        this.marcas = [];
        this.isSubmitting = false;
        
        // Inicializar ImageHandler
        this.imageHandler = new ImageHandler();
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Panel de Administración...');
        
        try {
            await this.waitForDependencies();
            this.setupNavigation();
            this.setupForms();
            this.setupEvents();
            await this.loadInitialData();
            this.showSection('dashboard');
            console.log('✅ Panel listo');
        } catch (error) {
            console.error('❌ Error inicializando:', error);
            this.setupNavigation();
            this.setupForms();
            this.showSection('dashboard');
        }
    }

    async waitForDependencies() {
        const maxAttempts = 30;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const hasSupabase = typeof window.supabase !== 'undefined';
            const hasService = typeof ProductosService !== 'undefined';
            const hasImageHandler = typeof ImageHandler !== 'undefined';
            
            if (hasSupabase && hasService && hasImageHandler) {
                console.log('✅ Dependencias listas');
                return;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Timeout dependencias');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-menu a');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });
    }

    setupForms() {
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.isSubmitting) {
                    this.handleProductSubmit(e);
                }
            });
            
            productForm.addEventListener('reset', () => {
                setTimeout(() => {
                    this.setFormEditMode(false);
                    this.clearImagePreview();
                }, 100);
            });
        }
    }

    setupEvents() {
        // Búsqueda de productos
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Botón refrescar
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllData());
        }

        // Estado y descuento
        const estadoSelect = document.getElementById('estado');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', () => this.handleEstadoChange());
        }

        // Precio y descuento
        const precioInput = document.getElementById('precio');
        const descuentoInput = document.getElementById('descuento');

        if (precioInput) {
            precioInput.addEventListener('input', (e) => {
                this.validatePrice(e.target);
                this.updatePrecioConDescuento();
            });
        }

        if (descuentoInput) {
            descuentoInput.addEventListener('input', () => this.updatePrecioConDescuento());
        }

        // Preview de imagen URL - Usando ImageHandler
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

        // Archivo de imagen - Usando ImageHandler
        const imageFileInput = document.getElementById('imagen_file');
        if (imageFileInput) {
            imageFileInput.addEventListener('change', (e) => {
                this.previewImageFromFile(e.target);
            });
        }

        // Tabs de imagen
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                this.clearImagePreview();
            });
        });
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadProductos(),
                this.loadCategorias(),
                this.loadMarcas()
            ]);
        } catch (error) {
            console.error('❌ Error carga inicial:', error);
        }
    }

    async loadProductos() {
        try {
            if (typeof ProductosService === 'undefined') return;
            
            this.productos = await ProductosService.getProductos();
            console.log(`✅ ${this.productos.length} productos cargados`);
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.productos = [];
        }
    }

    async loadCategorias() {
        try {
            if (typeof ProductosService === 'undefined') return;
            
            this.categorias = await ProductosService.getCategorias();
            this.populateSelect('categoria', this.categorias);
            
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            this.categorias = [];
        }
    }

    async loadMarcas() {
        try {
            if (typeof ProductosService === 'undefined') return;
            
            this.marcas = await ProductosService.getMarcas();
            this.populateSelect('marca', this.marcas);
            
        } catch (error) {
            console.error('❌ Error cargando marcas:', error);
            this.marcas = [];
        }
    }

    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccionar...</option>';

        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }

    showSection(sectionId) {
        this.currentSection = sectionId;
        
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });

        if (sectionId === 'productos') {
            this.loadProductsData();
        } else if (sectionId === 'dashboard') {
            this.loadDashboardData();
        }
    }

    async loadProductsData() {
        try {
            await this.loadProductos();
            this.renderProductsList();
        } catch (error) {
            console.error('❌ Error cargando datos productos:', error);
        }
    }

    renderProductsList() {
        const container = document.getElementById('products-list');
        if (!container) return;

        if (this.productos.length === 0) {
            container.innerHTML = '<p>No hay productos registrados</p>';
            return;
        }

        const html = this.productos.map(producto => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${this.imageHandler.getImagePath(producto.imagen_url)}" 
                         alt="${producto.nombre}" 
                         onerror="this.src='${this.imageHandler.getPlaceholder()}'">
                </div>
                <div class="product-info">
                    <h3>${producto.nombre}</h3>
                    <p class="marca">${producto.marca}</p>
                    <p class="categoria">${producto.categoria}</p>
                    <div class="price-info">
                        <span class="precio">$${producto.precio}</span>
                        ${producto.descuento ? `<span class="descuento">${producto.descuento}% OFF</span>` : ''}
                    </div>
                    <div class="estado estado-${producto.estado}">${producto.estado}</div>
                </div>
                <div class="product-actions">
                    <button onclick="adminPanel.editProduct('${producto.id}')" class="btn-edit">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="adminPanel.deleteProduct('${producto.id}')" class="btn-delete">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    filterProducts(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderProductsList();
            return;
        }

        const filtered = this.productos.filter(producto => 
            producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const container = document.getElementById('products-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<p>No se encontraron productos</p>';
            return;
        }

        const html = filtered.map(producto => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${this.imageHandler.getImagePath(producto.imagen_url)}" 
                         alt="${producto.nombre}" 
                         onerror="this.src='${this.imageHandler.getPlaceholder()}'">
                </div>
                <div class="product-info">
                    <h3>${producto.nombre}</h3>
                    <p class="marca">${producto.marca}</p>
                    <p class="categoria">${producto.categoria}</p>
                    <div class="price-info">
                        <span class="precio">$${producto.precio}</span>
                        ${producto.descuento ? `<span class="descuento">${producto.descuento}% OFF</span>` : ''}
                    </div>
                    <div class="estado estado-${producto.estado}">${producto.estado}</div>
                </div>
                <div class="product-actions">
                    <button onclick="adminPanel.editProduct('${producto.id}')" class="btn-edit">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="adminPanel.deleteProduct('${producto.id}')" class="btn-delete">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async refreshAllData() {
        this.showLoading(true);
        try {
            await this.loadInitialData();
            if (this.currentSection === 'productos') {
                this.renderProductsList();
            }
            this.showAlert('Datos actualizados exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error actualizando:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleProductSubmit(e) {
        this.isSubmitting = true;
        this.showLoading(true);

        try {
            const formData = new FormData(e.target);
            const isEditMode = document.getElementById('productId').value !== '';

            // Validaciones básicas
            const nombre = formData.get('nombre')?.trim();
            const marca = formData.get('marca')?.trim();
            const precio = formData.get('precio');
            const categoria = formData.get('categoria');

            if (!nombre || !marca || !precio || !categoria) {
                throw new Error('Todos los campos marcados con * son requeridos');
            }

            const precioNum = parseFloat(precio);
            if (isNaN(precioNum) || precioNum < 0) {
                throw new Error('El precio debe ser un número válido mayor o igual a 0');
            }

            // Datos del producto
            const productData = {
                nombre: nombre,
                marca: marca,
                precio: precioNum,
                categoria: categoria,
                subcategoria: formData.get('subcategoria') || null,
                descripcion: formData.get('descripcion') || '',
                notas: formData.get('notas') || '',
                estado: formData.get('estado') || 'disponible',
                descuento: parseInt(formData.get('descuento')) || null,
                activo: formData.get('activo') === 'on'
            };

            // Procesar imagen usando ImageHandler
            await this.processProductImage(productData);

            // Guardar producto
            let result;
            if (isEditMode) {
                const productId = document.getElementById('productId').value;
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

                const action = isEditMode ? 'actualizado' : 'guardado';
                this.showAlert(`Producto ${action} exitosamente`, 'success');
                this.showSection('productos');
            }

        } catch (error) {
            console.error('❌ Error:', error);
            this.showAlert('Error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            this.isSubmitting = false;
        }
    }

    // Usar ImageHandler para procesar imágenes
    async processProductImage(productData) {
        const fileInput = document.getElementById('imagen_file');
        const urlInput = document.getElementById('imagen_url');

        try {
            const imageData = await this.imageHandler.processProductImage(fileInput, urlInput);
            productData.imagen = imageData.imagen;
            productData.imagen_url = imageData.imagen_url;
        } catch (error) {
            throw new Error('Error procesando imagen: ' + error.message);
        }
    }

    async saveProduct(productData) {
        try {
            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no disponible');
            }

            const result = await ProductosService.crearProducto(productData);
            console.log('✅ Producto creado:', result);
            return result;

        } catch (error) {
            console.error('❌ Error creando producto:', error);
            throw error;
        }
    }

    async updateProduct(productId, productData) {
        try {
            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no disponible');
            }

            const result = await ProductosService.updateProduct(productId, productData);
            console.log('✅ Producto actualizado:', result);
            return result;

        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            throw error;
        }
    }

    async editProduct(productId) {
        try {
            const producto = this.productos.find(p => p.id === productId);
            if (!producto) {
                this.showAlert('Producto no encontrado', 'error');
                return;
            }

            this.fillForm(producto);
            this.setFormEditMode(true);
            this.showSection('agregar');

        } catch (error) {
            console.error('❌ Error editando producto:', error);
            this.showAlert('Error editando producto', 'error');
        }
    }

    fillForm(producto) {
        const fields = ['productId', 'nombre', 'marca', 'precio', 'categoria', 
                       'subcategoria', 'descripcion', 'notas', 'estado', 'descuento'];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && producto[field] !== undefined) {
                element.value = producto[field] || '';
            }
        });

        const activoCheckbox = document.getElementById('activo');
        if (activoCheckbox) {
            activoCheckbox.checked = producto.activo !== false;
        }

        // Mostrar imagen usando ImageHandler
        if (producto.imagen_url) {
            const imagenUrl = this.imageHandler.getImagePath(producto.imagen_url);
            this.previewImageFromUrl(imagenUrl);
        }

        this.updatePrecioConDescuento();
    }

    async deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }

        try {
            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no disponible');
            }

            await ProductosService.deleteProduct(productId);
            await this.loadProductos();
            this.renderProductsList();
            this.showAlert('Producto eliminado exitosamente', 'success');

        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            this.showAlert('Error eliminando producto: ' + error.message, 'error');
        }
    }

    setFormEditMode(isEdit) {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        const title = document.querySelector('#agregar h2');
        
        if (submitBtn) {
            submitBtn.textContent = isEdit ? 'Actualizar Producto' : 'Crear Producto';
        }
        
        if (title) {
            title.textContent = isEdit ? 'Editar Producto' : 'Agregar Producto';
        }
    }

    // Preview de imagen usando ImageHandler
    previewImageFromUrl(url) {
        const preview = document.getElementById('image-preview');
        if (!preview) return;

        this.imageHandler.previewImageFromUrl(url, preview);
    }

    previewImageFromFile(fileInput) {
        const preview = document.getElementById('image-preview');
        if (!preview) return;

        if (fileInput.files && fileInput.files[0]) {
            this.imageHandler.previewImageFromFile(fileInput.files[0], preview);
        }
    }

    clearImagePreview() {
        const preview = document.getElementById('image-preview');
        this.imageHandler.clearPreview(preview);
    }

    handleEstadoChange() {
        const estadoSelect = document.getElementById('estado');
        const descuentoGroup = document.querySelector('.field-group:has(#descuento)');
        
        if (estadoSelect && descuentoGroup) {
            const isOferta = estadoSelect.value === 'oferta';
            descuentoGroup.style.display = isOferta ? 'block' : 'none';
            
            if (!isOferta) {
                const descuentoInput = document.getElementById('descuento');
                if (descuentoInput) descuentoInput.value = '';
            }
        }
        
        this.updatePrecioConDescuento();
    }

    validatePrice(input) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            input.setCustomValidity('El precio debe ser un número válido mayor o igual a 0');
        } else {
            input.setCustomValidity('');
        }
    }

    updatePrecioConDescuento() {
        const precioInput = document.getElementById('precio');
        const descuentoInput = document.getElementById('descuento');
        const precioConDescuentoSpan = document.getElementById('precio-con-descuento');

        if (!precioInput || !descuentoInput || !precioConDescuentoSpan) return;

        const precio = parseFloat(precioInput.value);
        const descuento = parseInt(descuentoInput.value);

        if (isNaN(precio) || precio <= 0) {
            precioConDescuentoSpan.textContent = '-';
            return;
        }

        if (isNaN(descuento) || descuento <= 0 || descuento >= 100) {
            precioConDescuentoSpan.textContent = `$${precio.toFixed(2)}`;
            return;
        }

        const precioFinal = precio * (1 - descuento / 100);
        precioConDescuentoSpan.textContent = `$${precioFinal.toFixed(2)}`;
    }

    loadDashboardData() {
        const totalProductos = document.getElementById('total-productos');
        const productosActivos = document.getElementById('productos-activos');
        const productosAgotados = document.getElementById('productos-agotados');

        if (totalProductos) {
            totalProductos.textContent = this.productos.length;
        }

        if (productosActivos) {
            const activos = this.productos.filter(p => p.estado === 'disponible').length;
            productosActivos.textContent = activos;
        }

        if (productosAgotados) {
            const agotados = this.productos.filter(p => p.estado === 'agotado').length;
            productosAgotados.textContent = agotados;
        }
    }

    showLoading(show) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showAlert(message, type = 'info') {
        // Crear o actualizar alert
        let alert = document.getElementById('admin-alert');
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'admin-alert';
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(alert);
        }

        // Colores según tipo
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        alert.style.backgroundColor = colors[type] || colors.info;
        alert.textContent = message;
        alert.style.display = 'block';

        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            if (alert) {
                alert.style.display = 'none';
            }
        }, 5000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
