/**
 * =====================================================
 * DROPBOX SERVICE
 * Servicio completo para integración con Dropbox API
 * =====================================================
 */

class DropboxService {
    constructor(config) {
        this.config = config;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.cache = {
            projects: null,
            projectImages: {},
            lastUpdate: null
        };
    }

    // ============================================
    // AUTENTICACIÓN CON REFRESH TOKEN
    // ============================================

    /**
     * Obtiene un nuevo access token usando el refresh token
     * El refresh token NO expira, el access token sí (4 horas)
     */
    async refreshAccessToken() {
        try {
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.config.REFRESH_TOKEN,
                client_id: this.config.APP_KEY,
                client_secret: this.config.APP_SECRET
            });

            const response = await fetch(this.config.AUTH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error de autenticación: ${errorData.error_description || response.statusText}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            // El token expira en 4 horas, renovamos a las 3.5 horas por seguridad
            this.tokenExpiry = Date.now() + this.config.TOKEN_REFRESH_INTERVAL;

            console.log('✓ Access token renovado exitosamente');
            return this.accessToken;

        } catch (error) {
            console.error('Error al renovar access token:', error);
            throw error;
        }
    }

    /**
     * Obtiene un access token válido, renovándolo si es necesario
     */
    async getValidAccessToken() {
        if (!this.accessToken || Date.now() >= this.tokenExpiry) {
            await this.refreshAccessToken();
        }
        return this.accessToken;
    }

    // ============================================
    // OPERACIONES DE LECTURA
    // ============================================

    /**
     * Lista todas las subcarpetas (proyectos) dentro de /Proyectos
     */
    async listProjects() {
        // Verificar caché
        if (this.cache.projects && this.cache.lastUpdate && 
            (Date.now() - this.cache.lastUpdate) < this.config.CACHE_TTL) {
            console.log('📦 Usando proyectos desde caché');
            return this.cache.projects;
        }

        try {
            const token = await this.getValidAccessToken();
            
            const response = await fetch(`${this.config.API_BASE_URL}/files/list_folder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: this.config.PROJECTS_FOLDER,
                    recursive: false,
                    include_media_info: false,
                    include_deleted: false,
                    include_has_explicit_shared_members: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error al listar proyectos: ${errorData.error_summary || response.statusText}`);
            }

            const data = await response.json();
            
            // Filtrar solo carpetas (cada carpeta es un proyecto)
            const projects = data.entries
                .filter(entry => entry['.tag'] === 'folder')
                .map(folder => ({
                    id: folder.id,
                    name: folder.name,
                    path: folder.path_lower,
                    pathDisplay: folder.path_display
                }))
                .sort((a, b) => a.name.localeCompare(b.name, 'es'));

            // Actualizar caché
            this.cache.projects = projects;
            this.cache.lastUpdate = Date.now();

            console.log(`✓ ${projects.length} proyectos encontrados`);
            return projects;

        } catch (error) {
            console.error('Error al listar proyectos:', error);
            throw error;
        }
    }

    /**
     * Obtiene las imágenes de un proyecto con sus temporary links
     * @param {string} projectPath - Ruta del proyecto (ej: '/Proyectos/Casa Bosque')
     */
    async getProjectImages(projectPath) {
        // Verificar caché
        const cacheKey = projectPath.toLowerCase();
        if (this.cache.projectImages[cacheKey] && this.cache.lastUpdate &&
            (Date.now() - this.cache.lastUpdate) < this.config.CACHE_TTL) {
            console.log(`📦 Usando imágenes de ${projectPath} desde caché`);
            return this.cache.projectImages[cacheKey];
        }

        try {
            const token = await this.getValidAccessToken();
            
            // Primero listar archivos en la carpeta del proyecto
            const listResponse = await fetch(`${this.config.API_BASE_URL}/files/list_folder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: projectPath,
                    recursive: false,
                    include_media_info: true,
                    include_deleted: false
                })
            });

            if (!listResponse.ok) {
                const errorData = await listResponse.json();
                throw new Error(`Error al listar archivos: ${errorData.error_summary || listResponse.statusText}`);
            }

            const listData = await listResponse.json();
            
            // Filtrar solo imágenes por extensión
            const imageFiles = listData.entries.filter(entry => {
                if (entry['.tag'] !== 'file') return false;
                const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'));
                return this.config.ALLOWED_EXTENSIONS.includes(ext);
            });

            if (imageFiles.length === 0) {
                return [];
            }

            // Obtener temporary links para todas las imágenes
            const images = await Promise.all(
                imageFiles.map(async (file) => {
                    const link = await this.getTemporaryLink(file.path_lower);
                    return {
                        id: file.id,
                        name: file.name,
                        path: file.path_lower,
                        size: file.size,
                        modified: file.server_modified,
                        temporaryLink: link,
                        mediaInfo: file.media_info
                    };
                })
            );

            // Ordenar por nombre
            images.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));

            // Actualizar caché
            this.cache.projectImages[cacheKey] = images;

            console.log(`✓ ${images.length} imágenes encontradas en ${projectPath}`);
            return images;

        } catch (error) {
            console.error(`Error al obtener imágenes de ${projectPath}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene un temporary link para un archivo específico
     * Los temporary links expiran en 4 horas
     * @param {string} filePath - Ruta completa del archivo
     */
    async getTemporaryLink(filePath) {
        try {
            const token = await this.getValidAccessToken();
            
            const response = await fetch(`${this.config.API_BASE_URL}/files/get_temporary_link`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: filePath
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error al obtener link temporal: ${errorData.error_summary || response.statusText}`);
            }

            const data = await response.json();
            return data.link;

        } catch (error) {
            console.error(`Error al obtener link temporal para ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todos los proyectos con sus imágenes de portada
     */
    async getAllProjectsWithCovers() {
        try {
            const projects = await this.listProjects();
            
            const projectsWithCovers = await Promise.all(
                projects.map(async (project) => {
                    const images = await this.getProjectImages(project.path);
                    return {
                        ...project,
                        cover: images.length > 0 ? images[0].temporaryLink : null,
                        imageCount: images.length
                    };
                })
            );

            return projectsWithCovers;

        } catch (error) {
            console.error('Error al obtener proyectos con portadas:', error);
            throw error;
        }
    }

    // ============================================
    // OPERACIONES DE ESCRITURA (UPLOAD)
    // ============================================

    /**
     * Valida un archivo antes de subirlo
     * @param {File} file - Archivo a validar
     * @returns {Object} - { valid: boolean, error?: string }
     */
    validateFile(file) {
        // Validar tamaño
        if (file.size > this.config.MAX_FILE_SIZE) {
            const maxMB = this.config.MAX_FILE_SIZE / (1024 * 1024);
            const fileMB = (file.size / (1024 * 1024)).toFixed(2);
            return {
                valid: false,
                error: `El archivo "${file.name}" (${fileMB}MB) excede el límite de ${maxMB}MB`
            };
        }

        // Validar extensión
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!this.config.ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: `El archivo "${file.name}" tiene una extensión no permitida. Solo se permiten: ${this.config.ALLOWED_EXTENSIONS.join(', ')}`
            };
        }

        // Validar tipo MIME
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.type)) {
            return {
                valid: false,
                error: `El archivo "${file.name}" no es una imagen válida`
            };
        }

        return { valid: true };
    }

    /**
     * Sube un archivo a una carpeta específica de Dropbox
     * @param {File} file - Archivo a subir
     * @param {string} destinationPath - Ruta de destino (ej: '/Proyectos/Casa Bosque/imagen.jpg')
     * @param {Function} onProgress - Callback opcional para progreso
     */
    async uploadFile(file, destinationPath, onProgress = null) {
        // Validar archivo
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        try {
            const token = await this.getValidAccessToken();
            
            // Para archivos menores a 150MB usamos upload simple
            // Para archivos mayores se necesitaría upload_session (no aplica aquí por el límite de 10MB)
            
            const response = await fetch(`${this.config.CONTENT_URL}/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: destinationPath,
                        mode: 'add',  // No sobrescribir si existe
                        autorename: true,  // Renombrar automáticamente si hay conflicto
                        mute: false,
                        strict_conflict: false
                    })
                },
                body: file
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error al subir archivo: ${errorData.error_summary || response.statusText}`);
            }

            const data = await response.json();
            
            // Limpiar caché del proyecto afectado
            const projectPath = destinationPath.substring(0, destinationPath.lastIndexOf('/'));
            delete this.cache.projectImages[projectPath.toLowerCase()];

            console.log(`✓ Archivo subido exitosamente: ${data.name}`);
            return {
                success: true,
                file: {
                    id: data.id,
                    name: data.name,
                    path: data.path_lower,
                    size: data.size
                }
            };

        } catch (error) {
            console.error(`Error al subir ${file.name}:`, error);
            throw error;
        }
    }

    /**
     * Sube múltiples archivos a una carpeta de proyecto
     * @param {FileList|Array} files - Archivos a subir
     * @param {string} projectPath - Ruta del proyecto (ej: '/Proyectos/Casa Bosque')
     * @param {Function} onProgress - Callback de progreso (current, total, fileName)
     */
    async uploadMultipleFiles(files, projectPath, onProgress = null) {
        const results = {
            successful: [],
            failed: []
        };

        const fileArray = Array.from(files);
        
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            const destinationPath = `${projectPath}/${file.name}`;

            if (onProgress) {
                onProgress(i + 1, fileArray.length, file.name);
            }

            try {
                const result = await this.uploadFile(file, destinationPath);
                results.successful.push({
                    originalName: file.name,
                    ...result.file
                });
            } catch (error) {
                results.failed.push({
                    name: file.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Crea una nueva carpeta de proyecto
     * @param {string} projectName - Nombre del nuevo proyecto
     */
    async createProject(projectName) {
        try {
            const token = await this.getValidAccessToken();
            const projectPath = `${this.config.PROJECTS_FOLDER}/${projectName}`;

            const response = await fetch(`${this.config.API_BASE_URL}/files/create_folder_v2`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: projectPath,
                    autorename: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error al crear proyecto: ${errorData.error_summary || response.statusText}`);
            }

            const data = await response.json();
            
            // Limpiar caché de proyectos
            this.cache.projects = null;

            console.log(`✓ Proyecto creado: ${projectName}`);
            return {
                success: true,
                project: {
                    id: data.metadata.id,
                    name: data.metadata.name,
                    path: data.metadata.path_lower
                }
            };

        } catch (error) {
            console.error(`Error al crear proyecto ${projectName}:`, error);
            throw error;
        }
    }

    /**
     * Elimina un archivo de Dropbox
     * @param {string} filePath - Ruta del archivo a eliminar
     */
    async deleteFile(filePath) {
        try {
            const token = await this.getValidAccessToken();

            const response = await fetch(`${this.config.API_BASE_URL}/files/delete_v2`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: filePath
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error al eliminar archivo: ${errorData.error_summary || response.statusText}`);
            }

            // Limpiar caché
            const projectPath = filePath.substring(0, filePath.lastIndexOf('/'));
            delete this.cache.projectImages[projectPath.toLowerCase()];

            console.log(`✓ Archivo eliminado: ${filePath}`);
            return { success: true };

        } catch (error) {
            console.error(`Error al eliminar ${filePath}:`, error);
            throw error;
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Limpia toda la caché
     */
    clearCache() {
        this.cache = {
            projects: null,
            projectImages: {},
            lastUpdate: null
        };
        console.log('✓ Caché limpiada');
    }

    /**
     * Formatea el tamaño de archivo en formato legible
     * @param {number} bytes - Tamaño en bytes
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Crear instancia global del servicio
const dropboxService = new DropboxService(DropboxConfig);

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DropboxService, dropboxService };
}
