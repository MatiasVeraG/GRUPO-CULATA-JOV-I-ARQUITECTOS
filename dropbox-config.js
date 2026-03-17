/**
 * =====================================================
 * DROPBOX CONFIGURATION
 * Configuración para la integración con Dropbox API
 * =====================================================
 * 
 * IMPORTANTE: Antes de usar, configura tus credenciales
 * siguiendo la guía en DROPBOX-SETUP.md
 */

const DropboxConfig = {
    // ============================================
    // CREDENCIALES - REEMPLAZAR CON TUS VALORES
    // ============================================
    
    // Tu App Key de Dropbox Developer Console
    APP_KEY: 'TU_APP_KEY_AQUI',
    
    // Tu App Secret de Dropbox Developer Console
    APP_SECRET: 'TU_APP_SECRET_AQUI',
    
    // Refresh Token de larga duración (obtenido con el script de setup)
    REFRESH_TOKEN: 'TU_REFRESH_TOKEN_AQUI',
    
    // ============================================
    // CONFIGURACIÓN DE CARPETAS
    // ============================================
    
    // Carpeta principal donde están los proyectos
    PROJECTS_FOLDER: '/Proyectos',
    
    // Extensiones de imagen permitidas
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    
    // Tamaño máximo de archivo en bytes (10MB)
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    
    // ============================================
    // URLs DE LA API
    // ============================================
    
    API_BASE_URL: 'https://api.dropboxapi.com/2',
    CONTENT_URL: 'https://content.dropboxapi.com/2',
    AUTH_URL: 'https://api.dropbox.com/oauth2/token',
    
    // ============================================
    // CACHÉ
    // ============================================
    
    // Tiempo de vida del caché en milisegundos (5 minutos)
    CACHE_TTL: 5 * 60 * 1000,
    
    // Tiempo de vida del access token en milisegundos (3.5 horas para renovar antes de expirar)
    TOKEN_REFRESH_INTERVAL: 3.5 * 60 * 60 * 1000
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DropboxConfig;
}
