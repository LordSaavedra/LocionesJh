// QRService - Actualizado para estructura real de Supabase
class QRService {
    constructor() {
        this.supabase = null;
        this.initSupabase();
        console.log('🔧 QRService inicializado con estructura real');
    }

    // Inicializar conexión Supabase
    initSupabase() {
        try {
            // Primero intentar usar el cliente global
            if (window.supabaseClient) {
                this.supabase = window.supabaseClient;
                console.log('✅ Usando cliente Supabase global existente');
                return;
            }

            // Si no existe, crear uno nuevo
            if (typeof window !== 'undefined' && window.supabase) {
                const SUPABASE_URL = 'https://xelobsbzytdxrrxgmlta.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbG9ic2J6eXRkeHJyeGdtbHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODUzNTksImV4cCI6MjA2NTk2MTM1OX0.bJL5DsL4pxlQ_FV3jX0ieiW3bYLA-Zf3M2HlNmdMMy4';
                
                this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                window.supabaseClient = this.supabase;
                console.log('✅ Cliente Supabase creado para QRService');
            } else {
                console.warn('⚠️ Supabase no disponible en window');
            }
        } catch (error) {
            console.error('❌ Error inicializando Supabase en QRService:', error);
        }
    }

    // Verificar disponibilidad de Supabase
    isSupabaseAvailable() {
        return typeof this.supabase !== 'undefined' && this.supabase !== null;
    }

    // Generar ID único para QR
    generateQRId() {
        return 'QR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Crear URL de verificación
    createVerificationURL(qrId, productId) {
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        return `${baseUrl}/verificacion-qr.html?qr=${qrId}`;
    }

    // Crear nuevo QR
    async createQRCode(qrData) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('⚠️ Supabase no disponible, usando localStorage');
                return this.saveQRToLocalStorage(qrData);
            }

            console.log('📝 Creando QR en Supabase:', qrData.id);

            // Estructura básica que debería funcionar siempre
            const qrRecord = {
                qr_code: qrData.id, // Campo obligatorio
                producto_id: parseInt(qrData.productId),
                total_escaneos: 0, // ✅ Campo confirmado que existe
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Agregar campos opcionales solo si existen
            if (qrData.lote) qrRecord.lote = qrData.lote;
            if (qrData.fechaProduccion) qrRecord.fecha_produccion = qrData.fechaProduccion;
            if (qrData.notas) qrRecord.notas = qrData.notas;
            
            // Intentar agregar fecha_creacion (campo común)
            try {
                qrRecord.fecha_creacion = new Date().toISOString();
            } catch (e) {
                console.warn('⚠️ fecha_creacion no disponible');
            }

            console.log('📝 Datos a insertar:', qrRecord);

            const { data, error } = await this.supabase
                .from('qr_codes')
                .insert([qrRecord])
                .select()
                .single();

            if (error) {
                console.error('❌ Error Supabase:', error);
                throw error;
            }

            console.log('✅ QR creado exitosamente en BASE DE DATOS:', data.qr_code);
            return data;

        } catch (error) {
            console.error('❌ Error creando QR:', error);
            throw error; // NO usar fallback, forzar que se arregle la conexión
        }
    }

    // Obtener información de QR
    async getQRInfo(qrId) {
        try {
            if (!this.isSupabaseAvailable()) {
                throw new Error('⚠️ SUPABASE REQUERIDO - No se usará localStorage');
            }

            console.log('🔍 Consultando QR en BASE DE DATOS:', qrId);

            // Primero obtener el QR sin JOIN
            const { data, error } = await this.supabase
                .from('qr_codes')
                .select('*')
                .eq('qr_code', qrId)
                .single();

            if (error) {
                console.error('❌ Error consultando Supabase:', error);
                throw error;
            }

            if (!data) {
                console.log('❌ QR no encontrado en base de datos');
                return null;
            }

            console.log('✅ QR encontrado en BASE DE DATOS:', data.qr_code);

            // Si hay producto_id, intentar obtener info del producto por separado
            let productoInfo = null;
            if (data.producto_id) {
                try {
                    const { data: producto } = await this.supabase
                        .from('productos')
                        .select('id, nombre, marca, precio, categoria, subcategoria, descripcion, imagen_url, ml, stock, estado, luxury')
                        .eq('id', data.producto_id)
                        .single();
                    
                    if (producto) {
                        productoInfo = {
                            id: producto.id,
                            nombre: producto.nombre,
                            marca: producto.marca,
                            precio: producto.precio,
                            ml: producto.ml,
                            categoria: producto.categoria,
                            descripcion: producto.descripcion,
                            imagen_url: producto.imagen_url,
                            luxury: producto.luxury,
                            stock: producto.stock,
                            estado: producto.estado
                        };
                        console.log('✅ Información del producto obtenida:', producto.nombre);
                    }
                } catch (productoError) {
                    console.warn('⚠️ No se pudo obtener info del producto:', productoError);
                }
            }

            return {
                qr: {
                    id: data.qr_code,
                    lote: data.lote || null,
                    fechaProduccion: data.fecha_produccion || null,
                    fechaCreacion: data.fecha_creacion || data.created_at,
                    notas: data.notas || null,
                    totalEscaneos: data.total_escaneos || 0,
                    primerEscaneo: null, // Campo temporal hasta confirmar nombre correcto
                    activo: true
                },
                producto: productoInfo
            };

        } catch (error) {
            console.error('❌ Error obteniendo QR de BASE DE DATOS:', error);
            throw error; // NO usar localStorage
        }
    }

    // Registrar escaneo
    async registerScan(qrId, additionalData = {}) {
        try {
            if (!this.isSupabaseAvailable()) {
                throw new Error('⚠️ SUPABASE REQUERIDO - No se usará localStorage');
            }

            console.log('📊 Registrando escaneo en BASE DE DATOS:', qrId);

            // Obtener el QR actual - solo campos básicos
            const { data: currentQR, error: getError } = await this.supabase
                .from('qr_codes')
                .select('total_escaneos') // Solo el campo que sabemos que existe
                .eq('qr_code', qrId)
                .single();

            if (getError) {
                throw getError;
            }

            const newScanCount = (currentQR.total_escaneos || 0) + 1;
            const now = new Date().toISOString();

            // Actualizar solo contador básico
            const updateData = {
                total_escaneos: newScanCount,
                updated_at: now
            };

            const { error: updateError } = await this.supabase
                .from('qr_codes')
                .update(updateData)
                .eq('qr_code', qrId);

            if (updateError) {
                throw updateError;
            }

            console.log('✅ Escaneo registrado en BASE DE DATOS:', qrId, '- Total:', newScanCount);
            return true;

        } catch (error) {
            console.error('❌ Error registrando escaneo en BASE DE DATOS:', error);
            throw error; // NO usar localStorage
        }
    }

    // Obtener todos los QRs
    async getAllQRs() {
        try {
            if (!this.isSupabaseAvailable()) {
                throw new Error('⚠️ SUPABASE REQUERIDO - No se usará localStorage');
            }

            console.log('📋 Obteniendo QRs de BASE DE DATOS...');

            // Obtener QRs sin JOIN
            const { data, error } = await this.supabase
                .from('qr_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            console.log('✅ QRs obtenidos de BASE DE DATOS:', data.length);

            // Obtener información de productos para cada QR
            const qrsWithProducts = await Promise.all(
                data.map(async (item) => {
                    let productoInfo = {
                        nombre: `Producto ${item.producto_id}`,
                        marca: 'N/A'
                    };

                    // Intentar obtener información real del producto
                    if (item.producto_id) {
                        try {
                            const { data: producto } = await this.supabase
                                .from('productos')
                                .select('nombre, marca')
                                .eq('id', item.producto_id)
                                .single();
                            
                            if (producto) {
                                productoInfo = {
                                    nombre: producto.nombre || `Producto ${item.producto_id}`,
                                    marca: producto.marca || 'N/A'
                                };
                            }
                        } catch (prodError) {
                            console.warn(`⚠️ No se pudo obtener producto ${item.producto_id}:`, prodError);
                        }
                    }

                    return {
                        id: item.qr_code,
                        productId: item.producto_id,
                        producto: productoInfo,
                        lote: item.lote || null,
                        fechaCreacion: item.fecha_creacion || item.created_at,
                        totalEscaneos: item.total_escaneos || 0,
                        primerEscaneo: null,
                        url: this.createVerificationURL(item.qr_code, item.producto_id),
                        activo: true
                    };
                })
            );

            console.log('✅ QRs con información de productos obtenidos');
            return qrsWithProducts;

        } catch (error) {
            console.error('❌ Error obteniendo QRs de BASE DE DATOS:', error);
            throw error; // NO usar localStorage
        }
    }

    // Estadísticas de QRs
    async getQRStats() {
        try {
            if (!this.isSupabaseAvailable()) {
                throw new Error('⚠️ SUPABASE REQUERIDO - No se usará localStorage');
            }

            console.log('📊 Obteniendo estadísticas de BASE DE DATOS...');

            const { data, error } = await this.supabase
                .from('qr_codes')
                .select('qr_code, total_escaneos, fecha_creacion, created_at'); // Campos básicos confirmados

            if (error) {
                throw error;
            }

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const stats = {
                totalQRs: data.length,
                qrsEscaneados: data.filter(qr => (qr.total_escaneos || 0) > 0).length,
                qrsHoy: data.filter(qr => {
                    const fecha = qr.fecha_creacion || qr.created_at;
                    return fecha && new Date(fecha) >= today;
                }).length,
                qrsSemana: data.filter(qr => {
                    const fecha = qr.fecha_creacion || qr.created_at;
                    return fecha && new Date(fecha) >= weekAgo;
                }).length,
                totalEscaneos: data.reduce((sum, qr) => sum + (qr.total_escaneos || 0), 0)
            };

            console.log('✅ Estadísticas obtenidas de BASE DE DATOS:', stats);
            return stats;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de BASE DE DATOS:', error);
            throw error; // NO usar localStorage
        }
    }

    // Eliminar QR
    async deleteQR(qrId) {
        try {
            if (!this.isSupabaseAvailable()) {
                return this.deleteQRFromLocalStorage(qrId);
            }

            console.log('🗑️ Eliminando QR de BASE DE DATOS:', qrId);

            // Eliminar completamente el QR (más simple que marcar como inactivo)
            const { error } = await this.supabase
                .from('qr_codes')
                .delete()
                .eq('qr_code', qrId);

            if (error) {
                throw error;
            }

            console.log('✅ QR eliminado de BASE DE DATOS:', qrId);
            return true;

        } catch (error) {
            console.error('❌ Error eliminando QR de BASE DE DATOS:', error);
            return this.deleteQRFromLocalStorage(qrId);
        }
    }

    // === MÉTODOS LOCALSTORAGE (FALLBACK) ===

    saveQRToLocalStorage(qrData) {
        try {
            const qrs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
            qrs.push({
                ...qrData,
                fechaCreacion: new Date().toISOString(),
                totalEscaneos: 0,
                activo: true
            });
            localStorage.setItem('qr_codes', JSON.stringify(qrs));
            console.log('💾 QR guardado en localStorage:', qrData.id);
            return qrData;
        } catch (error) {
            console.error('❌ Error guardando en localStorage:', error);
            throw error;
        }
    }

    getQRFromLocalStorage(qrId) {
        try {
            const qrs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
            const qr = qrs.find(q => q.id === qrId && q.activo);
            
            if (!qr) return null;

            return {
                qr: qr,
                producto: qr.producto || null
            };
        } catch (error) {
            console.error('❌ Error leyendo localStorage:', error);
            return null;
        }
    }

    getAllQRsFromLocalStorage() {
        try {
            const qrs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
            return qrs.filter(qr => qr.activo).sort((a, b) => 
                new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
            );
        } catch (error) {
            console.error('❌ Error leyendo QRs de localStorage:', error);
            return [];
        }
    }

    getQRStatsFromLocalStorage() {
        try {
            const qrs = this.getAllQRsFromLocalStorage();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            return {
                totalQRs: qrs.length,
                qrsEscaneados: qrs.filter(qr => qr.totalEscaneos > 0).length,
                qrsHoy: qrs.filter(qr => new Date(qr.fechaCreacion) >= today).length,
                qrsSemana: qrs.filter(qr => new Date(qr.fechaCreacion) >= weekAgo).length,
                totalEscaneos: qrs.reduce((sum, qr) => sum + (qr.totalEscaneos || 0), 0)
            };
        } catch (error) {
            console.error('❌ Error calculando stats localStorage:', error);
            return { totalQRs: 0, qrsEscaneados: 0, qrsHoy: 0, qrsSemana: 0, totalEscaneos: 0 };
        }
    }

    registerScanInLocalStorage(qrId) {
        try {
            const qrs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
            const qrIndex = qrs.findIndex(q => q.id === qrId);
            
            if (qrIndex !== -1) {
                qrs[qrIndex].totalEscaneos = (qrs[qrIndex].totalEscaneos || 0) + 1;
                qrs[qrIndex].ultimaVerificacion = new Date().toISOString();
                localStorage.setItem('qr_codes', JSON.stringify(qrs));
                console.log('📱 Escaneo registrado en localStorage:', qrId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error registrando escaneo en localStorage:', error);
            return false;
        }
    }

    deleteQRFromLocalStorage(qrId) {
        try {
            const qrs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
            const qrIndex = qrs.findIndex(q => q.id === qrId);
            
            if (qrIndex !== -1) {
                qrs[qrIndex].activo = false;
                localStorage.setItem('qr_codes', JSON.stringify(qrs));
                console.log('🗑️ QR marcado como inactivo en localStorage:', qrId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error eliminando QR de localStorage:', error);
            return false;
        }
    }
}

// Inicializar QRService globalmente
window.QRService = new QRService();
console.log('✅ QRService actualizado e inicializado globalmente');
