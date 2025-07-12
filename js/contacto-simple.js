// Funcionalidad para la página de contacto

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    initFAQ();
    initContactForm();
    initScrollAnimations();
    initContactMethods();
});

// Funcionalidad FAQ
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Cerrar otros items abiertos
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle el item actual
            item.classList.toggle('active');
        });
    });
}

// Funcionalidad del formulario de contacto
function initContactForm() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Mejorar la experiencia de los inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });
}

// Manejar envío del formulario
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Validar campos requeridos
    if (!validateForm(data)) {
        showNotification('Por favor, complete todos los campos requeridos.', 'error');
        return;
    }
    
    // Simular envío del formulario
    showLoadingState();
    
    // Simular petición al servidor
    setTimeout(() => {
        hideLoadingState();
        showNotification('¡Mensaje enviado exitosamente! Nos pondremos en contacto pronto.', 'success');
        e.target.reset();
        
        // Limpiar estados de focus
        const inputGroups = document.querySelectorAll('.input-group');
        inputGroups.forEach(group => group.classList.remove('focused'));
    }, 2000);
}

// Validar formulario
function validateForm(data) {
    const required = ['firstName', 'lastName', 'email', 'subject', 'message'];
    
    for (let field of required) {
        if (!data[field] || data[field].trim() === '') {
            return false;
        }
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('Por favor, ingrese un correo electrónico válido.', 'error');
        return false;
    }
    
    return true;
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    // Remover notificaciones anteriores
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Estilos en línea para las notificaciones
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: 'Montserrat', sans-serif;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Estados de carga
function showLoadingState() {
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
        submitButton.innerHTML = `
            <span>Enviando...</span>
            <i class="fas fa-spinner fa-spin"></i>
        `;
        submitButton.disabled = true;
    }
}

function hideLoadingState() {
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
        submitButton.innerHTML = `
            <span>Enviar Consulta</span>
            <i class="fas fa-arrow-right"></i>
        `;
        submitButton.disabled = false;
    }
}

// Animaciones de scroll
function initScrollAnimations() {
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
    
    // Observar elementos que necesitan animación
    const animatedElements = document.querySelectorAll('.form-container, .contact-info, .service-card');
    animatedElements.forEach(el => {
        // Establecer estado inicial para animación
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s ease';
        observer.observe(el);
    });
}

// Inicializar métodos de contacto
function initContactMethods() {
    document.addEventListener('click', function(e) {
        const methodCard = e.target.closest('.contact-method');
        if (methodCard) {
            const icon = methodCard.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-whatsapp')) {
                    openWhatsApp();
                } else if (icon.classList.contains('fa-phone')) {
                    callPhone();
                } else if (icon.classList.contains('fa-envelope')) {
                    openEmail();
                } else if (icon.classList.contains('fa-map-marker-alt')) {
                    openMap();
                }
            }
        }
    });
}

// Funciones auxiliares para botones de contacto
function openWhatsApp() {
    const phoneNumber = '+15559876543'; // Reemplazar con el número real
    const message = encodeURIComponent('Hola, me interesa obtener más información sobre sus fragancias.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}

function callPhone() {
    window.location.href = 'tel:+15551234567';
}

function openEmail() {
    window.location.href = 'mailto:info@aromesdedieu.com?subject=Consulta%20desde%20la%20web';
}

function openMap() {
    // Reemplazar con coordenadas reales
    window.open('https://maps.google.com?q=Av.+Perfumería+Exclusiva+123', '_blank');
}

// Scroll suave al formulario
function scrollToForm() {
    const formSection = document.getElementById('contactFormSection');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
}
