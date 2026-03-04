// API de autenticación simple
module.exports = async (req, res) => {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { email, password } = req.body;

        // Validar credenciales (puedes cambiar estas por variables de entorno)
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@culata-jovai.com';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'culata2024';

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Generar un token simple (en producción usar JWT)
            const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
            
            return res.status(200).json({
                success: true,
                token,
                email
            });
        } else {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
