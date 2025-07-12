// ==========================================
// VERIFICADOR RÁPIDO: SINCRONIZACIÓN DEL CARRITO
// ==========================================

(function() {
    'use strict';

    // Crear verificador global
    window.verificarCarrito = function() {
        console.log('\n🔍 VERIFICACIÓN RÁPIDA DEL CARRITO');
        console.log('═'.repeat(50));
        
        const resultados = {
            sistema: false,
            agregar: false,
            sincronizacion: false,
            persistencia: false,
            errores: []
        };

        try {
            // 1. Verificar sistema básico
            console.log('1️⃣ Verificando sistema básico...');
            
            if (!window.shoppingCart) {
                resultados.errores.push('❌ Instancia de carrito no existe');
                return mostrarResultados(resultados);
            }
            
            if (!window.shoppingCart.isInitialized) {
                resultados.errores.push('❌ Carrito no está inicializado');
                return mostrarResultados(resultados);
            }
            
            if (typeof window.shoppingCart.addItem !== 'function') {
                resultados.errores.push('❌ Método addItem no disponible');
                return mostrarResultados(resultados);
            }
            
            resultados.sistema = true;
            console.log('✅ Sistema básico OK');

            // 2. Probar agregar producto
            console.log('2️⃣ Probando agregar producto...');
            
            const productoTest = {
                id: `verificacion-${Date.now()}`,
                nombre: 'Producto Verificación',
                marca: 'Test',
                precio: 99.99,
                categoria: 'test',
                imagen_url: 'test.jpg'
            };

            const itemsAntes = window.shoppingCart.getTotalItems();
            window.shoppingCart.addItem(productoTest);
            const itemsDespues = window.shoppingCart.getTotalItems();
            
            if (itemsDespues > itemsAntes) {
                resultados.agregar = true;
                console.log(`✅ Producto agregado OK (${itemsAntes} → ${itemsDespues})`);
            } else {
                resultados.errores.push('❌ Producto no se agregó correctamente');
                return mostrarResultados(resultados);
            }

            // 3. Verificar sincronización (con delay mínimo)
            setTimeout(() => {
                console.log('3️⃣ Verificando sincronización...');
                
                const itemsMemoria = window.shoppingCart.getTotalItems();
                const itemsStorage = obtenerItemsStorage();
                
                if (itemsMemoria === itemsStorage) {
                    resultados.sincronizacion = true;
                    console.log(`✅ Sincronización OK (memoria: ${itemsMemoria}, storage: ${itemsStorage})`);
                } else {
                    resultados.errores.push(`❌ Desincronización (memoria: ${itemsMemoria}, storage: ${itemsStorage})`);
                }

                // 4. Verificar persistencia
                console.log('4️⃣ Verificando persistencia...');
                
                const datosStorage = localStorage.getItem('shopping_cart');
                if (datosStorage) {
                    try {
                        const parsed = JSON.parse(datosStorage);
                        const tieneItems = Array.isArray(parsed) || (parsed.items && Array.isArray(parsed.items));
                        
                        if (tieneItems) {
                            resultados.persistencia = true;
                            console.log('✅ Persistencia OK');
                        } else {
                            resultados.errores.push('❌ Formato de persistencia inválido');
                        }
                    } catch (error) {
                        resultados.errores.push('❌ Datos de persistencia corruptos');
                    }
                } else {
                    resultados.errores.push('❌ No hay datos persistidos');
                }

                mostrarResultados(resultados);
            }, 100);

        } catch (error) {
            resultados.errores.push(`❌ Error durante verificación: ${error.message}`);
            mostrarResultados(resultados);
        }
    };

    function obtenerItemsStorage() {
        try {
            const data = localStorage.getItem('shopping_cart');
            if (!data) return 0;
            
            const parsed = JSON.parse(data);
            const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
            
            return items.reduce((total, item) => total + (item.quantity || 1), 0);
        } catch (error) {
            return 0;
        }
    }

    function mostrarResultados(resultados) {
        console.log('\n📊 RESULTADOS:');
        console.log('─'.repeat(30));
        
        const checks = [
            { nombre: 'Sistema', estado: resultados.sistema },
            { nombre: 'Agregar', estado: resultados.agregar },
            { nombre: 'Sincronización', estado: resultados.sincronizacion },
            { nombre: 'Persistencia', estado: resultados.persistencia }
        ];

        checks.forEach(check => {
            const icon = check.estado ? '✅' : '❌';
            console.log(`${icon} ${check.nombre}: ${check.estado ? 'OK' : 'FALLO'}`);
        });

        const todoOK = checks.every(check => check.estado);
        
        if (todoOK) {
            console.log('\n🎉 ¡CARRITO FUNCIONANDO PERFECTAMENTE!');
            console.log('✅ Todos los tests pasaron correctamente');
        } else {
            console.log('\n⚠️ Se detectaron problemas:');
            resultados.errores.forEach(error => {
                console.log(`  ${error}`);
            });
        }

        console.log('═'.repeat(50));
        
        return todoOK;
    }

    // Verificación manual solamente - NO auto-ejecutar
    console.log('📝 Para verificar el carrito, usa: verificarCarrito() o checkCart()');

    // Crear método simplificado
    window.checkCart = function() {
        if (window.shoppingCart && window.shoppingCart.isInitialized) {
            const items = window.shoppingCart.getTotalItems();
            const storage = obtenerItemsStorage();
            const synced = items === storage;
            
            console.log(`🛒 Carrito: ${items} items | 💾 Storage: ${storage} items | 🔄 Sync: ${synced ? 'OK' : 'ERROR'}`);
            return synced;
        } else {
            console.log('❌ Carrito no disponible');
            return false;
        }
    };

    // Función para limpiar productos de prueba
    window.limpiarProductosPrueba = function() {
        if (!window.shoppingCart || !window.shoppingCart.items) {
            console.log('❌ Carrito no disponible');
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
                item.marca === 'Test' ||
                item.categoria === 'test';
            
            return !esProductoPrueba; // Mantener solo los que NO son de prueba
        });

        window.shoppingCart.items = productosLimpiados;
        window.shoppingCart.saveToStorage();
        window.shoppingCart.updateCartUI();

        const itemsLimpiados = itemsOriginales - productosLimpiados.length;
        
        if (itemsLimpiados > 0) {
            console.log(`🧹 Se eliminaron ${itemsLimpiados} productos de prueba`);
            console.log(`📦 Items restantes: ${productosLimpiados.length}`);
        } else {
            console.log('✨ No se encontraron productos de prueba para eliminar');
        }

        return itemsLimpiados > 0;
    };

    // Función para limpiar productos de prueba
    window.limpiarProductosPrueba = function() {
        if (!window.shoppingCart || !window.shoppingCart.items) {
            console.log('❌ Carrito no disponible');
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
                item.marca === 'Test' ||
                item.categoria === 'test';
            
            return !esProductoPrueba; // Mantener solo los que NO son de prueba
        });

        window.shoppingCart.items = productosLimpiados;
        window.shoppingCart.saveToStorage();
        window.shoppingCart.updateCartUI();

        const itemsLimpiados = itemsOriginales - productosLimpiados.length;
        
        if (itemsLimpiados > 0) {
            console.log(`🧹 Se eliminaron ${itemsLimpiados} productos de prueba`);
            console.log(`📦 Items restantes: ${productosLimpiados.length}`);
        } else {
            console.log('✨ No se encontraron productos de prueba para eliminar');
        }

        return itemsLimpiados > 0;
    };

    console.log('🔍 Verificador de carrito cargado');
    console.log('📝 Usa verificarCarrito() para test completo o checkCart() para check rápido');
    console.log('🧹 Usa limpiarProductosPrueba() para eliminar productos de test');

})();
