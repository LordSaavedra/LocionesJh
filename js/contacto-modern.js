// ==========================================
// CONTACTO JAVASCRIPT - REDISEÑO MODERNO
// ==========================================

const ContactPage = {
    // Inicialización
    init() {
        this.loadNavbar();
        this.setupFormHandling();
        this.setupFAQInteractions();
        this.setupScrollAnimations();
        this.setupCTAButtons();
        this.setupContactMethods();
        this.initializeAnimations();
    },

    // Cargar navbar
    loadNavbar() {
        fetch('../html/navbar.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('navbar-container').innerHTML = data;
                
                // Esperar un poco antes de cargar el script
                setTimeout(() => {
                    const script = document.createElement('script');
                    script.src = '../js/navbar.js';
                    document.head.appendChild(script);
                }, 100);
            })
            .catch(error => console.error('Error cargando navbar:', error));
    },

    // Configurar manejo de formulario moderno
    setupFormHandling() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        // Configurar animaciones de inputs
        this.setupInputAnimations();

        // Manejar envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.submit-modern');
            const originalContent = submitBtn.innerHTML;
            
            // Mostrar estado de carga
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            try {
                // Simular envío (reemplazar con lógica real)
                await this.simulateFormSubmission();
                
                // Mostrar éxito
                this.showNotification('¡Mensaje enviado exitosamente!', 'success');
                form.reset();
                this.resetInputAnimations();
                
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al enviar el mensaje. Inténtalo de nuevo.', 'error');
            } finally {
                // Restaurar botón
                setTimeout(() => {
                    submitBtn.innerHTML = originalContent;
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
    },

    // Configurar animaciones de inputs
    setupInputAnimations() {
        const inputs = document.querySelectorAll('.input-group input, .input-group select, .input-group textarea');
        
        inputs.forEach(input => {
            // Manejar estados de input
            input.addEventListener('focus', (e) => {
                e.target.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', (e) => {
                if (!e.target.value) {
                    e.target.parentElement.classList.remove('focused');
                }
            });
            
            // Verificar si ya tiene valor al cargar
            if (input.value) {
                input.parentElement.classList.add('focused');
            }
        });
    },

    // Resetear animaciones de inputs
    resetInputAnimations() {
        const inputGroups = document.querySelectorAll('.input-group');
        inputGroups.forEach(group => {
            group.classList.remove('focused');
        });
    },

    // Simular envío de formulario
    simulateFormSubmission() {
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
    },

    // Configurar interacciones del FAQ moderno
    setupFAQInteractions() {
        const faqItems = document.querySelectorAll('.faq-item-modern');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question-modern');
            
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Cerrar todos los FAQs
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Abrir el actual si no estaba activo
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    },

    // Configurar animaciones de scroll
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observar elementos para animación
        const animatedElements = document.querySelectorAll('.advantage-card, .method-card, .faq-item-modern');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.8s ease';
            observer.observe(el);
        });
    },

    // Configurar botones CTA del hero
    setupCTAButtons() {
        // Botón principal - scroll al formulario
        const primaryBtn = document.querySelector('.cta-btn.primary');
        if (primaryBtn) {
            primaryBtn.addEventListener('click', () => {
                document.getElementById('contactFormSection').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        }

        // Botón secundario - WhatsApp
        const secondaryBtn = document.querySelector('.cta-btn.secondary');
        if (secondaryBtn) {
            secondaryBtn.addEventListener('click', () => {
                this.openWhatsApp();
            });
        }
    },

    // Configurar métodos de contacto
    setupContactMethods() {
        const methodCards = document.querySelectorAll('.method-card');
        
        methodCards.forEach(card => {
            const btn = card.querySelector('.method-btn');
            
            btn.addEventListener('click', () => {
                if (card.classList.contains('whatsapp')) {
                    this.openWhatsApp();
                } else if (card.classList.contains('phone')) {
                    this.openPhone();
                } else if (card.classList.contains('email')) {
                    this.openEmail();
                } else if (card.classList.contains('location')) {
                    this.openMap();
                }
            });
        });
    },

    // Funciones de contacto
    openWhatsApp() {
        window.open('https://wa.me/15559876543?text=Hola%2C%20me%20interesa%20obtener%20más%20información%20sobre%20sus%20fragancias', '_blank');
    },

    openPhone() {
        window.location.href = 'tel:+15551234567';
    },

    openEmail() {
        window.location.href = 'mailto:info@aromesdedieu.com?subject=Consulta sobre fragancias';
    },

    openMap() {
        window.open('https://maps.google.com/?q=Av.+Perfumería+Elegante+123', '_blank');
    },

    // Inicializar animaciones de entrada
    initializeAnimations() {
        // Animar cards flotantes del hero
        const floatingCards = document.querySelectorAll('.floating-card');
        floatingCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 300 * (index + 1));
        });

        // Animar elementos con delay
        setTimeout(() => {
            const delayedElements = document.querySelectorAll('.form-container, .info-panel');
            delayedElements.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        }, 600);
    },

    // Mostrar notificaciones
    showNotification(message, type = 'success') {
        // Remover notificación existente
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
        `;

        // Agregar estilos inline para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: 'Montserrat', sans-serif;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            background: ${type === 'success' ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'};
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }
};

// Funciones globales para compatibilidad
window.scrollToForm = () => {
    document.getElementById('contactFormSection').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
};

window.openWhatsApp = () => {
    ContactPage.openWhatsApp();
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ContactPage.init();
});
