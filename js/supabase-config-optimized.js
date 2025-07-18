// Configuración de Supabase - Versión Optimizada para Rendimiento
const SUPABASE_URL = 'https://xelobsbzytdxrrxgmlta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbG9ic2J6eXRkeHJyeGdtbHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODUzNTksImV4cCI6MjA2NTk2MTM1OX0.bJL5DsL4pxlQ_FV3jX0ieiW3bYLA-Zf3M2HlNmdMMy4';

// Inicializar cliente de Supabase
let supabaseClient = null;

// Función para inicializar Supabase
function initSupabase() {
    try {
        console.log('🚀 Inicializando Supabase optimizado...');
        
        if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
            // Configurar cliente con opciones optimizadas
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                db: {
                    schema: 'public',
                    poolTimeout: 15000 // Reducido a 15 segundos
                },
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                },
                global: {
                    headers: {
                        'x-application-name': 'aromes-perfumeria-optimized',
                        'x-client-version': '2.0'
                    }
                }
            });
            
            window.supabaseClient = supabaseClient;
            console.log('✅ Supabase optimizado inicializado');
            return true;
        }
        
        console.log('⚠️ Supabase no disponible');
        return false;
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        return false;
    }
}

// Servicio de productos optimizado
class ProductosServiceOptimized {
    // Cache mejorado con TTL específico por sección
    static _cache = {
        productos: { data: null, timestamp: 0, ttl: 60000 }, // 1 minuto para admin
        ellos: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutos para secciones
        ellas: { data: null, timestamp: 0, ttl: 300000 },
        categorias: { data: null, timestamp: 0, ttl: 600000 }, // 10 minutos para metadatos
        marcas: { data: null, timestamp: 0, ttl: 600000 }
    };
    
    // Configuración de paginación
    static pagination = {
        pageSize: 20,
        adminPageSize: 1000 // Cargar todos los productos en admin
    };

    // Verificar cache por clave
    static _getCachedData(cacheKey) {
        const cached = this._cache[cacheKey];
        if (cached && cached.data && (Date.now() - cached.timestamp) < cached.ttl) {
            console.log(`📋 Usando cache para ${cacheKey}`);
            return cached.data;
        }
        return null;
    }

    // Guardar en cache
    static _setCachedData(cacheKey, data) {
        this._cache[cacheKey] = {
            data: data,
            timestamp: Date.now(),
            ttl: this._cache[cacheKey].ttl
        };
    }

    // Obtener productos con paginación optimizada
    static async obtenerProductosOptimizado(filtros = {}) {
        const startTime = Date.now();
        
        try {
            // Verificar cache primero (no usar cache si es admin o forceRefresh)
            if (!filtros.admin && !filtros.forceRefresh) {
                const cacheKey = filtros.categoria ? filtros.categoria.toLowerCase() : 'productos';
                const cachedData = this._getCachedData(cacheKey);
                if (cachedData) {
                    console.log(`⚡ Cache hit para ${cacheKey}: ${Date.now() - startTime}ms`);
                    return cachedData;
                }
            } else {
                console.log('🔄 Saltando cache para admin/forceRefresh');
            }

            // Verificar inicialización
            if (!supabaseClient) {
                const initialized = initSupabase();
                if (!initialized) {
                    throw new Error('Supabase no disponible');
                }
            }

            // Configurar paginación
            let pageSize, offset;
            
            if (filtros.unlimited || (filtros.admin && filtros.forceRefresh)) {
                // Para admin con unlimited, no aplicar límites
                pageSize = null;
                offset = 0;
                console.log('🔍 Admin: Consultando TODOS los productos sin límite...');
            } else {
                pageSize = filtros.admin ? 1000 : this.pagination.pageSize;
                const page = filtros.page || 0;
                offset = page * pageSize;
                console.log(`🔍 Consultando ${filtros.admin ? 'hasta 1000' : pageSize} productos desde ${offset}...`);
            }

            // Query optimizada - sin límite para admin unlimited
            let query = supabaseClient
                .from('productos')
                .select(`
                    id, 
                    nombre, 
                    precio, 
                    imagen_url,
                    imagen,
                    descripcion,
                    categoria,
                    marca,
                    ml,
                    stock,
                    estado,
                    descuento,
                    activo,
                    luxury,
                    notas,
                    subcategoria,
                    created_at
                `);
            
            // Solo aplicar límite si no es unlimited
            if (pageSize !== null) {
                query = query.range(offset, offset + pageSize - 1);
            }
            
            // Solo filtrar por activo si no es admin
            if (!filtros.admin) {
                query = query.eq('activo', true);
            }

            // Aplicar filtros
            if (filtros.categoria) {
                query = query.eq('categoria', filtros.categoria);
            }

            if (filtros.busqueda) {
                query = query.or(`nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);
            }
            
            // Ordenar por fecha de creación (más recientes primero) para consistencia
            query = query.order('created_at', { ascending: false });

            // Ejecutar query con timeout (más tiempo para admin con muchos productos)
            const timeoutMs = filtros.unlimited ? 15000 : 8000;
            const { data, error, count } = await Promise.race([
                query,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
                )
            ]);

            if (error) {
                console.error('❌ Error en consulta:', error);
                throw error;
            }

            // Procesar productos con imágenes optimizadas
            const productosOptimizados = (data || []).map(producto => ({
                ...producto,
                imagen_url: this._optimizeImageUrl(producto.imagen_url),
                imagen: this._optimizeImageUrl(producto.imagen),
                estado: producto.estado || 'disponible',
                descuento: producto.descuento || 0,
                activo: producto.activo !== false,
                luxury: producto.luxury || false,
                precio: producto.precio || 0,
                ml: producto.ml || 0,
                stock: producto.stock || 0
            }));

            // Guardar en cache solo si no es admin
            if (!filtros.admin) {
                this._setCachedData(cacheKey, productosOptimizados);
            }

            const endTime = Date.now();
            console.log(`✅ Consulta optimizada completada: ${productosOptimizados.length} productos en ${endTime - startTime}ms`);

            return productosOptimizados;

        } catch (error) {
            console.error('❌ Error en obtenerProductosOptimizado:', error);
            
            // Fallback a productos de ejemplo si es necesario
            if (filtros.fallback) {
                return this._getProductosEjemplo(filtros.categoria);
            }
            
            throw error;
        }
    }

    // Crear producto
    static async crearProducto(productoData) {
        const startTime = Date.now();
        
        try {
            console.log('🆕 Creando producto:', productoData.nombre);
            
            if (!supabaseClient) {
                const initialized = initSupabase();
                if (!initialized) {
                    throw new Error('Supabase no disponible');
                }
            }

            // Validar imagen URL
            if (productoData.imagen_url && !this._isValidUrl(productoData.imagen_url)) {
                throw new Error('La imagen_url debe ser una URL válida');
            }

            // Optimizar imagen si es necesario
            if (productoData.imagen_url) {
                productoData.imagen_url = this._optimizeImageUrl(productoData.imagen_url);
            }
            
            // También manejar el campo imagen legacy si existe
            if (productoData.imagen && !this._isValidUrl(productoData.imagen)) {
                throw new Error('La imagen debe ser una URL válida');
            }

            if (productoData.imagen) {
                productoData.imagen = this._optimizeImageUrl(productoData.imagen);
            }

            const { data, error } = await supabaseClient
                .from('productos')
                .insert([productoData])
                .select()
                .single();

            if (error) {
                console.error('❌ Error creando producto:', error);
                throw error;
            }

            console.log(`✅ Producto creado en ${Date.now() - startTime}ms`);
            
            // Limpiar cache para reflejar cambios
            this.clearCache();
            
            return data;

        } catch (error) {
            console.error('❌ Error en crearProducto:', error);
            throw error;
        }
    }

    // Actualizar producto
    static async updateProduct(productId, productoData) {
        const startTime = Date.now();
        
        try {
            console.log('🔄 Actualizando producto:', productId);
            
            if (!supabaseClient) {
                const initialized = initSupabase();
                if (!initialized) {
                    throw new Error('Supabase no disponible');
                }
            }

            // Validar imagen URL
            if (productoData.imagen_url && !this._isValidUrl(productoData.imagen_url)) {
                throw new Error('La imagen_url debe ser una URL válida');
            }

            // Optimizar imagen si es necesario
            if (productoData.imagen_url) {
                productoData.imagen_url = this._optimizeImageUrl(productoData.imagen_url);
            }
            
            // También manejar el campo imagen legacy si existe
            if (productoData.imagen && !this._isValidUrl(productoData.imagen)) {
                throw new Error('La imagen debe ser una URL válida');
            }

            if (productoData.imagen) {
                productoData.imagen = this._optimizeImageUrl(productoData.imagen);
            }

            const { data, error } = await supabaseClient
                .from('productos')
                .update(productoData)
                .eq('id', productId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error actualizando producto:', error);
                throw error;
            }

            console.log(`✅ Producto actualizado en ${Date.now() - startTime}ms`);
            
            // Limpiar cache para reflejar cambios
            this.clearCache();
            
            return data;

        } catch (error) {
            console.error('❌ Error en updateProduct:', error);
            throw error;
        }
    }

    // Eliminar producto
    static async deleteProduct(productId) {
        const startTime = Date.now();
        
        try {
            console.log('🗑️ Eliminando producto:', productId);
            
            if (!supabaseClient) {
                const initialized = initSupabase();
                if (!initialized) {
                    throw new Error('Supabase no disponible');
                }
            }

            const { error } = await supabaseClient
                .from('productos')
                .delete()
                .eq('id', productId);

            if (error) {
                console.error('❌ Error eliminando producto:', error);
                throw error;
            }

            console.log(`✅ Producto eliminado en ${Date.now() - startTime}ms`);
            
            // Limpiar cache para reflejar cambios
            this.clearCache();
            
            return { success: true };

        } catch (error) {
            console.error('❌ Error en deleteProduct:', error);
            throw error;
        }
    }

    // Validar URL
    static _isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    // Optimizar URL de imagen
    static _optimizeImageUrl(imageUrl) {
        if (!imageUrl) return '/IMAGENES/placeholder.jpg';
        
        // Si ya es una URL completa, devolverla tal como está
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        
        // Si es una ruta local, convertir a URL optimizada
        if (imageUrl.startsWith('/') || imageUrl.startsWith('IMAGENES/')) {
            return imageUrl;
        }
        
        // Para rutas de Supabase, usar proxy optimizado o convertir a URL directa
        if (imageUrl.includes('supabase')) {
            return imageUrl;
        }
        
        // Por defecto, asumir que es una ruta local
        return `/IMAGENES/${imageUrl}`;
    }

    // Obtener productos de ejemplo para fallback
    static _getProductosEjemplo(categoria = null) {
        const productosEjemplo = [
            {
                id: 1,
                nombre: 'Perfume Ejemplo 1',
                precio: 89.99,
                imagen_principal: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
                descripcion_corta: 'Fragancia elegante',
                categoria_id: 1,
                marca_id: 1,
                stock: 10,
                estado: 'disponible',
                descuento: 0
            },
            {
                id: 2,
                nombre: 'Perfume Ejemplo 2',
                precio: 79.99,
                imagen_principal: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400',
                descripcion_corta: 'Fragancia moderna',
                categoria_id: 2,
                marca_id: 2,
                stock: 15,
                estado: 'disponible',
                descuento: 10
            }
        ];

        console.log('📦 Usando productos de ejemplo como fallback');
        return productosEjemplo;
    }

    // Método optimizado para admin panel - carga TODOS los productos
    static async obtenerProductosAdmin(page = 0) {
        console.log('🔄 Admin: Cargando todos los productos sin límite...');
        return await this.obtenerProductosOptimizado({ 
            admin: true, 
            page: 0, // Siempre página 0 para admin
            forceRefresh: true,
            unlimited: true // Flag especial para cargar todos
        });
    }

    // Método optimizado para secciones
    static async obtenerProductosPorCategoriaOptimizado(categoria) {
        return await this.obtenerProductosOptimizado({ 
            categoria: categoria,
            fallback: true
        });
    }

    // Limpiar cache
    static clearCache(cacheKey = null) {
        if (cacheKey) {
            this._cache[cacheKey] = { data: null, timestamp: 0, ttl: this._cache[cacheKey].ttl };
        } else {
            Object.keys(this._cache).forEach(key => {
                this._cache[key] = { data: null, timestamp: 0, ttl: this._cache[key].ttl };
            });
        }
        console.log('🧹 Cache limpiado');
    }

    // Método para precargar datos críticos
    static async preloadCriticalData() {
        console.log('🚀 Precargando datos críticos...');
        
        try {
            // Precargar categorías y marcas
            const promises = [
                this.obtenerCategorias(),
                this.obtenerMarcas()
            ];
            
            await Promise.all(promises);
            console.log('✅ Datos críticos precargados');
        } catch (error) {
            console.warn('⚠️ Error precargando datos críticos:', error);
        }
    }

    // Obtener categorías con cache
    static async obtenerCategorias() {
        const cachedData = this._getCachedData('categorias');
        if (cachedData) return cachedData;

        try {
            if (!supabaseClient) initSupabase();
            
            const { data, error } = await supabaseClient
                .from('categorias')
                .select('id, nombre, slug')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;

            this._setCachedData('categorias', data || []);
            return data || [];
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            return [];
        }
    }

    // Obtener marcas con cache
    static async obtenerMarcas() {
        const cachedData = this._getCachedData('marcas');
        if (cachedData) return cachedData;

        try {
            if (!supabaseClient) initSupabase();
            
            const { data, error } = await supabaseClient
                .from('marcas')
                .select('id, nombre')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;

            this._setCachedData('marcas', data || []);
            return data || [];
        } catch (error) {
            console.error('❌ Error obteniendo marcas:', error);
            return [];
        }
    }

    // Método para obtener métricas de rendimiento
    static getPerformanceMetrics() {
        return {
            cacheHits: Object.keys(this._cache).filter(key => 
                this._cache[key].data && (Date.now() - this._cache[key].timestamp) < this._cache[key].ttl
            ).length,
            totalCacheKeys: Object.keys(this._cache).length,
            cacheStatus: Object.keys(this._cache).map(key => ({
                key,
                hasData: !!this._cache[key].data,
                age: Date.now() - this._cache[key].timestamp,
                ttl: this._cache[key].ttl
            }))
        };
    }
}

// Mantener compatibilidad con código existente
const ProductosService = ProductosServiceOptimized;

// Inicializar cuando se cargue la página
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        ProductosServiceOptimized.preloadCriticalData();
    });
}

console.log('🚀 ProductosService optimizado cargado');
