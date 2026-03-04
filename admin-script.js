// Verificar autenticación
if (!sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin.html';
} else {
    loadProjects();
}

// Obtener proyectos desde API
async function getProjects() {
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        const projects = await response.json();
        return projects.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        return [];
    }
}

// Guardar o actualizar proyecto
async function saveProject(projectData) {
    try {
        const method = projectData.id ? 'PUT' : 'POST';
        const response = await fetch('/api/projects', {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData)
        });

        if (!response.ok) {
            throw new Error('Error al guardar proyecto');
        }

        return true;
    } catch (error) {
        console.error('Error al guardar proyecto:', error);
        alert('Error al guardar el proyecto: ' + error.message);
        return false;
    }
}

// Eliminar proyecto
async function deleteProjectFromAPI(projectId) {
    try {
        const response = await fetch(`/api/projects?id=${projectId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar proyecto');
        }

        return true;
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        alert('Error al eliminar el proyecto: ' + error.message);
        return false;
    }
}

// Actualizar orden de proyectos
async function updateProjectsOrder(projects) {
    try {
        const updatePromises = projects.map((project, index) => 
            fetch('/api/projects', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: project.id,
                    title: project.title,
                    description: project.description,
                    images: project.images,
                    order: index
                })
            })
        );
        
        await Promise.all(updatePromises);
        return true;
    } catch (error) {
        console.error('Error al actualizar orden:', error);
        return false;
    }
}

// Cargar proyectos en el grid
async function loadProjects() {
    const grid = document.getElementById('projectsAdminGrid');
    
    // Mostrar indicador de carga
    grid.innerHTML = '<p style="text-align: center; letter-spacing: 1px;">Cargando proyectos...</p>';
    
    const projects = await getProjects();
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="text-align: center; letter-spacing: 1px;">No hay proyectos disponibles</p>';
        return;
    }
    
    grid.innerHTML = projects.map((project, index) => `
        <div class="project-admin-card" data-project-id="${project.id}">
            <div class="project-order-handle">⋮⋮ ORDEN: ${index + 1}</div>
            <img src="${project.images ? project.images[0] : project.image}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p><strong>Imágenes:</strong> ${project.images ? project.images.length : 1}</p>
            <p>${project.description.substring(0, 100)}...</p>
            <div class="project-admin-actions">
                <button class="btn-edit" onclick="editProject('${project.id}')">EDITAR</button>
                <button class="btn-delete" onclick="deleteProject('${project.id}')">ELIMINAR</button>
            </div>
        </div>
    `).join('');
    
    // Configurar drag & drop para reordenar proyectos
    setupProjectDragDrop();
}

// Abrir modal para agregar
function openAddModal() {
    document.getElementById('formTitle').textContent = 'AGREGAR PROYECTO';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    uploadedImages = [];
    updateImagePreview();
    document.getElementById('imageFileInput').value = '';
    document.getElementById('modalForm').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Editar proyecto
async function editProject(id) {
    const projects = await getProjects();
    const project = projects.find(p => p.id === id);
    
    if (project) {
        document.getElementById('formTitle').textContent = 'EDITAR PROYECTO';
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectTitle').value = project.title;
        document.getElementById('projectDescription').value = project.description;
        
        // Cargar todas las imágenes
        uploadedImages = [];
        
        if (project.images && project.images.length > 0) {
            uploadedImages = [...project.images];
        } else if (project.image) {
            uploadedImages = [project.image];
        }
        
        updateImagePreview();
        
        document.getElementById('modalForm').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Eliminar proyecto
async function deleteProject(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
        const success = await deleteProjectFromAPI(id);
        if (success) {
            await loadProjects();
        }
    }
}

// Cerrar modal
function closeFormModal() {
    document.getElementById('modalForm').classList.remove('active');
    document.body.style.overflow = 'auto';
    uploadedImages = [];
    updateImagePreview();
    document.getElementById('imageFileInput').value = '';
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminEmail');
    window.location.href = 'admin.html';
}

// Manejar envío del formulario
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('projectId').value;
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    
    // Usar el array uploadedImages que ya tiene el orden correcto
    const images = [...uploadedImages];
    
    // Validar que haya al menos una imagen
    if (images.length === 0) {
        alert('Por favor, agrega al menos una imagen');
        return;
    }
    
    const projectData = {
        id: id || null,
        title,
        description,
        images
    };
    
    // Mostrar indicador de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'GUARDANDO...';
    submitBtn.disabled = true;
    
    const success = await saveProject(projectData);
    
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    
    if (success) {
        await loadProjects();
        closeFormModal();
    }
});

// Array para almacenar imágenes cargadas
let uploadedImages = [];

// Configurar drag & drop
function setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('imageFileInput');

    // Click para abrir selector de archivos
    uploadArea.addEventListener('click', () => {
        fileInput.click();
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

// Procesar archivos de imagen y subirlos a Cloudinary
async function handleFiles(files) {
    const uploadPromises = [];
    
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            uploadPromises.push(uploadImageToCloudinary(file));
        } else {
            alert('Por favor, selecciona solo archivos de imagen');
        }
    }
    
    try {
        const imageUrls = await Promise.all(uploadPromises);
        uploadedImages.push(...imageUrls);
        updateImagePreview();
    } catch (error) {
        console.error('Error al subir imágenes:', error);
        alert('Error al subir las imágenes: ' + error.message);
    }
}

// Subir una imagen a Cloudinary
async function uploadImageToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: e.target.result,
                        folder: 'projects'
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al subir imagen');
                }

                const data = await response.json();
                resolve(data.url);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsDataURL(file);
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
            if (e.target.tagName === 'BUTTON') {
                e.preventDefault();
                return;
            }
            draggedProjectId = e.currentTarget.getAttribute('data-project-id');
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
            
            const dropProjectId = e.currentTarget.getAttribute('data-project-id');
            
            if (draggedProjectId !== null && draggedProjectId !== dropProjectId) {
                reorderProjects(draggedProjectId, dropProjectId);
            }
        });
    });
}

// Reordenar proyectos
async function reorderProjects(draggedId, targetId) {
    let projects = await getProjects();
    
    const draggedIndex = projects.findIndex(p => p.id === draggedId);
    const targetIndex = projects.findIndex(p => p.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remover proyecto arrastrado
        const [draggedProject] = projects.splice(draggedIndex, 1);
        // Insertar en nueva posición
        projects.splice(targetIndex, 0, draggedProject);
        
        // Actualizar orden
        await updateProjectsOrder(projects);
        await loadProjects();
    }
}

// Inicializar
loadProjects();
setupImageUpload();
