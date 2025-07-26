/**
 * Footer Global - Funcionalidades Interactivas
 * Maneja newsletter, animaciones y funcionalidades del footer
 */

class GlobalFooter {
    constructor() {
        this.init();
    }

    init() {
        this.setupNewsletterForm();
        this.setupScrollAnimations();
        this.setupSocialLinks();
        this.updateCurrentYear();
        console.log('🦶 Footer global inicializado');
    }

    // Configurar formulario de newsletter
    setupNewsletterForm() {
        const newsletterForm = document.querySelector('.newsletter-form');
        const newsletterInput = document.querySelector('.newsletter-input');
        const newsletterButton = document.querySelector('.newsletter-button');

        if (!newsletterForm) return;

        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsletterSubmit(newsletterInput.value);
        });

        // Animación del botón al escribir
        if (newsletterInput) {
            newsletterInput.addEventListener('input', () => {
                if (newsletterInput.value.length > 0) {
                    newsletterButton?.classList.add('active');
                } else {
                    newsletterButton?.classList.remove('active');
                }
            });
        }
    }

    // Manejar envío del newsletter
    async handleNewsletterSubmit(email) {
        const newsletterButton = document.querySelector('.newsletter-button');
        const originalHTML = newsletterButton.innerHTML;

        if (!this.isValidEmail(email)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        // Animación de loading
        newsletterButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3">
                    <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;
        newsletterButton.disabled = true;

        try {
            // Simular envío (aquí conectarías con tu API)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Éxito
            newsletterButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
            `;
            
            this.showNotification('¡Gracias! Te has suscrito exitosamente', 'success');
            document.querySelector('.newsletter-input').value = '';
            
            // Resetear después de 3 segundos
            setTimeout(() => {
                newsletterButton.innerHTML = originalHTML;
                newsletterButton.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Error al enviar newsletter:', error);
            this.showNotification('Error al suscribirse. Intenta de nuevo', 'error');
            
            newsletterButton.innerHTML = originalHTML;
            newsletterButton.disabled = false;
        }
    }

    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Mostrar notificaciones
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `footer-notification footer-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Estilos inline para la notificación
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.9rem'
        });

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Manejar cierre
        const closeBtn = notification.querySelector('.notification-close');
        const closeNotification = () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', closeNotification);

        // Auto cerrar después de 5 segundos
        setTimeout(closeNotification, 5000);
    }

    // Configurar animaciones de scroll
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observar columnas del footer
        const footerColumns = document.querySelectorAll('.footer-column');
        footerColumns.forEach(column => {
            observer.observe(column);
        });
    }

    // Configurar enlaces sociales
    setupSocialLinks() {
        const socialLinks = document.querySelectorAll('.social-link');
        
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Efecto visual
                link.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    link.style.transform = '';
                }, 200);

                // Aquí puedes agregar tracking o analytics
                const platform = this.getSocialPlatform(link);
                console.log(`🔗 Click en red social: ${platform}`);
                
                // Opcional: abrir enlace real
                // window.open('https://real-social-link.com', '_blank');
            });
        });
    }

    // Identificar plataforma social
    getSocialPlatform(linkElement) {
        const svg = linkElement.querySelector('svg path');
        if (!svg) return 'unknown';
        
        const path = svg.getAttribute('d');
        if (path.includes('24 12.073')) return 'Facebook';
        if (path.includes('12 2.163')) return 'Instagram';
        if (path.includes('17.472 14.382')) return 'WhatsApp';
        if (path.includes('12.525.02')) return 'TikTok';
        
        return 'unknown';
    }

    // Actualizar año actual
    updateCurrentYear() {
        const currentYear = new Date().getFullYear();
        const copyrightElement = document.querySelector('.copyright p');
        
        if (copyrightElement) {
            copyrightElement.innerHTML = copyrightElement.innerHTML.replace(
                /&copy; \d{4}/,
                `&copy; ${currentYear}`
            );
        }
    }

    // Método estático para cargar el footer
    static async loadFooter(containerId = 'footer-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Contenedor ${containerId} no encontrado para el footer`);
            return;
        }

        try {
            const response = await fetch('./footer.html');
            if (!response.ok) {
                // Intentar ruta alternativa
                const altResponse = await fetch('../html/footer.html');
                if (!altResponse.ok) {
                    throw new Error('No se pudo cargar el footer');
                }
                const html = await altResponse.text();
                container.innerHTML = html;
            } else {
                const html = await response.text();
                container.innerHTML = html;
            }

            // Inicializar funcionalidades
            new GlobalFooter();
            console.log('✅ Footer cargado exitosamente');

        } catch (error) {
            console.error('❌ Error cargando footer:', error);
            container.innerHTML = `
                <footer class="global-footer">
                    <div class="footer-content">
                        <div class="footer-bottom">
                            <div class="footer-bottom-content">
                                <div class="copyright">
                                    <p>&copy; ${new Date().getFullYear()} Aromes De Dieu. Todos los derechos reservados.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            `;
        }
    }
}

// CSS adicional para animaciones
const additionalStyles = `
    .footer-notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    }
    
    .newsletter-button.active {
        background: linear-gradient(135deg, #b8860b, #d4af37) !important;
        transform: scale(1.05);
    }
    
    .footer-column.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    @media (prefers-reduced-motion: reduce) {
        .footer-column {
            animation: none;
        }
    }
`;

// Inyectar estilos adicionales
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Exportar para uso global
window.GlobalFooter = GlobalFooter;

// Auto-inicializar si hay un contenedor de footer
document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        GlobalFooter.loadFooter('footer-container');
    }
});

console.log('🦶 Footer global script cargado');
