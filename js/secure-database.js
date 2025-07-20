// 🛡️ SECURE DATABASE CONNECTION MANAGER
// Protección multicapa contra ataques y vulnerabilidades

class DatabaseSecurityManager {
    constructor() {
        this.failedAttempts = 0;
        this.maxFailedAttempts = 5;
        this.lockoutTime = 300000; // 5 minutos
        this.isLocked = false;
        this.lockoutUntil = null;
        this.connectionTimeouts = new Map();
        this.requestCounts = new Map();
        this.suspiciousPatterns = [];
        this.sessionId = this.generateSessionId();
        
        console.log('🛡️ Database Security Manager initialized');
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    }

    // 🚫 PROTECCIÓN CONTRA BRUTE FORCE
    checkRateLimit(clientId = 'default') {
        const now = Date.now();
        const requests = this.requestCounts.get(clientId) || [];
        
        // Limpiar requests antiguos (últimos 60 segundos)
        const recentRequests = requests.filter(time => now - time < 60000);
        
        // Límite: 30 requests por minuto por cliente
        if (recentRequests.length >= 30) {
            console.warn('🚨 RATE LIMIT EXCEEDED:', {
                clientId,
                requests: recentRequests.length,
                timeWindow: '60s'
            });
            
            this.logSecurityIncident('RATE_LIMIT_EXCEEDED', {
                clientId,
                requestCount: recentRequests.length,
                timestamp: new Date().toISOString()
            });
            
            return false;
        }
        
        recentRequests.push(now);
        this.requestCounts.set(clientId, recentRequests);
        return true;
    }

    // 🕵️ DETECCIÓN DE PATRONES SOSPECHOSOS
    detectSuspiciousActivity(operation, params = {}) {
        const suspiciousPatterns = [
            // SQL Injection patterns
            /(\bunion\b.*\bselect\b)/i,
            /(\bdrop\b.*\btable\b)/i,
            /(\bdelete\b.*\bfrom\b)/i,
            /(1\s*=\s*1|1\s*=\s*'1')/i,
            /(\bor\b\s+\d+\s*=\s*\d+)/i,
            /(\band\b\s+\d+\s*=\s*\d+)/i,
            
            // Comment injection
            /(\-\-|\#|\/\*|\*\/)/,
            
            // XSS patterns
            /(<script|<iframe|<object|<embed)/i,
            /(javascript:|data:|vbscript:)/i,
            
            // File traversal
            /(\.\.|\/etc\/|\/windows\/|file:\/\/)/i,
            
            // Large data attempts
            /.{10000,}/, // Strings longer than 10k chars
        ];

        const dataToCheck = JSON.stringify({ operation, params });
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(dataToCheck)) {
                console.error('🚨 SUSPICIOUS PATTERN DETECTED:', {
                    pattern: pattern.source,
                    operation,
                    dataLength: dataToCheck.length,
                    timestamp: new Date().toISOString()
                });
                
                this.logSecurityIncident('SUSPICIOUS_PATTERN', {
                    pattern: pattern.source,
                    operation,
                    sessionId: this.sessionId
                });
                
                return true;
            }
        }
        
        return false;
    }

    // ⚡ CIRCUIT BREAKER PATTERN
    checkCircuitBreaker() {
        if (this.isLocked) {
            if (Date.now() > this.lockoutUntil) {
                this.isLocked = false;
                this.failedAttempts = 0;
                console.log('🔓 Circuit breaker reset - Database access restored');
                
                this.logSecurityIncident('CIRCUIT_BREAKER_RESET', {
                    previousFailures: this.maxFailedAttempts,
                    lockDuration: this.lockoutTime / 1000 + 's'
                });
            } else {
                const remaining = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
                console.warn(`🚫 DATABASE LOCKED - Try again in ${remaining} seconds`);
                return false;
            }
        }
        return true;
    }

    // ❌ REGISTRO DE FALLOS
    recordFailure(error, operation = 'unknown') {
        this.failedAttempts++;
        const errorInfo = {
            attempt: this.failedAttempts,
            maxAttempts: this.maxFailedAttempts,
            operation,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        console.error(`❌ Database operation failed (${this.failedAttempts}/${this.maxFailedAttempts}):`, errorInfo);
        
        if (this.failedAttempts >= this.maxFailedAttempts) {
            this.isLocked = true;
            this.lockoutUntil = Date.now() + this.lockoutTime;
            
            console.error('🔒 DATABASE ACCESS LOCKED due to multiple failures');
            
            this.logSecurityIncident('DATABASE_LOCKED', {
                reason: 'Multiple connection failures',
                lockoutDuration: this.lockoutTime / 1000 + 's',
                failedAttempts: this.failedAttempts
            });
        }
        
        this.logSecurityIncident('CONNECTION_FAILURE', errorInfo);
    }

    // ✅ REGISTRO DE ÉXITO
    recordSuccess(operation = 'unknown') {
        if (this.failedAttempts > 0) {
            console.log(`✅ Database connection restored (was ${this.failedAttempts} failures)`);
            this.failedAttempts = Math.max(0, this.failedAttempts - 1);
        }
        
        // Log successful operations for monitoring
        this.logActivity('SUCCESS', {
            operation,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId
        });
    }

    // 🔍 VALIDACIÓN DE ENTRADA
    validateInput(data, rules = {}) {
        const errors = [];
        
        // Validaciones básicas
        if (rules.required) {
            for (const field of rules.required) {
                if (!data[field] || data[field].toString().trim() === '') {
                    errors.push(`Field '${field}' is required`);
                }
            }
        }
        
        // Validaciones de tipo
        if (rules.types) {
            for (const [field, expectedType] of Object.entries(rules.types)) {
                if (data[field] !== undefined) {
                    const actualType = typeof data[field];
                    if (actualType !== expectedType) {
                        errors.push(`Field '${field}' must be ${expectedType}, got ${actualType}`);
                    }
                }
            }
        }
        
        // Validaciones de rango
        if (rules.ranges) {
            for (const [field, range] of Object.entries(rules.ranges)) {
                if (data[field] !== undefined) {
                    const value = data[field];
                    if (typeof value === 'number') {
                        if (value < range.min || value > range.max) {
                            errors.push(`Field '${field}' must be between ${range.min} and ${range.max}`);
                        }
                    } else if (typeof value === 'string') {
                        if (value.length < range.min || value.length > range.max) {
                            errors.push(`Field '${field}' length must be between ${range.min} and ${range.max}`);
                        }
                    }
                }
            }
        }
        
        // Validaciones de formato
        if (rules.formats) {
            for (const [field, pattern] of Object.entries(rules.formats)) {
                if (data[field] && !pattern.test(data[field])) {
                    errors.push(`Field '${field}' has invalid format`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 📊 LOGGING DE INCIDENTES DE SEGURIDAD
    logSecurityIncident(type, details) {
        const incident = {
            type,
            details,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Guardar en localStorage para análisis posterior
        const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
        incidents.push(incident);
        
        // Mantener solo los últimos 50 incidentes
        if (incidents.length > 50) {
            incidents.splice(0, incidents.length - 50);
        }
        
        localStorage.setItem('security_incidents', JSON.stringify(incidents));
        
        // En producción, enviar a sistema de monitoreo
        console.warn('🔐 Security Incident Logged:', incident);
    }

    // 📈 LOGGING DE ACTIVIDAD NORMAL
    logActivity(type, details) {
        const activity = {
            type,
            details,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        // Para debugging y análisis
        const activities = JSON.parse(localStorage.getItem('database_activities') || '[]');
        activities.push(activity);
        
        // Mantener solo las últimas 100 actividades
        if (activities.length > 100) {
            activities.splice(0, activities.length - 100);
        }
        
        localStorage.setItem('database_activities', JSON.stringify(activities));
    }

    // 📋 REPORTE DE ESTADO DE SEGURIDAD
    getSecurityReport() {
        const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
        const activities = JSON.parse(localStorage.getItem('database_activities') || '[]');
        
        const report = {
            status: this.isLocked ? 'LOCKED' : 'ACTIVE',
            sessionId: this.sessionId,
            failedAttempts: this.failedAttempts,
            maxFailedAttempts: this.maxFailedAttempts,
            lockoutTime: this.lockoutTime / 1000 + 's',
            recentIncidents: incidents.slice(-10),
            recentActivities: activities.slice(-20),
            statistics: {
                totalIncidents: incidents.length,
                totalActivities: activities.length,
                suspiciousPatterns: incidents.filter(i => i.type === 'SUSPICIOUS_PATTERN').length,
                rateLimitHits: incidents.filter(i => i.type === 'RATE_LIMIT_EXCEEDED').length,
                connectionFailures: incidents.filter(i => i.type === 'CONNECTION_FAILURE').length
            },
            recommendations: this.getSecurityRecommendations(incidents)
        };
        
        return report;
    }

    // 💡 RECOMENDACIONES DE SEGURIDAD
    getSecurityRecommendations(incidents) {
        const recommendations = [];
        const recentIncidents = incidents.filter(
            i => Date.now() - new Date(i.timestamp).getTime() < 3600000 // Última hora
        );
        
        if (recentIncidents.length > 10) {
            recommendations.push('High incident rate detected - consider implementing stricter rate limiting');
        }
        
        const suspiciousCount = recentIncidents.filter(i => i.type === 'SUSPICIOUS_PATTERN').length;
        if (suspiciousCount > 3) {
            recommendations.push('Multiple suspicious patterns detected - review user input validation');
        }
        
        const rateLimitCount = recentIncidents.filter(i => i.type === 'RATE_LIMIT_EXCEEDED').length;
        if (rateLimitCount > 5) {
            recommendations.push('Frequent rate limit violations - consider implementing progressive delays');
        }
        
        if (this.failedAttempts > 2) {
            recommendations.push('Database connection issues detected - check network connectivity');
        }
        
        return recommendations;
    }

    // 🧹 LIMPIEZA DE DATOS ANTIGUOS
    cleanup() {
        // Limpiar rate limiting data antigua
        const cutoff = Date.now() - 3600000; // 1 hora
        for (const [clientId, requests] of this.requestCounts.entries()) {
            const filtered = requests.filter(time => time > cutoff);
            if (filtered.length === 0) {
                this.requestCounts.delete(clientId);
            } else {
                this.requestCounts.set(clientId, filtered);
            }
        }
        
        console.log('🧹 Security data cleanup completed');
    }
}

// 🔒 CLASE PRINCIPAL DE CLIENTE SEGURO
class SecureSupabaseClient {
    constructor(url, anonKey) {
        this.url = url;
        this.anonKey = anonKey;
        this.client = null;
        this.security = new DatabaseSecurityManager();
        this.initialized = false;
        
        // Auto-cleanup cada hora
        setInterval(() => this.security.cleanup(), 3600000);
        
        this.initializeSecureClient();
    }

    async initializeSecureClient() {
        try {
            console.log('🔧 Initializing secure Supabase client...');
            
            // Validar credenciales
            if (!this.validateCredentials()) {
                throw new Error('Invalid Supabase credentials');
            }

            // Crear cliente con configuración segura
            this.client = window.supabase.createClient(this.url, this.anonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'X-Client-Info': 'aromes-secure-v1.0',
                        'X-Session-ID': this.security.sessionId,
                        'X-Timestamp': Date.now().toString()
                    }
                }
            });

            this.initialized = true;
            console.log('✅ Secure Supabase client initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize secure client:', error);
            this.security.recordFailure(error, 'client_initialization');
            throw error;
        }
    }

    validateCredentials() {
        // Validar URL format
        const urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/;
        if (!this.url || !urlPattern.test(this.url)) {
            console.error('🚨 Invalid Supabase URL format');
            this.security.logSecurityIncident('INVALID_URL', { url: this.url });
            return false;
        }

        // Validar API key format (básico)
        if (!this.anonKey || this.anonKey.length < 100 || !this.anonKey.startsWith('eyJ')) {
            console.error('🚨 Invalid API key format');
            this.security.logSecurityIncident('INVALID_API_KEY', { keyLength: this.anonKey?.length });
            return false;
        }

        return true;
    }

    async secureQuery(table, operation, params = {}) {
        if (!this.initialized) {
            throw new Error('Client not initialized');
        }

        const clientId = this.getClientId();
        
        try {
            // 1. Rate limiting check
            if (!this.security.checkRateLimit(clientId)) {
                throw new Error('Rate limit exceeded');
            }

            // 2. Circuit breaker check
            if (!this.security.checkCircuitBreaker()) {
                throw new Error('Database temporarily unavailable');
            }

            // 3. Suspicious activity detection
            if (this.security.detectSuspiciousActivity(operation, params)) {
                throw new Error('Suspicious activity detected');
            }

            // 4. Input validation
            const validation = this.validateOperationParams(operation, params);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // 5. Execute with timeout
            const result = await Promise.race([
                this.executeOperation(table, operation, params),
                this.createTimeout(15000) // 15 segundos timeout
            ]);

            this.security.recordSuccess(operation);
            return result;

        } catch (error) {
            this.security.recordFailure(error, operation);
            console.error(`🚫 Secure query failed [${operation}]:`, error.message);
            throw error;
        }
    }

    validateOperationParams(operation, params) {
        const rules = {
            select: {
                types: {
                    limit: 'number'
                },
                ranges: {
                    limit: { min: 1, max: 1000 }
                }
            },
            insert: {
                required: ['data'],
                types: {
                    data: 'object'
                }
            },
            update: {
                required: ['data'],
                types: {
                    data: 'object'
                }
            },
            delete: {
                required: ['filter'],
                types: {
                    filter: 'object'
                }
            }
        };

        return this.security.validateInput(params, rules[operation] || {});
    }

    async executeOperation(table, operation, params) {
        let query = this.client.from(table);

        switch (operation) {
            case 'select':
                query = query.select(params.columns || '*');
                if (params.filter) {
                    query = query.eq(params.filter.column, params.filter.value);
                }
                if (params.limit) {
                    query = query.limit(params.limit);
                }
                if (params.order) {
                    query = query.order(params.order.column, { ascending: params.order.ascending !== false });
                }
                break;
            
            case 'insert':
                query = query.insert(params.data);
                break;
            
            case 'update':
                query = query.update(params.data);
                if (params.filter) {
                    query = query.eq(params.filter.column, params.filter.value);
                }
                break;
            
            case 'delete':
                query = query.delete();
                if (params.filter) {
                    query = query.eq(params.filter.column, params.filter.value);
                } else {
                    throw new Error('Delete operation requires filter');
                }
                break;
                
            default:
                throw new Error(`Invalid operation: ${operation}`);
        }

        const { data, error } = await query;
        
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        return { data, error: null };
    }

    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms);
        });
    }

    getClientId() {
        if (!this.clientId) {
            this.clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.clientId;
    }

    // 📊 Métodos de diagnóstico
    async testConnection() {
        console.log('🔧 Testing database connection...');
        
        try {
            const result = await this.secureQuery('productos', 'select', {
                columns: 'id',
                limit: 1
            });
            
            console.log('✅ Database connection test passed');
            return { success: true, message: 'Connection successful' };
            
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            return { success: false, message: error.message };
        }
    }

    getSecurityStatus() {
        return this.security.getSecurityReport();
    }

    // 🧹 Limpieza manual
    resetSecurity() {
        this.security = new DatabaseSecurityManager();
        localStorage.removeItem('security_incidents');
        localStorage.removeItem('database_activities');
        console.log('🔄 Security manager reset completed');
    }
}

// 🌐 EXPORTAR PARA USO GLOBAL
window.SecureSupabaseClient = SecureSupabaseClient;
window.DatabaseSecurityManager = DatabaseSecurityManager;

console.log('🛡️ Secure Database System loaded successfully');
