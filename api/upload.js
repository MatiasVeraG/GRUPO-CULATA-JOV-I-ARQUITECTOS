// API para subir imágenes a Cloudinary
const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary con variables de entorno
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { image, folder = 'projects' } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Imagen requerida' });
        }

        // Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });

        return res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error) {
        console.error('Error al subir imagen a Cloudinary:', error);
        return res.status(500).json({ error: 'Error al subir la imagen' });
    }
};
