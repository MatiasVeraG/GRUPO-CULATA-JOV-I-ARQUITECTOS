// Verificar autenticación
if (!sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin.html';
}

// Inicializar proyectos por defecto si no existen
function initializeProjects() {
    if (!localStorage.getItem('projects')) {
        const defaultProjects = [
            {
                id: 1,
                title: "PROYECTO 01",
                category: "vivienda-unifamiliar",
                description: "Residencia contemporánea que integra espacios abiertos y luminosos. El diseño prioriza la conexión con el entorno natural mediante amplias ventanas y terrazas integradas. Materiales nobles y líneas limpias definen su carácter arquitectónico.",
                images: ["images/casa1.jpg"]
            },
            {
                id: 2,
                title: "PROYECTO 02",
                category: "vivienda-unifamiliar",
                description: "Vivienda unifamiliar de estética minimalista donde la funcionalidad y el confort convergen. Espacios fluidos y una cuidadosa composición volumétrica caracterizan esta obra. La luz natural es protagonista en cada ambiente.",
                images: ["images/casa2.jpg"]
            },
            {
                id: 3,
                title: "PROYECTO 03",
                category: "vivienda-multifamiliar",
                description: "Proyecto residencial que explora la relación entre interior y exterior. Dobles alturas y circulaciones verticales aportan dinamismo espacial. La paleta material sobria refuerza el concepto arquitectónico.",
                images: ["images/casa3.jpg"]
            },
            {
                id: 4,
                title: "PROYECTO 04",
                category: "comercial",
                description: "Arquitectura residencial contemporánea con énfasis en la eficiencia espacial. Volúmenes puros y geometría clara definen la composición. Cada detalle ha sido pensado para optimizar la experiencia del usuario.",
                images: ["images/casa4.jpg"]
            },
            {
                id: 5,
                title: "PROYECTO 05",
                category: "vivienda-unifamiliar",
                description: "Vivienda que destaca por su integración con el paisaje circundante. Terrazas escalonadas y jardines integrados generan una transición fluida entre espacios. La arquitectura se funde con su contexto natural.",
                images: ["images/casa5.jpg"]
            },
            {
                id: 6,
                title: "PROYECTO 06",
                category: "espacio-publico",
                description: "Residencia de líneas horizontales que enfatizan la conexión con el horizonte. Amplios voladizos generan espacios de transición protegidos. La materialidad honesta refuerza el carácter del proyecto.",
                images: ["images/casa6.jpg"]
            },
            {
                id: 7,
                title: "PROYECTO 07",
                category: "no-construido",
                description: "Proyecto que explora la verticalidad y la luz como elementos compositivos. Espacios de doble altura y aberturas estratégicas generan dinamismo. La arquitectura responde a las necesidades contemporáneas del habitar.",
                images: ["images/casa7.jpg"]
            },
            {
                id: 8,
                title: "PROYECTO 08",
                category: "vivienda-unifamiliar",
                description: "Vivienda unifamiliar donde la privacidad y la apertura coexisten en equilibrio. Patios internos y visuales controladas caracterizan el diseño. Cada espacio ha sido concebido con precisión y cuidado.",
                images: ["images/casa8.jpg"]
            },
            {
                id: 9,
                title: "PROYECTO 09",
                category: "vivienda-multifamiliar",
                description: "Arquitectura residencial que reinterpreta la tradición con lenguaje contemporáneo. Volúmenes simples y composición equilibrada definen la propuesta. El proyecto dialoga respetuosamente con su contexto urbano.",
                images: ["images/casa9.jpg"]
            }
        ];
        localStorage.setItem('projects', JSON.stringify(defaultProjects));
    }
}

// Obtener proyectos
function getProjects() {
    const projects = localStorage.getItem('projects');
    return projects ? JSON.parse(projects) : [];
}

// Guardar proyectos
function saveProjects(projects) {
    localStorage.setItem('projects', JSON.stringify(projects));
}

// Cargar proyectos en el grid
function loadProjects() {
    const projects = getProjects();
    const grid = document.getElementById('projectsAdminGrid');
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="text-align: center; letter-spacing: 1px;">No hay proyectos disponibles</p>';
        return;
    }
    
    grid.innerHTML = projects.map((project, index) => `
        <div class="project-admin-card" data-project-id="${project.id}">
            <div class="project-order-handle">⋮⋮ ORDEN: ${index + 1}</div>
            <img src="${project.images ? project.images[0] : project.image}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p><strong>Categoría:</strong> ${getCategoryName(project.category)}</p>
            <p><strong>Imágenes:</strong> ${project.images ? project.images.length : 1}</p>
            <p>${project.description.substring(0, 100)}...</p>
            <div class="project-admin-actions">
                <button class="btn-edit" onclick="editProject(${project.id})">EDITAR</button>
                <button class="btn-delete" onclick="deleteProject(${project.id})">ELIMINAR</button>
            </div>
        </div>
    `).join('');
    
    // Configurar drag & drop para reordenar proyectos
    setupProjectDragDrop();
}

// Obtener nombre de categoría
function getCategoryName(category) {
    const categories = {
        'vivienda-unifamiliar': 'Vivienda unifamiliar',
        'vivienda-multifamiliar': 'Vivienda multifamiliar',
        'comercial': 'Comercial',
        'espacio-publico': 'Espacio público',
        'no-construido': 'No construido'
    };
    return categories[category] || category;
}

// Abrir modal para agregar
function openAddModal() {
    document.getElementById('formTitle').textContent = 'AGREGAR PROYECTO';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('modalForm').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Editar proyecto
function editProject(id) {
    const projects = getProjects();
    const project = projects.find(p => p.id === id);
    
    if (project) {
        document.getElementById('formTitle').textContent = 'EDITAR PROYECTO';
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectTitle').value = project.title;
        document.getElementById('projectCategory').value = project.category;
        document.getElementById('projectDescription').value = project.description;
        
        // Cargar todas las imágenes (base64 y URLs) en el array de uploadedImages
        uploadedImages = [];
        
        if (project.images && project.images.length > 0) {
            uploadedImages = [...project.images];
        } else if (project.image) {
            uploadedImages = [project.image];
        }
        
        // Limpiar el textarea de URLs
        document.getElementById('projectImage').value = '';
        updateImagePreview();
        
        document.getElementById('modalForm').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Eliminar proyecto
function deleteProject(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
        let projects = getProjects();
        projects = projects.filter(p => p.id !== id);
        saveProjects(projects);
        loadProjects();
    }
}

// Cerrar modal
function closeFormModal() {
    document.getElementById('modalForm').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin.html';
}

// Manejar envío del formulario
document.getElementById('projectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('projectId').value;
    const title = document.getElementById('projectTitle').value;
    const category = document.getElementById('projectCategory').value;
    const description = document.getElementById('projectDescription').value;
    const imageInput = document.getElementById('projectImage').value;
    
    // Convertir string de URLs en array si hay algo en el textarea
    const urlImages = imageInput
        .split(',')
        .map(img => img.trim())
        .filter(img => img.length > 0);
    
    // Agregar URLs adicionales del textarea al array de imágenes
    urlImages.forEach(url => {
        if (!uploadedImages.includes(url)) {
            uploadedImages.push(url);
        }
    });
    
    // Usar el array uploadedImages que ya tiene el orden correcto
    const images = [...uploadedImages];
    
    // Validar que haya al menos una imagen
    if (images.length === 0) {
        alert('Por favor, agrega al menos una imagen');
        return;
    }
    
    let projects = getProjects();
    
    if (id) {
        // Editar proyecto existente
        const index = projects.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            projects[index] = {
                id: parseInt(id),
                title,
                category,
                description,
                images
            };
        }
    } else {
        // Agregar nuevo proyecto
        const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
        projects.push({
            id: newId,
            title,
            category,
            description,
            images
        });
    }
    
    saveProjects(projects);
    loadProjects();
    closeFormModal();
});

// Array para almacenar imágenes cargadas (base64)
let uploadedImages = [];

// Configurar drag & drop
function setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('imageFileInput');
    const previewGrid = document.getElementById('imagePreviewGrid');
    const imageTextarea = document.getElementById('projectImage');

    // Click para abrir selector de archivos
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Listener para textarea de URLs
    imageTextarea.addEventListener('blur', () => {
        const urlInput = imageTextarea.value;
        if (urlInput.trim()) {
            const urls = urlInput
                .split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0);
            
            // Agregar URLs al final del array de imágenes cargadas
            urls.forEach(url => {
                if (!uploadedImages.includes(url)) {
                    uploadedImages.push(url);
                }
            });
            
            // Limpiar textarea
            imageTextarea.value = '';
            updateImagePreview();
        }
    });

    // Prevenir comportamiento por defecto del drag
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Resaltar área cuando se arrastra sobre ella
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        });
    });

    // Manejar drop
    uploadArea.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    // Manejar selección de archivos
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
}

// Procesar archivos de imagen
function handleFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = e.target.result;
                uploadedImages.push(imageData);
                updateImagePreview();
            };
            
            reader.readAsDataURL(file);
        } else {
            alert('Por favor, selecciona solo archivos de imagen');
        }
    });
}

// Actualizar preview de imágenes
function updateImagePreview() {
    const previewGrid = document.getElementById('imagePreviewGrid');
    
    previewGrid.innerHTML = uploadedImages.map((imgData, index) => `
        <div class="image-preview-item" draggable="true" data-index="${index}">
            <img src="${imgData}" alt="Preview ${index + 1}">
            <div class="image-number">#${index + 1}</div>
            <button type="button" class="remove-image" onclick="removeUploadedImage(${index})">×</button>
        </div>
    `).join('');
    
    // Agregar funcionalidad de drag & drop
    setupImageDragDrop();
}

// Eliminar imagen subida
function removeUploadedImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
}

// Limpiar imágenes cargadas al cerrar modal
const originalCloseFormModal = closeFormModal;
closeFormModal = function() {
    uploadedImages = [];
    updateImagePreview();
    document.getElementById('imageFileInput').value = '';
    originalCloseFormModal();
};

// Modificar openAddModal para limpiar imágenes
const originalOpenAddModal = openAddModal;
openAddModal = function() {
    uploadedImages = [];
    updateImagePreview();
    document.getElementById('imageFileInput').value = '';
    originalOpenAddModal();
};

// Configurar drag & drop para reordenar imágenes
function setupImageDragDrop() {
    const imageItems = document.querySelectorAll('.image-preview-item');
    let draggedImageIndex = null;
    
    imageItems.forEach((item, index) => {
        // Prevenir drag en botón de eliminar
        const removeBtn = item.querySelector('.remove-image');
        if (removeBtn) {
            removeBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                item.setAttribute('draggable', 'false');
            });
            removeBtn.addEventListener('mouseup', (e) => {
                item.setAttribute('draggable', 'true');
            });
        }
        
        item.addEventListener('dragstart', (e) => {
            // Prevenir drag si se inició desde el botón
            if (e.target.classList.contains('remove-image')) {
                e.preventDefault();
                return;
            }
            draggedImageIndex = parseInt(e.currentTarget.getAttribute('data-index'));
            e.currentTarget.classList.add('dragging');
        });
        
        item.addEventListener('dragend', (e) => {
            e.currentTarget.classList.remove('dragging');
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        });
        
        item.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropTarget = e.currentTarget;
            dropTarget.classList.remove('drag-over');
            
            const dropIndex = parseInt(dropTarget.getAttribute('data-index'));
            
            if (draggedImageIndex !== null && draggedImageIndex !== dropIndex) {
                // Reordenar array
                const [draggedImage] = uploadedImages.splice(draggedImageIndex, 1);
                uploadedImages.splice(dropIndex, 0, draggedImage);
                updateImagePreview();
            }
        });
    });
}

// Configurar drag & drop para reordenar proyectos
function setupProjectDragDrop() {
    const projectCards = document.querySelectorAll('.project-admin-card');
    let draggedProjectId = null;
    
    projectCards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        // Prevenir drag en botones
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                card.setAttribute('draggable', 'false');
            });
            btn.addEventListener('mouseup', (e) => {
                card.setAttribute('draggable', 'true');
            });
        });
        
        card.addEventListener('dragstart', (e) => {
            // Solo permitir drag si no se inició desde un botón
            if (e.target.tagName === 'BUTTON') {
                e.preventDefault();
                return;
            }
            draggedProjectId = parseInt(e.currentTarget.getAttribute('data-project-id'));
            e.currentTarget.classList.add('dragging');
        });
        
        card.addEventListener('dragend', (e) => {
            e.currentTarget.classList.remove('dragging');
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        });
        
        card.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            
            const dropProjectId = parseInt(e.currentTarget.getAttribute('data-project-id'));
            
            if (draggedProjectId !== null && draggedProjectId !== dropProjectId) {
                reorderProjects(draggedProjectId, dropProjectId);
            }
        });
    });
}

// Reordenar proyectos
function reorderProjects(draggedId, targetId) {
    let projects = getProjects();
    
    const draggedIndex = projects.findIndex(p => p.id === draggedId);
    const targetIndex = projects.findIndex(p => p.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remover proyecto arrastrado
        const [draggedProject] = projects.splice(draggedIndex, 1);
        // Insertar en nueva posición
        projects.splice(targetIndex, 0, draggedProject);
        
        saveProjects(projects);
        loadProjects();
    }
}

// Inicializar
initializeProjects();
loadProjects();
setupImageUpload();
