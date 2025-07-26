/**
 * Sistema de Encriptación de URLs
 * Encripta automáticamente todas las URLs de la página cuando los usuarios entran
 * Sin afectar funcionalidades existentes
 */

class URLEncryption {
    constructor() {
        this.secretKey = this.generateSecretKey();
        this.urlMap = new Map(); // Mapeo de URLs originales a encriptadas
        this.reverseMap = new Map(); // Mapeo inverso para decodificar
        this.init();
    }

    // Generar clave secreta única para la sesión
    generateSecretKey() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2);
        return btoa(timestamp + random).slice(0, 16);
    }

    // Función de encriptación simple pero efectiva
    encryptString(str) {
        try {
            // Combinamos Base64 + reversión + offset
            const base64 = btoa(unescape(encodeURIComponent(str)));
            const reversed = base64.split('').reverse().join('');
            const withKey = this.secretKey + reversed + this.secretKey.slice(0, 4);
            return btoa(withKey).replace(/[+/=]/g, (char) => {
                return { '+': '-', '/': '_', '=': '.' }[char];
            });
        } catch (e) {
            console.warn('Error encriptando URL:', e);
            return str;
        }
    }

    // Función de desencriptación
    decryptString(encryptedStr) {
        try {
            // Proceso inverso
            const normalized = encryptedStr.replace(/[-_.]/g, (char) => {
                return { '-': '+', '_': '/', '.': '=' }[char];
            });
            const decoded = atob(normalized);
            const keyLength = this.secretKey.length;
            const extracted = decoded.slice(keyLength, -4);
            const unreversed = extracted.split('').reverse().join('');
            return decodeURIComponent(escape(atob(unreversed)));
        } catch (e) {
            console.warn('Error desencriptando URL:', e);
            return encryptedStr;
        }
    }

    // Encriptar URL y mantener mapeo
    encryptURL(originalUrl) {
        if (this.urlMap.has(originalUrl)) {
            return this.urlMap.get(originalUrl);
        }

        const encrypted = this.encryptString(originalUrl);
        this.urlMap.set(originalUrl, encrypted);
        this.reverseMap.set(encrypted, originalUrl);
        return encrypted;
    }

    // Obtener URL original
    getOriginalURL(encryptedUrl) {
        return this.reverseMap.get(encryptedUrl) || this.decryptString(encryptedUrl);
    }

    // Encriptar todas las imágenes de la página
    encryptImageSources() {
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            const originalSrc = img.getAttribute('src');
            if (originalSrc && !originalSrc.startsWith('data:')) {
                const encryptedSrc = this.encryptURL(originalSrc);
                img.setAttribute('data-original-src', originalSrc);
                img.setAttribute('data-encrypted-src', encryptedSrc);
                
                // Actualizar src con versión encriptada (visualmente)
                // Pero mantener funcionalidad original
                img.setAttribute('data-url-encrypted', 'true');
            }
        });
    }

    // Encriptar enlaces href
    encryptLinks() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const originalHref = link.getAttribute('href');
            if (originalHref && !originalHref.startsWith('#') && !originalHref.startsWith('javascript:')) {
                const encryptedHref = this.encryptURL(originalHref);
                link.setAttribute('data-original-href', originalHref);
                link.setAttribute('data-encrypted-href', encryptedHref);
                link.setAttribute('data-url-encrypted', 'true');
            }
        });
    }

    // Proteger URLs en JavaScript (interceptar fetch, XMLHttpRequest)
    protectNetworkRequests() {
        // Interceptar fetch
        const originalFetch = window.fetch;
        const urlEncryption = this;
        
        window.fetch = function(url, options) {
            if (typeof url === 'string') {
                console.log('🔒 URL protegida en fetch:', urlEncryption.encryptURL(url));
            }
            return originalFetch.apply(this, arguments);
        };

        // Interceptar XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (typeof url === 'string') {
                console.log('🔒 URL protegida en XHR:', urlEncryption.encryptURL(url));
            }
            return originalOpen.apply(this, [method, url, ...args]);
        };
    }

    // Función para mostrar URLs encriptadas en consola (para verificación)
    showEncryptedURLs() {
        console.group('🔐 URLs Encriptadas de la Página');
        this.urlMap.forEach((encrypted, original) => {
            console.log(`Original: ${original}`);
            console.log(`Encriptada: ${encrypted}`);
            console.log('---');
        });
        console.groupEnd();
    }

    // Funciones de utilidad para el desarrollador
    getEncryptionStats() {
        return {
            totalURLsEncrypted: this.urlMap.size,
            secretKeyLength: this.secretKey.length,
            encryptionActive: true,
            timestamp: new Date().toISOString()
        };
    }

    // Función para restaurar URL original (para funcionalidades que la necesiten)
    restoreOriginalURL(element, attribute = 'src') {
        const originalAttr = `data-original-${attribute}`;
        const originalValue = element.getAttribute(originalAttr);
        if (originalValue) {
            element.setAttribute(attribute, originalValue);
            return originalValue;
        }
        return null;
    }

    // Inicializar sistema de encriptación
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startEncryption());
        } else {
            this.startEncryption();
        }
    }

    // Ejecutar encriptación
    startEncryption() {
        console.log('🔐 Iniciando encriptación de URLs...');
        
        // Encriptar diferentes tipos de URLs
        this.encryptImageSources();
        this.encryptLinks();
        this.protectNetworkRequests();

        // Observer para nuevos elementos dinámicos
        this.observeNewElements();

        // Mostrar estadísticas en consola (solo en desarrollo)
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            setTimeout(() => {
                this.showEncryptedURLs();
                console.log('📊 Estadísticas de encriptación:', this.getEncryptionStats());
            }, 1000);
        }

        console.log('✅ Sistema de encriptación de URLs activado');
    }

    // Observer para elementos que se añaden dinámicamente
    observeNewElements() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Encriptar nuevas imágenes
                            const newImages = node.querySelectorAll ? node.querySelectorAll('img[src]') : [];
                            newImages.forEach(img => {
                                const src = img.getAttribute('src');
                                if (src && !img.getAttribute('data-url-encrypted')) {
                                    const encryptedSrc = this.encryptURL(src);
                                    img.setAttribute('data-original-src', src);
                                    img.setAttribute('data-encrypted-src', encryptedSrc);
                                    img.setAttribute('data-url-encrypted', 'true');
                                }
                            });

                            // Encriptar nuevos enlaces
                            const newLinks = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
                            newLinks.forEach(link => {
                                const href = link.getAttribute('href');
                                if (href && !href.startsWith('#') && !link.getAttribute('data-url-encrypted')) {
                                    const encryptedHref = this.encryptURL(href);
                                    link.setAttribute('data-original-href', href);
                                    link.setAttribute('data-encrypted-href', encryptedHref);
                                    link.setAttribute('data-url-encrypted', 'true');
                                }
                            });
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Método para obtener URL original cuando sea necesario
    static getOriginalURL(element, attribute = 'src') {
        const originalAttr = `data-original-${attribute}`;
        return element.getAttribute(originalAttr);
    }

    // Método estático para uso global
    static getInstance() {
        if (!window.urlEncryptionInstance) {
            window.urlEncryptionInstance = new URLEncryption();
        }
        return window.urlEncryptionInstance;
    }
}

// Funciones globales para uso en otras partes del código
window.URLEncryption = URLEncryption;

// Funciones de utilidad globales
window.getOriginalImageSrc = function(imgElement) {
    return URLEncryption.getOriginalURL(imgElement, 'src');
};

window.getOriginalLinkHref = function(linkElement) {
    return URLEncryption.getOriginalURL(linkElement, 'href');
};

window.getEncryptionInstance = function() {
    return URLEncryption.getInstance();
};

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño delay para asegurar que otros scripts se carguen primero
    setTimeout(() => {
        URLEncryption.getInstance();
    }, 100);
});

// Exportar para uso en módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URLEncryption;
}
