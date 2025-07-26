/**
 * Adaptador para funciones existentes con URLs encriptadas
 * Mantiene compatibilidad total sin romper funcionalidades
 */

// Función helper para obtener URL original de imágenes
function getImageOriginalSrc(imgElement) {
    const originalSrc = imgElement.getAttribute('data-original-src');
    return originalSrc || imgElement.src;
}

// Sobrescribir la función showProductModal para trabajar con URLs encriptadas
(function() {
    // Guardar referencia a la función original
    const originalShowProductModal = window.showProductModal;
    
    window.showProductModal = function(productId) {
        // Llamar a la función original
        if (originalShowProductModal) {
            originalShowProductModal(productId);
        }
        
        // Después de mostrar el modal, asegurar que las imágenes se muestren correctamente
        setTimeout(() => {
            const modalImage = document.getElementById('modalImage');
            if (modalImage && modalImage.getAttribute('data-original-src')) {
                const originalSrc = modalImage.getAttribute('data-original-src');
                modalImage.src = originalSrc;
            }
        }, 50);
    };
})();

// Interceptor para funciones de carga de imágenes
(function() {
    // Asegurar que las imágenes con error se manejen correctamente
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            const img = e.target;
            const originalSrc = img.getAttribute('data-original-src');
            const onerror = img.getAttribute('onerror');
            
            // Si hay una URL original y un handler de error, usar la URL original
            if (originalSrc && onerror) {
                img.src = originalSrc;
            }
        }
    }, true);
})();

// Función para asegurar que las imágenes del producto se carguen correctamente
function ensureImageDisplay() {
    const images = document.querySelectorAll('img[data-original-src]');
    images.forEach(img => {
        const originalSrc = img.getAttribute('data-original-src');
        if (originalSrc && img.src !== originalSrc) {
            img.src = originalSrc;
        }
    });
}

// Observer para asegurar que las imágenes se muestren correctamente
const imageObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
            const img = mutation.target;
            const originalSrc = img.getAttribute('data-original-src');
            if (originalSrc && img.src.includes('data:') === false) {
                // Verificar si necesitamos restaurar la URL original
                if (img.src !== originalSrc && !img.complete) {
                    setTimeout(() => {
                        if (!img.complete) {
                            img.src = originalSrc;
                        }
                    }, 100);
                }
            }
        }
    });
});

// Observar cambios en todas las imágenes
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        imageObserver.observe(img, {
            attributes: true,
            attributeFilter: ['src']
        });
    });
});

// Función para debugging - mostrar estado de encriptación
function showEncryptionStatus() {
    const instance = window.getEncryptionInstance();
    if (instance) {
        console.group('🔐 Estado de Encriptación');
        console.log('URLs encriptadas:', instance.getEncryptionStats().totalURLsEncrypted);
        console.log('Imágenes protegidas:', document.querySelectorAll('img[data-url-encrypted]').length);
        console.log('Enlaces protegidos:', document.querySelectorAll('a[data-url-encrypted]').length);
        console.groupEnd();
    }
}

// Auto-ejecutar verificaciones después de que todo esté cargado
window.addEventListener('load', function() {
    setTimeout(() => {
        ensureImageDisplay();
        
        // Mostrar estado solo en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            showEncryptionStatus();
        }
    }, 500);
});

// Función global para obtener URLs originales cuando sea necesario
window.getOriginalURL = function(element, attribute = 'src') {
    return element.getAttribute(`data-original-${attribute}`) || element.getAttribute(attribute);
};

// Función para restaurar todas las URLs originales (para debugging)
window.restoreAllOriginalURLs = function() {
    const encryptedImages = document.querySelectorAll('img[data-original-src]');
    encryptedImages.forEach(img => {
        img.src = img.getAttribute('data-original-src');
    });
    
    const encryptedLinks = document.querySelectorAll('a[data-original-href]');
    encryptedLinks.forEach(link => {
        link.href = link.getAttribute('data-original-href');
    });
    
    console.log('✅ URLs originales restauradas');
};

console.log('🔧 Adaptador de URLs encriptadas cargado');
