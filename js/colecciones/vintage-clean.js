// Funcionalidad para la página vintage
document.addEventListener('DOMContentLoaded', function() {
    // Cargar la navbar
    loadNavbar();
    
    // Inicializar filtros y eventos
    initializeFilters();
    initializeProductEvents();
    initializeModalEvents();
    
    // Filtro inicial
    filterProducts('femeninos');
});

// Función para cargar la navbar
function loadNavbar() {
    fetch('../../html/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-container').innerHTML = data;
            
            // Ajustar rutas para navegación desde colecciones/vintage.html
            const logo = document.querySelector('.navbar-logo');
            if (logo) {
                logo.setAttribute('href', '../../index.html');
            }
            
            // Ajustar enlaces del menú
            const navLinks = document.querySelectorAll('.navbar-menu a[href]');
            navLinks.forEach(link => {
                const currentHref = link.getAttribute('href');
                
                if (link.hasAttribute('data-vintage-link')) {
                    link.setAttribute('href', 'vintage.html');
                    return;
                }
                
                if (!currentHref.startsWith('http') && 
                    !currentHref.startsWith('../../') && 
                    !currentHref.startsWith('#') &&
                    currentHref.endsWith('.html')) {
                    
                    if (currentHref.startsWith('colecciones/')) {
                        const collectionPage = currentHref.replace('colecciones/', '');
                        link.setAttribute('href', collectionPage);
                    } else {
                        link.setAttribute('href', '../../' + currentHref);
                    }
                }
            });
            
            // Ajustar enlaces de navegación principal
            const mainNavLinks = document.querySelectorAll('.nav-links a');
            mainNavLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    if (href.startsWith('html/')) {
                        link.setAttribute('href', '../../' + href);
                    } else if (href === 'index.html') {
                        link.setAttribute('href', '../../index.html');
                    } else if (href.includes('colecciones/') && !href.startsWith('../../')) {
                        link.setAttribute('href', '../' + href);
                    }
                }
            });
            
            // Ajustar el carrito en la navbar
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) {
                cartIcon.addEventListener('click', function() {
                    const cartSlide = document.getElementById('cart-slide');
                    if (cartSlide) {
                        cartSlide.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                });
            }
        })
        .catch(error => console.error('Error loading navbar:', error));
}

// Función para inicializar los filtros
function initializeFilters() {
    const filterLinks = document.querySelectorAll('.filter-link');
    
    filterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los links
            filterLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al link clickeado
            this.classList.add('active');
            
            // Obtener categoría y filtrar productos
            const category = this.getAttribute('data-category');
            filterProducts(category);
        });
    });
}

// Función para inicializar eventos de productos
function initializeProductEvents() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            showProductModal(productId);
        });
    });
}

// Función para inicializar eventos del modal
function initializeModalEvents() {
    const modal = document.getElementById('productModal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    // Event listener para cerrar modal
    if (modalClose) {
        modalClose.addEventListener('click', closeProductModal);
    }

    // Cerrar modal al hacer click en el overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeProductModal);
    }

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeProductModal();
        }
    });

    // Inicializar pestañas del modal
    initializeModalTabs();
}

// Función para inicializar las pestañas del modal
function initializeModalTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y paneles
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Mostrar el panel correspondiente
            const targetPanel = document.getElementById(targetTab + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// Mapeo de filtros a subtítulos
const subtitleMap = {
    'all': 'Toda la Colección',
    'femeninos': 'Perfumes Femeninos',
    'masculinos': 'Perfumes Masculinos',
    'maquillaje': 'Maquillaje',
    'tratamiento': 'Tratamiento'
};

// Historias de productos
const productStories = {
    'gris-dior': {
        title: 'Gris Dior',
        subtitle: 'La elegancia refinada',
        story: 'Inspirada en el amor de Christian Dior por el color gris, esta fragancia captura la sofisticación parisina en cada nota.',
        history: 'Creada por François Demachy en 2017, Gris Dior rinde homenaje al color favorito del fundador de la maison. Christian Dior consideraba el gris como el color más elegante, capaz de realzar todos los demás colores.',
        notes: {
            salida: 'Bergamota, Rosa',
            corazon: 'Iris, Peonía',
            fondo: 'Almizcle blanco, Sándalo'
        },
        experience: 'Una fragancia que evoca los salones de alta costura de la Avenue Montaigne, donde cada detalle está pensado para la perfección.',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400'
    },
    'miss-dior': {
        title: 'Miss Dior Parfum',
        subtitle: 'El amor en cada gota',
        story: 'La primera fragancia de la maison Dior, creada en 1947, sigue siendo un símbolo de feminidad y elegancia atemporal.',
        history: 'Lanzada junto con el revolucionario New Look, Miss Dior fue la primera fragancia de la casa. Su nombre honra a Catherine Dior, hermana del diseñador y miembro de la Resistencia francesa.',
        notes: {
            salida: 'Mandarina, Rosa de Damasco',
            corazon: 'Jazmín de Grasse, Peonía',
            fondo: 'Pachulí, Vainilla'
        },
        experience: 'Cada aplicación transporta a los jardines de Granville, donde Christian Dior pasó su infancia rodeado de rosas y jazmines.',
        image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59db9?w=400'
    },
    'jadore': {
        title: "J'adore L'Or",
        subtitle: 'El oro líquido de Dior',
        story: 'Una versión más intensa y lujosa del icónico J\'adore, creada para las mujeres que no temen brillar.',
        history: 'Desarrollada por François Demachy como una versión más concentrada del clásico J\'adore de 1999. Esta edición especial celebra la feminidad con materias primas de excepción.',
        notes: {
            salida: 'Ylang-ylang, Magnolia',
            corazon: 'Jazmín Sambac, Rosa Turca',
            fondo: 'Sándalo, Ámbar'
        },
        experience: 'Como llevar puesto un collar de joyas invisibles, esta fragancia envuelve la piel con una sensualidad dorada incomparable.',
        image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400'
    },
    'sauvage': {
        title: 'Sauvage',
        subtitle: 'La libertad en estado puro',
        story: 'Inspirada en los amplios espacios del desierto americano, Sauvage captura la esencia de la libertad y la aventura.',
        history: 'Creada por François Demachy en 2015, Sauvage está inspirada en los paisajes del oeste americano que tanto fascinaron a Christian Dior durante sus viajes.',
        notes: {
            salida: 'Bergamota de Calabria, Pimienta rosa',
            corazon: 'Pimienta de Sichuan, Lavanda',
            fondo: 'Ambroxán, Cedro'
        },
        experience: 'Como una bocanada de aire fresco del desierto al amanecer, Sauvage despierta los sentidos con su frescura mineral.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0403ba2fe65?w=400'
    },
    'homme-sport': {
        title: 'Homme Sport',
        subtitle: 'La energía en movimiento',
        story: 'Una fragancia que celebra la vitalidad masculina y el espíritu deportivo con elegancia contemporánea.',
        history: 'Desarrollada para el hombre moderno que equilibra la sofisticación con un estilo de vida activo. Representa la evolución de la perfumería masculina de Dior.',
        notes: {
            salida: 'Cítricos, Elemi',
            corazon: 'Jengibre, Cedro',
            fondo: 'Sándalo, Almizcle'
        },
        experience: 'La fragancia perfecta para acompañar desde una reunión de negocios hasta una sesión de entrenamiento, adaptándose a cada momento del día.',
        image: 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=400'
    },
    'rouge-dior': {
        title: 'Rouge Dior',
        subtitle: 'La pasión hecha fragancia',
        story: 'Inspirada en el icónico color rojo de los labiales Dior, esta fragancia captura la pasión y el glamour parisino.',
        history: 'Una creación que celebra el poder del color rojo en la historia de Dior. Desde el primer rouge à lèvres hasta esta fragancia, el rojo sigue siendo símbolo de elegancia.',
        notes: {
            salida: 'Rosa roja, Frambuesa',
            corazon: 'Peonía, Jazmín',
            fondo: 'Cachemira, Vainilla'
        },
        experience: 'Como aplicar el rouge perfecto, esta fragancia realza la belleza natural con un toque de audacia parisina.',
        image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400'
    }
};

// Función para mostrar productos según el filtro
function filterProducts(category) {
    const productCards = document.querySelectorAll('.product-card');
    const sectionSubtitle = document.querySelector('.section-subtitle');
    
    productCards.forEach(card => {
        const productCategory = card.getAttribute('data-category');
        
        if (category === 'all' || productCategory === category) {
            card.style.display = 'block';
            // Animación de entrada
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });

    // Actualizar subtítulo
    if (sectionSubtitle) {
        sectionSubtitle.textContent = subtitleMap[category] || 'Toda la Colección';
    }
}

// Función para mostrar modal con historia del producto
function showProductModal(productId) {
    const story = productStories[productId];
    if (!story) return;

    const modal = document.getElementById('productModal');

    // Actualizar contenido del modal
    document.getElementById('modalTitle').textContent = story.title;
    document.getElementById('modalSubtitle').textContent = story.subtitle;
    document.getElementById('modalImage').src = story.image;
    document.getElementById('modalImage').alt = story.title;
    document.getElementById('storyText').textContent = story.story;
    document.getElementById('historyText').textContent = story.history;
    document.getElementById('experienceText').textContent = story.experience;

    // Actualizar notas olfativas
    document.getElementById('noteSalida').textContent = story.notes.salida;
    document.getElementById('noteCorazon').textContent = story.notes.corazon;
    document.getElementById('noteFondo').textContent = story.notes.fondo;

    // Resetear pestañas al estado inicial
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    // Activar la primera pestaña
    document.querySelector('.tab-button[data-tab="story"]').classList.add('active');
    document.getElementById('story-panel').classList.add('active');

    // Mostrar modal con animación
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Añadir clase para animaciones CSS
    setTimeout(() => {
        modal.classList.add('loaded');
    }, 100);
}

// Función para cerrar modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    modal.classList.remove('loaded');
    document.body.style.overflow = '';
    
    // Limpiar contenido después de la animación
    setTimeout(() => {
        document.getElementById('modalImage').src = '';
        document.getElementById('modalTitle').textContent = '';
        document.getElementById('modalSubtitle').textContent = '';
    }, 400);
}
