// ==========================================
// FUNCIONALIDAD DE LA PÁGINA DE CONTACTO
// ==========================================

/**
 * Módulo ContactPage
 * Maneja toda la funcionalidad de la página de contacto
 */
const ContactPage = {
    // Configuración
    config: {
        notificationDuration: 4000,
        animationDelay: 300
    },

    // Inicialización
    init() {
        console.log('✨ Inicializando página de contacto...');
        
        this.setupEventListeners();
        this.loadNavbar();
        this.addNotificationStyles();
        
        console.log('✅ Página de contacto lista');
    },

    // Configurar event listeners
    setupEventListeners() {
        // Formulario de contacto
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // FAQ items
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => this.toggleFAQ(question));
        });
    },

    // Manejo del formulario de contacto
    handleFormSubmit(e) {
        e.preventDefault();
        
        console.log('📝 Procesando formulario de contacto...');
        
        // Obtener datos del formulario
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Validación
        const validation = this.validateForm(data);
        if (!validation.isValid) {
            this.showNotification(validation.message, 'error');
            return;
        }
        
        // Simular envío
        this.submitForm(data, e.target);
    },

    // Validar formulario
    validateForm(data) {
        const required = ['firstName', 'lastName', 'email', 'subject', 'message'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                return {
                    isValid: false,
                    message: `Por favor, completa el campo: ${this.getFieldName(field)}`
                };
            }
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return {
                isValid: false,
                message: 'Por favor, ingresa un email válido'
            };
        }

        return {
            isValid: true,
            message: 'Formulario válido'
        };
    },

    // Obtener nombre del campo
    getFieldName(field) {
        const fieldNames = {
            firstName: 'Nombre',
            lastName: 'Apellido',
            email: 'Email',
            subject: 'Asunto',
            message: 'Mensaje',
            phone: 'Teléfono'
        };
        return fieldNames[field] || field;
    },

    // Enviar formulario
    async submitForm(data, form) {
        try {
            // Mostrar mensaje de envío
            this.showNotification('Enviando mensaje...', 'info');
            
            // Simular delay de envío
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simular respuesta exitosa
            console.log('📧 Datos del formulario:', data);
            
            // Mensaje de éxito
            this.showNotification('¡Mensaje enviado exitosamente! Te responderemos pronto.', 'success');
            
            // Limpiar formulario
            form.reset();
            
            // Analytics simulado
            this.trackFormSubmission(data);
            
        } catch (error) {
            console.error('❌ Error enviando formulario:', error);
            this.showNotification('Error al enviar el mensaje. Por favor, intenta nuevamente.', 'error');
        }
    },

    // Toggle FAQ
    toggleFAQ(questionElement) {
        const faqItem = questionElement.parentNode;
        const answer = faqItem.querySelector('.faq-answer');
        
        // Cerrar otros FAQs abiertos
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
                const itemAnswer = item.querySelector('.faq-answer');
                if (itemAnswer) {
                    itemAnswer.classList.remove('active');
                }
            }
        });
        
        // Toggle el FAQ actual
        faqItem.classList.toggle('active');
        if (answer) {
            answer.classList.toggle('active');
        }
        
        console.log(`📋 FAQ ${faqItem.classList.contains('active') ? 'abierto' : 'cerrado'}`);
    },

    // Mostrar notificación
    showNotification(message, type = 'success') {
        // Remover notificaciones existentes
        document.querySelectorAll('.notification').forEach(notif => {
            notif.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconClass = type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-triangle' : 
                         type === 'info' ? 'fa-info-circle' : 'fa-bell';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${iconClass}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Aplicar animación de entrada
        notification.style.animation = 'slideInRight 0.3s ease';
        
        document.body.appendChild(notification);
        
        // Auto-remover después del tiempo configurado
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, this.config.notificationDuration);
        
        console.log(`🔔 Notificación ${type}: ${message}`);
    },

    // Cargar navbar
    async loadNavbar() {
        try {
            console.log('🔄 Cargando navbar...');
            
            const navbarHTML = `
                <nav class="navbar" role="navigation" aria-label="Navegación global">
                    <div class="navbar-container">
                        <button class="hamburger-menu" aria-label="Menú principal">
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                        </button>
                        <a href="../index.html" class="navbar-logo" aria-label="AROMES DE DIEU - Página principal">AROMES DE DIEU</a>
                        <div class="navbar-right">
                            <ul class="navbar-menu" role="menubar">
                                <li role="none" class="has-submenu">
                                    <a href="#" role="menuitem" aria-haspopup="true" aria-expanded="false">Productos</a>
                                    <ul class="submenu" role="menu" aria-label="Submenu de productos">
                                        <li role="none"><a href="catalogo.html" role="menuitem">Catálogo Completo</a></li>
                                        <li role="none"><a href="para_ellos.html" role="menuitem">HOMBRE</a></li>
                                        <li role="none"><a href="para_ellas.html" role="menuitem">MUJER</a></li>
                                    </ul>
                                </li>
                                <li role="none" class="has-submenu">
                                    <a href="#" role="menuitem" aria-haspopup="true" aria-expanded="false">Colecciones</a>
                                    <ul class="submenu" role="menu" aria-label="Submenu de colecciones">
                                        <li role="none"><a href="colecciones/exclusivas.html" role="menuitem">Exclusivas</a></li>
                                        <li role="none"><a href="colecciones/clasicas.html" role="menuitem">Clásicas</a></li>
                                        <li role="none"><a href="colecciones/vintage.html" role="menuitem">Vintage</a></li>
                                    </ul>
                                </li>
                                <li role="none"><a href="catalogo.html" role="menuitem">Catálogo</a></li>
                                <li role="none"><a href="contacto.html" role="menuitem" class="active">Contacto</a></li>
                            </ul>
                            <button class="navbar-cart" id="cartButton" aria-label="Carrito de compras">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="m1 1 4 4 0 0 9.09-.09L15 14H6"></path>
                                    <path d="M5.5 7h7.09l.9 5H6.5L5.5 7z"></path>
                                </svg>
                                <span class="cart-count" id="cartCount">0</span>
                            </button>
                        </div>
                    </div>
                </nav>
            `;
            
            const navbarContainer = document.getElementById('navbar-container');
            if (navbarContainer) {
                navbarContainer.innerHTML = navbarHTML;
                console.log('✅ Navbar cargada exitosamente');
                
                // Inicializar navbar después de cargarla
                setTimeout(() => {
                    if (typeof initNavbar === 'function') {
                        initNavbar();
                    }
                }, 100);
                
                // Inicializar carrito después de cargar navbar
                this.initCartIntegration();
            }
            
        } catch (error) {
            console.error('❌ Error cargando navbar:', error);
            this.showNotification('Error cargando la navegación', 'error');
        }
    },

    // Integración con el carrito
    initCartIntegration() {
        const maxAttempts = 5;
        let attempt = 0;

        const tryInitCart = () => {
            attempt++;
            
            if (window.shoppingCart && typeof window.shoppingCart.updateCartUI === 'function') {
                window.shoppingCart.updateCartUI();
                console.log('🛒 Carrito integrado exitosamente');
                return;
            }
            
            if (attempt < maxAttempts) {
                console.log(`🔄 Intentando integrar carrito (${attempt}/${maxAttempts})...`);
                setTimeout(tryInitCart, 500);
            } else {
                console.warn('⚠️ No se pudo integrar el carrito después de varios intentos');
            }
        };

        setTimeout(tryInitCart, 200);
    },

    // Añadir estilos para notificaciones
    addNotificationStyles() {
        if (document.getElementById('contactPageStyles')) return;

        const style = document.createElement('style');
        style.id = 'contactPageStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .notification.info {
                background: #3182ce;
            }
        `;
        
        document.head.appendChild(style);
    },

    // Analytics simulado
    trackFormSubmission(data) {
        const analytics = {
            event: 'contact_form_submitted',
            timestamp: new Date().toISOString(),
            subject: data.subject,
            hasPhone: !!data.phone,
            messageLength: data.message.length
        };
        
        console.log('📊 Analytics:', analytics);
        
        // Aquí se podría integrar con Google Analytics, etc.
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_submit', {
                event_category: 'engagement',
                event_label: data.subject
            });
        }
    },

    // Utilidades públicas
    utils: {
        // Formatear texto para mostrar
        formatText(text) {
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        },

        // Validar email
        isValidEmail(email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        // Sanitizar input
        sanitizeInput(input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        }
    }
};

// Funciones globales para mantener compatibilidad
function toggleFAQ(element) {
    ContactPage.toggleFAQ(element);
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    ContactPage.init();
});

// Exportar para uso global
window.ContactPage = ContactPage;
