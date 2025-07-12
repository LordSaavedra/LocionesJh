// SCRIPT DE PRUEBAS PARA SINCRONIZACIÓN DEL CARRITO
// Este script verifica que el carrito funcione correctamente entre páginas

class CartSyncTester {
    
    constructor() {
        this.testResults = [];
        this.currentPage = window.location.pathname;
        console.log(`🧪 Iniciando pruebas de sincronización desde: ${this.currentPage}`);
    }
    
    // Test principal de sincronización
    async runAllTests() {
        console.group('🧪 INICIANDO PRUEBAS DE SINCRONIZACIÓN DEL CARRITO');
        
        const tests = [
            { name: 'Verificar localStorage disponible', func: () => this.testLocalStorageAvailable() },
            { name: 'Verificar instancia del carrito', func: () => this.testCartInstance() },
            { name: 'Test de guardado y carga', func: () => this.testSaveLoad() },
            { name: 'Test de persistencia entre recargas', func: () => this.testPersistenceAcrossReloads() },
            { name: 'Test de sincronización con múltiples items', func: () => this.testMultipleItemsSync() },
            { name: 'Test de cleanup de datos antiguos', func: () => this.testDataCleanup() },
            { name: 'Test de formato de datos', func: () => this.testDataFormat() }
        ];
        
        for (const test of tests) {
            try {
                console.log(`\n🔍 Ejecutando: ${test.name}`);
                const result = await test.func();
                this.testResults.push({ name: test.name, result, success: true });
                console.log(`✅ ${test.name}: PASÓ`);
            } catch (error) {
                console.error(`❌ ${test.name}: FALLÓ -`, error.message);
                this.testResults.push({ name: test.name, result: error.message, success: false });
            }
        }
        
        this.showTestSummary();
        console.groupEnd();
        
        return this.testResults;
    }
    
    // Test 1: Verificar que localStorage esté disponible
    testLocalStorageAvailable() {
        if (typeof Storage === 'undefined') {
            throw new Error('localStorage no está disponible');
        }
        
        // Test de escritura/lectura
        const testKey = 'cart_sync_test';
        const testValue = 'test_value_' + Date.now();
        
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved !== testValue) {
            throw new Error('localStorage no funciona correctamente');
        }
        
        return 'localStorage funciona correctamente';
    }
    
    // Test 2: Verificar instancia del carrito
    testCartInstance() {
        if (!window.shoppingCart) {
            throw new Error('window.shoppingCart no existe');
        }
        
        if (typeof window.shoppingCart.addItem !== 'function') {
            throw new Error('window.shoppingCart.addItem no es una función');
        }
        
        if (typeof window.shoppingCart.saveToStorage !== 'function') {
            throw new Error('window.shoppingCart.saveToStorage no es una función');
        }
        
        if (typeof window.shoppingCart.loadFromStorage !== 'function') {
            throw new Error('window.shoppingCart.loadFromStorage no es una función');
        }
        
        return 'Instancia del carrito válida con todos los métodos necesarios';
    }
    
    // Test 3: Test de guardado y carga
    testSaveLoad() {
        const originalItems = [...window.shoppingCart.items];
        
        // Crear producto de prueba
        const testProduct = {
            id: 'test_sync_' + Date.now(),
            nombre: 'Producto de Prueba Sync',
            marca: 'Test Brand',
            precio: 99999,
            categoria: 'para-ellas',
            imagen_url: 'test_image.jpg'
        };
        
        // Agregar producto
        window.shoppingCart.addItem(testProduct);
        
        // Verificar que se guardó en localStorage
        const savedData = localStorage.getItem('shopping_cart');
        if (!savedData) {
            throw new Error('No se guardó nada en localStorage');
        }
        
        const parsedData = JSON.parse(savedData);
        const foundItem = parsedData.items.find(item => item.id === testProduct.id);
        
        if (!foundItem) {
            throw new Error('El producto no se guardó correctamente en localStorage');
        }
        
        // Limpiar
        window.shoppingCart.removeItem(testProduct.id);
        
        return `Producto guardado y encontrado en localStorage correctamente`;
    }
    
    // Test 4: Test de persistencia entre recargas simuladas
    testPersistenceAcrossReloads() {
        const testProduct = {
            id: 'test_persist_' + Date.now(),
            nombre: 'Producto Persistencia',
            marca: 'Persist Brand',
            precio: 88888,
            categoria: 'para-ellos',
            imagen_url: 'persist_image.jpg'
        };
        
        // Agregar producto
        window.shoppingCart.addItem(testProduct);
        const itemsBeforeReload = window.shoppingCart.getTotalItems();
        
        // Simular recarga: crear nueva instancia y cargar desde storage
        const newCart = new ShoppingCart();
        
        const itemsAfterReload = newCart.getTotalItems();
        const foundItem = newCart.items.find(item => item.id === testProduct.id);
        
        // Limpiar
        newCart.removeItem(testProduct.id);
        
        if (!foundItem) {
            throw new Error('El producto no persistió después de la simulación de recarga');
        }
        
        return `Persistencia verificada: ${itemsBeforeReload} items antes, ${itemsAfterReload} después`;
    }
    
    // Test 5: Test de sincronización con múltiples items
    testMultipleItemsSync() {
        const testProducts = [
            {
                id: 'sync_multi_1_' + Date.now(),
                nombre: 'Producto Multi 1',
                marca: 'Multi Brand',
                precio: 11111,
                categoria: 'para-ellas'
            },
            {
                id: 'sync_multi_2_' + Date.now(),
                nombre: 'Producto Multi 2', 
                marca: 'Multi Brand',
                precio: 22222,
                categoria: 'para-ellos'
            },
            {
                id: 'sync_multi_3_' + Date.now(),
                nombre: 'Producto Multi 3',
                marca: 'Multi Brand', 
                precio: 33333,
                categoria: 'para-ellas'
            }
        ];
        
        const initialCount = window.shoppingCart.getTotalItems();
        
        // Agregar múltiples productos
        testProducts.forEach(product => {
            window.shoppingCart.addItem(product);
        });
        
        const afterAddCount = window.shoppingCart.getTotalItems();
        
        // Verificar en localStorage
        const savedData = JSON.parse(localStorage.getItem('shopping_cart'));
        const savedCount = savedData.items.length;
        
        // Verificar que todos los productos están guardados
        const allFound = testProducts.every(product => 
            savedData.items.find(item => item.id === product.id)
        );
        
        // Limpiar
        testProducts.forEach(product => {
            window.shoppingCart.removeItem(product.id);
        });
        
        if (!allFound) {
            throw new Error('No todos los productos múltiples se sincronizaron correctamente');
        }
        
        return `${testProducts.length} productos sincronizados correctamente (${initialCount} → ${afterAddCount}, storage: ${savedCount})`;
    }
    
    // Test 6: Test de cleanup de datos antiguos
    testDataCleanup() {
        const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 horas atrás
        
        // Crear datos antiguos
        const expiredData = {
            items: [{ id: 'expired_item', nombre: 'Item Expirado' }],
            timestamp: oldTimestamp,
            expiresIn: 60 * 60 * 1000, // 1 hora
            version: '1.0'
        };
        
        localStorage.setItem('shopping_cart', JSON.stringify(expiredData));
        
        // Crear nueva instancia del carrito (debería limpiar datos expirados)
        const newCart = new ShoppingCart();
        
        // Esperar a que se complete la inicialización
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (newCart.items.length > 0) {
                    reject(new Error('Los datos expirados no se limpiaron automáticamente'));
                } else {
                    resolve('Datos expirados limpiados correctamente');
                }
            }, 500);
        });
    }
    
    // Test 7: Test de formato de datos
    testDataFormat() {
        const testProduct = {
            id: 'test_format_' + Date.now(),
            nombre: 'Producto Formato',
            marca: 'Format Brand',
            precio: 77777,
            categoria: 'para-ellas',
            imagen_url: 'format_image.jpg'
        };
        
        window.shoppingCart.addItem(testProduct);
        
        const savedData = JSON.parse(localStorage.getItem('shopping_cart'));
        
        // Verificar estructura de datos
        const requiredFields = ['items', 'timestamp', 'expiresIn', 'version'];
        const missingFields = requiredFields.filter(field => !(field in savedData));
        
        if (missingFields.length > 0) {
            throw new Error(`Campos faltantes en el formato: ${missingFields.join(', ')}`);
        }
        
        // Verificar que los items tienen los campos necesarios
        const itemRequiredFields = ['id', 'nombre', 'precio', 'quantity'];
        const item = savedData.items.find(item => item.id === testProduct.id);
        
        if (!item) {
            throw new Error('Item no encontrado en datos guardados');
        }
        
        const itemMissingFields = itemRequiredFields.filter(field => !(field in item));
        
        if (itemMissingFields.length > 0) {
            throw new Error(`Campos faltantes en item: ${itemMissingFields.join(', ')}`);
        }
        
        // Limpiar
        window.shoppingCart.removeItem(testProduct.id);
        
        return 'Formato de datos válido con todos los campos requeridos';
    }
    
    // Mostrar resumen de pruebas
    showTestSummary() {
        console.log('\n📊 RESUMEN DE PRUEBAS DE SINCRONIZACIÓN');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(test => test.success).length;
        const failed = this.testResults.filter(test => !test.success).length;
        const total = this.testResults.length;
        
        console.log(`✅ Pruebas pasadas: ${passed}/${total}`);
        console.log(`❌ Pruebas fallidas: ${failed}/${total}`);
        
        if (failed > 0) {
            console.log('\n❌ PRUEBAS FALLIDAS:');
            this.testResults
                .filter(test => !test.success)
                .forEach(test => {
                    console.log(`   • ${test.name}: ${test.result}`);
                });
        }
        
        if (passed === total) {
            console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El carrito está correctamente sincronizado.');
        } else {
            console.log('\n⚠️ Hay problemas de sincronización que necesitan ser corregidos.');
        }
        
        console.log('='.repeat(50));
    }
    
    // Test específico para verificar sincronización entre páginas
    async testCrossPageSync() {
        console.group('🔄 PRUEBA DE SINCRONIZACIÓN ENTRE PÁGINAS');
        
        const testProduct = {
            id: 'cross_page_test_' + Date.now(),
            nombre: 'Producto Cross Page',
            marca: 'Cross Brand',
            precio: 55555,
            categoria: 'para-ellas'
        };
        
        // Agregar producto
        window.shoppingCart.addItem(testProduct);
        console.log('✅ Producto agregado en página actual');
        
        // Verificar que se guardó
        const savedData = localStorage.getItem('shopping_cart');
        if (!savedData) {
            console.error('❌ No se guardó en localStorage');
            console.groupEnd();
            return false;
        }
        
        const parsedData = JSON.parse(savedData);
        const found = parsedData.items.find(item => item.id === testProduct.id);
        
        if (!found) {
            console.error('❌ Producto no encontrado en localStorage');
            console.groupEnd();
            return false;
        }
        
        console.log('✅ Producto verificado en localStorage');
        console.log('📍 Para probar sincronización: navega a otra página y verifica que el producto sigue en el carrito');
        console.log(`🔍 ID del producto de prueba: ${testProduct.id}`);
        
        // Programar limpieza en 30 segundos
        setTimeout(() => {
            if (window.shoppingCart) {
                window.shoppingCart.removeItem(testProduct.id);
                console.log('🧹 Producto de prueba limpiado automáticamente');
            }
        }, 30000);
        
        console.groupEnd();
        return true;
    }
}

// Función global para ejecutar pruebas
window.testCartSync = function() {
    const tester = new CartSyncTester();
    return tester.runAllTests();
};

// Función global para prueba rápida entre páginas
window.testCrossPageSync = function() {
    const tester = new CartSyncTester();
    return tester.testCrossPageSync();
};

// Función para verificar el estado actual del carrito
window.checkCartStatus = function() {
    console.group('📊 ESTADO ACTUAL DEL CARRITO');
    
    if (!window.shoppingCart) {
        console.error('❌ window.shoppingCart no existe');
        console.groupEnd();
        return;
    }
    
    console.log('✅ Instancia del carrito:', window.shoppingCart);
    console.log('📦 Items en memoria:', window.shoppingCart.items.length);
    console.log('🔢 Total items:', window.shoppingCart.getTotalItems());
    console.log('💰 Total precio:', window.shoppingCart.getTotal());
    
    // Verificar localStorage
    const savedData = localStorage.getItem('shopping_cart');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('💾 Items en localStorage:', parsed.items.length);
        console.log('⏰ Timestamp:', new Date(parsed.timestamp).toLocaleString());
        
        if (parsed.items.length !== window.shoppingCart.items.length) {
            console.warn('⚠️ DISCREPANCIA: Memoria y localStorage no coinciden');
        } else {
            console.log('✅ Memoria y localStorage sincronizados');
        }
    } else {
        console.log('📭 No hay datos en localStorage');
    }
    
    console.groupEnd();
};

// Auto-ejecutar una verificación básica al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🧪 CartSyncTester cargado. Usa:');
            console.log('   window.testCartSync() - Ejecutar todas las pruebas');
            console.log('   window.testCrossPageSync() - Prueba entre páginas');
            console.log('   window.checkCartStatus() - Ver estado actual');
        }, 1000);
    });
} else {
    setTimeout(() => {
        console.log('🧪 CartSyncTester cargado. Usa:');
        console.log('   window.testCartSync() - Ejecutar todas las pruebas');
        console.log('   window.testCrossPageSync() - Prueba entre páginas');
        console.log('   window.checkCartStatus() - Ver estado actual');
    }, 100);
}
