// ==========================================
// LIMPIADOR DE PRODUCTOS DE PRUEBA
// ==========================================

(function() {
    'use strict';

    // Función para limpiar productos de prueba
    function limpiarProductosPrueba() {
        if (!window.shoppingCart || !window.shoppingCart.items) {
            console.log('❌ Carrito no disponible para limpieza');
            return false;
        }

        const itemsOriginales = window.shoppingCart.items.length;
        
        // Filtrar productos que parecen ser de prueba
        const productosLimpiados = window.shoppingCart.items.filter(item => {
            const esProductoPrueba = 
                item.id.includes('test') ||
                item.id.includes('verificacion') ||
                item.id.includes('sync-test') ||
                item.id.includes('concurrent-test') ||
                item.id.includes('memory-test') ||
                item.id.includes('timing-test') ||
                item.id.includes('duplicate-test') ||
                item.id.includes('stress') ||
                item.id.includes('quick-test') ||
                item.nombre.includes('Test') ||
                item.nombre.includes('Verificación') ||
                item.nombre.includes('Prueba') ||
                item.marca === 'Test' ||
                item.marca === 'Quick' ||
                item.marca === 'Stress Test' ||
                item.categoria === 'test' ||
                item.categoria === 'stress';
            
            return !esProductoPrueba; // Mantener solo los que NO son de prueba
        });

        if (productosLimpiados.length !== itemsOriginales) {
            window.shoppingCart.items = productosLimpiados;
            window.shoppingCart.saveToStorage();
            window.shoppingCart.updateCartUI();

            const itemsEliminados = itemsOriginales - productosLimpiados.length;
            console.log(`🧹 Se eliminaron ${itemsEliminados} productos de prueba automáticamente`);
            console.log(`📦 Items restantes: ${productosLimpiados.length}`);
            
            return true;
        }

        return false;
    }

    // Ejecutar limpieza cuando el carrito esté listo
    function ejecutarLimpieza() {
        if (window.shoppingCart && window.shoppingCart.isInitialized) {
            limpiarProductosPrueba();
        } else {
            // Esperar hasta que el carrito esté inicializado
            const checkInterval = setInterval(() => {
                if (window.shoppingCart && window.shoppingCart.isInitialized) {
                    clearInterval(checkInterval);
                    limpiarProductosPrueba();
                }
            }, 500);
            
            // Timeout después de 5 segundos
            setTimeout(() => {
                clearInterval(checkInterval);
            }, 5000);
        }
    }

    // Hacer la función disponible globalmente para uso manual
    window.limpiarProductosPrueba = limpiarProductosPrueba;

    // Ejecutar limpieza automática al cargar la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ejecutarLimpieza);
    } else {
        ejecutarLimpieza();
    }

    console.log('🧹 Limpiador de productos de prueba cargado');

})();
