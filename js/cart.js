// ==========================================
// CARRITO DE COMPRAS - SISTEMA INDEPENDIENTE
// ==========================================

class ShoppingCart {
    constructor() {
        // Solo inicializar items como array vacío, no sobrescribir si ya existen
        if (!this.items) {
            this.items = [];
        }
        this.isInitialized = false;
        
        // Verificar si ya hay una instancia con datos cargados para no perderlos
        const existingData = this.getExistingCartData();
        if (existingData && existingData.length > 0) {
            console.log(`🔄 Preservando ${existingData.length} items existentes en el carrito`);
            this.items = existingData;
        }
        
        this.init();
    }
    
    // Método para obtener datos existentes del carrito sin reinicializar
    getExistingCartData() {
        try {
            const saved = localStorage.getItem('shopping_cart');
            if (!saved) {
                return null;
            }

            const cartData = JSON.parse(saved);
            
            // Verificar si es formato antiguo (solo array de items)
            if (Array.isArray(cartData)) {
                return cartData;
            }
            
            // Verificar formato nuevo con timestamp
            if (cartData.timestamp && cartData.expiresIn) {
                const now = Date.now();
                const expirationTime = cartData.timestamp + cartData.expiresIn;
                
                if (now > expirationTime) {
                    console.log('⏰ Datos existentes expirados');
                    return null;
                }
                
                return cartData.items || [];
            }
            
            return null;
        } catch (error) {
            console.warn('⚠️ Error verificando datos existentes:', error);
            return null;
        }
    }

    async init() {
        if (this.isInitialized) {
            console.log('🛒 Carrito ya inicializado, saltando init()');
            return;
        }
        
        console.log('🛒 Inicializando carrito de compras...');
        
        try {
            // Cargar items del localStorage PRIMERO
            this.loadFromStorage();
            console.log(`📦 Items cargados del localStorage: ${this.items.length}`);
            
            // Insertar HTML del carrito
            await this.insertCartHTML();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Actualizar UI
            this.updateCartUI();
            
            // Iniciar verificación periódica del tiempo del carrito
            this.startPeriodicTimeCheck();
            
            this.isInitialized = true;
            console.log('✅ Carrito inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando carrito:', error);
        }
    }

    async insertCartHTML() {
        try {
            // Usar el método corregido para cargar template
            if (typeof CartErrorFixer !== 'undefined') {
                const cartHTML = await CartErrorFixer.loadCartTemplate();
                document.body.insertAdjacentHTML('beforeend', cartHTML);
                return;
            }
            
            // Fallback al método original con rutas dinámicas
            const currentPath = window.location.pathname;
            const isInRoot = !currentPath.includes('/html/') && currentPath.endsWith('.html');
            const templatePath = isInRoot ? 'html/cart-template.html' : '../html/cart-template.html';
            
            console.log(`🔄 Intentando cargar template desde: ${templatePath}`);
            const response = await fetch(templatePath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const cartHTML = await response.text();
            document.body.insertAdjacentHTML('beforeend', cartHTML);
            
        } catch (error) {
            console.warn('⚠️ No se pudo cargar template externo, usando HTML inline:', error.message);
            
            // Fallback: HTML inline
            const cartHTML = `
                <div class="cart-overlay" id="cartOverlay"></div>
                <div class="cart-slide" id="cartSlide">
                    <div class="cart-header">
                        <h2 class="cart-title">Mi Carrito</h2>
                        <button class="cart-close" id="cartClose" aria-label="Cerrar carrito">&times;</button>
                    </div>
                    
                    <div class="cart-content" id="cartContent">
                        <div class="cart-empty" id="cartEmpty">
                            <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="m1 1 4 4 0 0 9.09-.09L15 14H6"></path>
                                <path d="M5.5 7h7.09l.9 5H6.5L5.5 7z"></path>
                            </svg>
                            <h3>Tu carrito está vacío</h3>
                            <p>Agrega algunos productos para comenzar tu compra</p>
                        </div>
                        
                        <div class="cart-items" id="cartItems" style="display: none;"></div>
                    </div>
                    
                    <div class="cart-footer" id="cartFooter" style="display: none;">
                        <div class="cart-total">
                            <span class="cart-total-label">Total:</span>
                            <span class="cart-total-amount" id="cartTotalAmount">$0</span>
                        </div>
                        
                        <div class="cart-actions">
                            <button class="cart-btn cart-btn-primary" id="checkoutBtn">
                                Proceder al Checkout
                            </button>
                            <button class="cart-btn cart-btn-secondary" id="continueShoppingBtn">
                                Continuar Comprando
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', cartHTML);
        }
    }

    setupEventListeners() {
        // Usar configuración segura si está disponible
        if (typeof CartErrorFixer !== 'undefined') {
            CartErrorFixer.setupSafeEventListeners(this);
            return;
        }
        
        // Fallback al método original
        console.log('⚠️ Usando configuración de event listeners original');
        
        // Botón del carrito en navbar
        const cartButton = document.getElementById('cartButton');
        if (cartButton) {
            cartButton.addEventListener('click', () => this.toggleCart());
            console.log('✅ Event listener configurado para botón del carrito');
        } else {
            console.log('⚠️ Botón del carrito no encontrado durante setupEventListeners');
        }

        // Cerrar carrito
        const cartClose = document.getElementById('cartClose');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartClose) {
            cartClose.addEventListener('click', () => this.closeCart());
        }
        
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCart());
        }

        // Botones del footer
        const checkoutBtn = document.getElementById('checkoutBtn');
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }
        
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => this.closeCart());
        }

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isCartOpen()) {
                this.closeCart();
            }
        });
    }    // Métodos públicos para agregar/quitar productos
    addItem(product) {
        console.log('🛒 Agregando producto al carrito:', product);
        console.log('🔍 Estado del carrito antes de agregar:', {
            initialized: this.isInitialized,
            itemCount: this.items.length,
            items: this.items.map(i => i.id)
        });
        
        // Normalizar ID como string para consistencia
        const productId = String(product.id);
        
        const existingItem = this.items.find(item => String(item.id) === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
            console.log(`✅ Cantidad incrementada. Nueva cantidad: ${existingItem.quantity}`);
        } else {
            // Asegurar que la imagen se guarde correctamente
            let imagenFinal = product.imagen_url || product.imagen;
            
            // Si no hay imagen, usar placeholder apropiado según categoría
            if (!imagenFinal) {
                if (product.categoria === 'para-ellas') {
                    imagenFinal = '../IMAGENES/PARA_ELLAS.png';
                } else if (product.categoria === 'para-ellos') {
                    imagenFinal = '../IMAGENES/PARA_ELLOS.png';
                } else {
                    imagenFinal = '../IMAGENES/placeholder.png';
                }
            }
            
            this.items.push({
                id: productId, // Guardar como string
                nombre: product.nombre,
                marca: product.marca,
                precio: product.precio,
                categoria: product.categoria, // Guardar categoría para el placeholder
                imagen_url: imagenFinal,
                imagen: imagenFinal, // Mantener ambos por compatibilidad
                quantity: 1
            });
            console.log(`✅ Nuevo producto agregado con ID: ${productId}`);
        }
        
        console.log('💾 Intentando guardar en storage...');
        try {
            this.saveToStorage();
            console.log('✅ Guardado en storage exitoso');
        } catch (error) {
            console.error('❌ Error guardando en storage:', error);
        }
        
        console.log('🔄 Actualizando UI...');
        this.updateCartUI();
        
        console.log('📢 Mostrando notificación...');
        this.showAddedNotification(product.nombre);
        
        // Extender tiempo del carrito por actividad
        console.log('⏲️ Extendiendo tiempo del carrito...');
        this.extendCartTime();
        
        console.log(`✅ Total items en carrito después de agregar: ${this.getTotalItems()}`);
        
        // Verificación adicional: revisar que se guardó correctamente
        setTimeout(() => {
            const savedData = this.getSavedCartData();
            if (savedData) {
                const savedItems = this.extractItemsFromSavedData(savedData);
                console.log(`🔍 Verificación post-guardado: ${savedItems.length} items en storage`);
                if (savedItems.length !== this.items.length) {
                    console.warn('⚠️ Discrepancia detectada entre memoria y storage!');
                    console.log('Memoria:', this.items.map(i => i.id));
                    console.log('Storage:', savedItems.map(i => i.id));
                }
            } else {
                console.warn('⚠️ No se encontraron datos guardados después de agregar item');
            }
        }, 100);
    }    removeItem(productId) {
        console.log('🗑️ Eliminando producto del carrito:', productId, typeof productId);
        
        // Normalizar ID y filtrar
        const normalizedId = String(productId);
        const initialLength = this.items.length;
        this.items = this.items.filter(item => String(item.id) !== normalizedId);
        
        if (this.items.length < initialLength) {
            console.log('✅ Producto eliminado del carrito');
        } else {
            console.warn('⚠️ No se encontró producto para eliminar:', productId);
        }
        
        this.saveToStorage();
        this.updateCartUI();
        
        // Extender tiempo del carrito por actividad si quedan items
        if (this.items.length > 0) {
            this.extendCartTime();
        }
    }

    updateQuantity(productId, newQuantity) {
        console.log(`🔢 Actualizando cantidad para producto ${productId} (${typeof productId}): ${newQuantity}`);
        
        // Validar cantidad
        if (newQuantity < 0) {
            console.warn('⚠️ Cantidad no puede ser negativa');
            return;
        }
        
        if (newQuantity === 0) {
            // Buscar con comparación flexible
            const item = this.items.find(item => item.id == productId || item.id === String(productId) || String(item.id) === String(productId));
            if (item) {
                const confirmRemove = confirm(`¿Eliminar "${item.nombre}" del carrito?`);
                if (confirmRemove) {
                    this.removeItem(productId);
                }
            }
            return;
        }
        
        // Buscar con comparación flexible
        const item = this.items.find(item => item.id == productId || item.id === String(productId) || String(item.id) === String(productId));
        if (item) {
            const oldQuantity = item.quantity;
            item.quantity = Math.max(1, Math.floor(newQuantity)); // Asegurar que sea al menos 1 y entero
            
            this.saveToStorage();
            this.updateCartUI();
            
            // Extender tiempo del carrito por actividad
            this.extendCartTime();
            
            console.log(`✅ Cantidad actualizada de ${oldQuantity} a ${item.quantity}`);
        } else {
            console.error('❌ Producto no encontrado en carrito:', productId);
            console.log('🔍 IDs disponibles:', this.items.map(item => ({ id: item.id, tipo: typeof item.id })));
        }
    }

    clearCart() {
        console.log('🧹 Limpiando carrito');
        this.items = [];
        this.saveToStorage();
        this.updateCartUI();
    }

    // Métodos de UI
    toggleCart() {
        if (this.isCartOpen()) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    openCart() {
        console.log('📂 Abriendo carrito');
        const cartSlide = document.getElementById('cartSlide');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartSlide && cartOverlay) {
            cartSlide.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCart() {
        console.log('📁 Cerrando carrito');
        const cartSlide = document.getElementById('cartSlide');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartSlide && cartOverlay) {
            cartSlide.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }    isCartOpen() {
        const cartSlide = document.getElementById('cartSlide');
        return cartSlide && cartSlide.classList.contains('active');
    }
    
    updateCartUI() {
        // Validar carrito antes de actualizar UI
        this.validateCart();
        
        this.updateCartCount();
        this.updateCartContent();
        
        // Debug info
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🛒 Estado del carrito:', this.getCartStatus());
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.getTotalItems();
        
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.classList.toggle('hidden', totalItems === 0);
            
            // Animación del contador
            if (totalItems > 0) {
                cartCount.style.animation = 'none';
                setTimeout(() => {
                    cartCount.style.animation = 'cartBounce 0.3s ease-out';
                }, 10);
            }
        }
    }

    updateCartContent() {
        const cartEmpty = document.getElementById('cartEmpty');
        const cartItems = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');
        
        if (this.items.length === 0) {
            // Mostrar estado vacío
            if (cartEmpty) cartEmpty.style.display = 'flex';
            if (cartItems) cartItems.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            // Mostrar items
            if (cartEmpty) cartEmpty.style.display = 'none';
            if (cartItems) cartItems.style.display = 'block';
            if (cartFooter) cartFooter.style.display = 'block';
            
            this.renderCartItems();
            this.updateCartTotal();
        }
    }    renderCartItems() {
        // Usar renderizado seguro si está disponible
        if (typeof CartErrorFixer !== 'undefined') {
            CartErrorFixer.renderCartItemsSafe(this, this.items);
            return;
        }
        
        // Fallback al método original con mejoras
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;
        
        console.log('⚠️ Usando renderizado original (considera usar cart-error-fixes.js para mejor compatibilidad)');
        
        cartItems.innerHTML = this.items.map(item => {
            // Usar placeholders con rutas dinámicas
            const currentPath = window.location.pathname;
            const isInHtmlFolder = currentPath.includes('/html/');
            const basePath = isInHtmlFolder ? '../IMAGENES/' : 'IMAGENES/';
            
            let placeholder = `${basePath}placeholder.png`;
            if (item.categoria === 'para-ellas') {
                placeholder = `${basePath}PARA_ELLAS.png`;
            } else if (item.categoria === 'para-ellos') {
                placeholder = `${basePath}PARA_ELLOS.png`;
            }
            
            return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.imagen_url || item.imagen || placeholder}" 
                         alt="${item.nombre}"
                         onerror="this.src='${placeholder}'">
                </div>
                
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.nombre}</h4>
                    <p class="cart-item-brand">${item.marca || 'Sin marca'}</p>
                    
                    <div class="cart-item-controls">
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="if(window.shoppingCart && window.shoppingCart.decreaseQuantity) window.shoppingCart.decreaseQuantity('${item.id}')" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="if(window.shoppingCart && window.shoppingCart.increaseQuantity) window.shoppingCart.increaseQuantity('${item.id}')">+</button>
                        </div>
                        
                        <span class="cart-item-price">$${this.formatPrice(item.precio * item.quantity)}</span>
                        
                        <button class="cart-item-remove" onclick="if(window.shoppingCart && window.shoppingCart.removeItem) window.shoppingCart.removeItem('${item.id}')" title="Eliminar producto">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    updateCartTotal() {
        const cartTotalAmount = document.getElementById('cartTotalAmount');
        const total = this.getTotal();
        
        if (cartTotalAmount) {
            cartTotalAmount.textContent = `$${this.formatPrice(total)}`;
        }
    }

    // Métodos de cálculo
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.precio * item.quantity), 0);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    // Persistencia con timestamp y expiración
    saveToStorage() {
        console.log('💾 [saveToStorage] Iniciando guardado...');
        console.log('💾 [saveToStorage] Items a guardar:', this.items.length);
        console.log('💾 [saveToStorage] Items:', this.items.map(i => `${i.id}:${i.nombre}`));
        
        try {
            // Crear versión optimizada de los datos (sin campos innecesarios)
            const optimizedItems = this.items.map(item => ({
                id: item.id,
                nombre: item.nombre,
                marca: item.marca,
                precio: item.precio,
                categoria: item.categoria,
                imagen_url: item.imagen_url || item.imagen,
                quantity: item.quantity
            }));
            
            const cartData = {
                items: optimizedItems,
                timestamp: Date.now(),
                expiresIn: 60 * 60 * 1000, // 1 hora
                version: '1.0'
            };
            
            const dataString = JSON.stringify(cartData);
            
            // Verificar tamaño antes de guardar
            const sizeInBytes = new Blob([dataString]).size;
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
            
            console.log(`📦 [saveToStorage] Intentando guardar carrito: ${sizeInMB}MB, ${this.items.length} items`);
            
            localStorage.setItem('shopping_cart', dataString);
            
            // Verificar que se guardó correctamente
            const verification = localStorage.getItem('shopping_cart');
            if (verification) {
                const parsedVerification = JSON.parse(verification);
                console.log(`✅ [saveToStorage] Carrito guardado y verificado: ${parsedVerification.items.length} items`);
            } else {
                console.error('❌ [saveToStorage] Verificación falló: no se encontraron datos después de guardar');
            }
            
            console.log(`💾 [saveToStorage] Carrito guardado exitosamente (${sizeInMB}MB)`);
            
        } catch (error) {
            console.error('❌ [saveToStorage] Error guardando en localStorage:', error.name, error.message);
            console.error('❌ [saveToStorage] Stack trace:', error.stack);
            
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ [saveToStorage] Ejecutando manejo de cuota excedida...');
                this.handleQuotaExceeded();
            } else {
                console.error('❌ [saveToStorage] Error desconocido en localStorage:', error);
            }
        }
    }
    
    // Manejar cuando se excede la cuota de localStorage
    handleQuotaExceeded() {
        console.group('💾 MANEJANDO CUOTA EXCEDIDA');
        
        try {
            // 1. Obtener información de uso de localStorage
            const storageInfo = this.getLocalStorageInfo();
            console.log('📊 Uso de localStorage:', storageInfo);
            
            // 2. Limpiar datos antiguos o innecesarios
            this.cleanupLocalStorage();
            
            // 3. Intentar guardar una versión más compacta
            const compactData = this.createCompactCartData();
            
            try {
                localStorage.setItem('shopping_cart', JSON.stringify(compactData));
                console.log('✅ Carrito guardado en formato compacto');
            } catch (compactError) {
                console.warn('⚠️ Aún así no se puede guardar, usando sessionStorage');
                
                // 4. Fallback a sessionStorage
                try {
                    sessionStorage.setItem('shopping_cart_session', JSON.stringify(compactData));
                    console.log('✅ Carrito guardado en sessionStorage como fallback');
                } catch (sessionError) {
                    console.error('❌ No se puede guardar en ningún storage:', sessionError);
                    
                    // 5. Último recurso: mantener solo en memoria
                    console.warn('⚠️ Carrito funcionará solo en memoria durante esta sesión');
                }
            }
            
        } catch (error) {
            console.error('❌ Error en handleQuotaExceeded:', error);
        }
        
        console.groupEnd();
    }
    
    // Crear versión compacta de los datos del carrito
    createCompactCartData() {
        const compactItems = this.items.map(item => ({
            i: item.id,                    // id -> i
            n: item.nombre,                // nombre -> n
            m: item.marca,                 // marca -> m
            p: item.precio,                // precio -> p
            c: item.categoria,             // categoria -> c
            img: item.imagen_url || item.imagen, // imagen -> img
            q: item.quantity               // quantity -> q
        }));
        
        return {
            i: compactItems,              // items -> i
            t: Date.now(),                // timestamp -> t
            e: 60 * 60 * 1000,           // expiresIn -> e
            v: '1.1'                      // version -> v (indica formato compacto)
        };
    }
    
    // Obtener información del uso de localStorage
    getLocalStorageInfo() {
        let totalSize = 0;
        let itemCount = 0;
        const items = [];
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                totalSize += size;
                itemCount++;
                
                items.push({
                    key: key,
                    size: (size / 1024).toFixed(2) + 'KB'
                });
            }
        }
        
        return {
            totalSize: (totalSize / (1024 * 1024)).toFixed(2) + 'MB',
            itemCount: itemCount,
            items: items.sort((a, b) => parseFloat(b.size) - parseFloat(a.size))
        };
    }
    
    // Limpiar localStorage de datos antiguos
    cleanupLocalStorage() {
        console.log('🧹 Iniciando limpieza de localStorage...');
        
        const keysToCheck = [];
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                keysToCheck.push(key);
            }
        }
        
        let cleanedCount = 0;
        
        keysToCheck.forEach(key => {
            try {
                // Limpiar datos que no sean del carrito y parezcan antiguos/temporales
                if (key.includes('temp') || 
                    key.includes('cache') || 
                    key.includes('old') ||
                    key.startsWith('_') ||
                    key.includes('debug')) {
                    
                    localStorage.removeItem(key);
                    cleanedCount++;
                    console.log(`🗑️ Eliminado: ${key}`);
                }
            } catch (error) {
                console.warn(`⚠️ No se pudo eliminar ${key}:`, error);
            }
        });
        
        console.log(`✅ Limpieza completada: ${cleanedCount} elementos eliminados`);
    }

    loadFromStorage() {
        try {
            // Si ya tenemos items cargados en el constructor, no sobrescribir
            if (this.items && this.items.length > 0) {
                console.log(`🔄 Items ya cargados en memoria (${this.items.length}), verificando con localStorage...`);
                
                // Verificar si localStorage tiene datos más actuales
                const savedData = this.getSavedCartData();
                if (savedData) {
                    let storageItems = this.extractItemsFromSavedData(savedData);
                    
                    // Solo usar storage si tiene más items
                    if (storageItems.length > this.items.length) {
                        console.log(`📦 Storage tiene más items (${storageItems.length} vs ${this.items.length}), actualizando...`);
                        this.items = storageItems;
                    } else {
                        console.log(`✅ Manteniendo items en memoria (${this.items.length})`);
                        return;
                    }
                } else {
                    console.log(`✅ Manteniendo items en memoria, no hay datos en storage`);
                    return;
                }
            }

            const savedData = this.getSavedCartData();
            if (!savedData) {
                console.log('📦 No hay carrito guardado en ningún storage');
                this.items = [];
                return;
            }

            const cartData = savedData.data;
            const source = savedData.source;
            
            console.log(`📦 Cargando carrito desde ${source}`);

            // Verificar si es formato antiguo (solo array de items)
            if (Array.isArray(cartData)) {
                console.log('🔄 Migrando formato antiguo...');
                this.items = cartData;
                this.saveToStorage(); // Guardar en nuevo formato
                console.log(`📦 Carrito migrado: ${this.items.length} items`);
                return;
            }
            
            // Verificar timestamp y expiración
            const timestamp = cartData.t || cartData.timestamp;
            const expiresIn = cartData.e || cartData.expiresIn;
            
            if (timestamp && expiresIn) {
                const now = Date.now();
                const expirationTime = timestamp + expiresIn;
                
                if (now > expirationTime) {
                    console.log('⏰ Carrito expirado, limpiando...');
                    this.clearExpiredCart();
                    return;
                }
                
                // Extraer items según el formato
                let items = this.extractItemsFromSavedData(savedData);
                this.items = items;
                
                const remainingTime = Math.round((expirationTime - now) / (1000 * 60));
                console.log(`📦 Carrito cargado desde ${source}: ${this.items.length} items, expira en ${remainingTime} minutos`);
                
                // Programar limpieza automática cuando expire
                this.scheduleCartExpiration(expirationTime - now);
                
            } else {
                // Formato desconocido, limpiar
                console.warn('⚠️ Formato de carrito desconocido, limpiando...');
                this.clearExpiredCart();
            }
            
        } catch (error) {
            console.warn('⚠️ No se pudo cargar el carrito desde storage:', error);
            this.items = [];
            this.clearExpiredCart();
        }
    }
    
    // Obtener datos del carrito desde localStorage o sessionStorage
    getSavedCartData() {
        // Intentar localStorage primero
        try {
            const localData = localStorage.getItem('shopping_cart');
            if (localData) {
                return {
                    data: JSON.parse(localData),
                    source: 'localStorage'
                };
            }
        } catch (error) {
            console.warn('⚠️ Error leyendo localStorage:', error);
        }
        
        // Fallback a sessionStorage
        try {
            const sessionData = sessionStorage.getItem('shopping_cart_session');
            if (sessionData) {
                console.log('📦 Usando datos de sessionStorage como fallback');
                return {
                    data: JSON.parse(sessionData),
                    source: 'sessionStorage'
                };
            }
        } catch (error) {
            console.warn('⚠️ Error leyendo sessionStorage:', error);
        }
        
        return null;
    }
    
    // Extraer items de los datos guardados (maneja formato normal y compacto)
    extractItemsFromSavedData(savedData) {
        const cartData = savedData.data;
        const version = cartData.v || cartData.version;
        
        // Formato compacto (v1.1)
        if (version === '1.1') {
            console.log('📦 Leyendo formato compacto');
            return (cartData.i || []).map(item => ({
                id: item.i,
                nombre: item.n,
                marca: item.m,
                precio: item.p,
                categoria: item.c,
                imagen_url: item.img,
                imagen: item.img,
                quantity: item.q
            }));
        }
        
        // Formato normal (v1.0 o sin versión)
        return cartData.items || cartData.i || [];
    }
    
    // Limpiar carrito expirado
    clearExpiredCart() {
        this.items = [];
        localStorage.removeItem('shopping_cart');
        console.log('🧹 Carrito expirado eliminado');
        
        // Solo actualizar UI si el carrito está inicializado
        if (this.isInitialized) {
            this.updateCartUI();
        }
    }
    
    // Programar limpieza automática del carrito
    scheduleCartExpiration(timeUntilExpiration) {
        if (this.expirationTimeout) {
            clearTimeout(this.expirationTimeout);
        }
        
        this.expirationTimeout = setTimeout(() => {
            console.log('⏰ Carrito expirado automáticamente');
            this.clearExpiredCart();
            this.showExpirationNotification();
        }, timeUntilExpiration);
        
        console.log(`⏲️ Carrito programado para expirar en ${Math.round(timeUntilExpiration / (1000 * 60))} minutos`);
    }
    
    // Mostrar notificación de expiración
    showExpirationNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div>⏰ <strong>Carrito expirado</strong></div>
            <div style="font-size: 12px; margin-top: 4px;">Los productos han sido removidos por inactividad</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
    
    // Extender tiempo del carrito (reiniciar timer)
    extendCartTime() {
        if (this.items.length > 0) {
            console.log('🔄 Extendiendo tiempo del carrito...');
            this.saveToStorage(); // Actualiza timestamp
            
            // Reprogramar expiración
            this.scheduleCartExpiration(60 * 60 * 1000); // 1 hora más
        }
    }

    // Notificaciones
    showAddedNotification(productName) {
        // Crear notification temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #2c2c2c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div>✅ <strong>${productName}</strong> agregado al carrito</div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Ocultar y remover notification
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Checkout
    proceedToCheckout() {
        console.log('💳 Procediendo al checkout');
        
        if (this.items.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        
        // Aquí puedes integrar con tu sistema de checkout
        // Por ahora, mostrar resumen
        const total = this.getTotal();
        const itemCount = this.getTotalItems();
        
        const confirmed = confirm(
            `¿Proceder con la compra?\n\n` +
            `Items: ${itemCount}\n` +
            `Total: $${this.formatPrice(total)}\n\n` +
            `Se abrirá WhatsApp para completar la compra.`
        );
        
        if (confirmed) {
            this.sendWhatsAppOrder();
        }
    }

    sendWhatsAppOrder() {
        const phoneNumber = '573001234567'; // Cambiar por tu número
        let message = `🛒 *Nueva Orden - Aromes De Dieu*\n\n`;
        
        this.items.forEach((item, index) => {
            message += `${index + 1}. *${item.nombre}*\n`;
            message += `   Marca: ${item.marca || 'N/A'}\n`;
            message += `   Cantidad: ${item.quantity}\n`;
            message += `   Precio: $${this.formatPrice(item.precio * item.quantity)}\n\n`;
        });
        
        message += `💰 *Total: $${this.formatPrice(this.getTotal())}*\n\n`;
        message += `¡Gracias por tu compra! 🌟`;
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Opcional: limpiar carrito después del checkout
        // this.clearCart();
    }

    // Obtener información del tiempo restante del carrito
    getCartTimeInfo() {
        try {
            const saved = localStorage.getItem('shopping_cart');
            if (!saved) return null;
            
            const cartData = JSON.parse(saved);
            if (!cartData.timestamp || !cartData.expiresIn) return null;
            
            const now = Date.now();
            const expirationTime = cartData.timestamp + cartData.expiresIn;
            const remainingTime = expirationTime - now;
            
            if (remainingTime <= 0) return { expired: true };
            
            return {
                expired: false,
                remainingMinutes: Math.round(remainingTime / (1000 * 60)),
                expirationTime: new Date(expirationTime).toLocaleTimeString()
            };
        } catch (error) {
            console.warn('⚠️ Error obteniendo información de tiempo del carrito:', error);
            return null;
        }
    }
    
    // Mostrar tiempo restante del carrito al usuario (opcional)
    showCartTimeInfo() {
        const timeInfo = this.getCartTimeInfo();
        if (!timeInfo) return;
        
        if (timeInfo.expired) {
            console.log('⏰ El carrito ha expirado');
            return;
        }
        
        if (timeInfo.remainingMinutes <= 10) {
            // Mostrar advertencia si quedan menos de 10 minutos
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-family: 'Montserrat', sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 300px;
            `;
            
            notification.innerHTML = `
                <div>⏰ <strong>Carrito expirando</strong></div>
                <div style="font-size: 12px; margin-top: 4px;">
                    Los productos se eliminarán en ${timeInfo.remainingMinutes} minutos
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 5000);
        }
        
        console.log(`⏲️ Carrito expira en ${timeInfo.remainingMinutes} minutos (${timeInfo.expirationTime})`);
    }

    // Método de validación y depuración
    validateCart() {
        console.log('🔍 Validando carrito...');
        
        let hasChanges = false;
        
        // Eliminar items con cantidad 0 o inválida
        const validItems = this.items.filter(item => {
            if (!item.id || item.quantity <= 0 || !item.nombre || !item.precio) {
                console.warn('⚠️ Eliminando item inválido:', item);
                hasChanges = true;
                return false;
            }
            return true;
        });
        
        // Corregir cantidades no enteras
        validItems.forEach(item => {
            const newQuantity = Math.max(1, Math.floor(item.quantity));
            if (newQuantity !== item.quantity) {
                console.warn(`⚠️ Corrigiendo cantidad de ${item.quantity} a ${newQuantity} para ${item.nombre}`);
                item.quantity = newQuantity;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.items = validItems;
            this.saveToStorage();
            this.updateCartUI();
            console.log('✅ Carrito validado y corregido');
        } else {
            console.log('✅ Carrito válido');
        }
        
        return this.items.length;
    }

    // Método para obtener información del estado del carrito de forma segura
    getCartStatus() {
        return {
            totalItems: this.getTotalItems(),
            totalAmount: this.getTotal(),
            isInitialized: this.isInitialized,
            itemsList: this.items.map(item => ({
                id: item.id,
                nombre: item.nombre,
                quantity: item.quantity,
                precio: item.precio
            }))
        };
    }
    
    // Método para verificar integridad del carrito
    verifyCartIntegrity() {
        const localStorageData = this.getExistingCartData();
        const memoryItems = this.items || [];
        
        console.group('🔍 VERIFICACIÓN DE INTEGRIDAD DEL CARRITO');
        console.log('Items en memoria:', memoryItems.length);
        console.log('Items en localStorage:', localStorageData ? localStorageData.length : 0);
        
        if (localStorageData && localStorageData.length !== memoryItems.length) {
            console.warn('⚠️ Discrepancia detectada entre memoria y localStorage');
            console.log('Memoria:', memoryItems.map(i => i.id));
            console.log('LocalStorage:', localStorageData.map(i => i.id));
            
            // Usar los datos más completos
            if (localStorageData.length > memoryItems.length) {
                console.log('🔄 Sincronizando desde localStorage a memoria');
                this.items = localStorageData;
                this.updateCartUI();
                return 'localStorage_to_memory';
            } else if (memoryItems.length > localStorageData.length) {
                console.log('🔄 Sincronizando desde memoria a localStorage');
                this.saveToStorage();
                return 'memory_to_localStorage';
            }
        } else {
            console.log('✅ Integridad verificada: memoria y localStorage están sincronizados');
        }
        
        console.groupEnd();
        return 'synchronized';
    }

    // Método de emergencia para reinicializar el carrito
    resetCart() {
        console.log('🔄 Reinicializando carrito...');
        
        try {
            this.items = [];
            this.saveToStorage();
            this.updateCartUI();
            
            // Recrear elementos del DOM si es necesario
            if (!document.getElementById('cartSlide')) {
                this.insertCartHTML();
                this.setupEventListeners();
            }
            
            console.log('✅ Carrito reinicializado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error reinicializando carrito:', error);
            return false;
        }
    }

    // Método para debugging avanzado
    debugCart() {
        console.group('🛒 DEBUG DEL CARRITO');
        console.log('Estado:', this.getCartStatus());
        console.log('HTML Elements:', {
            cartButton: !!document.getElementById('cartButton'),
            cartSlide: !!document.getElementById('cartSlide'),
            cartItems: !!document.getElementById('cartItems'),
            cartCount: !!document.getElementById('cartCount')
        });
        console.log('LocalStorage:', localStorage.getItem('shopping_cart'));
        console.log('Inicializado:', this.isInitialized);
        
        // Información de tiempo del carrito
        const timeInfo = this.getCartTimeInfo();
        if (timeInfo) {
            if (timeInfo.expired) {
                console.log('⏰ Tiempo del carrito: EXPIRADO');
            } else {
                console.log('⏰ Tiempo del carrito:', {
                    remainingMinutes: timeInfo.remainingMinutes,
                    expirationTime: timeInfo.expirationTime,
                    status: timeInfo.remainingMinutes <= 10 ? 'Expirando pronto' : 'Activo'
                });
            }
        } else {
            console.log('⏰ Tiempo del carrito: No disponible');
        }
        
        console.groupEnd();
    }    // Métodos mejorados para manejo de cantidades
    increaseQuantity(productId) {
        console.log('➕ Incrementando cantidad para producto:', productId, typeof productId);
        
        // Normalizar ID para búsqueda
        const normalizedId = String(productId);
        const item = this.items.find(item => String(item.id) === normalizedId);
        
        if (item) {
            item.quantity += 1;
            this.saveToStorage();
            this.updateCartUI();
            
            // Extender tiempo del carrito por actividad
            this.extendCartTime();
            
            console.log(`✅ Nueva cantidad: ${item.quantity}`);
        } else {
            console.error('❌ Producto no encontrado en carrito:', productId);
            console.log('🔍 IDs en carrito:', this.items.map(item => ({ id: item.id, nombre: item.nombre })));
        }
    }

    decreaseQuantity(productId) {
        console.log('➖ Decrementando cantidad para producto:', productId, typeof productId);
        
        // Normalizar ID para búsqueda
        const normalizedId = String(productId);
        const item = this.items.find(item => String(item.id) === normalizedId);
        
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                this.saveToStorage();
                this.updateCartUI();
                
                // Extender tiempo del carrito por actividad
                this.extendCartTime();
                
                console.log(`✅ Nueva cantidad: ${item.quantity}`);
            } else {
                // Si cantidad es 1, preguntar si quiere eliminar
                const confirmRemove = confirm(`¿Eliminar "${item.nombre}" del carrito?`);
                if (confirmRemove) {
                    this.removeItem(productId);
                }
            }
        } else {
            console.error('❌ Producto no encontrado en carrito:', productId);
            console.log('🔍 IDs en carrito:', this.items.map(item => ({ id: item.id, nombre: item.nombre })));
        }
    }

    // Método para reconfigurar event listeners (especialmente útil para el botón del carrito)
    reconfigureEventListeners() {
        console.log('🔄 Reconfigurando event listeners del carrito...');
        
        // Verificar si ya se reconfiguró recientemente para evitar duplicados
        if (this._lastReconfigure && (Date.now() - this._lastReconfigure) < 1000) {
            console.log('⏭️ Reconfiguración saltada - muy reciente');
            return;
        }
        this._lastReconfigure = Date.now();
        
        // Reconfigurar botón del carrito
        const cartButton = document.getElementById('cartButton');
        if (cartButton) {
            try {
                // Crear un nuevo event listener único
                const cartClickHandler = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('🛒 Botón del carrito clickeado - handler único');
                    this.toggleCart();
                };
                
                // Remover todos los event listeners existentes clonando el elemento
                const newCartButton = cartButton.cloneNode(true);
                cartButton.parentNode.replaceChild(newCartButton, cartButton);
                
                // Agregar el nuevo event listener al botón reemplazado
                const freshCartButton = document.getElementById('cartButton');
                if (freshCartButton) {
                    freshCartButton.addEventListener('click', cartClickHandler);
                    console.log('✅ Event listener único configurado para el botón del carrito');
                } else {
                    console.warn('⚠️ No se pudo obtener el botón del carrito después del reemplazo');
                }
                
            } catch (error) {
                console.warn('⚠️ Error reconfigurando botón del carrito:', error.message);
                // Fallback: agregar event listener directamente
                cartButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🛒 Botón del carrito clickeado (fallback)');
                    this.toggleCart();
                });
                console.log('✅ Event listener del carrito configurado (fallback)');
            }
        } else {
            console.warn('⚠️ Botón del carrito no encontrado durante reconfiguración');
        }
        
        // También reconfigurar otros elementos del carrito si existen
        this.reconfigureCartElements();
    }
    
    // Método auxiliar para reconfigurar elementos del carrito
    reconfigureCartElements() {
        // Crear handlers únicos para cada elemento
        const closeCartHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeCart();
        };
        
        const checkoutHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.proceedToCheckout();
        };
        
        // Cerrar carrito - clonar para remover listeners
        const cartClose = document.getElementById('cartClose');
        if (cartClose) {
            const newCartClose = cartClose.cloneNode(true);
            cartClose.parentNode.replaceChild(newCartClose, cartClose);
            document.getElementById('cartClose').addEventListener('click', closeCartHandler);
        }
        
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay) {
            const newCartOverlay = cartOverlay.cloneNode(true);
            cartOverlay.parentNode.replaceChild(newCartOverlay, cartOverlay);
            document.getElementById('cartOverlay').addEventListener('click', closeCartHandler);
        }

        // Botones del footer
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            const newCheckoutBtn = checkoutBtn.cloneNode(true);
            checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);
            document.getElementById('checkoutBtn').addEventListener('click', checkoutHandler);
        }
        
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        if (continueShoppingBtn) {
            const newContinueBtn = continueShoppingBtn.cloneNode(true);
            continueShoppingBtn.parentNode.replaceChild(newContinueBtn, continueShoppingBtn);
            document.getElementById('continueShoppingBtn').addEventListener('click', closeCartHandler);
        }
        
        console.log('✅ Elementos del carrito reconfigurados sin duplicados');
    }

    // Iniciar verificación periódica del tiempo del carrito
    startPeriodicTimeCheck() {
        // Verificar cada 5 minutos
        this.timeCheckInterval = setInterval(() => {
            if (this.items.length > 0) {
                const timeInfo = this.getCartTimeInfo();
                if (timeInfo) {
                    if (timeInfo.expired) {
                        console.log('⏰ Verificación periódica: carrito expirado');
                        this.clearExpiredCart();
                    } else if (timeInfo.remainingMinutes <= 10) {
                        console.log(`⏰ Verificación periódica: carrito expira en ${timeInfo.remainingMinutes} minutos`);
                        this.showCartTimeInfo();
                    }
                }
                
                // Verificar integridad cada vez
                this.verifyCartIntegrity();
            }
        }, 5 * 60 * 1000); // 5 minutos
        
        console.log('⏲️ Verificación periódica del carrito iniciada (cada 5 minutos)');
        
        // Verificación inicial de integridad después de 2 segundos
        setTimeout(() => {
            if (this.items.length > 0) {
                this.verifyCartIntegrity();
            }
        }, 2000);
    }

    // Método para debuggear el localStorage específicamente
    debugLocalStorage() {
        console.group('💾 DEBUG DEL LOCALSTORAGE');
        
        const cartData = localStorage.getItem('shopping_cart');
        if (!cartData) {
            console.log('📦 No hay datos en localStorage');
            console.groupEnd();
            return;
        }
        
        try {
            const parsed = JSON.parse(cartData);
            console.log('📦 Datos guardados:', parsed);
            
            if (parsed.timestamp) {
                const now = Date.now();
                const age = now - parsed.timestamp;
                const ageMinutes = Math.round(age / (1000 * 60));
                const expirationTime = parsed.timestamp + (parsed.expiresIn || 0);
                const remainingTime = Math.round((expirationTime - now) / (1000 * 60));
                
                console.log('⏰ Información de tiempo:', {
                    'Guardado hace (minutos)': ageMinutes,
                    'Tiempo restante (minutos)': remainingTime,
                    'Expira el': new Date(expirationTime).toLocaleString(),
                    'Estado': remainingTime > 0 ? 'Válido' : 'Expirado'
                });
            }
            
            if (parsed.items) {
                console.log('🛒 Items en localStorage:', parsed.items.length);
                parsed.items.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.nombre} (${item.marca}) - Cantidad: ${item.quantity}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Error parseando localStorage:', error);
            console.log('🔧 Datos raw:', cartData.substring(0, 200) + '...');
        }
        
        console.groupEnd();
    }
}

// Función global para verificar el estado del carrito
window.checkCartStatus = function() {
    console.group('🔍 DIAGNÓSTICO DEL CARRITO');
    
    console.log('¿Existe window.shoppingCart?', !!window.shoppingCart);
    
    if (window.shoppingCart) {
        console.log('Tipo:', typeof window.shoppingCart);
        console.log('¿Es instancia de ShoppingCart?', window.shoppingCart instanceof ShoppingCart);
        console.log('¿Está inicializado?', window.shoppingCart.isInitialized);
        
        // Verificar funciones clave
        const functions = ['addItem', 'removeItem', 'increaseQuantity', 'decreaseQuantity', 'updateQuantity'];
        functions.forEach(funcName => {
            console.log(`¿Existe ${funcName}?`, typeof window.shoppingCart[funcName] === 'function');
        });
        
        // Estado actual
        if (typeof window.shoppingCart.getCartStatus === 'function') {
            console.log('Estado actual:', window.shoppingCart.getCartStatus());
        }
    } else {
        console.error('❌ window.shoppingCart no existe');
        console.log('Intentando crear nueva instancia...');
        try {
            // Usar función singleton en lugar de crear directamente
            window.getShoppingCartInstance();
            console.log('✅ Nueva instancia creada');
        } catch (error) {
            console.error('❌ Error creando instancia:', error);
        }
    }
    
    console.groupEnd();
};

// Función para forzar reinicialización
window.forceInitCart = function() {
    console.log('🔄 Forzando reinicialización del carrito...');
    try {
        // Limpiar instancia existente
        if (window.shoppingCart) {
            window.shoppingCart = null;
        }
        // Usar función singleton para crear nueva instancia
        window.shoppingCart = window.getShoppingCartInstance();
        console.log('✅ Carrito reinicializado');
        return true;
    } catch (error) {
        console.error('❌ Error reinicializando:', error);
        return false;
    }
};

// SINGLETON MEJORADO: Función para obtener o crear la instancia única del carrito
window.getShoppingCartInstance = function() {
    // Prevenir inicialización múltiple
    if (window._cartInitialized && window.shoppingCart) {
        console.log('✅ Reutilizando instancia existente del carrito (mejorada)');
        return window.shoppingCart;
    }
    
    // Si ya existe y está correctamente inicializado, devolverlo
    if (window.shoppingCart && window.shoppingCart.isInitialized) {
        console.log('✅ Reutilizando instancia existente del carrito');
        window._cartInitialized = true;
        return window.shoppingCart;
    }
    
    // Si existe pero no está inicializado, inicializarlo preservando datos
    if (window.shoppingCart && !window.shoppingCart.isInitialized) {
        console.log('🔄 Inicializando carrito existente...');
        
        // Preservar cualquier dato ya cargado antes de init
        const existingItems = window.shoppingCart.items || [];
        window.shoppingCart.init();
        
        // Si init sobrescribió los datos, restaurarlos
        if (existingItems.length > 0 && window.shoppingCart.items.length === 0) {
            console.log(`🔄 Restaurando ${existingItems.length} items después de init`);
            window.shoppingCart.items = existingItems;
            window.shoppingCart.saveToStorage();
            window.shoppingCart.updateCartUI();
        }
        
        window._cartInitialized = true;
        return window.shoppingCart;
    }
    
    // Si no existe, crear nueva instancia
    console.log('🛒 Creando nueva instancia única del carrito...');
    window.shoppingCart = new ShoppingCart();
    window._cartInitialized = true;
    return window.shoppingCart;
};

// Inicializar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, obteniendo instancia del carrito...');
    
    // Usar función singleton para obtener/crear instancia
    const cart = window.getShoppingCartInstance();
    
    // Verificación final después de un delay mínimo
    setTimeout(() => {
        if (window.shoppingCart && typeof window.shoppingCart.getTotalItems === 'function') {
            const itemCount = window.shoppingCart.getTotalItems();
            console.log(`✅ Carrito verificado: ${itemCount} items`);
            
            // Mostrar información de tiempo si hay items
            if (itemCount > 0) {
                const timeInfo = window.shoppingCart.getCartTimeInfo();
                if (timeInfo && !timeInfo.expired) {
                    console.log(`⏲️ Carrito expira en ${timeInfo.remainingMinutes} minutos`);
                }
            }
        } else {
            console.error('❌ Error crítico: carrito no funciona correctamente');
        }
    }, 500);
});

// También verificar cuando la ventana se carga completamente (solo como backup)
window.addEventListener('load', function() {
    // Usar función singleton en lugar de crear directamente
    window.getShoppingCartInstance();
});

// Función global para verificar tiempo del carrito
window.checkCartTime = function() {
    if (!window.shoppingCart) {
        console.log('❌ Carrito no disponible');
        return;
    }
    
    const timeInfo = window.shoppingCart.getCartTimeInfo();
    if (!timeInfo) {
        console.log('📦 No hay carrito guardado o sin información de tiempo');
        return;
    }
    
    if (timeInfo.expired) {
        console.log('⏰ El carrito ha expirado');
        return;
    }
    
    console.group('⏲️ INFORMACIÓN DEL CARRITO');
    console.log(`Items en carrito: ${window.shoppingCart.getTotalItems()}`);
    console.log(`Tiempo restante: ${timeInfo.remainingMinutes} minutos`);
    console.log(`Expira a las: ${timeInfo.expirationTime}`);
    console.log(`Estado: ${timeInfo.remainingMinutes <= 10 ? '⚠️ Expirando pronto' : '✅ Activo'}`);
    console.groupEnd();
    
    return timeInfo;
};

// Función para extender manualmente el tiempo del carrito
window.extendCartTime = function() {
    if (!window.shoppingCart) {
        console.log('❌ Carrito no disponible');
        return false;
    }
    
    if (window.shoppingCart.items.length === 0) {
        console.log('📦 Carrito vacío, no hay nada que extender');
        return false;
    }
    
    window.shoppingCart.extendCartTime();
    console.log('✅ Tiempo del carrito extendido por 1 hora más');
    return true;
};

// Hacer disponible globalmente
window.ShoppingCart = ShoppingCart;

// Función global para debug del localStorage
window.debugCartLocalStorage = function() {
    if (!window.shoppingCart || !window.shoppingCart.debugLocalStorage) {
        console.log('❌ Método debugLocalStorage no disponible');
        
        // Fallback manual
        console.group('💾 DEBUG DEL LOCALSTORAGE (Fallback)');
        const cartData = localStorage.getItem('shopping_cart');
        if (!cartData) {
            console.log('📦 No hay datos en localStorage');
        } else {
            try {
                const parsed = JSON.parse(cartData);
                console.log('📦 Datos guardados:', parsed);
            } catch (error) {
                console.error('❌ Error parseando:', error);
                console.log('🔧 Datos raw:', cartData);
            }
        }
        console.groupEnd();
        return;
    }
    
    window.shoppingCart.debugLocalStorage();
};

// Función global adicional para verificar integridad
window.verifyCartIntegrity = function() {
    if (!window.shoppingCart || !window.shoppingCart.verifyCartIntegrity) {
        console.log('❌ Método verifyCartIntegrity no disponible');
        return false;
    }
    
    return window.shoppingCart.verifyCartIntegrity();
};

// Función para simular navegación y verificar persistencia
window.simulateNavigation = function() {
    console.group('🚀 SIMULACIÓN DE NAVEGACIÓN');
    
    if (!window.shoppingCart) {
        console.log('❌ No hay carrito para simular');
        console.groupEnd();
        return;
    }
    
    const beforeItems = window.shoppingCart.items.length;
    console.log(`📦 Items antes de simular navegación: ${beforeItems}`);
    
    // Simular que el carrito se "reinicializa" (como pasaría en navegación)
    const currentItems = [...window.shoppingCart.items];
    
    // Forzar reinicialización
    window.shoppingCart.isInitialized = false;
    
    // Obtener instancia (debería preservar datos)
    const cart = window.getShoppingCartInstance();
    
    const afterItems = cart.items.length;
    console.log(`📦 Items después de reinicialización: ${afterItems}`);
    
    if (beforeItems === afterItems) {
        console.log('✅ Navegación simulada exitosa - datos preservados');
    } else {
        console.log('❌ Datos perdidos durante navegación simulada');
        console.log('Antes:', currentItems.map(i => i.id));
        console.log('Después:', cart.items.map(i => i.id));
    }
    
    console.groupEnd();
    return beforeItems === afterItems;
};

// Función global para diagnosticar problemas de guardado
window.debugCartSave = function() {
    console.group('🔍 DIAGNÓSTICO DE GUARDADO DEL CARRITO');
    
    if (!window.shoppingCart) {
        console.error('❌ window.shoppingCart no existe');
        console.groupEnd();
        return;
    }
    
    console.log('✅ Carrito existe');
    console.log('🔧 Estado de inicialización:', window.shoppingCart.isInitialized);
    console.log('📦 Items en memoria:', window.shoppingCart.items.length);
    
    if (window.shoppingCart.items.length > 0) {
        console.log('📋 Lista de items:');
        window.shoppingCart.items.forEach((item, i) => {
            console.log(`  ${i+1}. ${item.nombre} (ID: ${item.id})`);
        });
    }
    
    // Verificar localStorage
    const localData = localStorage.getItem('shopping_cart');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            let savedItems = [];
            
            if (Array.isArray(parsed)) {
                savedItems = parsed;
            } else if (parsed.items) {
                savedItems = parsed.items;
            } else if (parsed.i) {
                savedItems = parsed.i;
            }
            
            console.log('💾 Items en localStorage:', savedItems.length);
            if (savedItems.length > 0) {
                console.log('💾 Lista de items guardados:');
                savedItems.forEach((item, i) => {
                    const name = item.nombre || item.n;
                    const id = item.id || item.i;
                    console.log(`  ${i+1}. ${name} (ID: ${id})`);
                });
            }
            
            // Comparar memoria vs localStorage
            if (window.shoppingCart.items.length !== savedItems.length) {
                console.warn('⚠️ DISCREPANCIA DETECTADA:');
                console.warn(`   Memoria: ${window.shoppingCart.items.length} items`);
                console.warn(`   LocalStorage: ${savedItems.length} items`);
            } else {
                console.log('✅ Memoria y localStorage coinciden');
            }
            
        } catch (error) {
            console.error('❌ Error parseando localStorage:', error);
        }
    } else {
        console.warn('⚠️ No hay datos en localStorage');
    }
    
    // Verificar sessionStorage como fallback
    const sessionData = sessionStorage.getItem('shopping_cart_session');
    if (sessionData) {
        console.log('📱 Datos encontrados en sessionStorage (fallback)');
    }
    
    // Test de guardado
    console.log('🧪 Probando capacidad de guardado...');
    try {
        const testData = JSON.stringify({test: 'cart_save_test', timestamp: Date.now()});
        localStorage.setItem('cart_save_test', testData);
        localStorage.removeItem('cart_save_test');
        console.log('✅ LocalStorage funciona correctamente');
    } catch (error) {
        console.error('❌ Error en localStorage:', error.name, error.message);
    }
    
    console.groupEnd();
};
