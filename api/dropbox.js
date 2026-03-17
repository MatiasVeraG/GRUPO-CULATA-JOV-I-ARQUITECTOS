/**
 * =====================================================
 * VERCEL SERVERLESS API - DROPBOX INTEGRATION
 * =====================================================
 * 
 * Este endpoint maneja todas las operaciones con Dropbox
 * sin exponer las credenciales al frontend.
 * 
 * Las credenciales se obtienen desde variables de entorno
 * configuradas en el dashboard de Vercel.
 * 
 * USO:
 * POST /api/dropbox
 * 
 * VARIABLES DE ENTORNO REQUERIDAS:
 * - DROPBOX_APP_KEY
 * - DROPBOX_APP_SECRET
 * - DROPBOX_REFRESH_TOKEN
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, ...params } = req.body;

    try {
        // Verificar que existan las variables de entorno
        if (!process.env.DROPBOX_REFRESH_TOKEN) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Dropbox credentials not configured'
            });
        }

        switch (action) {
            case 'list-projects':
                return await listProjects(res);
            case 'get-project-images':
                return await getProjectImages(params.projectPath, res);
            case 'get-temporary-link':
                return await getTemporaryLink(params.filePath, res);
            case 'upload-file':
                return await uploadFile(params.destinationPath, params.fileContent, params.fileName, res);
            case 'create-project':
                return await createProject(params.projectName, res);
            case 'delete-file':
                return await deleteFile(params.filePath, res);
            default:
                return res.status(400).json({ error: 'Unknown action', action });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
}

// ============================================
// UTILIDADES DE AUTENTICACIÓN
// ============================================

let accessToken = null;
let tokenExpiry = null;

/**
 * Obtiene un access token válido, usando el refresh token
 */
async function getValidAccessToken() {
    // Si el token es válido, retornarlo
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    // Renovar el token
    try {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
            client_id: process.env.DROPBOX_APP_KEY,
            client_secret: process.env.DROPBOX_APP_SECRET
        });

        const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Auth failed: ${errorData.error_description || response.statusText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        // Token expira en 4 horas, renovar a las 3.5 horas
        tokenExpiry = Date.now() + 3.5 * 60 * 60 * 1000;

        return accessToken;
    } catch (error) {
        throw new Error(`Failed to refresh access token: ${error.message}`);
    }
}

// ============================================
// OPERACIONES DE LECTURA
// ============================================

/**
 * Lista todos los proyectos en /Proyectos
 */
async function listProjects(res) {
    try {
        const token = await getValidAccessToken();

        const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: '/Proyectos',
                recursive: false,
                include_media_info: false,
                include_deleted: false,
                include_has_explicit_shared_members: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error_summary || response.statusText);
        }

        const data = await response.json();

        // Filtrar solo carpetas
        const projects = data.entries
            .filter(entry => entry['.tag'] === 'folder')
            .map(folder => ({
                id: folder.id,
                name: folder.name,
                path: folder.path_lower,
                pathDisplay: folder.path_display
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));

        return res.status(200).json({
            success: true,
            projects,
            count: projects.length
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Failed to list projects',
            message: error.message
        });
    }
}

/**
 * Obtiene las imágenes de un proyecto específico
 */
async function getProjectImages(projectPath, res) {
    try {
        if (!projectPath) {
            return res.status(400).json({ error: 'projectPath is required' });
        }

        const token = await getValidAccessToken();

        // Listar archivos en la carpeta del proyecto
        const listResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
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
            throw new Error(errorData.error_summary || listResponse.statusText);
        }

        const listData = await listResponse.json();

        // Filtrar imagen
        const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
        const imageFiles = listData.entries.filter(entry => {
            if (entry['.tag'] !== 'file') return false;
            const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'));
            return ALLOWED_EXTENSIONS.includes(ext);
        });

        if (imageFiles.length === 0) {
            return res.status(200).json({
                success: true,
                images: [],
                count: 0
            });
        }

        // Obtener temporary links para todas las imágenes
        const images = await Promise.all(
            imageFiles.map(async (file) => {
                const link = await getTemporaryLinkInternal(file.path_lower, token);
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

        return res.status(200).json({
            success: true,
            images,
            count: images.length
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get project images',
            message: error.message
        });
    }
}

/**
 * Obtiene un temporary link para un archivo
 */
async function getTemporaryLink(filePath, res) {
    try {
        if (!filePath) {
            return res.status(400).json({ error: 'filePath is required' });
        }

        const token = await getValidAccessToken();
        const link = await getTemporaryLinkInternal(filePath, token);

        return res.status(200).json({
            success: true,
            link
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get temporary link',
            message: error.message
        });
    }
}

/**
 * Función interna para obtener temporary link
 */
async function getTemporaryLinkInternal(filePath, token) {
    const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: filePath })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get temp link: ${errorData.error_summary}`);
    }

    const data = await response.json();
    return data.link;
}

// ============================================
// OPERACIONES DE ESCRITURA
// ============================================

/**
 * Sube un archivo a Dropbox
 */
async function uploadFile(destinationPath, fileContent, fileName, res) {
    try {
        if (!destinationPath || !fileContent) {
            return res.status(400).json({
                error: 'destinationPath and fileContent are required'
            });
        }

        const token = await getValidAccessToken();

        // fileContent llega como base64 desde el navegador
        const binaryContent = Buffer.from(fileContent, 'base64');

        const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                    path: destinationPath,
                    mode: 'add',
                    autorename: true,
                    mute: false,
                    strict_conflict: false
                })
            },
            body: binaryContent
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error_summary || response.statusText);
        }

        const data = await response.json();

        return res.status(200).json({
            success: true,
            file: {
                id: data.id,
                name: data.name,
                path: data.path_lower,
                size: data.size
            }
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Upload failed',
            message: error.message
        });
    }
}

/**
 * Crea una nueva carpeta de proyecto
 */
async function createProject(projectName, res) {
    try {
        if (!projectName) {
            return res.status(400).json({ error: 'projectName is required' });
        }

        const token = await getValidAccessToken();
        const projectPath = `/Proyectos/${projectName}`;

        const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
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
            throw new Error(errorData.error_summary || response.statusText);
        }

        const data = await response.json();

        return res.status(200).json({
            success: true,
            project: {
                id: data.metadata.id,
                name: data.metadata.name,
                path: data.metadata.path_lower
            }
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Failed to create project',
            message: error.message
        });
    }
}

/**
 * Elimina un archivo de Dropbox
 */
async function deleteFile(filePath, res) {
    try {
        if (!filePath) {
            return res.status(400).json({ error: 'filePath is required' });
        }

        const token = await getValidAccessToken();

        const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: filePath })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error_summary || response.statusText);
        }

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Failed to delete file',
            message: error.message
        });
    }
}
