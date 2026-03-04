// API para manejar proyectos usando Vercel KV
import { kv } from '@vercel/kv';

const PROJECTS_KEY = 'projects';

// Leer proyectos
async function getProjects() {
    try {
        const projects = await kv.get(PROJECTS_KEY);
        return projects || [];
    } catch (error) {
        console.error('Error leyendo proyectos:', error);
        return [];
    }
}

// Guardar proyectos
async function saveProjects(projects) {
    try {
        await kv.set(PROJECTS_KEY, projects);
        return true;
    } catch (error) {
        console.error('Error guardando proyectos:', error);
        return false;
    }
}

export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { method } = req;
        const projects = await getProjects();

        // GET - Obtener todos los proyectos
        if (method === 'GET') {
            return res.status(200).json(projects);
        }

        // POST - Crear nuevo proyecto
        if (method === 'POST') {
            const { title, description, images } = req.body;
            
            if (!title || !description || !images || images.length === 0) {
                return res.status(400).json({ error: 'Faltan datos requeridos' });
            }

            const newProject = {
                id: Date.now().toString(),
                title,
                description,
                images,
                order: projects.length
            };

            projects.push(newProject);
            await saveProjects(projects);

            return res.status(201).json(newProject);
        }

        // PUT - Actualizar proyecto existente
        if (method === 'PUT') {
            const { id, title, description, images, order } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'ID del proyecto requerido' });
            }

            const index = projects.findIndex(p => p.id === id);
            
            if (index === -1) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }

            projects[index] = {
                ...projects[index],
                title: title || projects[index].title,
                description: description || projects[index].description,
                images: images || projects[index].images,
                order: order !== undefined ? order : projects[index].order
            };

            await saveProjects(projects);

            return res.status(200).json(projects[index]);
        }

        // DELETE - Eliminar proyecto
        if (method === 'DELETE') {
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'ID del proyecto requerido' });
            }

            const index = projects.findIndex(p => p.id === id);
            
            if (index === -1) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }

            projects.splice(index, 1);
            await saveProjects(projects);

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Método no permitido' });

    } catch (error) {
        console.error('Error en API:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
