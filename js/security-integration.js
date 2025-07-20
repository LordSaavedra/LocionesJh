// 🔐 INTEGRATION SCRIPT - Integrar sistema seguro con admin panel existente
// Reemplaza las funciones inseguras con versiones protegidas

class AdminPanelSecurityIntegration {
    constructor() {
        this.secureProductService = null;
        this.originalFunctions = {};
        this.isSecurityEnabled = false;
        this.securityConfig = {
            enableRateLimit: true,
            enableSuspiciousDetection: true,
            enableCircuitBreaker: true,
            maxRetries: 3,
            timeoutMs: 15000
        };
    }

    // 🚀 INICIALIZAR INTEGRACIÓN SEGURA
    async initializeSecureSystems() {
        try {
            console.log('🔐 Initializing security integration...');
            
            // 1. Verificar dependencias
            this.checkDependencies();
            
            // 2. Inicializar servicio seguro
            this.secureProductService = new SecureProductService();
            await this.secureProductService.initialize(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // 3. Backup funciones originales
            this.backupOriginalFunctions();
            
            // 4. Reemplazar con versiones seguras
            this.replaceWithSecureFunctions();
            
            // 5. Configurar monitoreo
            this.setupSecurityMonitoring();
            
            this.isSecurityEnabled = true;
            console.log('✅ Security integration completed successfully');
            
            // Mostrar dashboard de seguridad
            this.showSecurityStatus();
            
        } catch (error) {
            console.error('❌ Security integration failed:', error);
            throw error;
        }
    }

    checkDependencies() {
        const required = [
            'SecureSupabaseClient',
            'DatabaseSecurityManager', 
            'SecureProductService',
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY'
        ];
        
        for (const dep of required) {
            if (typeof window[dep] === 'undefined' && typeof eval(dep) === 'undefined') {
                throw new Error(`Missing dependency: ${dep}`);
            }
        }
        
        console.log('✅ All security dependencies verified');
    }

    backupOriginalFunctions() {
        // Backup funciones críticas del admin panel
        if (window.productService) {
            this.originalFunctions.getProducts = window.productService.getProducts;
            this.originalFunctions.createProduct = window.productService.createProduct;
            this.originalFunctions.updateProduct = window.productService.updateProduct;
            this.originalFunctions.deleteProduct = window.productService.deleteProduct;
        }
        
        if (window.adminPanel) {
            this.originalFunctions.loadProducts = window.adminPanel.loadProducts;
            this.originalFunctions.saveProduct = window.adminPanel.saveProduct;
            this.originalFunctions.deleteProduct = window.adminPanel.deleteProduct;
        }
        
        console.log('💾 Original functions backed up');
    }

    replaceWithSecureFunctions() {
        // Reemplazar productService si existe
        if (window.productService) {
            window.productService.getProducts = this.createSecureWrapper('getProducts');
            window.productService.createProduct = this.createSecureWrapper('createProduct');
            window.productService.updateProduct = this.createSecureWrapper('updateProduct');
            window.productService.deleteProduct = this.createSecureWrapper('deleteProduct');
        }
        
        // Reemplazar funciones del adminPanel si existe
        if (window.adminPanel) {
            const originalLoadProducts = window.adminPanel.loadProducts;
            window.adminPanel.loadProducts = async () => {
                return this.secureLoadProducts(originalLoadProducts);
            };
            
            const originalSaveProduct = window.adminPanel.saveProduct;
            window.adminPanel.saveProduct = async (productData) => {
                return this.secureSaveProduct(originalSaveProduct, productData);
            };
        }
        
        console.log('🔄 Functions replaced with secure versions');
    }

    createSecureWrapper(methodName) {
        return async (...args) => {
            try {
                if (!this.isSecurityEnabled) {
                    throw new Error('Security system not initialized');
                }
                
                // Llamar método seguro
                switch (methodName) {
                    case 'getProducts':
                        return await this.secureProductService.getAllProducts(args[0]);
                    case 'createProduct':
                        return await this.secureProductService.createProduct(args[0]);
                    case 'updateProduct':
                        return await this.secureProductService.updateProduct(args[0], args[1]);
                    case 'deleteProduct':
                        return await this.secureProductService.deleteProduct(args[0]);
                    default:
                        throw new Error(`Unknown method: ${methodName}`);
                }
                
            } catch (error) {
                console.error(`🚫 Secure ${methodName} failed:`, error.message);
                
                // Fallback a función original si está disponible
                if (this.securityConfig.enableFallback && this.originalFunctions[methodName]) {
                    console.warn(`⚠️ Falling back to original ${methodName}`);
                    return await this.originalFunctions[methodName](...args);
                }
                
                throw error;
            }
        };
    }

    // 🛡️ WRAPPERS SEGUROS ESPECÍFICOS
    async secureLoadProducts(originalFunction) {
        try {
            console.log('🔄 Loading products with security validation...');
            
            const products = await this.secureProductService.getAllProducts();
            
            // Actualizar UI de forma segura
            if (window.adminPanel && window.adminPanel.displayProducts) {
                window.adminPanel.displayProducts(products);
            }
            
            return products;
            
        } catch (error) {
            console.error('❌ Secure load products failed:', error);
            this.showSecurityError('Failed to load products', error.message);
            
            // Intentar función original como fallback
            if (originalFunction && this.securityConfig.enableFallback) {
                console.warn('⚠️ Using fallback for load products');
                return await originalFunction();
            }
            
            throw error;
        }
    }

    async secureSaveProduct(originalFunction, productData) {
        try {
            console.log('💾 Saving product with security validation...');
            
            // Determinar si es crear o actualizar
            let result;
            if (productData.id) {
                result = await this.secureProductService.updateProduct(productData.id, productData);
            } else {
                result = await this.secureProductService.createProduct(productData);
            }
            
            // Actualizar UI
            this.showSecuritySuccess('Product saved successfully');
            
            // Recargar productos
            if (window.adminPanel && window.adminPanel.loadProducts) {
                await window.adminPanel.loadProducts();
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Secure save product failed:', error);
            this.showSecurityError('Failed to save product', error.message);
            
            // Fallback si está habilitado
            if (originalFunction && this.securityConfig.enableFallback) {
                console.warn('⚠️ Using fallback for save product');
                return await originalFunction(productData);
            }
            
            throw error;
        }
    }

    // 📊 MONITOREO Y ALERTAS
    setupSecurityMonitoring() {
        // Monitor de estado cada 30 segundos
        this.monitoringInterval = setInterval(() => {
            this.checkSecurityHealth();
        }, 30000);
        
        // Monitor de métricas cada 5 minutos
        this.metricsInterval = setInterval(() => {
            this.logSecurityMetrics();
        }, 300000);
        
        console.log('📊 Security monitoring started');
    }

    checkSecurityHealth() {
        try {
            const status = this.secureProductService?.getServiceStatus();
            const metrics = this.secureProductService?.getServiceMetrics();
            
            if (metrics && metrics.successRate < 80) {
                this.showSecurityWarning(
                    `Low success rate: ${metrics.successRate}%`,
                    'Consider checking network connectivity'
                );
            }
            
            if (metrics && metrics.securityIncidents > 10) {
                this.showSecurityAlert(
                    'High security incident count',
                    'Multiple security violations detected'
                );
            }
            
        } catch (error) {
            console.error('❌ Security health check failed:', error);
        }
    }

    logSecurityMetrics() {
        try {
            const metrics = this.secureProductService?.getServiceMetrics();
            if (metrics) {
                console.log('📈 Security Metrics:', {
                    operations: metrics.totalOperations,
                    successRate: metrics.successRate + '%',
                    incidents: metrics.securityIncidents,
                    status: metrics.status
                });
            }
        } catch (error) {
            console.error('❌ Failed to log metrics:', error);
        }
    }

    // 🎨 UI DE SEGURIDAD
    showSecurityStatus() {
        const status = this.secureProductService?.getServiceStatus();
        const metrics = this.secureProductService?.getServiceMetrics();
        
        const statusHtml = `
            <div class="security-status" style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                min-width: 200px;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 16px; margin-right: 8px;">🛡️</span>
                    <strong>Security Active</strong>
                </div>
                <div style="font-size: 12px; opacity: 0.9;">
                    Operations: ${metrics?.totalOperations || 0}<br>
                    Success Rate: ${metrics?.successRate || 100}%<br>
                    Status: ${metrics?.status || 'ACTIVE'}
                </div>
            </div>
        `;
        
        // Remover status anterior si existe
        const existingStatus = document.querySelector('.security-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Agregar nuevo status
        document.body.insertAdjacentHTML('beforeend', statusHtml);
        
        // Auto-hide después de 5 segundos
        setTimeout(() => {
            const statusDiv = document.querySelector('.security-status');
            if (statusDiv) {
                statusDiv.style.opacity = '0.7';
                statusDiv.style.transform = 'translateX(10px)';
            }
        }, 5000);
    }

    showSecuritySuccess(message) {
        this.showSecurityNotification(message, 'success', '✅');
    }

    showSecurityWarning(title, message) {
        this.showSecurityNotification(`${title}: ${message}`, 'warning', '⚠️');
    }

    showSecurityError(title, message) {
        this.showSecurityNotification(`${title}: ${message}`, 'error', '❌');
    }

    showSecurityAlert(title, message) {
        this.showSecurityNotification(`SECURITY ALERT - ${title}: ${message}`, 'alert', '🚨');
    }

    showSecurityNotification(message, type, icon) {
        const colors = {
            success: '#10B981',
            warning: '#F59E0B', 
            error: '#EF4444',
            alert: '#DC2626'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 10px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1001;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start;">
                <span style="font-size: 16px; margin-right: 8px; flex-shrink: 0;">${icon}</span>
                <div>${message}</div>
            </div>
        `;
        
        // Agregar CSS animation si no existe
        if (!document.querySelector('#security-animations')) {
            const style = document.createElement('style');
            style.id = 'security-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove después de tiempo según tipo
        const timeout = type === 'error' || type === 'alert' ? 8000 : 4000;
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, timeout);
    }

    // 🔧 CONTROL Y CONFIGURACIÓN
    enableSecurity() {
        if (!this.isSecurityEnabled) {
            this.initializeSecureSystems().catch(console.error);
        }
    }

    disableSecurity() {
        if (this.isSecurityEnabled) {
            this.restoreOriginalFunctions();
            this.stopMonitoring();
            this.isSecurityEnabled = false;
            console.log('🔓 Security system disabled');
        }
    }

    restoreOriginalFunctions() {
        // Restaurar funciones originales
        if (window.productService && this.originalFunctions) {
            for (const [method, originalFunc] of Object.entries(this.originalFunctions)) {
                if (window.productService[method] && originalFunc) {
                    window.productService[method] = originalFunc;
                }
            }
        }
        
        console.log('🔄 Original functions restored');
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        
        console.log('📊 Security monitoring stopped');
    }

    // 📋 DIAGNÓSTICOS
    async runSecurityDiagnostics() {
        console.log('🔍 Running security diagnostics...');
        
        const diagnostics = {
            systemStatus: this.isSecurityEnabled,
            connectionTest: null,
            serviceMetrics: null,
            securityIncidents: null,
            recommendations: []
        };
        
        try {
            // Test de conexión
            if (this.secureProductService) {
                diagnostics.connectionTest = await this.secureProductService.testConnection();
                diagnostics.serviceMetrics = this.secureProductService.getServiceMetrics();
                
                const securityStatus = this.secureProductService.secureClient?.getSecurityStatus();
                if (securityStatus) {
                    diagnostics.securityIncidents = securityStatus.recentIncidents;
                    diagnostics.recommendations = securityStatus.recommendations;
                }
            }
            
            console.log('📋 Security Diagnostics Report:', diagnostics);
            return diagnostics;
            
        } catch (error) {
            console.error('❌ Diagnostics failed:', error);
            diagnostics.error = error.message;
            return diagnostics;
        }
    }

    // 🎯 MÉTODOS PÚBLICOS DE CONTROL
    getSecurityReport() {
        return {
            enabled: this.isSecurityEnabled,
            config: this.securityConfig,
            serviceStatus: this.secureProductService?.getServiceStatus(),
            serviceMetrics: this.secureProductService?.getServiceMetrics()
        };
    }

    updateSecurityConfig(newConfig) {
        this.securityConfig = { ...this.securityConfig, ...newConfig };
        console.log('⚙️ Security config updated:', this.securityConfig);
    }
}

// 🌐 INICIALIZACIÓN GLOBAL
const securityIntegration = new AdminPanelSecurityIntegration();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        securityIntegration.enableSecurity();
    });
} else {
    // DOM ya está listo
    setTimeout(() => {
        securityIntegration.enableSecurity();
    }, 1000);
}

// Exportar globalmente
window.securityIntegration = securityIntegration;

console.log('🔐 Security Integration System loaded - Auto-enabling in 1 second...');
