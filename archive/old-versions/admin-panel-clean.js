// Panel de Administración - Versión Limpia
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.productos = [];
        this.categorias = [];
        this.marcas = [];
        this.isSubmitting = false;
        
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
            
            if (hasSupabase && hasService) {
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

        // Preview de imagen
        const imagenUrlInput = document.getElementById('imagen_url');
        if (imagenUrlInput) {
            let previewTimeout;
            imagenUrlInput.addEventListener('input', (e) => {
                clearTimeout(previewTimeout);
                previewTimeout = setTimeout(() => {
                    const url = e.target.value.trim();
                    if (url && (url.startsWith('http') || url.startsWith('.') || url.startsWith('/'))) {
                        this.previewImageFromUrl(url);
                    } else if (!url) {
                        this.clearImagePreview();
                    }
                }, 1000);
            });
        }

        // Archivo de imagen
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
                const targetTab = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    showSection(sectionName) {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));

        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            console.log(`📄 Sección activa: ${sectionName}`);
            
            this.loadSectionData(sectionName);
        } else {
            console.error(`❌ Sección no encontrada: ${sectionName}`);
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboardDisplay();
                break;
            case 'productos':
                await this.loadProductsData();
                break;
            case 'agregar-producto':
                this.setupProductForm();
                break;
        }
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            await this.loadProductos();
            await this.loadCategorias();
            await this.loadMarcas();
            
            console.log('✅ Datos cargados');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.productos = [];
            this.categorias = [];
            this.marcas = [];
        } finally {
            this.showLoading(false);
        }
    }

    async loadProductos() {
        try {
            if (typeof ProductosService !== 'undefined') {
                this.productos = await ProductosService.obtenerProductos();
                console.log(`✅ ${this.productos.length} productos cargados`);
            } else {
                this.productos = [];
            }
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.productos = [];
        }
    }

    async loadCategorias() {
        try {
            if (typeof ProductosService !== 'undefined') {
                this.categorias = await ProductosService.obtenerCategorias();
            } else {
                this.categorias = [
                    { id: 1, nombre: 'Para Ellos', slug: 'para-ellos' },
                    { id: 2, nombre: 'Para Ellas', slug: 'para-ellas' }
                ];
            }
        } catch (error) {
            this.categorias = [];
        }
    }

    async loadMarcas() {
        const marcasUnicas = [...new Set(this.productos.map(p => p.marca).filter(Boolean))];
        this.marcas = marcasUnicas.sort();
    }

    updateDashboardDisplay() {
        const totalProducts = this.productos.length;
        const activeProducts = this.productos.filter(p => p.activo !== false).length;
        const totalCategories = this.categorias.length;
        const totalBrands = this.marcas.length;

        this.updateDashboardCard('total-productos', totalProducts);
        this.updateDashboardCard('productos-activos', activeProducts);
        this.updateDashboardCard('total-categorias', totalCategories);
        this.updateDashboardCard('total-marcas', totalBrands);
    }

    updateDashboardCard(cardType, value) {
        const card = document.querySelector(`[data-card="${cardType}"] .number`);
        if (card) {
            card.textContent = value;
        }
    }

    async refreshAllData() {
        try {
            this.showLoading(true);
            await this.loadInitialData();
            await this.loadSectionData(this.currentSection);
            console.log('✅ Datos refrescados');
        } catch (error) {
            console.error('❌ Error refrescando:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async loadProductsData() {
        try {
            const container = document.getElementById('productos-container');
            if (!container) return;

            if (this.productos.length === 0) {
                container.innerHTML = '<p class="no-data">No hay productos disponibles</p>';
                return;
            }

            const productCards = this.productos.map(product => this.createProductCard(product)).join('');
            container.innerHTML = productCards;

            // Configurar botones de acción
            this.setupProductActions();
        } catch (error) {
            console.error('❌ Error cargando lista productos:', error);
        }
    }

    createProductCard(product) {
        const imageSrc = this.getImagePath(product.imagen_url || product.imagen);
        const estado = product.estado || 'disponible';
        const estadoBadge = this.getEstadoBadge(estado);
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${imageSrc}" 
                         alt="${product.nombre}" 
                         onerror="this.src='${this.getPlaceholderPath()}'">
                    ${estadoBadge}
                </div>
                <div class="product-info">
                    <h3>${product.nombre}</h3>
                    <p class="brand">${product.marca || 'Sin marca'}</p>
                    <p class="price">$${this.formatPrice(product.precio || 0)}</p>
                    <p class="category">${product.categoria || 'Sin categoría'}</p>
                </div>
                <div class="product-actions">
                    <button class="btn btn-edit" onclick="adminPanel.editProduct(${product.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-delete" onclick="adminPanel.deleteProduct(${product.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }

    setupProductActions() {
        // Los botones ya tienen onclick en el HTML generado
        console.log('✅ Acciones de productos configuradas');
    }

    setupProductForm() {
        this.populateSelects();
        this.setFormEditMode(false);
        this.clearImagePreview();
    }

    populateSelects() {
        // Categorías
        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect && this.categorias.length > 0) {
            categoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>' +
                this.categorias.map(cat => `<option value="${cat.slug || cat.nombre}">${cat.nombre}</option>`).join('');
        }

        // Marcas
        const marcaInput = document.getElementById('marca');
        if (marcaInput && this.marcas.length > 0) {
            const datalist = document.getElementById('marcas-list') || this.createDatalist('marcas-list');
            datalist.innerHTML = this.marcas.map(marca => `<option value="${marca}"></option>`).join('');
            marcaInput.setAttribute('list', 'marcas-list');
        }
    }

    createDatalist(id) {
        const datalist = document.createElement('datalist');
        datalist.id = id;
        document.body.appendChild(datalist);
        return datalist;
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

            // Manejar imagen
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

    async processProductImage(productData) {
        const fileInput = document.getElementById('imagen_file');
        const urlInput = document.getElementById('imagen_url');

        // Priorizar archivo sobre URL
        if (fileInput?.files?.length > 0) {
            const file = fileInput.files[0];
            
            if (!file.type.startsWith('image/')) {
                throw new Error('Selecciona un archivo de imagen válido');
            }
            
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('La imagen es muy grande. Máximo 5MB');
            }

            const imageData = await this.convertFileToBase64(file);
            productData.imagen = imageData;
            productData.imagen_url = imageData;

        } else if (urlInput?.value?.trim()) {
            const imageUrl = urlInput.value.trim();
            
            if (imageUrl.startsWith('http') || imageUrl.startsWith('.') || imageUrl.startsWith('/')) {
                productData.imagen = imageUrl;
                productData.imagen_url = imageUrl;
            }
        } else {
            productData.imagen = null;
            productData.imagen_url = null;
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

    editProduct(productId) {
        const product = this.productos.find(p => p.id === productId);
        if (!product) return;

        this.showSection('agregar-producto');
        
        setTimeout(() => {
            this.fillProductForm(product);
            this.setFormEditMode(true, productId);
        }, 100);
    }

    fillProductForm(product) {
        document.getElementById('nombre').value = product.nombre || '';
        document.getElementById('marca').value = product.marca || '';
        document.getElementById('precio').value = product.precio || '';
        document.getElementById('categoria').value = product.categoria || '';
        document.getElementById('subcategoria').value = product.subcategoria || '';
        document.getElementById('descripcion').value = product.descripcion || '';
        document.getElementById('notas').value = product.notas || '';
        document.getElementById('estado').value = product.estado || 'disponible';
        document.getElementById('descuento').value = product.descuento || '';
        document.getElementById('activo').checked = product.activo !== false;

        // Imagen
        const imagenUrl = product.imagen_url || product.imagen;
        if (imagenUrl) {
            document.getElementById('imagen_url').value = imagenUrl;
            this.previewImageFromUrl(imagenUrl);
        }

        this.handleEstadoChange();
        this.updatePrecioConDescuento();
    }

    setFormEditMode(isEdit, productId = '') {
        document.getElementById('productId').value = productId;
        
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        const resetBtn = document.querySelector('#productForm button[type="reset"]');
        const title = document.querySelector('#agregar-producto h2');

        if (isEdit) {
            if (submitBtn) submitBtn.textContent = '✏️ Actualizar Producto';
            if (resetBtn) resetBtn.textContent = '❌ Cancelar Edición';
            if (title) title.textContent = 'Editar Producto';
        } else {
            if (submitBtn) submitBtn.textContent = '💾 Guardar Producto';
            if (resetBtn) resetBtn.textContent = '🧹 Limpiar Formulario';
            if (title) title.textContent = 'Agregar Nuevo Producto';
        }
    }

    async deleteProduct(productId) {
        const product = this.productos.find(p => p.id === productId);
        if (!product) return;

        if (!confirm(`¿Estás seguro de eliminar "${product.nombre}"?`)) return;

        try {
            this.showLoading(true);

            if (typeof ProductosService === 'undefined') {
                throw new Error('ProductosService no disponible');
            }

            await ProductosService.eliminarProducto(productId);
            
            await this.loadProductos();
            await this.loadProductsData();
            
            this.showAlert('Producto eliminado exitosamente', 'success');

        } catch (error) {
            console.error('❌ Error eliminando:', error);
            this.showAlert('Error eliminando producto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    filterProducts(searchTerm) {
        const cards = document.querySelectorAll('.product-card');
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            card.style.display = matches ? 'block' : 'none';
        });
    }

    // UTILIDADES

    handleEstadoChange() {
        const estado = document.getElementById('estado')?.value;
        const descuentoGroup = document.getElementById('descuento-group');
        
        if (descuentoGroup) {
            descuentoGroup.style.display = estado === 'oferta' ? 'block' : 'none';
        }
        
        this.updatePrecioConDescuento();
    }

    updatePrecioConDescuento() {
        const precio = parseFloat(document.getElementById('precio')?.value) || 0;
        const descuento = parseInt(document.getElementById('descuento')?.value) || 0;
        const estado = document.getElementById('estado')?.value;
        
        const preview = document.getElementById('precio-preview');
        if (!preview) return;

        if (estado === 'oferta' && descuento > 0) {
            const precioConDescuento = precio - (precio * descuento / 100);
            preview.innerHTML = `
                <span class="precio-original">$${this.formatPrice(precio)}</span>
                <span class="precio-oferta">$${this.formatPrice(precioConDescuento)}</span>
                <span class="descuento-badge">-${descuento}%</span>
            `;
        } else {
            preview.innerHTML = `<span class="precio-normal">$${this.formatPrice(precio)}</span>`;
        }
    }

    validatePrice(input) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            input.setCustomValidity('Ingresa un precio válido mayor o igual a 0');
        } else {
            input.setCustomValidity('');
        }
    }

    async convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    previewImageFromUrl(url) {
        const preview = document.getElementById('image-preview');
        if (!preview) return;

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Vista previa';
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';

        img.onload = () => {
            preview.innerHTML = '';
            preview.appendChild(img);
        };

        img.onerror = () => {
            preview.innerHTML = '<p style="color: #e74c3c;">Error cargando imagen</p>';
        };
    }

    previewImageFromFile(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;

        const preview = document.getElementById('image-preview');
        if (!preview) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Vista previa';
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';

            preview.innerHTML = '';
            preview.appendChild(img);
        };

        reader.readAsDataURL(file);
    }

    clearImagePreview() {
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.innerHTML = '<p>Vista previa de imagen</p>';
        }
    }

    getImagePath(imagePath) {
        if (!imagePath) return this.getPlaceholderPath();
        
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
            return imagePath;
        }
        
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        
        return isInHtmlFolder && !imagePath.startsWith('../') 
            ? `../${imagePath}` 
            : imagePath;
    }

    getPlaceholderPath() {
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZjNzU3ZCIgZm9udC1zaXplPSIxNCI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';
    }

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

    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    showLoading(show) {
        const loader = document.getElementById('loading') || this.createLoader();
        loader.style.display = show ? 'flex' : 'none';
    }

    createLoader() {
        const loader = document.createElement('div');
        loader.id = 'loading';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        loader.innerHTML = '<div style="background: white; padding: 20px; border-radius: 8px;">⏳ Cargando...</div>';
        document.body.appendChild(loader);
        return loader;
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        alert.style.background = colors[type] || colors.info;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.opacity = '1';
            alert.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(alert), 300);
        }, 3000);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando admin panel...');
    
    const checkAndInit = () => {
        const sidebar = document.querySelector('.sidebar');
        const hasSupabase = typeof window.supabase !== 'undefined' || typeof initSupabase === 'function';
        
        if (sidebar && hasSupabase) {
            console.log('✅ Iniciando admin panel...');
            window.adminPanel = new AdminPanel();
        } else {
            console.log('⏳ Esperando elementos...');
            setTimeout(checkAndInit, 100);
        }
    };
    
    checkAndInit();
});
