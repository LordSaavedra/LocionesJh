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
        adminPageSize: 15 // Menos productos en admin para carga rápida
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
            // Verificar cache primero
            const cacheKey = filtros.categoria ? filtros.categoria.toLowerCase() : 'productos';
            const cachedData = this._getCachedData(cacheKey);
            if (cachedData) {
                console.log(`⚡ Cache hit para ${cacheKey}: ${Date.now() - startTime}ms`);
                return cachedData;
            }

            // Verificar inicialización
            if (!supabaseClient) {
                const initialized = initSupabase();
                if (!initialized) {
                    throw new Error('Supabase no disponible');
                }
            }

            // Configurar paginación
            const pageSize = filtros.admin ? this.pagination.adminPageSize : this.pagination.pageSize;
            const page = filtros.page || 0;
            const offset = page * pageSize;

            console.log(`🔍 Consultando ${pageSize} productos desde ${offset}...`);

            // Query optimizada con límite
            let query = supabaseClient
                .from('productos')
                .select(`
                    id, 
                    nombre, 
                    precio, 
                    imagen_principal,
                    descripcion_corta,
                    categoria_id,
                    marca_id,
                    stock,
                    estado,
                    descuento
                `)
                .eq('activo', true)
                .range(offset, offset + pageSize - 1);

            // Aplicar filtros
            if (filtros.categoria) {
                // Buscar por nombre de categoría
                const { data: categoriaData } = await supabaseClient
                    .from('categorias')
                    .select('id')
                    .eq('nombre', filtros.categoria)
                    .single();
                
                if (categoriaData) {
                    query = query.eq('categoria_id', categoriaData.id);
                }
            }

            if (filtros.busqueda) {
                query = query.or(`nombre.ilike.%${filtros.busqueda}%,descripcion_corta.ilike.%${filtros.busqueda}%`);
            }

            // Ejecutar query con timeout
            const { data, error, count } = await Promise.race([
                query,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 8000)
                )
            ]);

            if (error) {
                console.error('❌ Error en consulta:', error);
                throw error;
            }

            // Procesar productos con imágenes optimizadas
            const productosOptimizados = (data || []).map(producto => ({
                ...producto,
                imagen_principal: this._optimizeImageUrl(producto.imagen_principal),
                estado: producto.estado || 'disponible',
                descuento: producto.descuento || 0
            }));

            // Guardar en cache
            this._setCachedData(cacheKey, productosOptimizados);

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

    // Método optimizado para admin panel
    static async obtenerProductosAdmin(page = 0) {
        return await this.obtenerProductosOptimizado({ 
            admin: true, 
            page: page,
            fallback: true
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
