// 🛡️ SECURE PRODUCT SERVICE - Capa de protección para productos
// Integración con el sistema de seguridad para operaciones CRUD

class SecureProductService {
    constructor() {
        this.secureClient = null;
        this.monitor = null;
        this.initialized = false;
        this.operationCount = 0;
        
        // Reglas de validación para productos
        this.validationRules = {
            create: {
                required: ['nombre', 'marca', 'precio', 'categoria'],
                types: {
                    nombre: 'string',
                    marca: 'string',
                    precio: 'number',
                    categoria: 'string',
                    ml: 'number',
                    stock: 'number',
                    activo: 'boolean',
                    luxury: 'boolean'
                },
                ranges: {
                    nombre: { min: 2, max: 200 },
                    marca: { min: 1, max: 100 },
                    precio: { min: 1000, max: 10000000 },
                    ml: { min: 1, max: 1000 },
                    stock: { min: 0, max: 50000 }
                },
                formats: {
                    categoria: /^(para-ellos|para-ellas|unisex)$/,
                    subcategoria: /^(designer|arabic|contemporary|vintage)?$/,
                    estado: /^(disponible|agotado|proximo|oferta)$/
                }
            }
        };
    }

    async initialize(supabaseUrl, supabaseKey) {
        try {
            console.log('🚀 Initializing Secure Product Service...');
            
            // Inicializar cliente seguro
            this.secureClient = new SecureSupabaseClient(supabaseUrl, supabaseKey);
            
            // Crear monitor de seguridad específico para productos
            this.monitor = new DatabaseSecurityManager();
            
            // Test inicial de conexión
            await this.testConnection();
            
            this.initialized = true;
            console.log('✅ Secure Product Service initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Secure Product Service:', error);
            throw new Error(`Service initialization failed: ${error.message}`);
        }
    }

    // 🔍 OPERACIONES DE LECTURA
    async getAllProducts(filters = {}) {
        this.ensureInitialized();
        this.operationCount++;
        
        try {
            console.log('📊 Fetching products with security validation...');
            
            // Validar filtros
            this.validateFilters(filters);
            
            const queryParams = {
                columns: 'id, nombre, marca, precio, categoria, subcategoria, descripcion, imagen_url, ml, stock, estado, descuento, luxury, activo, created_at',
                limit: filters.limit || 1000,
                order: { column: 'created_at', ascending: false }
            };
            
            // Aplicar filtros
            if (filters.categoria) {
                queryParams.filter = { column: 'categoria', value: filters.categoria };
            }
            
            const result = await this.secureClient.secureQuery('productos', 'select', queryParams);
            
            console.log(`✅ Retrieved ${result.data?.length || 0} products securely`);
            return this.processProductsData(result.data);
            
        } catch (error) {
            console.error('❌ Failed to fetch products:', error.message);
            this.logOperationError('getAllProducts', error, filters);
            throw error;
        }
    }

    async getProductById(id) {
        this.ensureInitialized();
        
        try {
            // Validar ID
            if (!id || typeof id !== 'number' || id <= 0) {
                throw new Error('Invalid product ID');
            }
            
            const result = await this.secureClient.secureQuery('productos', 'select', {
                columns: '*',
                filter: { column: 'id', value: id },
                limit: 1
            });
            
            if (!result.data || result.data.length === 0) {
                return null;
            }
            
            return this.processProductData(result.data[0]);
            
        } catch (error) {
            console.error('❌ Failed to fetch product by ID:', error.message);
            this.logOperationError('getProductById', error, { id });
            throw error;
        }
    }

    async searchProducts(searchTerm, filters = {}) {
        this.ensureInitialized();
        
        try {
            if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
                throw new Error('Search term must be at least 2 characters');
            }
            
            // Sanitizar término de búsqueda
            const sanitizedTerm = this.sanitizeSearchTerm(searchTerm);
            
            // Por seguridad, usamos ilike con términos específicos
            // En lugar de permitir queries SQL directas
            const products = await this.getAllProducts(filters);
            
            // Filtrar en el cliente por seguridad
            const filtered = products.filter(product => 
                product.nombre.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
                product.marca.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
                (product.descripcion && product.descripcion.toLowerCase().includes(sanitizedTerm.toLowerCase()))
            );
            
            console.log(`🔍 Search for "${searchTerm}" returned ${filtered.length} results`);
            return filtered;
            
        } catch (error) {
            console.error('❌ Search failed:', error.message);
            this.logOperationError('searchProducts', error, { searchTerm, filters });
            throw error;
        }
    }

    // ✏️ OPERACIONES DE ESCRITURA
    async createProduct(productData) {
        this.ensureInitialized();
        
        try {
            console.log('📝 Creating product with security validation...');
            
            // Validación completa de datos
            const validation = this.monitor.validateInput(productData, this.validationRules.create);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Sanitizar y preparar datos
            const sanitizedData = this.sanitizeProductData(productData);
            
            // Verificar duplicados
            await this.checkDuplicateProduct(sanitizedData.nombre, sanitizedData.marca);
            
            // Agregar metadatos
            sanitizedData.created_at = new Date().toISOString();
            sanitizedData.updated_at = sanitizedData.created_at;
            sanitizedData.created_by = 'admin_panel';
            
            const result = await this.secureClient.secureQuery('productos', 'insert', {
                data: sanitizedData
            });
            
            console.log('✅ Product created successfully:', result.data?.[0]?.id);
            this.logOperationSuccess('createProduct', { productId: result.data?.[0]?.id });
            
            return result.data?.[0];
            
        } catch (error) {
            console.error('❌ Failed to create product:', error.message);
            this.logOperationError('createProduct', error, productData);
            throw error;
        }
    }

    async updateProduct(id, updateData) {
        this.ensureInitialized();
        
        try {
            console.log(`📝 Updating product ${id} with security validation...`);
            
            // Validar ID
            if (!id || typeof id !== 'number' || id <= 0) {
                throw new Error('Invalid product ID');
            }
            
            // Verificar que el producto existe
            const existingProduct = await this.getProductById(id);
            if (!existingProduct) {
                throw new Error('Product not found');
            }
            
            // Validar datos de actualización
            const filteredData = this.filterUpdateData(updateData);
            const validation = this.validateUpdateData(filteredData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Sanitizar datos
            const sanitizedData = this.sanitizeProductData(filteredData);
            sanitizedData.updated_at = new Date().toISOString();
            
            const result = await this.secureClient.secureQuery('productos', 'update', {
                data: sanitizedData,
                filter: { column: 'id', value: id }
            });
            
            console.log(`✅ Product ${id} updated successfully`);
            this.logOperationSuccess('updateProduct', { productId: id });
            
            return result.data?.[0];
            
        } catch (error) {
            console.error('❌ Failed to update product:', error.message);
            this.logOperationError('updateProduct', error, { id, updateData });
            throw error;
        }
    }

    async deleteProduct(id) {
        this.ensureInitialized();
        
        try {
            console.log(`🗑️ Deleting product ${id} with security validation...`);
            
            // Validar ID
            if (!id || typeof id !== 'number' || id <= 0) {
                throw new Error('Invalid product ID');
            }
            
            // Verificar que el producto existe
            const existingProduct = await this.getProductById(id);
            if (!existingProduct) {
                throw new Error('Product not found');
            }
            
            // Por seguridad, hacer soft delete en lugar de delete real
            const result = await this.secureClient.secureQuery('productos', 'update', {
                data: { 
                    activo: false, 
                    deleted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                filter: { column: 'id', value: id }
            });
            
            console.log(`✅ Product ${id} soft-deleted successfully`);
            this.logOperationSuccess('deleteProduct', { productId: id });
            
            return result.data?.[0];
            
        } catch (error) {
            console.error('❌ Failed to delete product:', error.message);
            this.logOperationError('deleteProduct', error, { id });
            throw error;
        }
    }

    // 🔧 MÉTODOS DE VALIDACIÓN Y SANITIZACIÓN
    validateFilters(filters) {
        const allowedFilters = ['categoria', 'subcategoria', 'marca', 'estado', 'activo', 'limit'];
        
        for (const key of Object.keys(filters)) {
            if (!allowedFilters.includes(key)) {
                throw new Error(`Invalid filter: ${key}`);
            }
        }
        
        if (filters.limit && (filters.limit < 1 || filters.limit > 1000)) {
            throw new Error('Limit must be between 1 and 1000');
        }
    }

    sanitizeSearchTerm(term) {
        return term
            .replace(/[<>\"']/g, '') // Remove potential XSS chars
            .replace(/[;--]/g, '') // Remove SQL injection chars
            .trim()
            .substring(0, 100); // Limit length
    }

    sanitizeProductData(data) {
        const sanitized = { ...data };
        
        // Sanitizar strings
        if (sanitized.nombre) sanitized.nombre = this.sanitizeString(sanitized.nombre);
        if (sanitized.marca) sanitized.marca = this.sanitizeString(sanitized.marca);
        if (sanitized.descripcion) sanitized.descripcion = this.sanitizeString(sanitized.descripcion);
        if (sanitized.notas) sanitized.notas = this.sanitizeString(sanitized.notas);
        
        // Validar y sanitizar URL de imagen
        if (sanitized.imagen_url) {
            sanitized.imagen_url = this.sanitizeImageUrl(sanitized.imagen_url);
        }
        
        // Asegurar tipos numéricos
        if (sanitized.precio) sanitized.precio = Math.round(Number(sanitized.precio));
        if (sanitized.ml) sanitized.ml = Math.round(Number(sanitized.ml));
        if (sanitized.stock) sanitized.stock = Math.round(Number(sanitized.stock));
        if (sanitized.descuento) sanitized.descuento = Math.round(Number(sanitized.descuento));
        
        // Asegurar booleans
        if (sanitized.activo !== undefined) sanitized.activo = Boolean(sanitized.activo);
        if (sanitized.luxury !== undefined) sanitized.luxury = Boolean(sanitized.luxury);
        
        return sanitized;
    }

    sanitizeString(str) {
        return str
            .replace(/[<>\"'&]/g, '') // Remove XSS chars
            .replace(/[;--]/g, '') // Remove SQL injection chars
            .trim()
            .substring(0, 1000); // Limit length
    }

    sanitizeImageUrl(url) {
        try {
            const parsed = new URL(url);
            
            // Solo permitir HTTPS
            if (parsed.protocol !== 'https:') {
                throw new Error('Only HTTPS URLs are allowed');
            }
            
            // Lista de dominios permitidos para imágenes
            const allowedDomains = [
                'images.unsplash.com',
                'images.pexels.com',
                'cdn.pixabay.com',
                'img.freepik.com',
                'supabase.co' // Para Supabase Storage
            ];
            
            const isAllowed = allowedDomains.some(domain => 
                parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
            );
            
            if (!isAllowed) {
                console.warn('⚠️ Image URL from untrusted domain:', parsed.hostname);
            }
            
            return url;
            
        } catch (error) {
            throw new Error('Invalid image URL format');
        }
    }

    filterUpdateData(data) {
        const allowedFields = [
            'nombre', 'marca', 'precio', 'categoria', 'subcategoria',
            'descripcion', 'notas', 'imagen_url', 'ml', 'stock',
            'estado', 'descuento', 'luxury', 'activo'
        ];
        
        const filtered = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                filtered[field] = data[field];
            }
        }
        
        return filtered;
    }

    validateUpdateData(data) {
        // Usar las mismas reglas que para crear, pero sin campos requeridos
        const updateRules = { ...this.validationRules.create };
        delete updateRules.required;
        
        return this.monitor.validateInput(data, updateRules);
    }

    async checkDuplicateProduct(nombre, marca) {
        try {
            const existing = await this.searchProducts(nombre);
            const duplicate = existing.find(p => 
                p.nombre.toLowerCase() === nombre.toLowerCase() && 
                p.marca.toLowerCase() === marca.toLowerCase()
            );
            
            if (duplicate) {
                throw new Error(`Product "${nombre}" by "${marca}" already exists`);
            }
            
        } catch (error) {
            if (error.message.includes('already exists')) {
                throw error;
            }
            // Si falla la búsqueda, continuar (mejor permitir duplicado que fallar)
            console.warn('⚠️ Could not check for duplicates:', error.message);
        }
    }

    // 🔧 MÉTODOS AUXILIARES
    processProductsData(products) {
        if (!products || !Array.isArray(products)) {
            return [];
        }
        
        return products.map(product => this.processProductData(product));
    }

    processProductData(product) {
        if (!product) return null;
        
        // Asegurar tipos correctos
        const processed = {
            ...product,
            precio: Number(product.precio) || 0,
            ml: Number(product.ml) || 100,
            stock: Number(product.stock) || 0,
            descuento: Number(product.descuento) || 0,
            activo: Boolean(product.activo),
            luxury: Boolean(product.luxury)
        };
        
        // Calcular precio con descuento si aplica
        if (processed.descuento > 0) {
            processed.precio_con_descuento = Math.round(
                processed.precio * (1 - processed.descuento / 100)
            );
        }
        
        return processed;
    }

    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Service not initialized. Call initialize() first.');
        }
    }

    async testConnection() {
        try {
            const result = await this.secureClient.testConnection();
            console.log('🔗 Product service connection test:', result);
            return result;
        } catch (error) {
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    // 📊 LOGGING Y MONITOREO
    logOperationSuccess(operation, details = {}) {
        this.monitor.logActivity('PRODUCT_OPERATION_SUCCESS', {
            operation,
            details,
            operationCount: this.operationCount,
            timestamp: new Date().toISOString()
        });
    }

    logOperationError(operation, error, params = {}) {
        this.monitor.logSecurityIncident('PRODUCT_OPERATION_ERROR', {
            operation,
            error: error.message,
            params: JSON.stringify(params).substring(0, 200),
            operationCount: this.operationCount,
            timestamp: new Date().toISOString()
        });
    }

    // 📈 MÉTRICAS Y ESTADO
    getServiceStatus() {
        return {
            initialized: this.initialized,
            operationCount: this.operationCount,
            securityStatus: this.secureClient?.getSecurityStatus(),
            lastOperation: new Date().toISOString()
        };
    }

    getServiceMetrics() {
        const securityReport = this.monitor.getSecurityReport();
        
        return {
            totalOperations: this.operationCount,
            securityIncidents: securityReport.statistics.totalIncidents,
            successRate: this.calculateSuccessRate(securityReport),
            recommendations: securityReport.recommendations,
            status: securityReport.status
        };
    }

    calculateSuccessRate(securityReport) {
        const total = securityReport.statistics.totalActivities;
        const errors = securityReport.statistics.totalIncidents;
        
        if (total === 0) return 100;
        return Math.round(((total - errors) / total) * 100);
    }

    // 🧹 LIMPIEZA Y RESET
    resetService() {
        this.operationCount = 0;
        this.secureClient?.resetSecurity();
        this.monitor = new DatabaseSecurityManager();
        console.log('🔄 Product service reset completed');
    }
}

// 🌐 EXPORTAR PARA USO GLOBAL
window.SecureProductService = SecureProductService;

console.log('🛡️ Secure Product Service loaded successfully');
