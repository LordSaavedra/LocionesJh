// ==========================================
// DETECTOR DE PROBLEMAS: SINCRONIZACIÓN AL AGREGAR PRODUCTOS
// ==========================================

class CartSyncProblemDetector {
    constructor() {
        this.problems = [];
        this.warnings = [];
        this.fixes = [];
        this.testData = [];
        
        console.log('🔍 CartSyncProblemDetector inicializado');
    }

    // Detectar todos los problemas relacionados con agregar productos
    async detectAllProblems() {
        console.log('🚀 Iniciando detección completa de problemas...');
        
        const analysis = {
            timestamp: new Date().toISOString(),
            problems: [],
            warnings: [],
            fixes: [],
            recommendations: [],
            testResults: []
        };

        try {
            // 1. Verificar problemas de inicialización
            await this.detectInitializationProblems(analysis);

            // 2. Verificar problemas de sincronización inmediata
            await this.detectImmediateSyncProblems(analysis);

            // 3. Verificar problemas de persistencia
            await this.detectPersistenceProblems(analysis);

            // 4. Verificar problemas de concurrencia
            await this.detectConcurrencyProblems(analysis);

            // 5. Verificar problemas de memoria/storage
            await this.detectMemoryStorageProblems(analysis);

            // 6. Verificar problemas de formato de datos
            await this.detectDataFormatProblems(analysis);

            // 7. Verificar problemas de timing
            await this.detectTimingProblems(analysis);

            // Generar reporte y recomendaciones
            this.generateProblemReport(analysis);
            
            return analysis;

        } catch (error) {
            console.error('❌ Error durante detección de problemas:', error);
            analysis.problems.push({
                type: 'critical',
                category: 'system',
                description: 'Error crítico durante análisis',
                error: error.message,
                impact: 'high'
            });
            
            return analysis;
        }
    }

    // 1. Detectar problemas de inicialización
    async detectInitializationProblems(analysis) {
        console.log('🔍 Detectando problemas de inicialización...');

        try {
            // Verificar existencia del carrito
            if (!window.shoppingCart) {
                analysis.problems.push({
                    type: 'error',
                    category: 'initialization',
                    description: 'Instancia de carrito no existe',
                    impact: 'critical',
                    fix: 'Verificar que cart.js se carga correctamente'
                });
                return;
            }

            // Verificar inicialización
            if (!window.shoppingCart.isInitialized) {
                analysis.problems.push({
                    type: 'error',
                    category: 'initialization', 
                    description: 'Carrito no está inicializado',
                    impact: 'high',
                    fix: 'Llamar a init() o verificar proceso de inicialización'
                });
            }

            // Verificar método addItem
            if (typeof window.shoppingCart.addItem !== 'function') {
                analysis.problems.push({
                    type: 'error',
                    category: 'initialization',
                    description: 'Método addItem no disponible',
                    impact: 'critical',
                    fix: 'Verificar que la clase ShoppingCart está correctamente definida'
                });
            }

            // Verificar singleton
            if (typeof window.getShoppingCartInstance !== 'function') {
                analysis.warnings.push({
                    type: 'warning',
                    category: 'initialization',
                    description: 'Función singleton no disponible',
                    impact: 'medium',
                    recommendation: 'Implementar patrón singleton para mejor gestión'
                });
            }

            // Verificar doble inicialización
            const cartElements = document.querySelectorAll('#cartSlide, #cartOverlay');
            if (cartElements.length > 2) {
                analysis.problems.push({
                    type: 'error',
                    category: 'initialization',
                    description: 'Múltiples elementos de carrito detectados',
                    impact: 'medium',
                    fix: 'Implementar verificación de elementos existentes antes de crear'
                });
            }

        } catch (error) {
            analysis.problems.push({
                type: 'error',
                category: 'initialization',
                description: 'Error verificando inicialización',
                error: error.message,
                impact: 'high'
            });
        }
    }

    // 2. Detectar problemas de sincronización inmediata
    async detectImmediateSyncProblems(analysis) {
        console.log('🔍 Detectando problemas de sincronización inmediata...');

        try {
            // Agregar producto de prueba
            const testProduct = {
                id: `sync-test-${Date.now()}`,
                nombre: 'Test Sync',
                marca: 'Test',
                precio: 19.99,
                categoria: 'test'
            };

            const prevMemory = window.shoppingCart.getTotalItems();
            const prevStorage = this.getStorageItemCount();

            // Agregar producto
            window.shoppingCart.addItem(testProduct);

            // Verificar inmediatamente (sin delay)
            const immediateMemory = window.shoppingCart.getTotalItems();
            const immediateStorage = this.getStorageItemCount();

            // Verificar con delay corto
            await this.delay(50);
            const delayMemory = window.shoppingCart.getTotalItems();
            const delayStorage = this.getStorageItemCount();

            // Verificar con delay más largo
            await this.delay(200);
            const finalMemory = window.shoppingCart.getTotalItems();
            const finalStorage = this.getStorageItemCount();

            // Analizar resultados
            if (immediateMemory === prevMemory) {
                analysis.problems.push({
                    type: 'error',
                    category: 'sync',
                    description: 'Producto no se agrega inmediatamente a memoria',
                    impact: 'high',
                    data: { prevMemory, immediateMemory }
                });
            }

            if (immediateStorage === prevStorage && delayStorage === prevStorage) {
                analysis.problems.push({
                    type: 'error',
                    category: 'sync',
                    description: 'Producto no se persiste en storage',
                    impact: 'high',
                    data: { prevStorage, immediateStorage, delayStorage }
                });
            }

            if (finalMemory !== finalStorage) {
                analysis.problems.push({
                    type: 'error',
                    category: 'sync',
                    description: 'Desincronización entre memoria y storage',
                    impact: 'medium',
                    data: { finalMemory, finalStorage }
                });
            }

            // Verificar sincronización con singleton
            if (window.getShoppingCartInstance) {
                const singletonCart = window.getShoppingCartInstance();
                const singletonItems = singletonCart.getTotalItems();
                
                if (singletonItems !== finalMemory) {
                    analysis.problems.push({
                        type: 'error',
                        category: 'sync',
                        description: 'Desincronización con singleton',
                        impact: 'medium',
                        data: { memory: finalMemory, singleton: singletonItems }
                    });
                }
            }

            analysis.testResults.push({
                test: 'immediate_sync',
                product: testProduct.id,
                results: {
                    prevMemory, immediateMemory, delayMemory, finalMemory,
                    prevStorage, immediateStorage, delayStorage, finalStorage
                }
            });

        } catch (error) {
            analysis.problems.push({
                type: 'error',
                category: 'sync',
                description: 'Error durante test de sincronización inmediata',
                error: error.message,
                impact: 'high'
            });
        }
    }

    // 3. Detectar problemas de persistencia
    async detectPersistenceProblems(analysis) {
        console.log('🔍 Detectando problemas de persistencia...');

        try {
            // Verificar formato de datos en localStorage
            const storageData = localStorage.getItem('shopping_cart');
            
            if (!storageData) {
                analysis.warnings.push({
                    type: 'warning',
                    category: 'persistence',
                    description: 'No hay datos en localStorage',
                    impact: 'medium'
                });
                return;
            }

            try {
                const parsed = JSON.parse(storageData);
                
                // Verificar formato válido
                const isOldFormat = Array.isArray(parsed);
                const isNewFormat = parsed.items && Array.isArray(parsed.items);
                
                if (!isOldFormat && !isNewFormat) {
                    analysis.problems.push({
                        type: 'error',
                        category: 'persistence',
                        description: 'Formato de datos inválido en localStorage',
                        impact: 'high',
                        data: { format: typeof parsed }
                    });
                }

                // Verificar timestamp si está en formato nuevo
                if (isNewFormat) {
                    if (!parsed.timestamp) {
                        analysis.warnings.push({
                            type: 'warning',
                            category: 'persistence',
                            description: 'Datos sin timestamp',
                            impact: 'low'
                        });
                    } else {
                        const age = Date.now() - parsed.timestamp;
                        if (age > 60 * 60 * 1000) { // 1 hora
                            analysis.warnings.push({
                                type: 'warning',
                                category: 'persistence',
                                description: 'Datos antiguos en localStorage',
                                impact: 'low',
                                data: { ageHours: Math.round(age / (60 * 60 * 1000)) }
                            });
                        }
                    }
                }

                // Verificar tamaño de datos
                const dataSize = new Blob([storageData]).size;
                if (dataSize > 1024 * 1024) { // 1MB
                    analysis.warnings.push({
                        type: 'warning',
                        category: 'persistence',
                        description: 'Datos de carrito muy grandes',
                        impact: 'medium',
                        data: { sizeMB: (dataSize / (1024 * 1024)).toFixed(2) }
                    });
                }

            } catch (parseError) {
                analysis.problems.push({
                    type: 'error',
                    category: 'persistence',
                    description: 'Datos corruptos en localStorage',
                    error: parseError.message,
                    impact: 'high'
                });
            }

        } catch (error) {
            analysis.problems.push({
                type: 'error',
                category: 'persistence',
                description: 'Error verificando persistencia',
                error: error.message,
                impact: 'medium'
            });
        }
    }

    // 4. Detectar problemas de concurrencia
    async detectConcurrencyProblems(analysis) {
        console.log('🔍 Detectando problemas de concurrencia...');

        try {
            // Simular múltiples adiciones rápidas
            const testProducts = [];
            const promises = [];

            for (let i = 0; i < 5; i++) {
                const product = {
                    id: `concurrent-test-${i}-${Date.now()}`,
                    nombre: `Concurrent Test ${i}`,
                    marca: 'Test',
                    precio: 10 + i,
                    categoria: 'test'
                };
                
                testProducts.push(product);
            }

            const initialItems = window.shoppingCart.getTotalItems();

            // Agregar productos concurrentemente
            testProducts.forEach(product => {
                promises.push(
                    new Promise(resolve => {
                        try {
                            window.shoppingCart.addItem(product);
                            resolve({ success: true, id: product.id });
                        } catch (error) {
                            resolve({ success: false, id: product.id, error: error.message });
                        }
                    })
                );
            });

            const results = await Promise.all(promises);
            
            // Esperar a que se procesen
            await this.delay(300);
            
            const finalItems = window.shoppingCart.getTotalItems();
            const expectedItems = initialItems + testProducts.length;

            // Verificar que todos se agregaron
            if (finalItems !== expectedItems) {
                analysis.problems.push({
                    type: 'error',
                    category: 'concurrency',
                    description: 'Pérdida de productos en adición concurrente',
                    impact: 'medium',
                    data: { 
                        expected: expectedItems, 
                        actual: finalItems, 
                        lost: expectedItems - finalItems 
                    }
                });
            }

            // Verificar errores individuales
            const failedResults = results.filter(r => !r.success);
            if (failedResults.length > 0) {
                analysis.problems.push({
                    type: 'error',
                    category: 'concurrency',
                    description: 'Errores en adiciones concurrentes',
                    impact: 'medium',
                    data: { failures: failedResults }
                });
            }

            analysis.testResults.push({
                test: 'concurrency',
                products: testProducts.length,
                results: { initialItems, finalItems, expectedItems, failures: failedResults.length }
            });

        } catch (error) {
            analysis.problems.push({
                type: 'error',
                category: 'concurrency',
                description: 'Error durante test de concurrencia',
                error: error.message,
                impact: 'medium'
            });
        }
    }

    // 5. Detectar problemas de memoria/storage
    async detectMemoryStorageProblems(analysis) {
        console.log('🔍 Detectando problemas de memoria/storage...');

        try {
            // Verificar leak de memoria
            const initialMemory = window.shoppingCart.items.length;
            const productsBefore = window.shoppingCart.items.map(item => ({ id: item.id, quantity: item.quantity }));

            // Agregar y remover productos
            const testProduct = {
                id: `memory-test-${Date.now()}`,
                nombre: 'Memory Test',
                marca: 'Test',
                precio: 25.99,
                categoria: 'test'
            };

            window.shoppingCart.addItem(testProduct);
            await this.delay(100);
            
            window.shoppingCart.removeItem(testProduct.id);
            await this.delay(100);

            const finalMemory = window.shoppingCart.items.length;
            const productsAfter = window.shoppingCart.items.map(item => ({ id: item.id, quantity: item.quantity }));

            // Verificar que no hay leak
            if (finalMemory !== initialMemory) {
                analysis.warnings.push({
                    type: 'warning',
                    category: 'memory',
                    description: 'Posible leak de memoria después de remover producto',
                    impact: 'low',
                    data: { before: initialMemory, after: finalMemory }
                });
            }

            // Verificar que productos no se modificaron accidentalmente
            const productsChanged = !this.arraysEqual(productsBefore, productsAfter);
            if (productsChanged) {
                analysis.warnings.push({
                    type: 'warning',
                    category: 'memory',
                    description: 'Productos existentes modificados durante operación',
                    impact: 'medium',
                    data: { before: productsBefore, after: productsAfter }
                });
            }

            // Verificar tamaño en storage
            const storageSize = this.getStorageSize();
            if (storageSize > 500000) { // 500KB
                analysis.warnings.push({
                    type: 'warning',
                    category: 'storage',
                    description: 'Carrito ocupa mucho espacio en localStorage',
                    impact: 'medium',
                    data: { sizeKB: Math.round(storageSize / 1024) }
                });
            }

        } catch (error) {
            analysis.problems.push({
                type: 'error',
                category: 'memory',
                description: 'Error verificando memoria/storage',
                error: error.message,
                impact: 'medium'
            });
        }
    }

    // 6. Detectar problemas de formato de datos
    async detectDataFormatProblems(analysis) {
        console.log('🔍 Detectando problemas de formato de datos...');

        try {
            // Verificar estructura de productos en memoria
            const items = window.shoppingCart.items;
            
            items.forEach((item, index) => {
                // Verificar campos requeridos
                const requiredFields = ['id', 'nombre', 'precio', 'quantity'];
                const missingFields = requiredFields.filter(field => !item.hasOwnProperty(field));
                
                if (missingFields.length > 0) {
                    analysis.problems.push({
                        type: 'error',
                        category: 'data_format',
                        description: `Producto ${index} tiene campos faltantes`,
                        impact: 'high',
                        data: { productId: item.id, missingFields }
                    });
                }

                // Verificar tipos de datos
                if (typeof item.id !== 'string' && typeof item.id !== 'number') {
                    analysis.problems.push({
                        type: 'error',
                        category: 'data_format',
                        description: `Producto ${index} tiene ID inválido`,
                        impact: 'high',
                        data: { productId: item.id, type: typeof item.id }
                    });
                }

                if (typeof item.precio !== 'number' || item.precio <= 0) {
                    analysis.problems.push({
                        type: 'error',
                        category: 'data_format',
                        description: `Producto ${index} tiene precio inválido`,
                        impact: 'medium',
                        data: { productId: item.id, precio: item.precio }
                    });
                }

                if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                    analysis.problems.push({
                        type: 'error',
                        category: 'data_format',
                        description: `Producto ${index} tiene cantidad inválida`,
                        impact: 'medium',
                        data: { productId: item.id, quantity: item.quantity }
                    });
                }

                // Verificar imagen
                if (!item.imagen_url && !item.imagen) {
                    analysis.warnings.push({
                        type: 'warning',
                        category: 'data_format',
                        description: `Producto ${index} no tiene imagen`,
                        impact: 'low',
                        data: { productId: item.id }
                    });
                }
            });

        } catch (error) {
            analysis.problems.push({
                type: 'error',
                category: 'data_format',
                description: 'Error verificando formato de datos',
                error: error.message,
                impact: 'medium'
            });
        }
    }

    // 7. Detectar problemas de timing
    async detectTimingProblems(analysis) {
        console.log('🔍 Detectando problemas de timing...');

        try {
            // Medir tiempo de respuesta de addItem
            const testProduct = {
                id: `timing-test-${Date.now()}`,
                nombre: 'Timing Test',
                marca: 'Test',
                precio: 15.99,
                categoria: 'test'
            };

            const startTime = performance.now();
            window.shoppingCart.addItem(testProduct);
            const endTime = performance.now();
            
            const addItemTime = endTime - startTime;

            if (addItemTime > 100) { // 100ms
                analysis.warnings.push({
                    type: 'warning',
                    category: 'timing',
                    description: 'addItem es lento',
                    impact: 'low',
                    data: { timeMs: Math.round(addItemTime) }
                });
            }

            // Medir tiempo de sincronización
            const syncStartTime = performance.now();
            await this.delay(50); // Esperar sincronización
            
            const memoryItems = window.shoppingCart.getTotalItems();
            const storageItems = this.getStorageItemCount();
            const syncEndTime = performance.now();
            
            const syncTime = syncEndTime - syncStartTime;

            if (memoryItems !== storageItems) {
                analysis.problems.push({
                    type: 'error',
                    category: 'timing',
                    description: 'Sincronización demorada o fallida',
                    impact: 'medium',
                    data: { 
                        syncTimeMs: Math.round(syncTime),
                        memory: memoryItems,
                        storage: storageItems
                    }
                });
            }

        } catch (error) {
            analysis.problems.push({
                type: 'error',
                category: 'timing',
                description: 'Error verificando timing',
                error: error.message,
                impact: 'low'
            });
        }
    }

    // Generar reporte de problemas
    generateProblemReport(analysis) {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 REPORTE DE PROBLEMAS: SINCRONIZACIÓN AL AGREGAR PRODUCTOS');
        console.log('='.repeat(60));
        
        console.log(`🕐 Timestamp: ${analysis.timestamp}`);
        console.log(`📊 Resumen: ${analysis.problems.length} problemas, ${analysis.warnings.length} advertencias`);
        
        // Problemas críticos
        const criticalProblems = analysis.problems.filter(p => p.impact === 'critical');
        if (criticalProblems.length > 0) {
            console.log(`\n🚨 PROBLEMAS CRÍTICOS (${criticalProblems.length}):`);
            criticalProblems.forEach((problem, index) => {
                console.log(`❌ ${index + 1}. ${problem.description}`);
                if (problem.fix) console.log(`   💡 Fix: ${problem.fix}`);
                if (problem.error) console.log(`   🔍 Error: ${problem.error}`);
            });
        }

        // Problemas altos
        const highProblems = analysis.problems.filter(p => p.impact === 'high');
        if (highProblems.length > 0) {
            console.log(`\n⚠️ PROBLEMAS ALTOS (${highProblems.length}):`);
            highProblems.forEach((problem, index) => {
                console.log(`🔥 ${index + 1}. ${problem.description}`);
                if (problem.fix) console.log(`   💡 Fix: ${problem.fix}`);
                if (problem.data) console.log(`   📊 Data:`, problem.data);
            });
        }

        // Problemas medios
        const mediumProblems = analysis.problems.filter(p => p.impact === 'medium');
        if (mediumProblems.length > 0) {
            console.log(`\n📋 PROBLEMAS MEDIOS (${mediumProblems.length}):`);
            mediumProblems.forEach((problem, index) => {
                console.log(`⚠️ ${index + 1}. ${problem.description}`);
                if (problem.data) console.log(`   📊 Data:`, problem.data);
            });
        }

        // Advertencias
        if (analysis.warnings.length > 0) {
            console.log(`\n💡 ADVERTENCIAS (${analysis.warnings.length}):`);
            analysis.warnings.forEach((warning, index) => {
                console.log(`⚠️ ${index + 1}. ${warning.description}`);
                if (warning.recommendation) console.log(`   💡 Recomendación: ${warning.recommendation}`);
            });
        }

        // Recomendaciones generales
        console.log('\n💡 RECOMENDACIONES GENERALES:');
        if (analysis.problems.length === 0) {
            console.log('✅ No se detectaron problemas críticos en el sistema de agregar productos');
        } else {
            console.log('🔧 Se requieren las siguientes acciones:');
            
            if (criticalProblems.length > 0) {
                console.log('  1. Resolver problemas críticos primero (sistema no funcional)');
            }
            if (highProblems.length > 0) {
                console.log('  2. Atender problemas de alta prioridad (funcionalidad comprometida)');
            }
            if (mediumProblems.length > 0) {
                console.log('  3. Revisar problemas de prioridad media (experiencia del usuario)');
            }
        }

        // Resultados de tests
        if (analysis.testResults.length > 0) {
            console.log('\n📊 RESULTADOS DE TESTS:');
            analysis.testResults.forEach(result => {
                console.log(`🧪 ${result.test}:`, result.results);
            });
        }
        
        console.log('='.repeat(60) + '\n');
        
        return analysis;
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
            return 0;
        }
    }

    getStorageSize() {
        try {
            const data = localStorage.getItem('shopping_cart');
            return data ? new Blob([data]).size : 0;
        } catch (error) {
            return 0;
        }
    }

    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
        }
        return true;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Funciones globales
window.CartSyncProblemDetector = CartSyncProblemDetector;

window.detectCartProblems = async function() {
    const detector = new CartSyncProblemDetector();
    return await detector.detectAllProblems();
};

window.quickProblemCheck = function() {
    console.log('🚀 Verificación rápida de problemas...');
    
    const issues = [];
    
    // Verificaciones básicas
    if (!window.shoppingCart) {
        issues.push('❌ Carrito no existe');
    } else {
        if (!window.shoppingCart.isInitialized) {
            issues.push('❌ Carrito no inicializado');
        }
        if (typeof window.shoppingCart.addItem !== 'function') {
            issues.push('❌ Método addItem no disponible');
        }
    }
    
    // Verificar localStorage
    try {
        const storage = localStorage.getItem('shopping_cart');
        if (storage) {
            JSON.parse(storage); // Verificar que es JSON válido
        }
    } catch (error) {
        issues.push('❌ LocalStorage corrupto');
    }
    
    if (issues.length === 0) {
        console.log('✅ Verificación rápida: No se detectaron problemas básicos');
    } else {
        console.log('❌ Problemas detectados:');
        issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    return issues.length === 0;
};

console.log('🔍 CartSyncProblemDetector cargado. Usa detectCartProblems() o quickProblemCheck()');
