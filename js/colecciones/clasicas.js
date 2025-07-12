document.addEventListener('DOMContentLoaded', function() {
    // Cargar la navbar
    fetch('../../html/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-container').innerHTML = data;
            // La inicialización ahora se maneja automáticamente por el observer en navbar.js
        })
        .catch(error => console.error('Error loading navbar:', error));

    // Intersection Observer para videos principales
    const videoSections = document.querySelectorAll('.video-container');
    
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (entry.isIntersecting) {
                video.play().catch(e => console.log('Video autoplay prevented:', e));
                entry.target.closest('section').classList.add('active');
            } else {
                video.pause();
                entry.target.closest('section').classList.remove('active');
            }
        });
    }, {
        threshold: 0.5
    });

    videoSections.forEach(section => {
        videoObserver.observe(section);
    });

    // Manejo de videos del catálogo
    const catalogueVideos = document.querySelectorAll('.catalogue-item video');
    catalogueVideos.forEach(video => {
        const item = video.closest('.catalogue-item');
        
        // Reproducir video en hover
        item.addEventListener('mouseenter', () => {
            video.play().catch(e => console.log('Video hover play prevented:', e));
        });
        
        // Pausar video cuando sale del hover
        item.addEventListener('mouseleave', () => {
            video.pause();
            // Opcional: rebobinar el video
            video.currentTime = 0;
        });

        // Para dispositivos táctiles
        item.addEventListener('touchstart', () => {
            if (video.paused) {
                catalogueVideos.forEach(v => {
                    if (v !== video) {
                        v.pause();
                        v.currentTime = 0;
                    }
                });
                video.play().catch(e => console.log('Video touch play prevented:', e));
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    });

    // Parallax effect para textos
    const textSections = document.querySelectorAll('.text-content');
    
    window.addEventListener('scroll', () => {
        textSections.forEach(section => {
            const distance = window.scrollY - section.offsetTop;
            const isVisible = section.getBoundingClientRect().top < window.innerHeight;
            
            if (isVisible) {
                section.style.transform = `translateY(${distance * 0.1}px)`;
                section.style.opacity = 1;
            }
        });
    });

    // Smooth scroll para los botones de "VER DETALLES"
    document.querySelectorAll('.explore-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.closest('section').nextElementSibling;
            if (section) {
                section.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
