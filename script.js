// CARGA INICIAL
window.addEventListener('load', () => {
    // Cargar proyectos al iniciar
    loadProjects();
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
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Añadir clase fade-in a elementos que queremos animar
window.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const projectItems = document.querySelectorAll('.project-item');
    
    sections.forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });
    
    projectItems.forEach((item, index) => {
        item.classList.add('fade-in');
        item.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(item);
    });
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
// Inicializar proyectos - sin proyectos por defecto
function initializeProjects() {
    // No crear proyectos por defecto, dejar que localStorage esté vacío
    // Los proyectos se agregarán desde el panel de administración
}

// Obtener proyectos desde localStorage
function getProjects() {
    const projects = localStorage.getItem('projects');
    return projects ? JSON.parse(projects) : [];
}

// Cargar y mostrar proyectos
function loadProjects() {
    initializeProjects();
    const projects = getProjects();
    const grid = document.getElementById('projectsGrid');
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; letter-spacing: 1px; padding: 60px 0;">No hay proyectos</p>';
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
    
    // Reiniciar event listeners para el modal
    attachProjectClickEvents();
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
let currentImageIndex = 0;
let currentProjectImages = [];

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
document.getElementById('modalPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateModalImage();
    }
});

document.getElementById('modalNext').addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentImageIndex < currentProjectImages.length - 1) {
        currentImageIndex++;
        updateModalImage();
    }
});

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('projectModal');
    if (!modal.classList.contains('active')) return;
    
    if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
        currentImageIndex--;
        updateModalImage();
    } else if (e.key === 'ArrowRight' && currentImageIndex < currentProjectImages.length - 1) {
        currentImageIndex++;
        updateModalImage();
    }
});

// Soporte para gestos táctiles (swipe)
let touchStartX = 0;
let touchEndX = 0;

document.getElementById('modalImage').addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.getElementById('modalImage').addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

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

modalClose.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    document.body.style.overflow = 'auto';
}

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});
