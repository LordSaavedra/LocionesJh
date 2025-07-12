// CORRECCIÓN DE ERRORES CRÍTICOS DEL CARRITO DE COMPRAS
// Este script corrige los problemas identificados en el diagnóstico

class CartErrorFixer {
    
    // 1. Solución para rutas dinámicas
    static getCorrectPath(filename) {
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        const isInRoot = !isInHtmlFolder && currentPath.endsWith('.html');
        
        switch (filename) {
            case 'cart-template.html':
                return isInRoot ? 'html/cart-template.html' : '../html/cart-template.html';
            case 'navbar.html':
                return isInRoot ? 'html/navbar.html' : 'navbar.html';
            default:
                return filename;
        }
    }
    
    // 2. Método mejorado para cargar template del carrito
    static async loadCartTemplate() {
        try {
            const templatePath = this.getCorrectPath('cart-template.html');
            console.log(`🔄 Intentando cargar template desde: ${templatePath}`);
            
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const cartHTML = await response.text();
            console.log('✅ Template del carrito cargado exitosamente');
            return cartHTML;
            
        } catch (error) {
            console.warn('⚠️ No se pudo cargar template externo, usando HTML inline:', error.message);
            return this.getFallbackCartHTML();
        }
    }
    
    // 3. HTML fallback mejorado
    static getFallbackCartHTML() {
        return `
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
    }
    
    // 4. Método para configurar event listeners de forma segura
    static setupSafeEventListeners(cartInstance) {
        // Remover listeners anteriores si existen
        this.removePreviousListeners();
        
        // Botón del carrito en navbar
        const cartButton = document.getElementById('cartButton');
        if (cartButton) {
            const clickHandler = (e) => {
                e.preventDefault();
                if (cartInstance && typeof cartInstance.toggleCart === 'function') {
                    cartInstance.toggleCart();
                } else {
                    console.error('❌ Carrito no disponible para toggle');
                }
            };
            
            cartButton.addEventListener('click', clickHandler);
            cartButton._cartClickHandler = clickHandler; // Guardar referencia para limpieza
            console.log('✅ Event listener seguro configurado para botón del carrito');
        }

        // Cerrar carrito
        const cartClose = document.getElementById('cartClose');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartClose) {
            const closeHandler = () => {
                if (cartInstance && typeof cartInstance.closeCart === 'function') {
                    cartInstance.closeCart();
                }
            };
            cartClose.addEventListener('click', closeHandler);
            cartClose._cartCloseHandler = closeHandler;
        }
        
        if (cartOverlay) {
            const overlayHandler = () => {
                if (cartInstance && typeof cartInstance.closeCart === 'function') {
                    cartInstance.closeCart();
                }
            };
            cartOverlay.addEventListener('click', overlayHandler);
            cartOverlay._cartOverlayHandler = overlayHandler;
        }

        // Botones del footer
        const checkoutBtn = document.getElementById('checkoutBtn');
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        
        if (checkoutBtn) {
            const checkoutHandler = () => {
                if (cartInstance && typeof cartInstance.proceedToCheckout === 'function') {
                    cartInstance.proceedToCheckout();
                }
            };
            checkoutBtn.addEventListener('click', checkoutHandler);
            checkoutBtn._cartCheckoutHandler = checkoutHandler;
        }
        
        if (continueShoppingBtn) {
            const continueHandler = () => {
                if (cartInstance && typeof cartInstance.closeCart === 'function') {
                    cartInstance.closeCart();
                }
            };
            continueShoppingBtn.addEventListener('click', continueHandler);
            continueShoppingBtn._cartContinueHandler = continueHandler;
        }

        // Cerrar con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                const cartSlide = document.getElementById('cartSlide');
                if (cartSlide && cartSlide.classList.contains('active')) {
                    if (cartInstance && typeof cartInstance.closeCart === 'function') {
                        cartInstance.closeCart();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', escHandler);
        document._cartEscHandler = escHandler;
    }
    
    // 5. Limpiar event listeners anteriores
    static removePreviousListeners() {
        const cartButton = document.getElementById('cartButton');
        if (cartButton && cartButton._cartClickHandler) {
            cartButton.removeEventListener('click', cartButton._cartClickHandler);
            delete cartButton._cartClickHandler;
        }
        
        const cartClose = document.getElementById('cartClose');
        if (cartClose && cartClose._cartCloseHandler) {
            cartClose.removeEventListener('click', cartClose._cartCloseHandler);
            delete cartClose._cartCloseHandler;
        }
        
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay && cartOverlay._cartOverlayHandler) {
            cartOverlay.removeEventListener('click', cartOverlay._cartOverlayHandler);
            delete cartOverlay._cartOverlayHandler;
        }
        
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn && checkoutBtn._cartCheckoutHandler) {
            checkoutBtn.removeEventListener('click', checkoutBtn._cartCheckoutHandler);
            delete checkoutBtn._cartCheckoutHandler;
        }
        
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        if (continueShoppingBtn && continueShoppingBtn._cartContinueHandler) {
            continueShoppingBtn.removeEventListener('click', continueShoppingBtn._cartContinueHandler);
            delete continueShoppingBtn._cartContinueHandler;
        }
        
        if (document._cartEscHandler) {
            document.removeEventListener('keydown', document._cartEscHandler);
            delete document._cartEscHandler;
        }
    }
    
    // 6. Método para renderizar items con event listeners seguros
    static renderCartItemsSafe(cartInstance, items) {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;
        
        // Limpiar contenido anterior
        cartItems.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = this.createCartItemElement(item, cartInstance);
            cartItems.appendChild(itemElement);
        });
    }
    
    // 7. Crear elemento de item con event listeners seguros
    static createCartItemElement(item, cartInstance) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.dataset.id = item.id;
        
        // Determinar placeholder correcto
        const placeholder = this.getImagePlaceholder(item.categoria);
        
        itemDiv.innerHTML = `
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
                        <button class="quantity-btn decrease-btn" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                    
                    <span class="cart-item-price">$${this.formatPrice(item.precio * item.quantity)}</span>
                    
                    <button class="cart-item-remove" title="Eliminar producto">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Configurar event listeners seguros
        const decreaseBtn = itemDiv.querySelector('.decrease-btn');
        const increaseBtn = itemDiv.querySelector('.increase-btn');
        const removeBtn = itemDiv.querySelector('.cart-item-remove');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                if (cartInstance && typeof cartInstance.decreaseQuantity === 'function') {
                    cartInstance.decreaseQuantity(item.id);
                }
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                if (cartInstance && typeof cartInstance.increaseQuantity === 'function') {
                    cartInstance.increaseQuantity(item.id);
                }
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (cartInstance && typeof cartInstance.removeItem === 'function') {
                    cartInstance.removeItem(item.id);
                }
            });
        }
        
        return itemDiv;
    }
    
    // 8. Obtener placeholder correcto para imágenes
    static getImagePlaceholder(categoria) {
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        const basePath = isInHtmlFolder ? '../IMAGENES/' : 'IMAGENES/';
        
        switch (categoria) {
            case 'para-ellas':
                return `${basePath}PARA_ELLAS.png`;
            case 'para-ellos':
                return `${basePath}PARA_ELLOS.png`;
            default:
                return `${basePath}placeholder.png`;
        }
    }
    
    // 9. Formatear precio (método utilitario)
    static formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }
    
    // 10. Verificar y corregir inicialización múltiple
    static ensureSingleInstance() {
        if (window._cartInitialized) {
            console.log('✅ Carrito ya inicializado, evitando duplicación');
            return window.shoppingCart;
        }
        
        // Marcar como inicializado
        window._cartInitialized = true;
        
        // Si ya existe una instancia, usarla
        if (window.shoppingCart && typeof window.shoppingCart.init === 'function') {
            console.log('🔄 Reutilizando instancia existente del carrito');
            return window.shoppingCart;
        }
        
        // Crear nueva instancia si no existe
        if (typeof ShoppingCart !== 'undefined') {
            console.log('🛒 Creando nueva instancia única del carrito con correcciones');
            window.shoppingCart = new ShoppingCart();
            return window.shoppingCart;
        }
        
        console.error('❌ Clase ShoppingCart no disponible');
        return null;
    }
}

// Función global corregida para obtener instancia del carrito
window.getShoppingCartInstanceFixed = function() {
    return CartErrorFixer.ensureSingleInstance();
};

// Función para aplicar todas las correcciones
window.applyCartFixes = function() {
    console.group('🔧 APLICANDO CORRECCIONES AL CARRITO');
    
    try {
        // 1. Asegurar instancia única
        const cart = CartErrorFixer.ensureSingleInstance();
        
        if (!cart) {
            console.error('❌ No se pudo obtener instancia del carrito');
            console.groupEnd();
            return false;
        }
        
        // 2. Configurar event listeners seguros
        CartErrorFixer.setupSafeEventListeners(cart);
        
        // 3. Si el carrito tiene items, re-renderizar de forma segura
        if (cart.items && cart.items.length > 0) {
            CartErrorFixer.renderCartItemsSafe(cart, cart.items);
        }
        
        console.log('✅ Correcciones aplicadas exitosamente');
        console.groupEnd();
        return true;
        
    } catch (error) {
        console.error('❌ Error aplicando correcciones:', error);
        console.groupEnd();
        return false;
    }
};

// Auto-aplicar correcciones cuando el script se carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.applyCartFixes);
} else {
    // Si el DOM ya está cargado, aplicar inmediatamente
    setTimeout(window.applyCartFixes, 100);
}

console.log('🔧 Cart Error Fixer cargado - use window.applyCartFixes() para aplicar correcciones');
