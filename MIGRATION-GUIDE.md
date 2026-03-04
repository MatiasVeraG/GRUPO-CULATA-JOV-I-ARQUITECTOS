# MIGRACIÓN A CLOUDINARY - GUÍA RÁPIDA

## ✅ Cambios realizados:

1. **Eliminado Firebase completamente**
   - Firestore Database
   - Firebase Storage
   - Firebase Authentication
   - Archivos: `firebase-config.js`, `cors.json`, `FIREBASE-SETUP.md`

2. **Implementado Cloudinary** para almacenamiento de imágenes
   - Upload API: `/api/upload.js`
   - Optimización automática de imágenes

3. **Nuevo backend con Vercel Serverless Functions**
   - `/api/auth.js` - Autenticación simple
   - `/api/projects.js` - CRUD de proyectos
   - `/api/upload.js` - Upload a Cloudinary

4. **Base de datos JSON local**
   - Archivo: `/data/projects.json`
   - Almacenamiento persistente en Vercel

## 🚀 Pasos para deploy:

### 1. Configurar Cloudinary

1. Crea cuenta en [Cloudinary](https://cloudinary.com/)
2. Ve a Dashboard y obtén:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel Dashboard → Settings → Environment Variables y agrega:

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
ADMIN_EMAIL=admin@culata-jovai.com
ADMIN_PASSWORD=tu_contraseña_segura
```

### 3. Instalar dependencias y desplegar

```bash
# Instalar dependencias
npm install

# Desplegar a Vercel
vercel --prod
```

## 🔐 Credenciales Admin

Las credenciales están ahora en variables de entorno:
- Email: valor de `ADMIN_EMAIL`
- Password: valor de `ADMIN_PASSWORD`

## 📝 Notas importantes:

- **No hay más errores CORS** de Firebase Storage
- Las imágenes se suben directamente a Cloudinary
- La autenticación es más simple (basada en credenciales guardadas en env)
- Los proyectos se guardan en `/data/projects.json`
- Todo funciona con Vercel Serverless Functions

## 🎨 Ventajas de Cloudinary:

- ✅ Sin problemas de CORS
- ✅ CDN global automático
- ✅ Optimización automática de imágenes
- ✅ Transformaciones on-the-fly
- ✅ Plan gratuito generoso (25GB/mes)

## ⚠️ Antes del primer deploy:

1. Asegúrate de configurar todas las variables de entorno en Vercel
2. Prueba localmente con `vercel dev`
3. Verifica que `.env` esté en `.gitignore`
4. No commitees archivos sensibles

## 🔄 Recuperar proyectos existentes:

Si tenías proyectos en Firebase, necesitarás:
1. Exportar los datos de Firestore
2. Subir las imágenes a Cloudinary
3. Actualizar las URLs en `/data/projects.json`

---

**¡Todo listo para deployment en Vercel!** 🎉
