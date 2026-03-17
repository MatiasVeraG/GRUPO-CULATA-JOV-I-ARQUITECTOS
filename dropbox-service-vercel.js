/**
 * =====================================================
 * DROPBOX SERVICE (VERSIÓN CON API SERVERLESS)
 * =====================================================
 * 
 * Este servicio llama a la API de Vercel en lugar de
 * conectar directamente con Dropbox. Las credenciales
 * están protegidas en el backend.
 */

class DropboxService {
    constructor(config) {
        this.config = config;
        this.storageKeyPrefix = 'dropbox_service_cache_v1';
        this.cache = {
            projects: null,
            projectSummaries: null,
            projectImages: {},
            lastUpdate: null
        };
        // La URL de la API dependerá del entorno
        this.apiUrl = this.getApiUrl();
    }

    /**
     * Obtiene la URL de la API según el entorno
     */
    getApiUrl() {
        // En desarrollo: http://localhost:3000
        // En producción: https://tudominio.vercel.app
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api/dropbox';
        }
        return `${window.location.origin}/api/dropbox`;
    }

    /**
     * Realiza una llamada a la API serverless
     */
    async callApi(action, params = {}) {
        try {
            const readActions = new Set([
                'list-projects',
                'get-project-summaries',
                'get-project-detail',
                'get-project-images',
                'get-project-drawings',
                'get-temporary-link',
                'get-site-content',
                'get-sobre-images'
            ]);

            const isReadAction = readActions.has(action);
            let response;

            if (isReadAction) {
                const url = new URL(this.apiUrl, window.location.origin);
                url.searchParams.set('action', action);
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value === undefined || value === null) return;
                    url.searchParams.set(key, String(value));
                });

                response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
            } else {
                response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action,
                        ...params
                    })
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || response.statusText);
            }

            const data = await response.json();
            
            if (!data.success && data.error) {
                throw new Error(data.message || data.error);
            }

            return data;

        } catch (error) {
            console.error(`API Error (${action}):`, error);
            throw error;
        }
    }

    // ============================================
    // OPERACIONES DE LECTURA
    // ============================================

    /**
     * Lista todos los proyectos
     */
    async listProjects() {
        // Verificar caché
        if (this.cache.projects && this.cache.lastUpdate && 
            (Date.now() - this.cache.lastUpdate) < this.config.CACHE_TTL) {
            console.log('📦 Usando proyectos desde caché');
            return this.cache.projects;
        }

        const cachedProjects = this.readSessionCache('projects');
        if (cachedProjects) {
            this.cache.projects = cachedProjects;
            this.cache.lastUpdate = Date.now();
            console.log('📦 Usando proyectos desde sessionStorage');
            return cachedProjects;
        }

        const data = await this.callApi('list-projects');
        
        this.cache.projects = data.projects;
        this.cache.lastUpdate = Date.now();
        this.writeSessionCache('projects', data.projects);

        console.log(`✓ ${data.count} proyectos encontrados`);
        return data.projects;
    }

    /**
     * Obtiene las imágenes de un proyecto
     */
    async getProjectImages(projectPath) {
        // Verificar caché
        const cacheKey = projectPath.toLowerCase();
        if (this.cache.projectImages[cacheKey] && this.cache.lastUpdate &&
            (Date.now() - this.cache.lastUpdate) < this.config.CACHE_TTL) {
            console.log(`📦 Usando imágenes de ${projectPath} desde caché`);
            return this.cache.projectImages[cacheKey];
        }

        const data = await this.callApi('get-project-images', {
            projectPath
        });

        this.cache.projectImages[cacheKey] = data.images;
        
        console.log(`✓ ${data.count} imágenes encontradas en ${projectPath}`);
        return data.images;
    }

    async getProjectDrawings(projectPath) {
        const data = await this.callApi('get-project-drawings', {
            projectPath
        });
        return data.drawings;
    }

    async getProjectDetail(projectPath) {
        const data = await this.callApi('get-project-detail', {
            projectPath
        });
        return data.project;
    }

    /**
     * Obtiene un temporary link
     */
    async getTemporaryLink(filePath) {
        const data = await this.callApi('get-temporary-link', {
            filePath
        });
        return data.link;
    }

    /**
     * Obtiene todos los proyectos con sus portadas
     */
    async getAllProjectsWithCovers() {
        if (this.cache.projectSummaries && this.cache.lastUpdate &&
            (Date.now() - this.cache.lastUpdate) < this.config.CACHE_TTL) {
            console.log('📦 Usando resumen de proyectos desde caché');
            return this.cache.projectSummaries;
        }

        const cachedSummaries = this.readSessionCache('project_summaries');
        if (cachedSummaries) {
            this.cache.projectSummaries = cachedSummaries;
            this.cache.lastUpdate = Date.now();
            console.log('📦 Usando resumen de proyectos desde sessionStorage');
            return cachedSummaries;
        }

        try {
            const data = await this.callApi('get-project-summaries');
            const summaries = data.projects || [];

            this.cache.projectSummaries = summaries;
            this.cache.projects = summaries;
            this.cache.lastUpdate = Date.now();
            this.writeSessionCache('project_summaries', summaries);
            this.writeSessionCache('projects', summaries);

            return summaries;
        } catch (error) {
            // Fallback para mantener compatibilidad en despliegues sin el nuevo endpoint
            const projects = await this.listProjects();
            const projectsWithCovers = await Promise.all(
                projects.map(async (project) => {
                    const detail = await this.getProjectDetail(project.path);
                    return {
                        ...project,
                        cover: detail.cover,
                        imageCount: detail.images.length,
                        drawingCount: detail.drawings.length,
                        description: detail.description,
                        features: detail.features
                    };
                })
            );

            this.cache.projectSummaries = projectsWithCovers;
            this.cache.lastUpdate = Date.now();
            this.writeSessionCache('project_summaries', projectsWithCovers);
            return projectsWithCovers;
        }
    }

    readSessionCache(key) {
        try {
            const raw = sessionStorage.getItem(`${this.storageKeyPrefix}:${key}`);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.timestamp || !('value' in parsed)) return null;

            if ((Date.now() - parsed.timestamp) > this.config.CACHE_TTL) {
                sessionStorage.removeItem(`${this.storageKeyPrefix}:${key}`);
                return null;
            }

            return parsed.value;
        } catch (_) {
            return null;
        }
    }

    writeSessionCache(key, value) {
        try {
            sessionStorage.setItem(
                `${this.storageKeyPrefix}:${key}`,
                JSON.stringify({
                    timestamp: Date.now(),
                    value
                })
            );
        } catch (_) {
            // Ignorar errores de sessionStorage (modo privado/cuota)
        }
    }

    // ============================================
    // OPERACIONES DE ESCRITURA
    // ============================================

    /**
     * Valida un archivo antes de subirlo
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
     * Sube un archivo a Dropbox
     */
    async uploadFile(file, destinationPath, onProgress = null) {
        // Validar archivo
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Leer archivo como base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async () => {
                try {
                    // Extraer base64 sin el prefijo "data:image/...;base64,"
                    const base64 = reader.result.split(',')[1];
                    
                    const data = await this.callApi('upload-file', {
                        destinationPath,
                        fileContent: base64,
                        fileName: file.name
                    });

                    // Limpiar caché
                    const projectPath = destinationPath.substring(0, destinationPath.lastIndexOf('/'));
                    delete this.cache.projectImages[projectPath.toLowerCase()];

                    console.log(`✓ Archivo subido exitosamente: ${data.file.name}`);
                    resolve({
                        success: true,
                        file: data.file
                    });

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

    /**
     * Sube múltiples archivos
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
     */
    async createProject(projectName) {
        const data = await this.callApi('create-project', {
            projectName
        });

        // Limpiar caché de proyectos
        this.cache.projects = null;

        console.log(`✓ Proyecto creado: ${projectName}`);
        return {
            success: true,
            project: data.project
        };
    }

    async saveDescription(projectPath, content) {
        const data = await this.callApi('save-description', {
            projectPath,
            content
        });
        return data;
    }

    async saveDescriptionLang(projectPath, lang, content) {
        const data = await this.callApi('save-description-lang', {
            projectPath,
            lang,
            content
        });
        return data;
    }

    async saveFeatures(projectPath, featuresText) {
        const data = await this.callApi('save-features', {
            projectPath,
            featuresText
        });
        return data;
    }

    async getSiteContent(pageKey) {
        const data = await this.callApi('get-site-content', {
            pageKey
        });
        return data.content || '';
    }

    async getSobreImages() {
        const data = await this.callApi('get-sobre-images', {});
        return data.images || [];
    }

    async saveSiteContent(pageKey, content) {
        const data = await this.callApi('save-site-content', {
            pageKey,
            content
        });
        return data;
    }

    /**
     * Elimina un archivo
     */
    async deleteFile(filePath) {
        await this.callApi('delete-file', {
            filePath
        });

        // Limpiar caché del proyecto
        const projectPath = filePath.substring(0, filePath.lastIndexOf('/'));
        delete this.cache.projectImages[projectPath.toLowerCase()];

        console.log(`✓ Archivo eliminado: ${filePath}`);
        return { success: true };
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Limpia la caché
     */
    clearCache() {
        this.cache = {
            projects: null,
            projectSummaries: null,
            projectImages: {},
            lastUpdate: null
        };
        try {
            Object.keys(sessionStorage)
                .filter(key => key.startsWith(`${this.storageKeyPrefix}:`))
                .forEach(key => sessionStorage.removeItem(key));
        } catch (_) {
            // Ignorar errores de sessionStorage
        }
        console.log('✓ Caché limpiada');
    }

    /**
     * Formatea el tamaño de archivo
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
