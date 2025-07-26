// Variables globales
let initAttempts = 0;
const MAX_ATTEMPTS = 10;
let navbarInitialized = false;

// Función principal de inicialización de la navbar
function initNavbar() {
    console.log('Iniciando inicialización de navbar');
    if (navbarInitialized) {
        console.log('La navbar ya está inicializada');
        return;
    }

    const navbar = document.querySelector('.navbar');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navbarMenu = document.querySelector('.navbar-menu');

    if (!navbar || !hamburgerMenu || !navbarMenu) {
        console.log('Elementos de navbar no encontrados, reintentando...');
        initAttempts++;
        if (initAttempts < MAX_ATTEMPTS) {
            setTimeout(initNavbar, 100);
        }
        return;
    }

    console.log('Elementos de navbar encontrados, configurando eventos');
    
    // Toggle del menú hamburguesa
    hamburgerMenu.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Hamburger menu clicked!');
        hamburgerMenu.classList.toggle('active');
        navbarMenu.classList.toggle('active');
        document.body.style.overflow = hamburgerMenu.classList.contains('active') ? 'hidden' : '';
        console.log('Hamburger active:', hamburgerMenu.classList.contains('active'));
        console.log('Menu active:', navbarMenu.classList.contains('active'));
    });

    // Cerrar menú al hacer click en enlaces finales (que no tienen submenús)
    navbarMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const parentLi = link.closest('li');
            const hasSubmenu = parentLi && parentLi.classList.contains('has-submenu');
            
            // Solo cerrar el menú si el enlace no tiene submenú Y no es un enlace placeholder (#)
            if (!hasSubmenu && link.getAttribute('href') !== '#') {
                hamburgerMenu.classList.remove('active');
                navbarMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Manejar submenús con mejores animaciones
    document.querySelectorAll('.has-submenu').forEach(item => {
        const link = item.querySelector('a');
        const submenu = item.querySelector('.submenu');
        const arrow = item.querySelector('.submenu-arrow');
        
        if (link && submenu && arrow) {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    
                    // Cerrar otros submenús abiertos con animación
                    document.querySelectorAll('.has-submenu.active').forEach(openItem => {
                        if (openItem !== item) {
                            openItem.classList.remove('active');
                            const openLink = openItem.querySelector('a');
                            const openArrow = openItem.querySelector('.submenu-arrow');
                            if (openLink) {
                                openLink.setAttribute('aria-expanded', 'false');
                            }
                            if (openArrow) {
                                openArrow.style.transform = '';
                            }
                        }
                    });
                    
                    // Toggle del submenú actual con animación mejorada
                    const isActive = item.classList.contains('active');
                    
                    if (!isActive) {
                        // Abrir submenú
                        item.classList.add('active');
                        link.setAttribute('aria-expanded', 'true');
                        arrow.style.transform = 'rotate(180deg)';
                        
                        // Animar los elementos del submenú
                        setTimeout(() => {
                            const submenuItems = submenu.querySelectorAll('a');
                            submenuItems.forEach((item, index) => {
                                setTimeout(() => {
                                    item.style.animation = `slideInSubmenu 0.3s ease forwards`;
                                }, index * 50);
                            });
                        }, 100);
                    } else {
                        // Cerrar submenú
                        item.classList.remove('active');
                        link.setAttribute('aria-expanded', 'false');
                        arrow.style.transform = '';
                        
                        // Limpiar animaciones
                        const submenuItems = submenu.querySelectorAll('a');
                        submenuItems.forEach(item => {
                            item.style.animation = '';
                        });
                    }
                    
                    console.log('Submenu toggled:', link.textContent, 'Active:', !isActive);
                }
            });

            // Mejorar feedback visual en hover para desktop
            if (window.innerWidth > 768) {
                item.addEventListener('mouseenter', () => {
                    arrow.style.transform = 'translateY(-1px)';
                });
                
                item.addEventListener('mouseleave', () => {
                    if (!item.classList.contains('active')) {
                        arrow.style.transform = '';
                    }
                });
            }
        }
    });

    // Cerrar submenús al hacer click fuera de ellos
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && navbarMenu.classList.contains('active')) {
            const clickedElement = e.target;
            const isInsideSubmenu = clickedElement.closest('.has-submenu');
            
            if (!isInsideSubmenu) {
                // Cerrar todos los submenús abiertos con animación
                document.querySelectorAll('.has-submenu.active').forEach(item => {
                    item.classList.remove('active');
                    const link = item.querySelector('a');
                    const arrow = item.querySelector('.submenu-arrow');
                    const submenu = item.querySelector('.submenu');
                    
                    if (link) {
                        link.setAttribute('aria-expanded', 'false');
                    }
                    if (arrow) {
                        arrow.style.transform = '';
                    }
                    if (submenu) {
                        const submenuItems = submenu.querySelectorAll('a');
                        submenuItems.forEach(item => {
                            item.style.animation = '';
                        });
                    }
                });
            }
        }
    });

    navbarInitialized = true;
    console.log('✓ Navbar inicializada correctamente');
}

// Event listener para cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Intentando inicializar navbar');
    
    // Intentar inicializar la navbar inmediatamente
    initNavbar();

    // Si no se inicializó en el primer intento, crear un observer para detectar cambios
    if (!navbarInitialized) {
        console.log('Primera inicialización falló, creando observer');
        const observer = new MutationObserver((mutations) => {
            if (!navbarInitialized) {
                console.log('Cambio detectado en DOM, reintentando inicialización');
                initNavbar();
            } else {
                observer.disconnect();
            }
        });

        observer.observe(document.body, { 
            childList: true,
            subtree: true 
        });
    }
});

// Función adicional para inicialización manual si es necesario
window.forceInitNavbar = function() {
    navbarInitialized = false;
    initAttempts = 0;
    initNavbar();
};
