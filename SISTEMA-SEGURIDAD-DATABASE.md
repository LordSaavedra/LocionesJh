# 🛡️ SISTEMA DE SEGURIDAD ANTI-HACK PARA BASE DE DATOS

## 🚨 VULNERABILIDADES COMUNES Y PROTECCIONES

### 1. SQL INJECTION
**Problema:** Inyección de código SQL malicioso
**Protección:** Supabase usa prepared statements automáticamente

### 2. BRUTE FORCE ATTACKS
**Problema:** Intentos masivos de acceso
**Protección:** Rate limiting y timeouts

### 3. DDOS ATTACKS
**Problema:** Sobrecarga de la base de datos
**Protección:** Throttling y circuit breaker

### 4. CREDENTIAL EXPOSURE
**Problema:** Exposición de claves API
**Protección:** Rotación de claves y variables de entorno

### 5. UNAUTHORIZED ACCESS
**Problema:** Acceso no autorizado
**Protección:** Row Level Security y validación de sesiones

---

## 🔐 IMPLEMENTACIÓN DE PROTECCIONES

### 1. CONNECTION SECURITY MANAGER
```javascript
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
    }

    // Protección contra brute force
    checkRateLimit(clientId = 'default') {
        const now = Date.now();
        const requests = this.requestCounts.get(clientId) || [];
        
        // Limpiar requests antiguos (últimos 60 segundos)
        const recentRequests = requests.filter(time => now - time < 60000);
        
        if (recentRequests.length >= 30) { // Máximo 30 requests por minuto
            console.warn('🚨 Rate limit exceeded for client:', clientId);
            return false;
        }
        
        recentRequests.push(now);
        this.requestCounts.set(clientId, recentRequests);
        return true;
    }

    // Detectar patrones sospechosos
    detectSuspiciousActivity(query, params) {
        const suspiciousPatterns = [
            /(\bunion\b|\bselect\b|\bdrop\b|\bdelete\b)/i,
            /(\-\-|\/\*|\*\/)/,
            /(\bor\b\s+\d+\s*=\s*\d+)/i,
            /(\band\b\s+\d+\s*=\s*\d+)/i
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(query) || (params && pattern.test(JSON.stringify(params)))) {
                console.error('🚨 SUSPICIOUS SQL PATTERN DETECTED:', {
                    query: query.substring(0, 100),
                    timestamp: new Date().toISOString(),
                    pattern: pattern.source
                });
                return true;
            }
        }
        return false;
    }

    // Circuit breaker para conexiones
    checkCircuitBreaker() {
        if (this.isLocked) {
            if (Date.now() > this.lockoutUntil) {
                this.isLocked = false;
                this.failedAttempts = 0;
                console.log('🔓 Circuit breaker reset');
            } else {
                const remaining = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
                console.warn(`🚫 Database locked. Try again in ${remaining} seconds`);
                return false;
            }
        }
        return true;
    }

    // Registrar fallo de conexión
    recordFailure(error) {
        this.failedAttempts++;
        console.error(`❌ Database connection failed (${this.failedAttempts}/${this.maxFailedAttempts}):`, error.message);
        
        if (this.failedAttempts >= this.maxFailedAttempts) {
            this.isLocked = true;
            this.lockoutUntil = Date.now() + this.lockoutTime;
            console.error('🔒 DATABASE LOCKED due to multiple failures');
        }
    }

    // Registrar éxito
    recordSuccess() {
        if (this.failedAttempts > 0) {
            console.log('✅ Database connection restored');
            this.failedAttempts = Math.max(0, this.failedAttempts - 1);
        }
    }
}
```

### 2. SECURE CONNECTION WRAPPER
```javascript
class SecureSupabaseClient {
    constructor(url, anonKey) {
        this.url = url;
        this.anonKey = anonKey;
        this.client = null;
        this.security = new DatabaseSecurityManager();
        this.initializeSecureClient();
    }

    async initializeSecureClient() {
        try {
            // Validar URL y key antes de crear cliente
            if (!this.validateCredentials()) {
                throw new Error('Invalid credentials');
            }

            this.client = window.supabase.createClient(this.url, this.anonKey, {
                auth: {
                    persistSession: false, // No persistir sesiones por seguridad
                    autoRefreshToken: false
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'X-Client-Info': 'aromes-secure-client',
                        'X-Request-ID': this.generateRequestId()
                    }
                }
            });

            // Establecer timeout para todas las operaciones
            this.setupTimeouts();
            
        } catch (error) {
            console.error('🚨 Failed to initialize secure client:', error);
            throw error;
        }
    }

    validateCredentials() {
        // Validar formato de URL
        if (!this.url || !this.url.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
            console.error('🚨 Invalid Supabase URL format');
            return false;
        }

        // Validar formato de API key
        if (!this.anonKey || this.anonKey.length < 100) {
            console.error('🚨 Invalid API key format');
            return false;
        }

        return true;
    }

    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async secureQuery(table, operation, params = {}) {
        const clientId = this.getClientId();
        
        // 1. Verificar rate limiting
        if (!this.security.checkRateLimit(clientId)) {
            throw new Error('Rate limit exceeded');
        }

        // 2. Verificar circuit breaker
        if (!this.security.checkCircuitBreaker()) {
            throw new Error('Database temporarily unavailable');
        }

        // 3. Detectar actividad sospechosa
        if (this.security.detectSuspiciousActivity(table, params)) {
            throw new Error('Suspicious activity detected');
        }

        // 4. Ejecutar operación con timeout
        try {
            const result = await Promise.race([
                this.executeOperation(table, operation, params),
                this.createTimeout(10000) // 10 segundos timeout
            ]);

            this.security.recordSuccess();
            return result;

        } catch (error) {
            this.security.recordFailure(error);
            throw error;
        }
    }

    async executeOperation(table, operation, params) {
        let query = this.client.from(table);

        switch (operation) {
            case 'select':
                query = query.select(params.columns || '*');
                if (params.filter) query = query.eq(params.filter.column, params.filter.value);
                if (params.limit) query = query.limit(params.limit);
                break;
            
            case 'insert':
                query = query.insert(params.data);
                break;
            
            case 'update':
                query = query.update(params.data);
                if (params.filter) query = query.eq(params.filter.column, params.filter.value);
                break;
            
            case 'delete':
                query = query.delete();
                if (params.filter) query = query.eq(params.filter.column, params.filter.value);
                break;
                
            default:
                throw new Error('Invalid operation');
        }

        return await query;
    }

    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), ms);
        });
    }

    getClientId() {
        // Generar ID único por sesión
        if (!this.clientId) {
            this.clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.clientId;
    }
}
```

### 3. API KEY ROTATION SYSTEM
```javascript
class APIKeyManager {
    constructor() {
        this.currentKey = null;
        this.backupKey = null;
        this.keyExpiry = null;
        this.rotationInterval = 24 * 60 * 60 * 1000; // 24 horas
    }

    async rotateKey() {
        try {
            console.log('🔄 Initiating API key rotation...');
            
            // En producción, esto debería ser una llamada a tu backend
            // que gestione la rotación de claves de forma segura
            const newKey = await this.requestNewKey();
            
            if (newKey) {
                this.backupKey = this.currentKey;
                this.currentKey = newKey;
                this.keyExpiry = Date.now() + this.rotationInterval;
                
                console.log('✅ API key rotated successfully');
                return true;
            }
            
        } catch (error) {
            console.error('❌ API key rotation failed:', error);
            return false;
        }
    }

    async requestNewKey() {
        // Esta función debería comunicarse con tu backend seguro
        // Por seguridad, NUNCA generes claves en el frontend
        console.log('📡 Requesting new API key from secure backend...');
        return null; // Placeholder
    }

    isKeyExpired() {
        return this.keyExpiry && Date.now() > this.keyExpiry;
    }

    getCurrentKey() {
        if (this.isKeyExpired()) {
            console.warn('⚠️ API key expired, using backup');
            return this.backupKey;
        }
        return this.currentKey;
    }
}
```

### 4. MONITORING & ALERTING SYSTEM
```javascript
class SecurityMonitor {
    constructor() {
        this.alerts = [];
        this.metrics = {
            totalRequests: 0,
            failedRequests: 0,
            suspiciousActivity: 0,
            rateLimitHits: 0
        };
        this.alertThresholds = {
            failureRate: 0.1, // 10% failure rate
            suspiciousActivity: 5,
            rateLimitHits: 10
        };
    }

    logSecurityEvent(type, details) {
        const event = {
            type,
            details,
            timestamp: new Date().toISOString(),
            severity: this.getSeverity(type)
        };

        this.alerts.push(event);
        console.log(`🔍 Security Event: ${type}`, details);

        // Mantener solo los últimos 100 eventos
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }

        // Verificar si necesitamos alertas
        this.checkAlertThresholds();
    }

    getSeverity(type) {
        const severityMap = {
            'suspicious_query': 'HIGH',
            'rate_limit_exceeded': 'MEDIUM',
            'connection_failure': 'MEDIUM',
            'invalid_credentials': 'HIGH',
            'timeout': 'LOW'
        };
        return severityMap[type] || 'LOW';
    }

    checkAlertThresholds() {
        const recentEvents = this.alerts.filter(
            event => Date.now() - new Date(event.timestamp).getTime() < 300000 // 5 minutos
        );

        const suspiciousCount = recentEvents.filter(e => e.type === 'suspicious_query').length;
        const rateLimitCount = recentEvents.filter(e => e.type === 'rate_limit_exceeded').length;

        if (suspiciousCount >= this.alertThresholds.suspiciousActivity) {
            this.triggerAlert('CRITICAL', 'Multiple suspicious queries detected');
        }

        if (rateLimitCount >= this.alertThresholds.rateLimitHits) {
            this.triggerAlert('WARNING', 'High rate limit violations');
        }
    }

    triggerAlert(level, message) {
        console.error(`🚨 SECURITY ALERT [${level}]: ${message}`);
        
        // En producción, enviar alertas a sistemas de monitoreo
        // Slack, email, PagerDuty, etc.
    }

    getSecurityReport() {
        return {
            metrics: this.metrics,
            recentAlerts: this.alerts.slice(-10),
            status: this.getOverallStatus()
        };
    }

    getOverallStatus() {
        const failureRate = this.metrics.failedRequests / this.metrics.totalRequests;
        
        if (failureRate > 0.2) return 'CRITICAL';
        if (failureRate > 0.1) return 'WARNING';
        if (this.metrics.suspiciousActivity > 0) return 'CAUTION';
        
        return 'NORMAL';
    }
}
```

---

## 🛠️ INTEGRACIÓN CON TU SISTEMA ACTUAL

### 1. Reemplazar cliente Supabase actual
```javascript
// En lugar de:
const supabaseClient = window.supabase.createClient(url, key);

// Usar:
const secureClient = new SecureSupabaseClient(url, key);
const monitor = new SecurityMonitor();
```

### 2. Wrapper para operaciones de productos
```javascript
class SecureProductService {
    constructor() {
        this.secureClient = new SecureSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.monitor = new SecurityMonitor();
    }

    async getProducts(filters = {}) {
        try {
            this.monitor.metrics.totalRequests++;
            
            const result = await this.secureClient.secureQuery('productos', 'select', {
                columns: 'id, nombre, marca, precio, categoria, imagen_url, activo',
                filter: filters.categoria ? { column: 'categoria', value: filters.categoria } : null,
                limit: 1000
            });

            return result;

        } catch (error) {
            this.monitor.metrics.failedRequests++;
            this.monitor.logSecurityEvent('query_failure', {
                operation: 'getProducts',
                error: error.message
            });
            throw error;
        }
    }

    async createProduct(productData) {
        try {
            // Validar datos antes de enviar
            this.validateProductData(productData);
            
            const result = await this.secureClient.secureQuery('productos', 'insert', {
                data: productData
            });

            return result;

        } catch (error) {
            this.monitor.logSecurityEvent('insert_failure', {
                operation: 'createProduct',
                error: error.message
            });
            throw error;
        }
    }

    validateProductData(data) {
        const required = ['nombre', 'marca', 'precio', 'categoria'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Validaciones adicionales
        if (data.precio < 0 || data.precio > 10000000) {
            throw new Error('Invalid price range');
        }

        if (!['para-ellos', 'para-ellas', 'unisex'].includes(data.categoria)) {
            throw new Error('Invalid category');
        }
    }
}
```

¿Quieres que implemente alguna de estas protecciones específicamente en tu código actual?
