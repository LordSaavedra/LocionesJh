// ==========================================
// ANALIZADOR DE FLUJO: AGREGAR PRODUCTO AL CARRITO
// ==========================================

class CartAddProductAnalyzer {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
        
        console.log('🔬 CartAddProductAnalyzer inicializado');
    }

    // Analizar el flujo completo de agregar producto
    async analyzeAddProductFlow() {
        console.log('🚀 Iniciando análisis del flujo de agregar producto...');
        
        const analysis = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };

        try {
            // Test 1: Verificar disponibilidad del sistema
            const systemTest = await this.testSystemAvailability();
            analysis.tests.push(systemTest);

            // Test 2: Verificar estado inicial del carrito
            const initialStateTest = await this.testInitialCartState();
            analysis.tests.push(initialStateTest);

            // Test 3: Agregar producto y verificar memoria
            const memoryTest = await this.testAddProductToMemory();
            analysis.tests.push(memoryTest);

            // Test 4: Verificar persistencia en localStorage
            const storageTest = await this.testStoragePersistence();
            analysis.tests.push(storageTest);

            // Test 5: Verificar sincronización entre componentes
            const syncTest = await this.testComponentSynchronization();
            analysis.tests.push(syncTest);

            // Test 6: Verificar manejo de duplicados
            const duplicateTest = await this.testDuplicateHandling();
            analysis.tests.push(duplicateTest);

            // Test 7: Verificar persistencia entre recargas
            const persistenceTest = await this.testReloadPersistence();
            analysis.tests.push(persistenceTest);

            // Calcular resumen
            analysis.tests.forEach(test => {
                if (test.passed) {
                    analysis.summary.passed++;
                } else {
                    analysis.summary.failed++;
                }
                analysis.summary.warnings += test.warnings ? test.warnings.length : 0;
            });

            // Generar reporte
            this.generateReport(analysis);
            
            return analysis;

        } catch (error) {
            console.error('❌ Error durante el análisis:', error);
            analysis.tests.push({
                name: 'Análisis Global',
                passed: false,
                error: error.message,
                details: 'Error crítico durante el análisis'
            });
            
            return analysis;
        }
    }

    // Test 1: Verificar disponibilidad del sistema
    async testSystemAvailability() {
        console.log('🔍 Test 1: Verificando disponibilidad del sistema...');
        
        const test = {
            name: 'Disponibilidad del Sistema',
            passed: true,
            checks: [],
            warnings: []
        };

        // Verificar existencia del carrito
        const cartExists = !!window.shoppingCart;
        test.checks.push({
            description: 'Instancia de carrito existe',
            result: cartExists,
            value: cartExists
        });

        // Verificar inicialización
        const cartInitialized = cartExists && window.shoppingCart.isInitialized;
        test.checks.push({
            description: 'Carrito está inicializado',
            result: cartInitialized,
            value: cartInitialized
        });

        // Verificar método addItem
        const hasAddItem = cartExists && typeof window.shoppingCart.addItem === 'function';
        test.checks.push({
            description: 'Método addItem disponible',
            result: hasAddItem,
            value: hasAddItem
        });

        // Verificar singleton
        const singletonExists = typeof window.getShoppingCartInstance === 'function';
        test.checks.push({
            description: 'Función singleton disponible',
            result: singletonExists,
            value: singletonExists
        });

        // Verificar error fixes
        const errorFixerExists = typeof CartErrorFixer !== 'undefined';
        test.checks.push({
            description: 'CartErrorFixer disponible',
            result: errorFixerExists,
            value: errorFixerExists
        });

        // Determinar si pasó el test
        test.passed = test.checks.every(check => check.result);

        if (!test.passed) {
            const failedChecks = test.checks.filter(check => !check.result);
            test.details = `Fallos: ${failedChecks.map(c => c.description).join(', ')}`;
        }

        console.log(`✅ Test 1 ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
        return test;
    }

    // Test 2: Verificar estado inicial del carrito
    async testInitialCartState() {
        console.log('🔍 Test 2: Verificando estado inicial...');
        
        const test = {
            name: 'Estado Inicial del Carrito',
            passed: true,
            checks: [],
            warnings: []
        };

        try {
            // Obtener estado inicial
            const initialMemoryItems = window.shoppingCart ? window.shoppingCart.getTotalItems() : 0;
            const initialStorageItems = this.getStorageItemCount();

            test.checks.push({
                description: 'Items en memoria al inicio',
                result: true,
                value: initialMemoryItems
            });

            test.checks.push({
                description: 'Items en storage al inicio',
                result: true,
                value: initialStorageItems
            });

            // Verificar sincronización inicial
            const initialSync = initialMemoryItems === initialStorageItems;
            test.checks.push({
                description: 'Sincronización inicial memoria-storage',
                result: initialSync,
                value: `${initialMemoryItems} === ${initialStorageItems}`
            });

            if (!initialSync) {
                test.warnings.push('Carrito inicia con desincronización entre memoria y storage');
            }

            test.initialState = {
                memoryItems: initialMemoryItems,
                storageItems: initialStorageItems,
                synced: initialSync
            };

        } catch (error) {
            test.passed = false;
            test.error = error.message;
            test.details = 'Error verificando estado inicial';
        }

        console.log(`✅ Test 2 ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
        return test;
    }

    // Test 3: Agregar producto y verificar memoria
    async testAddProductToMemory() {
        console.log('🔍 Test 3: Agregando producto y verificando memoria...');
        
        const test = {
            name: 'Agregar Producto a Memoria',
            passed: true,
            checks: [],
            warnings: []
        };

        try {
            // Crear producto de prueba
            const testProduct = {
                id: `test-${Date.now()}`,
                nombre: 'Producto Test Memoria',
                marca: 'Test Brand',
                precio: 29.99,
                categoria: 'test',
                imagen_url: 'test.jpg'
            };

            // Obtener estado previo
            const prevMemoryItems = window.shoppingCart.getTotalItems();
            const prevMemoryIds = window.shoppingCart.items.map(item => item.id);

            // Agregar producto
            window.shoppingCart.addItem(testProduct);

            // Verificar inmediatamente
            const newMemoryItems = window.shoppingCart.getTotalItems();
            const newMemoryIds = window.shoppingCart.items.map(item => item.id);

            test.checks.push({
                description: 'Incremento en cantidad de items',
                result: newMemoryItems > prevMemoryItems,
                value: `${prevMemoryItems} → ${newMemoryItems}`
            });

            test.checks.push({
                description: 'Producto encontrado en memoria',
                result: newMemoryIds.includes(testProduct.id),
                value: `ID ${testProduct.id} en ${newMemoryIds.length} items`
            });

            // Verificar estructura del producto
            const foundProduct = window.shoppingCart.items.find(item => item.id === testProduct.id);
            if (foundProduct) {
                test.checks.push({
                    description: 'Producto tiene estructura correcta',
                    result: foundProduct.nombre && foundProduct.precio && foundProduct.quantity,
                    value: `nombre: ${!!foundProduct.nombre}, precio: ${!!foundProduct.precio}, quantity: ${foundProduct.quantity}`
                });
            }

            test.productAdded = {
                id: testProduct.id,
                found: !!foundProduct,
                quantity: foundProduct ? foundProduct.quantity : 0
            };

            // Determinar si pasó
            test.passed = test.checks.every(check => check.result);

        } catch (error) {
            test.passed = false;
            test.error = error.message;
            test.details = 'Error agregando producto a memoria';
        }

        console.log(`✅ Test 3 ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
        return test;
    }

    // Test 4: Verificar persistencia en localStorage
    async testStoragePersistence() {
        console.log('🔍 Test 4: Verificando persistencia en storage...');
        
        const test = {
            name: 'Persistencia en Storage',
            passed: true,
            checks: [],
            warnings: []
        };

        try {
            // Esperar un poco para que se guarde
            await this.delay(300);

            // Verificar que hay datos en localStorage
            const storageData = localStorage.getItem('shopping_cart');
            test.checks.push({
                description: 'Datos existen en localStorage',
                result: !!storageData,
                value: !!storageData
            });

            if (storageData) {
                try {
                    const parsedData = JSON.parse(storageData);
                    
                    test.checks.push({
                        description: 'Datos son JSON válido',
                        result: true,
                        value: 'JSON válido'
                    });

                    // Verificar formato
                    const hasItems = Array.isArray(parsedData) || (parsedData.items && Array.isArray(parsedData.items));
                    test.checks.push({
                        description: 'Formato de datos correcto',
                        result: hasItems,
                        value: Array.isArray(parsedData) ? 'array' : 'objeto con items'
                    });

                    // Verificar cantidad
                    const storageItems = this.getStorageItemCount();
                    const memoryItems = window.shoppingCart.getTotalItems();
                    
                    test.checks.push({
                        description: 'Cantidad sincronizada con memoria',
                        result: storageItems === memoryItems,
                        value: `storage: ${storageItems}, memoria: ${memoryItems}`
                    });

                    // Verificar timestamp si existe
                    if (parsedData.timestamp) {
                        const age = Date.now() - parsedData.timestamp;
                        test.checks.push({
                            description: 'Timestamp reciente',
                            result: age < 5000, // 5 segundos
                            value: `${age}ms de antigüedad`
                        });
                    }

                } catch (parseError) {
                    test.checks.push({
                        description: 'Datos son JSON válido',
                        result: false,
                        value: `Error: ${parseError.message}`
                    });
                }
            }

            test.passed = test.checks.every(check => check.result);

        } catch (error) {
            test.passed = false;
            test.error = error.message;
            test.details = 'Error verificando persistencia en storage';
        }

        console.log(`✅ Test 4 ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
        return test;
    }

    // Test 5: Verificar sincronización entre componentes
    async testComponentSynchronization() {
        console.log('🔍 Test 5: Verificando sincronización de componentes...');
        
        const test = {
            name: 'Sincronización de Componentes',
            passed: true,
            checks: [],
            warnings: []
        };

        try {
            // Obtener estado de todos los componentes
            const memoryItems = window.shoppingCart ? window.shoppingCart.getTotalItems() : 0;
            const storageItems = this.getStorageItemCount();
            
            let singletonItems = 0;
            try {
                if (window.getShoppingCartInstance) {
                    const singletonCart = window.getShoppingCartInstance();
                    singletonItems = singletonCart ? singletonCart.getTotalItems() : 0;
                }
            } catch (singletonError) {
                test.warnings.push(`Error accediendo singleton: ${singletonError.message}`);
            }

            // Verificar sincronización memoria-storage
            test.checks.push({
                description: 'Sincronización memoria-storage',
                result: memoryItems === storageItems,
                value: `memoria: ${memoryItems}, storage: ${storageItems}`
            });

            // Verificar sincronización memoria-singleton
            test.checks.push({
                description: 'Sincronización memoria-singleton',
                result: memoryItems === singletonItems,
                value: `memoria: ${memoryItems}, singleton: ${singletonItems}`
            });

            // Verificar que todos estén sincronizados
            const allSynced = memoryItems === storageItems && memoryItems === singletonItems;
            test.checks.push({
                description: 'Todos los componentes sincronizados',
                result: allSynced,
                value: `memoria: ${memoryItems}, storage: ${storageItems}, singleton: ${singletonItems}`
            });

            // Verificar identidad del singleton
            if (window.shoppingCart && window.getShoppingCartInstance) {
                const sameInstance = window.shoppingCart === window.getShoppingCartInstance();
                test.checks.push({
                    description: 'Singleton retorna misma instancia',
                    result: sameInstance,
                    value: sameInstance
                });
            }

            test.passed = test.checks.every(check => check.result);
            test.syncState = { memoryItems, storageItems, singletonItems, allSynced };

        } catch (error) {
            test.passed = false;
            test.error = error.message;
            test.details = 'Error verificando sincronización';
        }

        console.log(`✅ Test 5 ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
        return test;
    }

    // Test 6: Verificar manejo de duplicados
    async testDuplicateHandling() {
        console.log('🔍 Test 6: Verificando manejo de duplicados...');
        
        const test = {
            name: 'Manejo de Productos Duplicados',
            passed: true,
            checks: [],
            warnings: []
        };

        try {
            // Crear producto duplicado
            const duplicateProduct = {
                id: 'duplicate-test',
                nombre: 'Producto Duplicado',
                marca: 'Test',
                precio: 15.99,
                categoria: 'test',
                imagen_url: 'duplicate.jpg'
            };

            // Agregar primera vez
            const prevItems = window.shoppingCart.getTotalItems();
            window.shoppingCart.addItem(duplicateProduct);
            
            await this.delay(100);
            const afterFirst = window.shoppingCart.getTotalItems();
            
            // Agregar segunda vez (duplicado)
            window.shoppingCart.addItem(duplicateProduct);
            
            await this.delay(100);
            const afterSecond = window.shoppingCart.getTotalItems();

            // Verificar que se agregó la primera vez
            test.checks.push({
                description: 'Primera adición incrementa items',
                result: afterFirst > prevItems,
                value: `${prevItems} → ${afterFirst}`
            });

            // Verificar que la segunda vez NO incrementó items (solo quantity)
            test.checks.push({
                description: 'Duplicado no crea nuevo item',
                result: afterSecond === afterFirst,
                value: `después de duplicado: ${afterSecond}`
            });

            // Verificar que la cantidad incrementó
            const foundProduct = window.shoppingCart.items.find(item => item.id === duplicateProduct.id);
            if (foundProduct) {
                test.checks.push({
                    description: 'Cantidad del producto incrementó',
                    result: foundProduct.quantity >= 2,
                    value: `quantity: ${foundProduct.quantity}`
                });
            }

            test.passed = test.checks.every(check => check.result);

        } catch (error) {
            test.passed = false;
            test.error = error.message;
            test.details = 'Error verificando manejo de duplicados';
        }

        console.log(`✅ Test 6 ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
        return test;
    }

    // Test 7: Verificar persistencia entre recargas
    async testReloadPersistence() {
        console.log('🔍 Test 7: Verificando persistencia entre recargas...');
        
        const test = {
            name: 'Persistencia entre Recargas',
            passed: true,
            checks: [],
            warnings: []
        };

        try {
            // Guardar estado actual
            const currentItems = window.shoppingCart.getTotalItems();
            const currentIds = window.shoppingCart.items.map(item => item.id);

            // Verificar que hay datos para persistir
            test.checks.push({
                description: 'Hay datos para persistir',
                result: currentItems > 0,
                value: `${currentItems} items`
            });

            // Verificar formato de datos en storage
            const storageData = localStorage.getItem('shopping_cart');
            if (storageData) {
                try {
                    const parsed = JSON.parse(storageData);
                    const hasExpiration = parsed.timestamp && parsed.expiresIn;
                    
                    test.checks.push({
                        description: 'Datos tienen timestamp de expiración',
                        result: hasExpiration,
                        value: hasExpiration ? 'con expiración' : 'sin expiración'
                    });

                    if (hasExpiration) {
                        const timeLeft = (parsed.timestamp + parsed.expiresIn) - Date.now();
                        test.checks.push({
                            description: 'Datos no han expirado',
                            result: timeLeft > 0,
                            value: `${Math.round(timeLeft / 1000)}s restantes`
                        });
                    }

                } catch (parseError) {
                    test.warnings.push(`Error parseando datos de storage: ${parseError.message}`);
                }
            }

            // Simular reinicialización (crear nueva instancia)
            try {
                const testCart = new ShoppingCart();
                await testCart.init();
                
                await this.delay(200);
                
                const reloadedItems = testCart.getTotalItems();
                const reloadedIds = testCart.items.map(item => item.id);

                test.checks.push({
                    description: 'Items se recuperaron tras reinicialización',
                    result: reloadedItems === currentItems,
                    value: `original: ${currentItems}, recuperado: ${reloadedItems}`
                });

                // Verificar que los IDs coinciden
                const idsMatch = currentIds.every(id => reloadedIds.includes(id));
                test.checks.push({
                    description: 'IDs de productos coinciden',
                    result: idsMatch,
                    value: `${currentIds.length} IDs verificados`
                });

            } catch (initError) {
                test.warnings.push(`Error simulando reinicialización: ${initError.message}`);
            }

            test.passed = test.checks.every(check => check.result);

        } catch (error) {
            test.passed = false;
            test.error = error.message;
            test.details = 'Error verificando persistencia entre recargas';
        }

        console.log(`✅ Test 7 ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
        return test;
    }

    // Generar reporte de análisis
    generateReport(analysis) {
        console.log('\n' + '='.repeat(50));
        console.log('📊 REPORTE DE ANÁLISIS: AGREGAR PRODUCTO AL CARRITO');
        console.log('='.repeat(50));
        
        console.log(`🕐 Timestamp: ${analysis.timestamp}`);
        console.log(`📈 Resumen: ${analysis.summary.passed} pasaron, ${analysis.summary.failed} fallaron, ${analysis.summary.warnings} advertencias`);
        
        console.log('\n📋 Detalles de Tests:');
        analysis.tests.forEach((test, index) => {
            const status = test.passed ? '✅' : '❌';
            console.log(`${status} Test ${index + 1}: ${test.name}`);
            
            if (test.checks) {
                test.checks.forEach(check => {
                    const checkStatus = check.result ? '  ✓' : '  ✗';
                    console.log(`${checkStatus} ${check.description}: ${check.value}`);
                });
            }
            
            if (test.warnings && test.warnings.length > 0) {
                test.warnings.forEach(warning => {
                    console.log(`  ⚠️ ${warning}`);
                });
            }
            
            if (test.error) {
                console.log(`  ❌ Error: ${test.error}`);
            }
            
            console.log('');
        });

        // Recomendaciones
        console.log('💡 Recomendaciones:');
        if (analysis.summary.failed === 0) {
            console.log('✅ El sistema de agregar productos funciona correctamente');
        } else {
            console.log('❌ Se detectaron problemas que requieren atención:');
            
            analysis.tests.forEach(test => {
                if (!test.passed) {
                    console.log(`  - ${test.name}: ${test.details || test.error}`);
                }
            });
        }
        
        console.log('='.repeat(50) + '\n');
    }

    // Utilities
    getStorageItemCount() {
        try {
            const data = localStorage.getItem('shopping_cart');
            if (!data) return 0;
            
            const parsed = JSON.parse(data);
            const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
            
            return items.reduce((total, item) => total + (item.quantity || 1), 0);
        } catch (error) {
            console.warn('Error obteniendo items de storage:', error);
            return 0;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Funciones globales para uso en tests
window.CartAddProductAnalyzer = CartAddProductAnalyzer;

window.analyzeAddProductFlow = async function() {
    const analyzer = new CartAddProductAnalyzer();
    return await analyzer.analyzeAddProductFlow();
};

window.quickAddTest = function() {
    console.log('🚀 Iniciando test rápido de agregar producto...');
    
    if (!window.shoppingCart || !window.shoppingCart.isInitialized) {
        console.error('❌ Carrito no disponible');
        return false;
    }

    const testProduct = {
        id: `quick-test-${Date.now()}`,
        nombre: 'Test Rápido',
        marca: 'Quick',
        precio: 9.99,
        categoria: 'test'
    };

    const prevItems = window.shoppingCart.getTotalItems();
    window.shoppingCart.addItem(testProduct);
    
    setTimeout(() => {
        const newItems = window.shoppingCart.getTotalItems();
        const success = newItems > prevItems;
        
        console.log(`${success ? '✅' : '❌'} Test rápido: ${prevItems} → ${newItems} items`);
        
        if (success) {
            console.log('✅ Producto agregado exitosamente');
        } else {
            console.log('❌ Producto no se agregó correctamente');
        }
        
        return success;
    }, 200);
};

console.log('🔬 CartAddProductAnalyzer cargado. Usa analyzeAddProductFlow() o quickAddTest()');
