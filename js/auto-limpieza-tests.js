// ==========================================
// AUTO-LIMPIEZA: ELIMINAR PRODUCTOS DE PRUEBA
// ==========================================

(function() {
    'use strict';

    // Función de auto-limpieza que se ejecuta al cargar la página
    function autoLimpiezaProductosPrueba() {
        // Esperar a que el carrito esté inicializado
        const intentarLimpieza = () => {
            if (window.shoppingCart && window.shoppingCart.isInitialized && window.shoppingCart.items) {
                
                const itemsOriginales = window.shoppingCart.items.length;
                
                if (itemsOriginales === 0) {
                    return; // No hay items, no hacer nada
                }
                
                // Filtrar productos que parecen ser de prueba
                const productosReales = window.shoppingCart.items.filter(item => {
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
                        item.marca === 'Adventure' ||
                        item.marca === 'Luxury' ||
                        item.categoria === 'test' ||
                        item.categoria === 'stress';
                    
                    return !esProductoPrueba; // Mantener solo los que NO son de prueba
                });

                const productosEliminados = itemsOriginales - productosReales.length;
                
                if (productosEliminados > 0) {
                    console.log(`🧹 Auto-limpieza: Se eliminaron ${productosEliminados} productos de prueba`);
                    
                    // Actualizar carrito
                    window.shoppingCart.items = productosReales;
                    window.shoppingCart.saveToStorage();
                    window.shoppingCart.updateCartUI();
                    
                    console.log(`✅ Carrito limpio: ${productosReales.length} productos reales restantes`);
                }
            }
        };

        // Intentar limpiar después de que se inicialice el carrito
        if (window.shoppingCart && window.shoppingCart.isInitialized) {
            setTimeout(intentarLimpieza, 500);
        } else {
            // Esperar hasta que se inicialice
            let intentos = 0;
            const maxIntentos = 10;
            
            const intervalo = setInterval(() => {
                intentos++;
                
                if (window.shoppingCart && window.shoppingCart.isInitialized) {
                    clearInterval(intervalo);
                    setTimeout(intentarLimpieza, 500);
                } else if (intentos >= maxIntentos) {
                    clearInterval(intervalo);
                    console.log('⏰ Auto-limpieza: Timeout esperando inicialización del carrito');
                }
            }, 500);
        }
    }

    // Ejecutar auto-limpieza cuando se carga el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoLimpiezaProductosPrueba);
    } else {
        // DOM ya está cargado
        autoLimpiezaProductosPrueba();
    }

    console.log('🧹 Auto-limpieza de productos de prueba activada');

})();
