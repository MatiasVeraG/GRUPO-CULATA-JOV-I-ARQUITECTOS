// CARGA INICIAL
window.addEventListener('load', () => {
    // La carga específica de proyectos se maneja en cada página
});

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// FADE IN ON SCROLL
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Optional: unobserve if we only want it to animate once
            // observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Añadir clase reveal a elementos que queremos animar
window.addEventListener('DOMContentLoaded', () => {
    // Buscar elementos que ya tengan la clase reveal o añadírsela dinámicamente
    const sections = document.querySelectorAll('section');
    const projectItems = document.querySelectorAll('.project-item');
    const textBlocks = document.querySelectorAll('.about-block');
    
    sections.forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });
    
    projectItems.forEach((item, index) => {
        item.classList.add('reveal');
        item.style.transitionDelay = `${(index % 3) * 0.15}s`;
        observer.observe(item);
    });
    
    textBlocks.forEach((block, index) => {
        block.classList.add('reveal');
        block.style.transitionDelay = `${(index % 2) * 0.15}s`;
        observer.observe(block);
    });
    
    // Asegurar que cualquier elemento que ya tenga .fade-in o .reveal sea observado
    document.querySelectorAll('.fade-in, .reveal').forEach(el => observer.observe(el));
});

// HEADER BACKGROUND ON SCROLL
let lastScroll = 0;
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    } else {
        header.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// MODAL DE PROYECTOS
// Obtener proyectos desde localStorage o usar fallback visual
function getProjects() {
    const projects = localStorage.getItem('projects');
    const parsed = projects ? JSON.parse(projects) : [];
    
    if (parsed.length > 0) {
        return parsed.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // Fallback visual de alta calidad para cuando la API de Dropbox no esté disponible
    return [
        {
            id: 1,
            title: "Casa Mainumby - Fachada",
            image: "images/casa-mainumby-grupo-culata-jovai_11.jpg",
            images: ["images/casa-mainumby-grupo-culata-jovai_11.jpg"]
        },
        {
            id: 2,
            title: "Casa Mainumby - Interior",
            image: "images/casa-mainumby-grupo-culata-jovai_16.jpg",
            images: ["images/casa-mainumby-grupo-culata-jovai_16.jpg"]
        },
        {
            id: 3,
            title: "Casa Mainumby - Detalles",
            image: "images/casa-mainumby-grupo-culata-jovai_2.jpg",
            images: ["images/casa-mainumby-grupo-culata-jovai_2.jpg"]
        },
        {
            id: 4,
            title: "Casa Mainumby - Estructura",
            image: "images/casa-mainumby-grupo-culata-jovai_5.jpg",
            images: ["images/casa-mainumby-grupo-culata-jovai_5.jpg"]
        },
        {
            id: 5,
            title: "Casa Mainumby - Exteriores",
            image: "images/casa-mainumby-grupo-culata-jovai_7.jpg",
            images: ["images/casa-mainumby-grupo-culata-jovai_7.jpg"]
        },
        {
            id: 6,
            title: "Casa Mainumby - Espacios",
            image: "images/casa-mainumby-grupo-culata-jovai_9.jpg",
            images: ["images/casa-mainumby-grupo-culata-jovai_9.jpg"]
        }
    ];
}

// Cargar y mostrar proyectos desde localStorage (Fallback)
async function loadLocalProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    const projects = getProjects();
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; letter-spacing: 1px; padding: 60px 0;">No hay proyectos locales</p>';
        return;
    }
    
    grid.innerHTML = projects.map(project => `
        <div class="project-item" data-project="${project.id}">
            <img src="${project.images ? project.images[0] : project.image}" alt="${project.title}">
            <div class="project-overlay">
                <span>${project.title}</span>
            </div>
        </div>
    `).join('');
    
    if (typeof attachProjectClickEvents === 'function') attachProjectClickEvents();
}

// Adjuntar eventos de click a los proyectos
function attachProjectClickEvents() {
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            const projectId = parseInt(item.getAttribute('data-project'));
            openProjectModal(projectId);
        });
    });
}

// Abrir modal de proyecto con slider
var currentImageIndex = 0;
var currentProjectImages = [];

function openProjectModal(projectId) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    const modal = document.getElementById('projectModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalCounter = document.getElementById('modalCounter');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    const modalIndicators = document.getElementById('modalIndicators');
    
    // Soporte para proyectos antiguos con 'image' y nuevos con 'images'
    currentProjectImages = project.images || [project.image];
    currentImageIndex = 0;
    
    // Configurar información del proyecto
    modalTitle.textContent = project.title;
    modalDescription.textContent = project.description;
    
    // Mostrar primera imagen
    updateModalImage();
    
    // Configurar controles
    updateModalControls();
    
    // Crear indicadores
    createModalIndicators();
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    document.body.style.overflow = 'hidden';
}

function updateModalImage() {
    const modalImage = document.getElementById('modalImage');
    const modalCounter = document.getElementById('modalCounter');
    
    modalImage.src = currentProjectImages[currentImageIndex];
    modalCounter.textContent = `${currentImageIndex + 1} / ${currentProjectImages.length}`;
    
    // Actualizar indicadores activos
    document.querySelectorAll('.modal-indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentImageIndex);
    });
}

function updateModalControls() {
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    
    // Ocultar controles si solo hay una imagen
    if (currentProjectImages.length <= 1) {
        modalPrev.classList.add('hidden');
        modalNext.classList.add('hidden');
    } else {
        modalPrev.classList.remove('hidden');
        modalNext.classList.remove('hidden');
    }
}

function createModalIndicators() {
    const modalIndicators = document.getElementById('modalIndicators');
    
    // Limpiar indicadores existentes
    modalIndicators.innerHTML = '';
    
    // No mostrar indicadores si solo hay una imagen
    if (currentProjectImages.length <= 1) return;
    
    // Crear indicador para cada imagen
    currentProjectImages.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'modal-indicator';
        if (index === currentImageIndex) {
            indicator.classList.add('active');
        }
        indicator.addEventListener('click', () => {
            currentImageIndex = index;
            updateModalImage();
        });
        modalIndicators.appendChild(indicator);
    });
}

// Navegación del slider
const modalPrev = document.getElementById('modalPrev');
if (modalPrev) {
    modalPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updateModalImage();
        }
    });
}

const modalNext = document.getElementById('modalNext');
if (modalNext) {
    modalNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentImageIndex < currentProjectImages.length - 1) {
            currentImageIndex++;
            updateModalImage();
        }
    });
}

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('projectModal');
    if (!modal || !modal.classList.contains('active')) return;
    
    if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
        currentImageIndex--;
        updateModalImage();
    } else if (e.key === 'ArrowRight' && currentImageIndex < currentProjectImages.length - 1) {
        currentImageIndex++;
        updateModalImage();
    }
});

// Soporte para gestos táctiles (swipe)
var touchStartX = 0;
var touchEndX = 0;
const modalImageEl = document.getElementById('modalImage');

if (modalImageEl) {
    modalImageEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    modalImageEl.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    const swipeThreshold = 50; // Mínimo de píxeles para considerar un swipe
    
    if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe izquierda (siguiente imagen)
        if (currentImageIndex < currentProjectImages.length - 1) {
            currentImageIndex++;
            updateModalImage();
        }
    }
    
    if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe derecha (imagen anterior)
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updateModalImage();
        }
    }
}

// Cerrar modal
const modal = document.getElementById('projectModal');
const modalClose = document.querySelector('.modal-close');

if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    document.body.style.overflow = 'auto';
}

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
    if (modal && e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});
