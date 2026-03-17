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
    const READ_ACTIONS = new Set([
        'list-projects',
        'get-project-summaries',
        'get-project-detail',
        'get-project-images',
        'get-project-drawings',
        'get-temporary-link',
        'get-site-content',
        'get-sobre-images'
    ]);

    const WRITE_ACTIONS = new Set([
        'upload-file',
        'create-project',
        'save-description',
        'save-description-lang',
        'save-features',
        'save-site-content',
        'delete-file'
    ]);

    function setCacheHeaders(action) {
        // TTL conservador para no servir enlaces temporales demasiado viejos
        const cacheMap = {
            'list-projects': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            'get-project-summaries': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            'get-project-detail': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            'get-project-images': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            'get-project-drawings': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            'get-temporary-link': 'public, max-age=30, s-maxage=120, stale-while-revalidate=120',
            'get-site-content': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            'get-sobre-images': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
        };

        const value = cacheMap[action] || 'no-store';
        res.setHeader('Cache-Control', value);
        res.setHeader('CDN-Cache-Control', value);
        res.setHeader('Cloudflare-CDN-Cache-Control', value);
        res.setHeader('Vary', 'Accept-Encoding');
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sourceParams = req.method === 'GET' ? (req.query || {}) : (req.body || {});
    const { action, ...params } = sourceParams;

    if (!action) {
        return res.status(400).json({ error: 'Missing action' });
    }

    if (req.method === 'GET' && !READ_ACTIONS.has(action)) {
        return res.status(405).json({ error: 'Action requires POST', action });
    }

    if (req.method === 'POST' && READ_ACTIONS.has(action)) {
        // Permitimos POST por compatibilidad, pero recomendamos GET para cache CDN.
        setCacheHeaders(action);
    }

    if (req.method === 'GET') {
        setCacheHeaders(action);
    }

    if (WRITE_ACTIONS.has(action)) {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('CDN-Cache-Control', 'no-store');
        res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store');
    }

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
            case 'get-project-summaries':
                return await getProjectSummaries(res);
            case 'get-project-detail':
                return await getProjectDetail(params.projectPath, res);
            case 'get-project-images':
                return await getProjectImages(params.projectPath, res);
            case 'get-project-drawings':
                return await getProjectDrawings(params.projectPath, res);
            case 'get-temporary-link':
                return await getTemporaryLink(params.filePath, res);
            case 'upload-file':
                return await uploadFile(params.destinationPath, params.fileContent, params.fileName, res);
            case 'create-project':
                return await createProject(params.projectName, res);
            case 'save-description':
                return await saveDescription(params.projectPath, params.content, res);
            case 'save-description-lang':
                return await saveDescriptionLang(params.projectPath, params.lang, params.content, res);
            case 'save-features':
                return await saveFeatures(params.projectPath, params.featuresText, res);
            case 'get-site-content':
                return await getSiteContent(params.pageKey, res);
            case 'save-site-content':
                return await saveSiteContent(params.pageKey, params.content, res);
            case 'get-sobre-images':
                return await getSobreImages(res);
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

function getProjectsRootPath() {
    const configured = process.env.DROPBOX_PROJECTS_FOLDER || '/Proyectos';
    const trimmed = configured.trim();
    if (!trimmed) return '/Proyectos';
    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withLeadingSlash.endsWith('/') && withLeadingSlash.length > 1
        ? withLeadingSlash.slice(0, -1)
        : withLeadingSlash;
}

function getSiteContentRootPath() {
    const configured = process.env.DROPBOX_SITE_CONTENT_FOLDER || '/ContenidoSitio';
    const trimmed = configured.trim();
    if (!trimmed) return '/ContenidoSitio';
    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withLeadingSlash.endsWith('/') && withLeadingSlash.length > 1
        ? withLeadingSlash.slice(0, -1)
        : withLeadingSlash;
}

function normalizePageKey(pageKey) {
    const allowed = ['sobre', 'contacto', 'sobre_es', 'sobre_en', 'sobre_de', 'contacto_es', 'contacto_en', 'contacto_de'];
    if (!pageKey || typeof pageKey !== 'string') return null;
    const normalized = pageKey.trim().toLowerCase();
    return allowed.includes(normalized) ? normalized : null;
}

function isPathNotFound(errorSummary) {
    if (!errorSummary || typeof errorSummary !== 'string') return false;
    return errorSummary.includes('path/not_found');
}

async function createFolderIfMissing(path, token) {
    const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path,
            autorename: false
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_summary || response.statusText);
    }

    return response.json();
}

function slugify(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeFeatures(rawText) {
    if (!rawText) return [];

    return rawText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const index = line.indexOf(':');
            if (index === -1) {
                return { key: line, value: '' };
            }
            const key = line.slice(0, index).trim();
            const value = line.slice(index + 1).trim();
            return { key, value };
        });
}

function featuresToText(features) {
    if (!Array.isArray(features)) return '';
    return features
        .filter(item => item && item.key)
        .map(item => `${item.key}: ${item.value || ''}`.trim())
        .join('\n');
}

async function ensureProjectStructure(projectPath, token) {
    const subfolders = ['Descripcion', 'Caracteristicas', 'Imagenes', 'Dibujos'];

    for (const name of subfolders) {
        try {
            await createFolderIfMissing(`${projectPath}/${name}`, token);
        } catch (error) {
            const message = String(error.message || '');
            // Ignora "already exists"
            if (!message.includes('conflict/folder')) {
                throw error;
            }
        }
    }
}

async function ensureSiteContentStructure(token) {
    const root = getSiteContentRootPath();

    try {
        await createFolderIfMissing(root, token);
    } catch (error) {
        const message = String(error.message || '');
        if (!message.includes('conflict/folder')) {
            throw error;
        }
    }
}

async function downloadTextFile(path, token) {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Dropbox-API-Arg': JSON.stringify({ path })
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_summary || response.statusText);
    }

    return response.text();
}

async function uploadTextFile(path, text, token) {
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
                path,
                mode: 'overwrite',
                autorename: false,
                mute: true,
                strict_conflict: false
            })
        },
        body: Buffer.from(text || '', 'utf8')
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_summary || response.statusText);
    }

    return response.json();
}

async function listMediaFromFolder(folderPath, token) {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: folderPath,
            recursive: false,
            include_media_info: true,
            include_deleted: false
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (isPathNotFound(errorData.error_summary)) {
            return [];
        }
        throw new Error(errorData.error_summary || response.statusText);
    }

    const data = await response.json();
    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

    const imageFiles = data.entries.filter(entry => {
        if (entry['.tag'] !== 'file') return false;
        const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'));
        return ALLOWED_EXTENSIONS.includes(ext);
    });

    const files = await Promise.all(
        imageFiles.map(async (file) => {
            const link = await getTemporaryLinkInternal(file.path_lower, token);
            return {
                id: file.id,
                name: file.name,
                path: file.path_lower,
                size: file.size,
                modified: file.server_modified,
                temporaryLink: link
            };
        })
    );

    files.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
    return files;
}

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
        const projects = await listProjectsInternal(token);

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

async function listProjectsInternal(token) {
    const projectsRoot = getProjectsRootPath();

    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: projectsRoot,
            recursive: false,
            include_media_info: false,
            include_deleted: false,
            include_has_explicit_shared_members: false
        })
    });

    if (!response.ok) {
        const errorData = await response.json();

        // Si la carpeta base no existe, la creamos y devolvemos lista vacía.
        if (isPathNotFound(errorData.error_summary)) {
            await createFolderIfMissing(projectsRoot, token);
            return [];
        }

        throw new Error(errorData.error_summary || response.statusText);
    }

    const data = await response.json();

    return data.entries
        .filter(entry => entry['.tag'] === 'folder')
        .map(folder => ({
            id: folder.id,
            name: folder.name,
            slug: slugify(folder.name),
            path: folder.path_lower,
            pathDisplay: folder.path_display
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

async function getProjectImageSummary(projectPath, token) {
    const folderPath = `${projectPath}/Imagenes`;

    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: folderPath,
            recursive: false,
            include_media_info: false,
            include_deleted: false
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (isPathNotFound(errorData.error_summary)) {
            return { cover: null, imageCount: 0 };
        }
        throw new Error(errorData.error_summary || response.statusText);
    }

    const data = await response.json();
    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

    const imageFiles = data.entries
        .filter(entry => {
            if (entry['.tag'] !== 'file') return false;
            const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'));
            return ALLOWED_EXTENSIONS.includes(ext);
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));

    let cover = null;
    if (imageFiles.length > 0) {
        cover = await getTemporaryLinkInternal(imageFiles[0].path_lower, token);
    }

    return {
        cover,
        imageCount: imageFiles.length
    };
}

async function getProjectSummaries(res) {
    try {
        const token = await getValidAccessToken();
        const projects = await listProjectsInternal(token);

        const summaries = await Promise.all(
            projects.map(async (project) => {
                const imageSummary = await getProjectImageSummary(project.path, token);
                return {
                    ...project,
                    cover: imageSummary.cover,
                    imageCount: imageSummary.imageCount
                };
            })
        );

        return res.status(200).json({
            success: true,
            projects: summaries,
            count: summaries.length
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get project summaries',
            message: error.message
        });
    }
}

async function getProjectDetail(projectPath, res) {
    try {
        if (!projectPath) {
            return res.status(400).json({ error: 'projectPath is required' });
        }

        const token = await getValidAccessToken();
        await ensureProjectStructure(projectPath, token);

        const descriptionPath = `${projectPath}/Descripcion/descripcion.txt`;
        const descriptionEsPath = `${projectPath}/Descripcion/descripcion_es.txt`;
        const descriptionEnPath = `${projectPath}/Descripcion/descripcion_en.txt`;
        const descriptionDePath = `${projectPath}/Descripcion/descripcion_de.txt`;
        const featuresPath = `${projectPath}/Caracteristicas/caracteristicas.txt`;

        let description = '';
        let featuresRaw = '';
        let description_es = '';
        let description_en = '';
        let description_de = '';

        try {
            description = await downloadTextFile(descriptionPath, token);
        } catch (error) {
            if (!isPathNotFound(String(error.message))) throw error;
        }

        try {
            description_es = await downloadTextFile(descriptionEsPath, token);
        } catch (error) {
            if (!isPathNotFound(String(error.message))) throw error;
        }

        try {
            description_en = await downloadTextFile(descriptionEnPath, token);
        } catch (error) {
            if (!isPathNotFound(String(error.message))) throw error;
        }

        try {
            description_de = await downloadTextFile(descriptionDePath, token);
        } catch (error) {
            if (!isPathNotFound(String(error.message))) throw error;
        }

        try {
            featuresRaw = await downloadTextFile(featuresPath, token);
        } catch (error) {
            if (!isPathNotFound(String(error.message))) throw error;
        }

        const images = await listMediaFromFolder(`${projectPath}/Imagenes`, token);
        const drawings = await listMediaFromFolder(`${projectPath}/Dibujos`, token);
        const projectName = projectPath.split('/').filter(Boolean).pop() || 'Proyecto';

        return res.status(200).json({
            success: true,
            project: {
                name: projectName,
                slug: slugify(projectName),
                path: projectPath,
                description,
                description_es,
                description_en,
                description_de,
                featuresRaw,
                features: normalizeFeatures(featuresRaw),
                images,
                drawings,
                cover: images.length > 0 ? images[0].temporaryLink : null
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get project detail',
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
        const images = await listMediaFromFolder(`${projectPath}/Imagenes`, token);

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

async function getProjectDrawings(projectPath, res) {
    try {
        if (!projectPath) {
            return res.status(400).json({ error: 'projectPath is required' });
        }

        const token = await getValidAccessToken();
        const drawings = await listMediaFromFolder(`${projectPath}/Dibujos`, token);

        return res.status(200).json({
            success: true,
            drawings,
            count: drawings.length
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get project drawings',
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
        const projectsRoot = getProjectsRootPath();
        const projectPath = `${projectsRoot}/${projectName}`;

        const data = await createFolderIfMissing(projectPath, token);
        await ensureProjectStructure(projectPath, token);

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

async function getSobreImages(res) {
    try {
        const token = await getValidAccessToken();
        const images = await listMediaFromFolder('/ContenidoSitio/SobreImagenes', token);
        return res.status(200).json({ success: true, images });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get sobre images', message: error.message });
    }
}

async function saveDescription(projectPath, content, res) {
    try {
        if (!projectPath) {
            return res.status(400).json({ error: 'projectPath is required' });
        }

        const token = await getValidAccessToken();
        await ensureProjectStructure(projectPath, token);
        const targetPath = `${projectPath}/Descripcion/descripcion.txt`;

        await uploadTextFile(targetPath, content || '', token);

        return res.status(200).json({
            success: true,
            message: 'Description updated',
            path: targetPath
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to save description',
            message: error.message
        });
    }
}

async function saveDescriptionLang(projectPath, lang, content, res) {
    try {
        if (!projectPath) {
            return res.status(400).json({ error: 'projectPath is required' });
        }
        const allowedLangs = ['es', 'en', 'de'];
        if (!lang || !allowedLangs.includes(lang)) {
            return res.status(400).json({ error: 'lang must be es, en, or de' });
        }

        const token = await getValidAccessToken();
        await ensureProjectStructure(projectPath, token);
        const targetPath = `${projectPath}/Descripcion/descripcion_${lang}.txt`;

        await uploadTextFile(targetPath, content || '', token);

        return res.status(200).json({
            success: true,
            message: `Description (${lang}) updated`,
            path: targetPath
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to save description',
            message: error.message
        });
    }
}

async function saveFeatures(projectPath, featuresText, res) {
    try {
        if (!projectPath) {
            return res.status(400).json({ error: 'projectPath is required' });
        }

        const token = await getValidAccessToken();
        await ensureProjectStructure(projectPath, token);
        const targetPath = `${projectPath}/Caracteristicas/caracteristicas.txt`;

        let textToSave = featuresText || '';
        if (typeof featuresText !== 'string' && Array.isArray(featuresText)) {
            textToSave = featuresToText(featuresText);
        }

        await uploadTextFile(targetPath, textToSave, token);

        return res.status(200).json({
            success: true,
            message: 'Features updated',
            path: targetPath
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to save features',
            message: error.message
        });
    }
}

async function getSiteContent(pageKey, res) {
    try {
        const safePageKey = normalizePageKey(pageKey);
        if (!safePageKey) {
            return res.status(400).json({ error: 'Invalid pageKey. Use sobre or contacto' });
        }

        const token = await getValidAccessToken();
        await ensureSiteContentStructure(token);

        const root = getSiteContentRootPath();
        const filePath = `${root}/${safePageKey}.txt`;

        let content = '';
        try {
            content = await downloadTextFile(filePath, token);
        } catch (error) {
            if (!isPathNotFound(String(error.message))) {
                throw error;
            }
        }

        return res.status(200).json({
            success: true,
            pageKey: safePageKey,
            content
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get site content',
            message: error.message
        });
    }
}

async function saveSiteContent(pageKey, content, res) {
    try {
        const safePageKey = normalizePageKey(pageKey);
        if (!safePageKey) {
            return res.status(400).json({ error: 'Invalid pageKey. Use sobre or contacto' });
        }

        const token = await getValidAccessToken();
        await ensureSiteContentStructure(token);

        const root = getSiteContentRootPath();
        const filePath = `${root}/${safePageKey}.txt`;
        await uploadTextFile(filePath, content || '', token);

        return res.status(200).json({
            success: true,
            pageKey: safePageKey,
            path: filePath,
            message: 'Site content updated'
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to save site content',
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
