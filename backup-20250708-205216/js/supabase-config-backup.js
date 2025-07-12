// Configuración de Supabase - Versión Corregida
const SUPABASE_URL = 'https://xelobsbzytdxrrxgmlta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbG9ic2J6eXRkeHJyeGdtbHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODUzNTksImV4cCI6MjA2NTk2MTM1OX0.bJL5DsL4pxlQ_FV3jX0ieiW3bYLA-Zf3M2HlNmdMMy4';

// Inicializar cliente de Supabase
let supabaseClient = null;

// Función para inicializar Supabase
function initSupabase() {
    try {
        console.log('🚀 Intentando inicializar Supabase...');
        console.log('📋 Verificando dependencias:', {
            window: typeof window !== 'undefined',
            supabase: typeof window?.supabase !== 'undefined',
            url: !!SUPABASE_URL,
            key: !!SUPABASE_ANON_KEY
        });
        
        if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {            // Configurar cliente con opciones de timeout y performance optimizadas
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                db: {
                    schema: 'public',
                    poolTimeout: 30000 // 30 segundos timeout para pool de conexiones
                },
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                },
                global: {
                    headers: {
                        'x-application-name': 'aromes-perfumeria',
                        'x-client-version': '1.0'
                    }
                },
                realtime: {
                    params: {
                        eventsPerSecond: 1
                    }
                }
            });
            
            // Hacer el cliente disponible globalmente
            window.supabaseClient = supabaseClient;
            
            console.log('✅ Supabase client created successfully with optimized config');
            console.log('📡 Cliente disponible:', !!supabaseClient);
            return true;
        }
        
        console.log('⚠️ Supabase not available or not configured');
        console.log('🔍 Debug info:', {
            windowDefined: typeof window !== 'undefined',
            supabaseLibrary: typeof window?.supabase,
            hasUrl: !!SUPABASE_URL,
            hasKey: !!SUPABASE_ANON_KEY
        });
        return false;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return false;
    }
}

// Funciones para productos
class ProductosService {
    // Cache para evitar múltiples requests simultáneos
    static _cache = {
        productos: null,
        lastFetch: 0,
        cacheDuration: 30000, // 30 segundos
        pendingRequest: null
    };    // Obtener todos los productos con cache y timeout optimizado
    static async obtenerProductos(filtros = {}) {
        // Verificar que Supabase esté inicializado
        if (!supabaseClient) {
            console.error('❌ Supabase client no inicializado');
            console.log('🔄 Intentando inicializar Supabase...');
            
            // Intentar inicializar Supabase
            const initialized = initSupabase();
            if (!initialized || !supabaseClient) {
                console.error('❌ No se pudo inicializar Supabase - verifique configuración');
                throw new Error('Supabase no disponible. Verifique la configuración de la base de datos.');
            }
            
            console.log('✅ Supabase inicializado exitosamente');
        }

        // Verificar cache si no hay filtros específicos
        const now = Date.now();
        if (!filtros.categoria && !filtros.busqueda && 
            this._cache.productos && 
            (now - this._cache.lastFetch) < this._cache.cacheDuration) {
            console.log('📋 Usando productos desde cache');
            return this._cache.productos;
        }

        // Si ya hay una request pendiente, esperarla
        if (this._cache.pendingRequest && !filtros.categoria && !filtros.busqueda) {
            console.log('⏳ Esperando request pendiente...');
            try {
                return await this._cache.pendingRequest;
            } catch (error) {
                console.warn('Request pendiente falló, continuando con nueva request');
                this._cache.pendingRequest = null;
            }
        }

        // Crear nueva request con timeout
        const requestPromise = this._obtenerProductosWithTimeout(filtros);
        
        // Guardar request pendiente solo si no hay filtros
        if (!filtros.categoria && !filtros.busqueda) {
            this._cache.pendingRequest = requestPromise;
        }

        try {
            const productos = await requestPromise;
            
            // Guardar en cache solo si no hay filtros
            if (!filtros.categoria && !filtros.busqueda) {
                this._cache.productos = productos;
                this._cache.lastFetch = now;
                this._cache.pendingRequest = null;
            }
            
            return productos;        } catch (error) {
            this._cache.pendingRequest = null;
            
            console.error('❌ Error obteniendo productos de Supabase:', error);
            console.error('📋 Detalles del error:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            
            // SIN FALLBACK - Solo Supabase
            console.error('❌ NO hay fallback local disponible. Debe funcionar Supabase.');
            throw new Error(`Error conectando a Supabase: ${error.message}. No hay datos de respaldo disponibles.`);
        }
    }    // Obtener productos con timeout optimizado
    static async _obtenerProductosWithTimeout(filtros = {}, timeoutMs = 10000) {
        return new Promise(async (resolve, reject) => {
            // Configurar timeout más agresivo
            const timeoutId = setTimeout(() => {
                reject(new Error('Request timeout: La consulta tardó demasiado tiempo (10s)'));
            }, timeoutMs);

            try {
                const startTime = performance.now();
                const resultado = await this._obtenerProductosQuery(filtros);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                console.log(`⚡ Query completada en ${duration.toFixed(2)}ms`);
                
                clearTimeout(timeoutId);
                resolve(resultado);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }    // Query optimizada para productos con métricas de performance
    static async _obtenerProductosQuery(filtros = {}) {
        try {
            console.log('🔍 Ejecutando query de productos con filtros:', filtros);
            const queryStartTime = performance.now();
            
            // Usar select específico en lugar de * para mejorar performance
            let query = supabaseClient
                .from('productos')
                .select('id, nombre, descripcion, precio, imagen_url, imagen, marca, categoria, subcategoria, activo, created_at, updated_at, estado, descuento')
                .eq('activo', true)
                .limit(100) // Limitar resultados para mejorar performance
                .order('created_at', { ascending: false });

            // Aplicar filtros básicos
            if (filtros.categoria) {
                query = query.eq('categoria', filtros.categoria);
                console.log(`🏷️ Filtro de categoría aplicado: ${filtros.categoria}`);
            }
            
            if (filtros.busqueda) {
                query = query.or(
                    `nombre.ilike.%${filtros.busqueda}%,` +
                    `descripcion.ilike.%${filtros.busqueda}%,` +
                    `marca.ilike.%${filtros.busqueda}%`
                );
                console.log(`🔍 Filtro de búsqueda aplicado: ${filtros.busqueda}`);
            }
            
            if (filtros.precioMin) {
                query = query.gte('precio', filtros.precioMin);
            }
            
            if (filtros.precioMax) {
                query = query.lte('precio', filtros.precioMax);
            }

            console.log('📡 Ejecutando consulta optimizada a Supabase...');
            const { data, error } = await query;
            
            const queryEndTime = performance.now();
            const queryDuration = queryEndTime - queryStartTime;
            console.log(`⏱️ Consulta ejecutada en ${queryDuration.toFixed(2)}ms`);
            
            if (error) {
                console.error('❌ Error obteniendo productos de Supabase:', error);
                
                // Si falla por columnas faltantes, intentar sin las columnas estado y descuento
                if (error.message && (error.message.includes('column') || error.code === '42703')) {
                    console.log('🔧 Intentando consulta sin columnas estado/descuento...');
                    return await this.obtenerProductosSinNuevasColumnas(filtros);
                }
                
                // Si es timeout específico, lanzar error para que se maneje arriba
                if (error.code === '57014') {
                    console.error('⏰ Timeout de base de datos detectado');
                    throw new Error('Database timeout - la consulta tardó demasiado');
                }
                
                // Para otros errores de base de datos, lanzar el error
                throw new Error(`Error de base de datos: ${error.message} (código: ${error.code})`);
            }
            
            console.log(`✅ Consulta exitosa: ${data?.length || 0} productos obtenidos`);
            
            // Normalizar productos para asegurar que tengan estado y descuento
            const productosNormalizados = (data || []).map(producto => ({
                ...producto,
                estado: producto.estado || 'disponible',
                descuento: producto.descuento || 0
            }));
            
            return productosNormalizados;
            
        } catch (error) {
            console.error('❌ Error en _obtenerProductosQuery:', error);
            
            // Si hay error de columna faltante, intentar sin esas columnas
            if (error.message && (error.message.includes('column') || error.code === '42703')) {
                console.log('🔧 Intentando consulta sin columnas estado/descuento...');
                return await this.obtenerProductosSinNuevasColumnas(filtros);
            }
            
            // Relanzar el error para que se maneje en el nivel superior
            throw error;
        }
    }    // Método auxiliar para obtener productos sin las columnas nuevas
    static async obtenerProductosSinNuevasColumnas(filtros = {}) {
        try {
            console.log('🔧 Ejecutando consulta sin columnas estado/descuento...');
            
            let query = supabaseClient
                .from('productos')
                .select('id, nombre, descripcion, precio, imagen_url, imagen, marca, categoria, subcategoria, activo, created_at, updated_at')
                .eq('activo', true)
                .limit(100) // Limitar resultados para mejorar performance
                .order('created_at', { ascending: false });

            // Aplicar filtros básicos
            if (filtros.categoria) {
                query = query.eq('categoria', filtros.categoria);
            }
            
            if (filtros.busqueda) {
                query = query.or(
                    `nombre.ilike.%${filtros.busqueda}%,` +
                    `descripcion.ilike.%${filtros.busqueda}%,` +
                    `marca.ilike.%${filtros.busqueda}%`
                );
            }
            
            if (filtros.precioMin) {
                query = query.gte('precio', filtros.precioMin);
            }
            
            if (filtros.precioMax) {
                query = query.lte('precio', filtros.precioMax);
            }

            const { data, error } = await query;
            
            if (error) {
                console.error('❌ Error obteniendo productos (sin columnas nuevas):', error);
                
                // Si es timeout específico, lanzar error para manejo superior
                if (error.code === '57014') {
                    throw new Error('Database timeout - la consulta tardó demasiado');
                }
                
                // Para otros errores de BD, lanzar error
                throw new Error(`Error de base de datos: ${error.message}`);
            }
            
            console.log(`✅ Consulta sin columnas nuevas exitosa: ${data?.length || 0} productos`);
            
            // Agregar valores por defecto para estado y descuento
            const productosNormalizados = (data || []).map(producto => ({
                ...producto,
                estado: 'disponible',
                descuento: 0
            }));
            
            console.log('⚠️ Productos obtenidos sin columnas estado/descuento. Agregue las columnas ejecutando el script SQL.');
            
            return productosNormalizados;
              } catch (error) {
            console.error('❌ Error en obtenerProductosSinNuevasColumnas:', error);
            
            // SIN FALLBACK - Solo Supabase
            console.error('❌ NO hay fallback local disponible');
            throw new Error(`Error en consulta alternativa: ${error.message}`);
        }
    }

    // Limpiar cache de productos
    static clearCache() {
        console.log('🗑️ Limpiando cache de productos...');
        this._cache.productos = null;
        this._cache.lastFetch = 0;
        this._cache.pendingRequest = null;
    }

    // Forzar recarga de productos
    static async forceReload(filtros = {}) {
        console.log('🔄 Forzando recarga de productos...');
        this.clearCache();
        return await this.obtenerProductos(filtros);
    }

    // Obtener producto por ID
    static async obtenerProductoPorId(id) {
        if (!supabaseClient) {
            return this.obtenerProductoLocalPorId(id);
        }

        try {
            const { data, error } = await supabaseClient
                .from('productos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error obteniendo producto:', error);
                
                // Si falla por columnas faltantes, intentar sin estado/descuento
                if (error.message && error.message.includes('column')) {
                    return await this.obtenerProductoPorIdSinNuevasColumnas(id);
                }
                
                return this.obtenerProductoLocalPorId(id);
            }

            // Normalizar producto para asegurar que tenga estado y descuento
            return {
                ...data,
                estado: data.estado || 'disponible',
                descuento: data.descuento || 0
            };
        } catch (error) {
            console.error('Error en obtenerProductoPorId:', error);
            
            // Si hay error de columna faltante, intentar sin esas columnas
            if (error.message && error.message.includes('column')) {
                return await this.obtenerProductoPorIdSinNuevasColumnas(id);
            }
            
            return this.obtenerProductoLocalPorId(id);
        }
    }

    // Método auxiliar para obtener producto por ID sin las columnas nuevas
    static async obtenerProductoPorIdSinNuevasColumnas(id) {
        try {
            const { data, error } = await supabaseClient
                .from('productos')
                .select('id, nombre, descripcion, precio, imagen_url, imagen, marca, categoria, subcategoria, activo, created_at, updated_at')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error obteniendo producto (sin columnas nuevas):', error);
                return this.obtenerProductoLocalPorId(id);
            }

            // Agregar valores por defecto para estado y descuento
            return {
                ...data,
                estado: 'disponible',
                descuento: 0
            };
        } catch (error) {
            console.error('Error en obtenerProductoPorIdSinNuevasColumnas:', error);
            return this.obtenerProductoLocalPorId(id);
        }
    }    // Obtener productos por categoría
    static async obtenerProductosPorCategoria(categoria) {
        console.log(`🔍 Buscando productos para categoría: "${categoria}"`);
          if (!supabaseClient) {
            throw new Error('Supabase no configurado - NO hay datos de respaldo disponibles');
        }

        try {
            // Obtener todos los productos activos primero
            const { data: allData, error: allError } = await supabaseClient
                .from('productos')
                .select('*')
                .eq('activo', true);
            
            if (allError) {                console.error('Error obteniendo productos:', allError);
                
                // Si falla por columnas faltantes, intentar sin estado/descuento
                if (allError.message && allError.message.includes('column')) {
                    console.log('🔧 Intentando consulta sin columnas estado/descuento...');
                    return await this.obtenerProductosPorCategoriaSinNuevasColumnas(categoria);
                }
                
                throw new Error(`Error obteniendo productos de categoría: ${allError.message}`);
            }
            
            console.log(`📦 ${allData.length} productos totales encontrados en la BD`);
            
            // Normalizar productos para asegurar que tengan estado y descuento
            const productosNormalizados = allData.map(producto => ({
                ...producto,
                estado: producto.estado || 'disponible',
                descuento: producto.descuento || 0
            }));
            
            // Log de todas las categorías para debugging
            const categorias = [...new Set(productosNormalizados.map(p => p.categoria).filter(Boolean))];
            console.log(`📂 Categorías disponibles en BD:`, categorias);
            
            // Filtrar productos para la categoría específica con mayor flexibilidad
            let filteredData = productosNormalizados.filter(product => {
                // Normalizar strings para comparación
                const normalize = (str) => str ? str.toLowerCase().trim() : '';
                const targetCategory = normalize(categoria);
                
                const matchCategory = normalize(product.categoria) === targetCategory;
                const matchSubcategory = normalize(product.subcategoria) === targetCategory;
                const matchTipo = normalize(product.tipo) === targetCategory;
                
                // Para "para-ellos", también buscar variantes comunes
                if (targetCategory === 'para-ellos') {
                    const isForMen = normalize(product.categoria).includes('ellos') ||
                                   normalize(product.categoria).includes('hombre') ||
                                   normalize(product.categoria).includes('masculino') ||
                                   normalize(product.subcategoria).includes('ellos') ||
                                   normalize(product.subcategoria).includes('hombre') ||
                                   normalize(product.subcategoria).includes('masculino');
                    
                    return matchCategory || matchSubcategory || matchTipo || isForMen;
                }
                
                return matchCategory || matchSubcategory || matchTipo;
            });
            
            console.log(`🎯 ${filteredData.length} productos filtrados para "${categoria}"`);
            
            // Log de productos encontrados para debugging
            if (filteredData.length > 0) {
                filteredData.forEach(product => {
                    console.log(`   - ${product.nombre} (cat: "${product.categoria}", subcat: "${product.subcategoria}")`);
                });
            }
              // Si no encuentra productos, retornar array vacío
            if (filteredData.length === 0) {
                console.warn(`⚠️ No se encontraron productos para "${categoria}" en Supabase`);
                return [];
            }
            
            return filteredData;
              } catch (error) {
            console.error('Error en obtenerProductosPorCategoria:', error);
            
            // Si hay error de columna faltante, intentar sin esas columnas
            if (error.message && error.message.includes('column')) {
                console.log('🔧 Intentando consulta sin columnas estado/descuento...');
                return await this.obtenerProductosPorCategoriaSinNuevasColumnas(categoria);
            }
            
            throw new Error(`Error obteniendo productos por categoría: ${error.message}`);
        }
    }

    // Método auxiliar para obtener productos por categoría sin las columnas nuevas
    static async obtenerProductosPorCategoriaSinNuevasColumnas(categoria) {
        try {
            const { data: allData, error: allError } = await supabaseClient
                .from('productos')
                .select('id, nombre, descripcion, precio, imagen_url, imagen, marca, categoria, subcategoria, activo, created_at, updated_at')
                .eq('activo', true);
              if (allError) {
                console.error('Error obteniendo productos (sin columnas nuevas):', allError);
                throw new Error(`Error en consulta alternativa: ${allError.message}`);
            }
            
            // Agregar valores por defecto para estado y descuento
            const productosNormalizados = allData.map(producto => ({
                ...producto,
                estado: 'disponible',
                descuento: 0
            }));
            
            // Filtrar por categoría
            let filteredData = productosNormalizados.filter(product => {
                const normalize = (str) => str ? str.toLowerCase().trim() : '';
                const targetCategory = normalize(categoria);
                
                const matchCategory = normalize(product.categoria) === targetCategory;
                const matchSubcategory = normalize(product.subcategoria) === targetCategory;
                const matchTipo = normalize(product.tipo) === targetCategory;
                
                if (targetCategory === 'para-ellos') {
                    const isForMen = normalize(product.categoria).includes('ellos') ||
                                   normalize(product.categoria).includes('hombre') ||
                                   normalize(product.categoria).includes('masculino') ||
                                   normalize(product.subcategoria).includes('ellos') ||
                                   normalize(product.subcategoria).includes('hombre') ||
                                   normalize(product.subcategoria).includes('masculino');
                    
                    return matchCategory || matchSubcategory || matchTipo || isForMen;
                }
                
                return matchCategory || matchSubcategory || matchTipo;
            });
            
            console.log('⚠️ Productos obtenidos sin columnas estado/descuento. Agregue las columnas ejecutando el script SQL.');
            
            return filteredData;        } catch (error) {
            console.error('Error en obtenerProductosPorCategoriaSinNuevasColumnas:', error);
            throw new Error(`Error en método alternativo: ${error.message}`);
        }
    }

    // Buscar productos
    static async buscarProductos(termino) {
        return this.obtenerProductos({ busqueda: termino });
    }

    // Obtener categorías
    static async obtenerCategorias() {
        if (!supabaseClient) {
            return [
                { id: 1, nombre: 'Para Ellos', slug: 'para-ellos' },
                { id: 2, nombre: 'Para Ellas', slug: 'para-ellas' },
                { id: 3, nombre: 'Unisex', slug: 'unisex' },
                { id: 4, nombre: 'Clásicas', slug: 'clasicas' },
                { id: 5, nombre: 'Vintage', slug: 'vintage' }
            ];
        }

        try {
            const { data, error } = await supabaseClient
                .from('categorias')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) {
                console.error('Error obteniendo categorías:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error en obtenerCategorias:', error);
            return [];
        }
    }

    // Obtener marcas
    static async obtenerMarcas() {
        if (!supabaseClient) {
            return [
                { id: 1, nombre: 'Chanel' },
                { id: 2, nombre: 'Dior' },
                { id: 3, nombre: 'Tom Ford' },
                { id: 4, nombre: 'Versace' },
                { id: 5, nombre: 'Paco Rabanne' }
            ];
        }

        try {
            const { data, error } = await supabaseClient
                .from('marcas')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) {
                console.error('Error obteniendo marcas:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error en obtenerMarcas:', error);
            return [];
        }
    }    // Crear producto
    static async crearProducto(producto) {
        if (!supabaseClient) {
            console.error('❌ Supabase no configurado');
            throw new Error('Supabase no está configurado');
        }

        try {
            console.log('💾 Creando producto:', producto.nombre);
            console.log('📝 Datos recibidos:', producto);
            
            // Validar datos requeridos
            if (!producto.nombre || !producto.marca || !producto.precio || !producto.categoria) {
                throw new Error('Faltan campos requeridos: nombre, marca, precio, categoria');
            }
            
            // Validar y limpiar precio antes de enviar
            let precioValidado = Number(producto.precio);
            if (isNaN(precioValidado)) {
                throw new Error('El precio debe ser un número válido');
            }
            
            // Límites de precio para PostgreSQL integer
            const PRECIO_MAX = 2147483647;
            const PRECIO_MIN = 0;
            
            if (precioValidado > PRECIO_MAX) {
                console.warn(`⚠️ Precio ${precioValidado} excede máximo, ajustando a ${PRECIO_MAX}`);
                precioValidado = PRECIO_MAX;
            }
            
            if (precioValidado < PRECIO_MIN) {
                console.warn(`⚠️ Precio ${precioValidado} es negativo, ajustando a ${PRECIO_MIN}`);
                precioValidado = PRECIO_MIN;
            }
              // Validar y procesar imagen (URL o base64)
            let imagenUrl = null;
            let imagenBase64 = null;
            
            if (producto.imagen_url) {
                if (typeof producto.imagen_url === 'string') {
                    const imagenTrimmed = producto.imagen_url.trim();
                    
                    // Validar que no sea una cadena vacía
                    if (imagenTrimmed === '') {
                        imagenUrl = null;
                        imagenBase64 = null;
                    } else if (imagenTrimmed.startsWith('data:image/')) {
                        // Es una imagen base64
                        imagenBase64 = imagenTrimmed;
                        imagenUrl = null;
                        console.log('🖼️ Imagen base64 detectada:', `${imagenBase64.substring(0, 50)}... (${imagenBase64.length} caracteres)`);
                    } else {
                        // Es una URL normal
                        imagenUrl = imagenTrimmed;
                        imagenBase64 = null;
                        console.log('🔗 URL de imagen detectada:', imagenUrl);
                    }
                } else {
                    console.warn('⚠️ imagen_url no es string, ignorando:', typeof producto.imagen_url);
                    imagenUrl = null;
                    imagenBase64 = null;
                }
            }
            
            // Preparar datos BÁSICOS del producto (solo columnas que seguramente existen)
            const productDataBasic = {
                nombre: producto.nombre.trim(),
                marca: producto.marca.trim(),
                precio: precioValidado,
                categoria: producto.categoria,
                activo: producto.activo !== false // por defecto true
            };
            
            // Agregar campos opcionales solo si se proporcionan y son válidos
            if (producto.descripcion && typeof producto.descripcion === 'string') {
                productDataBasic.descripcion = producto.descripcion.trim();
            }
            
            if (producto.notas && typeof producto.notas === 'string') {
                productDataBasic.notas = producto.notas.trim();
            }
            
            if (producto.subcategoria && typeof producto.subcategoria === 'string') {
                productDataBasic.subcategoria = producto.subcategoria.trim();
            }
              // Agregar imágenes solo si son válidas
            if (imagenUrl) {
                productDataBasic.imagen_url = imagenUrl;
                console.log('🔗 Agregando URL de imagen al producto');
            }
            
            if (imagenBase64) {
                productDataBasic.imagen = imagenBase64;
                console.log('🖼️ Agregando imagen base64 al producto');
            }
            
            console.log('📤 Enviando datos básicos a Supabase:', productDataBasic);

            let { data, error } = await supabaseClient
                .from('productos')
                .insert([productDataBasic])
                .select()
                .single();

            if (error) {
                console.error('❌ Error de Supabase:', error);
                console.error('❌ Detalles del error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                
                // Manejar errores específicos
                if (error.message.includes('numeric field overflow')) {
                    throw new Error('El precio es demasiado alto. El máximo permitido es $2,147,483,647 COP.');
                }
                
                if (error.message.includes('duplicate key') || error.message.includes('unique_violation')) {
                    throw new Error('Ya existe un producto con ese nombre. Por favor usa un nombre diferente.');
                }
                
                if (error.message.includes('violates not-null constraint')) {
                    throw new Error('Faltan campos requeridos en la base de datos. Verifica que todos los campos obligatorios estén llenos.');
                }
                
                if (error.message.includes('column') && error.message.includes('does not exist')) {
                    console.error('❌ Error de columna:', error.message);
                    throw new Error('Error de estructura de base de datos. Algunas columnas no existen.');
                }
                
                // Si hay error, intentar solo con campos absolutamente mínimos
                console.log('🔄 Reintentando con campos mínimos...');
                
                const productDataMinimal = {
                    nombre: producto.nombre.trim(),
                    marca: producto.marca.trim(),
                    precio: precioValidado,
                    categoria: producto.categoria
                };
                
                console.log('🔄 Enviando datos mínimos:', productDataMinimal);
                
                const { data: retryData, error: retryError } = await supabaseClient
                    .from('productos')
                    .insert([productDataMinimal])
                    .select()
                    .single();
                    
                if (retryError) {
                    console.error('❌ Error en reintento:', retryError);
                    
                    if (retryError.message.includes('numeric field overflow')) {
                        throw new Error('Error de precio: El valor es demasiado alto para la base de datos.');
                    }
                    
                    if (retryError.message.includes('violates not-null constraint')) {
                        throw new Error('Error de base de datos: Faltan campos requeridos que no se pueden omitir.');
                    }
                    
                    throw new Error(`Error de base de datos: ${retryError.message}`);
                }
                
                console.log('✅ Producto creado con datos mínimos:', retryData);
                data = retryData;
            } else {
                console.log('✅ Datos básicos creados exitosamente');
            }

            // Intentar agregar campos adicionales (estado y descuento) si existen
            if (data && data.id && (producto.estado !== undefined || producto.descuento !== undefined)) {
                console.log('🔄 Intentando agregar campos adicionales (estado/descuento)...');
                
                const additionalData = {};
                
                if (producto.estado !== undefined && typeof producto.estado === 'string') {
                    additionalData.estado = producto.estado;
                }
                
                if (producto.descuento !== undefined) {
                    const descuentoValidado = Number(producto.descuento);
                    if (!isNaN(descuentoValidado) && descuentoValidado >= 0 && descuentoValidado <= 100) {
                        additionalData.descuento = descuentoValidado;
                    }
                }
                
                if (Object.keys(additionalData).length > 0) {
                    try {
                        const { data: additionalUpdate, error: additionalError } = await supabaseClient
                            .from('productos')
                            .update(additionalData)
                            .eq('id', data.id)
                            .select()
                            .single();

                        if (additionalError) {
                            console.warn('⚠️ No se pudieron agregar campos adicionales:', additionalError.message);
                            // No fallar, solo advertir
                            if (additionalError.message.includes('descuento') || additionalError.message.includes('estado')) {
                                console.warn('⚠️ Las columnas estado/descuento no existen. Ejecuta el script SQL para agregarlas.');
                            }
                        } else {
                            console.log('✅ Campos adicionales agregados exitosamente');
                            data = additionalUpdate; // Usar la data más actualizada
                        }
                    } catch (additionalCatchError) {
                        console.warn('⚠️ Error agregando campos adicionales (continuando):', additionalCatchError.message);
                    }
                } else {
                    console.log('📝 No hay campos adicionales válidos para agregar');
                }
            }

            console.log('✅ Producto creado exitosamente:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error en crearProducto:', error);
            throw error;
        }
    }// Actualizar producto existente
    static async updateProduct(productId, producto) {
        if (!supabaseClient) {
            console.error('❌ Supabase no configurado');
            throw new Error('Supabase no está configurado');
        }

        try {
            console.log(`💾 Actualizando producto ID ${productId}:`, producto.nombre);
              
            // Validar datos requeridos
            if (!producto.nombre || !producto.marca || !producto.precio || !producto.categoria) {
                throw new Error('Faltan campos requeridos: nombre, marca, precio, categoria');
            }
            
            // Validar y limpiar precio antes de enviar
            let precioValidado = Number(producto.precio);
            if (isNaN(precioValidado)) {
                throw new Error('El precio debe ser un número válido');
            }
            
            // Límites de precio para PostgreSQL integer
            const PRECIO_MAX = 2147483647;
            const PRECIO_MIN = 0;
            
            if (precioValidado > PRECIO_MAX) {
                console.warn(`⚠️ Precio ${precioValidado} excede máximo, ajustando a ${PRECIO_MAX}`);
                precioValidado = PRECIO_MAX;
            }
            
            if (precioValidado < PRECIO_MIN) {
                console.warn(`⚠️ Precio ${precioValidado} es negativo, ajustando a ${PRECIO_MIN}`);
                precioValidado = PRECIO_MIN;
            }
            
            // Preparar datos básicos del producto (campos que sabemos que existen)
            const productData = {
                nombre: producto.nombre.trim(),
                marca: producto.marca.trim(),
                precio: precioValidado,
                categoria: producto.categoria,
                activo: producto.activo !== false
            };
            
            // Agregar campos opcionales que probablemente existen
            if (producto.descripcion !== undefined) {
                productData.descripcion = producto.descripcion;
            }
            
            if (producto.subcategoria !== undefined) {
                productData.subcategoria = producto.subcategoria;
            }
            
            if (producto.notas !== undefined) {
                productData.notas = producto.notas;
            }
              // Manejar imágenes (URL o base64)
            if (producto.imagen_url !== undefined) {
                if (typeof producto.imagen_url === 'string') {
                    const imagenTrimmed = producto.imagen_url.trim();
                    
                    if (imagenTrimmed === '') {
                        productData.imagen_url = null;
                        productData.imagen = null;
                    } else if (imagenTrimmed.startsWith('data:image/')) {
                        // Es una imagen base64 - guardar en columna 'imagen'
                        productData.imagen = imagenTrimmed;
                        productData.imagen_url = null;
                        console.log('🖼️ Actualizando con imagen base64');
                    } else {
                        // Es una URL normal - guardar en columna 'imagen_url'
                        productData.imagen_url = imagenTrimmed;
                        productData.imagen = null;
                        console.log('🔗 Actualizando con URL de imagen');
                    }
                } else {
                    productData.imagen_url = null;
                    productData.imagen = null;
                }
            }
            
            console.log('📤 Enviando datos básicos de actualización a Supabase:', productData);

            // Intentar actualizar con datos básicos primero
            let { data, error } = await supabaseClient
                .from('productos')
                .update(productData)
                .eq('id', productId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error de Supabase al actualizar (datos básicos):', error);
                throw new Error(`Error de base de datos: ${error.message}`);
            }

            console.log('✅ Datos básicos actualizados exitosamente');

            // Intentar actualizar campos adicionales (estado y descuento) por separado
            if (producto.estado !== undefined || producto.descuento !== undefined) {
                console.log('🔄 Intentando actualizar campos adicionales (estado/descuento)...');
                
                const additionalData = {};
                
                if (producto.estado !== undefined) {
                    additionalData.estado = producto.estado;
                }
                
                if (producto.descuento !== undefined) {
                    additionalData.descuento = producto.descuento;
                }
                
                try {
                    const { data: additionalUpdate, error: additionalError } = await supabaseClient
                        .from('productos')
                        .update(additionalData)
                        .eq('id', productId)
                        .select()
                        .single();

                    if (additionalError) {
                        console.warn('⚠️ No se pudieron actualizar campos adicionales:', additionalError.message);
                        // No fallar, solo advertir
                        if (additionalError.message.includes('descuento') || additionalError.message.includes('estado')) {
                            console.warn('⚠️ Las columnas estado/descuento no existen. Ejecuta el script SQL para agregarlas.');
                        }
                    } else {
                        console.log('✅ Campos adicionales actualizados exitosamente');
                        data = additionalUpdate; // Usar la data más actualizada
                    }
                } catch (additionalCatchError) {
                    console.warn('⚠️ Error actualizando campos adicionales (continuando):', additionalCatchError.message);
                }
            }

            console.log('✅ Producto actualizado exitosamente:', data);
            return data;

        } catch (error) {
            console.error('❌ Error en updateProduct:', error);
            throw error;
        }
    }    // Eliminar producto
    static async deleteProduct(productId) {
        if (!supabaseClient) {
            console.error('❌ Supabase no configurado');
            throw new Error('Supabase no está configurado');
        }

        try {
            console.log(`🗑️ Eliminando producto ID: ${productId}`);

            // Primero verificar si el producto existe y obtener sus datos
            const { data: existingProduct, error: checkError } = await supabaseClient
                .from('productos')
                .select('id, nombre')
                .eq('id', productId)
                .single();

            if (checkError) {
                if (checkError.code === 'PGRST116') {
                    throw new Error('El producto no existe o ya fue eliminado');
                }
                throw new Error(`Error verificando producto: ${checkError.message}`);
            }

            console.log(`📋 Producto encontrado: ${existingProduct.nombre}`);

            // Proceder con la eliminación (método optimizado sin verificación posterior problemática)
            const { error } = await supabaseClient
                .from('productos')
                .delete()
                .eq('id', productId);

            if (error) {
                console.error('❌ Error de Supabase al eliminar:', error);
                
                // Manejar errores específicos
                if (error.message && error.message.includes('violates foreign key')) {
                    throw new Error('No se puede eliminar el producto porque está referenciado en otras tablas');
                } else if (error.code === 'PGRST116') {
                    throw new Error('El producto no existe o ya fue eliminado');
                } else {
                    throw new Error(`Error de base de datos: ${error.message}`);
                }
            }

            console.log('🗑️ Comando DELETE ejecutado sin errores');

            // En lugar de verificar si el producto ya no existe (que puede fallar),
            // confiar en que Supabase hizo su trabajo correctamente si no hay error
            console.log('✅ Producto eliminado exitosamente (método principal optimizado)');
            return { 
                success: true, 
                deletedProduct: existingProduct,
                message: `Producto "${existingProduct.nombre}" eliminado exitosamente`
            };

        } catch (error) {
            console.error('❌ Error en deleteProduct:', error);
            throw error;
        }
    }// Método alternativo de eliminación (más simple y robusto)
    static async deleteProductSimple(productId) {
        if (!supabaseClient) {
            console.error('❌ Supabase no configurado');
            throw new Error('Supabase no está configurado');
        }

        try {
            console.log(`🗑️ Eliminando producto ID: ${productId} (método simple)`);

            // Obtener información del producto antes de eliminarlo (opcional)
            let productInfo = null;
            try {
                const { data } = await supabaseClient
                    .from('productos')
                    .select('id, nombre')
                    .eq('id', productId)
                    .single();
                productInfo = data;
            } catch (infoError) {
                console.warn('⚠️ No se pudo obtener info del producto, continuando con eliminación');
            }

            // Proceder con eliminación simple sin verificaciones complejas
            const { error } = await supabaseClient
                .from('productos')
                .delete()
                .eq('id', productId);

            if (error) {
                console.error('❌ Error de Supabase al eliminar (simple):', error);
                
                if (error.message && error.message.includes('violates foreign key')) {
                    throw new Error('No se puede eliminar el producto porque está referenciado en otras tablas');
                } else if (error.code === 'PGRST116') {
                    // En el contexto de DELETE, PGRST116 puede significar que no había nada que eliminar
                    console.log('ℹ️ PGRST116 en DELETE - producto posiblemente ya eliminado');
                    return { 
                        success: true, 
                        message: `Producto eliminado exitosamente (ya no existía)`
                    };
                } else {
                    throw new Error(`Error de base de datos: ${error.message}`);
                }
            }

            console.log('✅ Comando DELETE ejecutado exitosamente (método simple)');
            
            const productName = productInfo?.nombre || `ID ${productId}`;
            return { 
                success: true, 
                deletedProduct: productInfo,
                message: `Producto "${productName}" eliminado exitosamente`
            };

        } catch (error) {
            console.error('❌ Error en deleteProductSimple:', error);
            throw error;
        }
    }    // Datos locales eliminados - SOLO Supabase

    // Función para forzar carga SOLO desde Supabase (sin fallback)
    static async obtenerProductosSupabaseOnly(filtros = {}) {
        console.log('🎯 FORZANDO carga SOLO desde Supabase (sin fallback local)');
        
        if (!supabaseClient) {
            throw new Error('Supabase no está disponible. No se puede cargar datos sin fallback.');
        }
        
        try {
            const productos = await this._obtenerProductosQuery(filtros);
            console.log(`✅ Productos cargados exitosamente desde Supabase: ${productos.length}`);
            
            // Verificar que realmente son datos de Supabase
            if (productos.length > 0) {
                const firstProduct = productos[0];
                console.log('🔍 Verificando origen de datos:');
                console.log(`   - ID: ${firstProduct.id} (${typeof firstProduct.id})`);
                console.log(`   - Imagen: ${firstProduct.imagen_url}`);
                
                // Si detectamos características de datos locales, lanzar error
                if (firstProduct.imagen_url?.includes('LOCIONES_PARA') || 
                    (typeof firstProduct.id === 'number' && firstProduct.id < 20)) {
                    throw new Error('Los datos obtenidos parecen ser locales en lugar de Supabase');
                }
            }
            
            return productos;
        } catch (error) {
            console.error('❌ Error cargando SOLO desde Supabase:', error);
            throw new Error(`Error cargando desde Supabase: ${error.message}`);
        }
    }

    // Función de diagnóstico de performance
    static async diagnosticarPerformance() {
        console.log('🔬 Iniciando diagnóstico de performance...');
        const results = {
            timestamp: new Date().toISOString(),
            tests: [],
            recommendations: []
        };
        
        try {
            // Test 1: Conexión a Supabase
            const connectStart = performance.now();
            const isConnected = !!supabaseClient;
            const connectEnd = performance.now();
            
            results.tests.push({
                name: 'Conexión Supabase',
                duration: connectEnd - connectStart,
                success: isConnected,
                details: isConnected ? 'Cliente conectado' : 'Cliente no inicializado'
            });
            
            if (!isConnected) {
                results.recommendations.push('Verificar configuración de Supabase y conexión a internet');
                return results;
            }
            
            // Test 2: Query simple
            const simpleQueryStart = performance.now();
            try {
                const { data, error } = await supabaseClient
                    .from('productos')
                    .select('count', { count: 'exact' })
                    .eq('activo', true)
                    .limit(1);
                
                const simpleQueryEnd = performance.now();
                results.tests.push({
                    name: 'Query simple (count)',
                    duration: simpleQueryEnd - simpleQueryStart,
                    success: !error,
                    details: error ? error.message : `${data?.[0]?.count || 0} productos activos`
                });
                
                if (simpleQueryEnd - simpleQueryStart > 2000) {
                    results.recommendations.push('Conexión lenta detectada - verificar red o servidor');
                }
            } catch (queryError) {
                results.tests.push({
                    name: 'Query simple (count)',
                    duration: performance.now() - simpleQueryStart,
                    success: false,
                    details: queryError.message
                });
                results.recommendations.push('Error en consulta básica - revisar permisos de base de datos');
            }
            
            // Test 3: Query completa
            const fullQueryStart = performance.now();
            try {
                const { data, error } = await supabaseClient
                    .from('productos')
                    .select('id, nombre, precio, categoria')
                    .eq('activo', true)
                    .limit(10);
                
                const fullQueryEnd = performance.now();
                results.tests.push({
                    name: 'Query productos (10 registros)',
                    duration: fullQueryEnd - fullQueryStart,
                    success: !error,
                    details: error ? error.message : `${data?.length || 0} productos obtenidos`
                });
                
                if (fullQueryEnd - fullQueryStart > 1500) {
                    results.recommendations.push('Consulta de productos lenta - considerar índices en BD');
                }
            } catch (queryError) {
                results.tests.push({
                    name: 'Query productos (10 registros)',
                    duration: performance.now() - fullQueryStart,
                    success: false,
                    details: queryError.message
                });
            }
            
            // Test 4: Procesamiento local
            const processStart = performance.now();
            const testData = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                nombre: `Producto ${i}`,
                precio: Math.random() * 1000000,
                categoria: i % 2 === 0 ? 'para-ellos' : 'para-ellas'
            }));
            
            const filtered = testData.filter(p => p.categoria === 'para-ellos');
            const processEnd = performance.now();
            
            results.tests.push({
                name: 'Procesamiento local (100 registros)',
                duration: processEnd - processStart,
                success: true,
                details: `${filtered.length} productos filtrados`
            });
            
            // Generar recomendaciones
            const totalDuration = results.tests.reduce((sum, test) => sum + test.duration, 0);
            if (totalDuration > 5000) {
                results.recommendations.push('Performance general lenta - revisar conexión de red');
            }
            
            const failedTests = results.tests.filter(test => !test.success);
            if (failedTests.length > 0) {
                results.recommendations.push(`${failedTests.length} pruebas fallaron - revisar configuración`);
            }
            
            if (results.recommendations.length === 0) {
                results.recommendations.push('Performance normal - no se detectaron problemas');
            }
            
        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
            results.tests.push({
                name: 'Diagnóstico general',
                duration: 0,
                success: false,
                details: error.message
            });
            results.recommendations.push('Error crítico en diagnóstico - revisar configuración completa');
        }
        
        console.log('📊 Resultados de diagnóstico:', results);
        return results;
    }
}

// Funciones para manejo de Storage (imágenes)
class ImageStorageService {
    // Subir imagen al storage de Supabase
    static async uploadImage(file, fileName) {
        if (!supabaseClient) {
            throw new Error('Supabase no está configurado');
        }

        try {
            console.log('📤 Subiendo imagen:', fileName);
            
            // Validar archivo
            if (!file || !(file instanceof File)) {
                throw new Error('Archivo no válido');
            }
            
            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('El archivo es demasiado grande. Máximo 5MB.');
            }
            
            // Validar tipo
            if (!file.type.startsWith('image/')) {
                throw new Error('El archivo debe ser una imagen');
            }
            
            // Crear nombre único para evitar colisiones
            const timestamp = new Date().getTime();
            const extension = file.name.split('.').pop();
            const uniqueFileName = `productos/${timestamp}_${fileName}.${extension}`;
            
            console.log('📁 Nombre de archivo:', uniqueFileName);
            
            // Subir archivo
            const { data, error } = await supabaseClient.storage
                .from('imagenes') // nombre del bucket
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
                
            if (error) {
                console.error('❌ Error subiendo imagen:', error);
                throw new Error(`Error subiendo imagen: ${error.message}`);
            }
            
            console.log('✅ Imagen subida:', data);
            
            // Obtener URL pública
            const { data: urlData } = supabaseClient.storage
                .from('imagenes')
                .getPublicUrl(uniqueFileName);
                
            if (!urlData || !urlData.publicUrl) {
                throw new Error('No se pudo obtener la URL pública de la imagen');
            }
            
            console.log('🔗 URL pública generada:', urlData.publicUrl);
            return urlData.publicUrl;
            
        } catch (error) {
            console.error('❌ Error en uploadImage:', error);
            throw error;
        }
    }
    
    // Subir imagen desde base64
    static async uploadImageFromBase64(base64Data, fileName) {
        try {
            console.log('📤 Subiendo imagen desde base64...');
            
            // Convertir base64 a blob
            const response = await fetch(base64Data);
            const blob = await response.blob();
            
            // Crear archivo a partir del blob
            const file = new File([blob], fileName, { type: blob.type });
            
            // Usar la función de upload normal
            return await this.uploadImage(file, fileName);
            
        } catch (error) {
            console.error('❌ Error convirtiendo base64:', error);
            throw new Error('Error procesando imagen: ' + error.message);
        }
    }
    
    // Eliminar imagen del storage
    static async deleteImage(imagePath) {
        if (!supabaseClient) {
            throw new Error('Supabase no está configurado');
        }
        
        try {
            console.log('🗑️ Eliminando imagen:', imagePath);
            
            // Extraer el path relativo de la URL completa
            const relativePath = imagePath.includes('/storage/v1/object/public/imagenes/') 
                ? imagePath.split('/storage/v1/object/public/imagenes/')[1]
                : imagePath;
            
            const { error } = await supabaseClient.storage
                .from('imagenes')
                .remove([relativePath]);
                
            if (error) {
                console.error('❌ Error eliminando imagen:', error);
                throw new Error(`Error eliminando imagen: ${error.message}`);
            }
            
            console.log('✅ Imagen eliminada');
            return true;
            
        } catch (error) {
            console.error('❌ Error en deleteImage:', error);
            throw error;
        }
    }
}

// Función utilitaria para formatear precios
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(precio);
}

// Función para probar conexión
async function testSupabaseConnection() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Cliente de Supabase no inicializado');
            return false;
        }
        
        // Probar una consulta simple
        const { data, error } = await supabaseClient
            .from('productos')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Error probando conexión:', error);
            return false;
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        return true;
        
    } catch (error) {
        console.error('❌ Error en testSupabaseConnection:', error);
        return false;
    }
}

// Función para verificar estructura de tabla
async function verificarEstructuraTabla() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase no configurado');
            return null;
        }
        
        // Intentar obtener estructura de la tabla
        const { data, error } = await supabaseClient
            .rpc('get_table_columns', { table_name: 'productos' })
            .single();
            
        if (error) {
            console.log('📋 Verificando estructura con método alternativo...');
            
            // Método alternativo: intentar una consulta vacía para ver las columnas
            const { data: emptyData, error: emptyError } = await supabaseClient
                .from('productos')
                .select('*')
                .limit(0);
                
            if (emptyError) {
                console.error('❌ Error verificando tabla:', emptyError);
                return null;
            }
            
            console.log('✅ Tabla productos accesible');
            return true;
        }
        
        console.log('📋 Estructura de tabla productos:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error verificando estructura:', error);
        return null;
    }
}

// Inicializar cuando se carga el script
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Supabase...');
    const supabaseInicializado = initSupabase();
    if (supabaseInicializado) {
        console.log('✅ Supabase inicializado correctamente');
    } else {
        console.warn('⚠️ Supabase no configurado - usando datos locales como fallback');
    }
});

// También inicializar inmediatamente si DOM ya está listo
if (document.readyState === 'loading') {
    // DOM aún está cargando
    document.addEventListener('DOMContentLoaded', function() {
        initSupabase();
    });
} else {
    // DOM ya está listo
    initSupabase();
}

// Función para verificar si Supabase está listo
function isSupabaseReady() {
    const isReady = supabaseClient !== null && typeof supabaseClient !== 'undefined';
    console.log('🔍 Verificando estado Supabase:', {
        clientExists: !!supabaseClient,
        clientType: typeof supabaseClient,
        isReady: isReady
    });
    return isReady;
}

// Función de debug para verificar conexión
async function debugSupabaseConnection() {
    console.log('🔧 Debug de conexión Supabase:');
    console.log('1. Cliente:', !!supabaseClient);
    console.log('2. Tipo:', typeof supabaseClient);
    console.log('3. URL configurada:', !!SUPABASE_URL);
    console.log('4. Key configurada:', !!SUPABASE_ANON_KEY);
    
    if (!supabaseClient) {
        console.log('❌ Cliente no inicializado');
        return false;
    }
    
    try {
        console.log('🧪 Probando consulta simple...');
        const { data, error } = await supabaseClient
            .from('productos')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Error en consulta de prueba:', error);
            return false;
        }
        
        console.log('✅ Conexión verificada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error verificando conexión:', error);
        return false;
    }
}

// Exportar para uso global
window.ProductosService = ProductosService;
window.formatearPrecio = formatearPrecio;
window.initSupabase = initSupabase;
window.isSupabaseReady = isSupabaseReady;
window.debugSupabaseConnection = debugSupabaseConnection;
window.supabaseClient = supabaseClient;
