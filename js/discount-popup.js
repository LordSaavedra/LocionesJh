/* ======= POPUP DE DESCUENTO - FUNCIONALIDAD ======= */

class DiscountPopup {
    constructor() {
        this.popup = document.getElementById('discount-popup');
        this.closeBtn = document.querySelector('.popup-close');
        this.form = document.getElementById('discount-form');
        this.emailInput = document.querySelector('.email-input');
        this.submitBtn = document.querySelector('.submit-btn');
        
        this.init();
    }
    
    init() {
        // Verificar si es la primera visita
        if (this.isFirstVisit()) {
            this.showPopup();
        }
        
        // Event listeners
        this.closeBtn.addEventListener('click', () => this.hidePopup());
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.hidePopup();
            }
        });
        
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup.classList.contains('active')) {
                this.hidePopup();
            }
        });
        
        // Auto-mostrar después de 3 segundos si es primera visita
        if (this.isFirstVisit()) {
            setTimeout(() => {
                this.showPopup();
            }, 3000);
        }
    }
    
    isFirstVisit() {
        const visited = localStorage.getItem('arome_visited');
        if (!visited) {
            return true;
        }
        
        // Verificar si han pasado más de 24 horas
        const lastVisit = parseInt(visited);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        return (now - lastVisit) > twentyFourHours;
    }
    
    showPopup() {
        document.body.style.overflow = 'hidden';
        this.popup.classList.add('active');
        
        // Marcar como visitado
        localStorage.setItem('arome_visited', Date.now().toString());
        
        // Analytics tracking (opcional)
        this.trackEvent('popup_shown');
    }
    
    hidePopup() {
        document.body.style.overflow = '';
        this.popup.classList.remove('active');
        
        // Analytics tracking
        this.trackEvent('popup_closed');
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        
        if (!this.validateEmail(email)) {
            this.showError('Por favor, ingresa un email válido');
            return;
        }
        
        // Deshabilitar botón durante envío
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'PROCESANDO...';
        
        try {
            // Simular envío (aquí puedes integrar con tu backend)
            await this.submitEmail(email);
            
            // Mostrar éxito
            this.showSuccess();
            
            // Analytics tracking
            this.trackEvent('email_submitted', { email });
            
        } catch (error) {
            this.showError('Error al procesar. Inténtalo de nuevo.');
            console.error('Error submitting email:', error);
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'OBTENER DESCUENTO';
        }
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    async submitEmail(email) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Aquí puedes integrar con tu sistema de newsletter
        // Por ejemplo: Mailchimp, ConvertKit, etc.
        console.log('Email submitted:', email);
        
        // Guardar en localStorage para futuras referencias
        const subscribers = JSON.parse(localStorage.getItem('arome_subscribers') || '[]');
        subscribers.push({
            email,
            timestamp: Date.now(),
            discountCode: this.generateDiscountCode()
        });
        localStorage.setItem('arome_subscribers', JSON.stringify(subscribers));
        
        return { success: true };
    }
    
    generateDiscountCode() {
        return 'AROME15-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    showSuccess() {
        const discountCode = this.generateDiscountCode();
        const rightPanel = document.querySelector('.popup-right');
        
        rightPanel.innerHTML = `
            <div class="popup-success">
                <div class="success-icon">✓</div>
                <h3 class="success-message">¡Gracias por suscribirte!</h3>
                <p class="success-code">Código de descuento: <strong>${discountCode}</strong></p>
                <p class="form-description">
                    Usa este código en tu primera compra para obtener 15% de descuento.
                    También te enviaremos ofertas exclusivas a tu email.
                </p>
                <button class="submit-btn" onclick="discountPopupInstance.hidePopup()">
                    CONTINUAR COMPRANDO
                </button>
            </div>
        `;
        
        // Auto-cerrar después de 8 segundos
        setTimeout(() => {
            this.hidePopup();
        }, 8000);
    }
    
    showError(message) {
        // Crear elemento de error si no existe
        let errorElement = document.querySelector('.popup-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'popup-error';
            errorElement.style.cssText = `
                color: #e74c3c;
                font-size: 0.9rem;
                margin-top: 10px;
                padding: 8px 12px;
                background: rgba(231, 76, 60, 0.1);
                border-radius: 4px;
                font-family: 'Montserrat', sans-serif;
            `;
            this.form.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Ocultar error después de 4 segundos
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 4000);
        
        // Shake animation en el input
        this.emailInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.emailInput.style.animation = '';
        }, 500);
    }
    
    trackEvent(eventName, data = {}) {
        // Integración con Google Analytics, Facebook Pixel, etc.
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'discount_popup',
                ...data
            });
        }
        
        console.log('Event tracked:', eventName, data);
    }
}

// CSS para animación shake
const shakeCSS = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;

// Agregar CSS de animación
if (!document.querySelector('#shake-animation-css')) {
    const style = document.createElement('style');
    style.id = 'shake-animation-css';
    style.textContent = shakeCSS;
    document.head.appendChild(style);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.discountPopupInstance = new DiscountPopup();
});

// Export para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscountPopup;
}
