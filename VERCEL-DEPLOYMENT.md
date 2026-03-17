# 🚀 Guía: Desplegar en Vercel con API Serverless de Dropbox

Esta sección te explica cómo subir tu portfolio a Vercel sin que las credenciales de Dropbox queden expuestas en el código público.

---

## 📋 Índice

1. [Estructura de Archivos](#1-estructura-de-archivos)
2. [Pasos Previos](#2-pasos-previos)
3. [Configurar Variables de Entorno](#3-configurar-variables-de-entorno-en-vercel)
4. [Desplegar en Vercel](#4-desplegar-en-vercel)
5. [Actualizar el Frontend](#5-actualizar-el-frontend)
6. [Verificar que Funciona](#6-verificar-que-funciona)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Estructura de Archivos

Tu proyecto debe tener esta estructura:

```
Pagina 2/
├── api/
│   └── dropbox.js                    ← API Serverless (nuevo)
├── galeria-dropbox.html              ← Galería (sin cambios grandes)
├── admin-dropbox.html                ← Panel admin (sin cambios grandes)
├── dropbox-config.js                 ← Configuración (SIN credenciales)
├── dropbox-service-vercel.js         ← Servicio para frontend (nuevo)
├── index.html
├── styles.css
├── script.js
├── package.json                      ← Necesario para Vercel
├── vercel.json                       ← Configuración de Vercel (opcional)
└── ... (otros archivos)
```

---

## 2. Pasos Previos

### Crear `package.json`

Crea un archivo `package.json` en la raíz de tu proyecto:

```json
{
  "name": "grupo-culata-jovai",
  "version": "1.0.0",
  "description": "Portfolio de arquitectura con Dropbox integrado",
  "private": true,
  "scripts": {
    "dev": "vercel dev",
    "build": "vercel build"
  }
}
```

### Crear `vercel.json` (Opcional pero Recomendado)

```json
{
  "buildCommand": "echo 'Build complete'",
  "outputDirectory": ".",
  "devCommand": "echo 'Ready'",
  "env": [
    "DROPBOX_APP_KEY",
    "DROPBOX_APP_SECRET",
    "DROPBOX_REFRESH_TOKEN"
  ]
}
```

---

## 3. Configurar Variables de Entorno en Vercel

### Paso 1: Acceder a Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en **"New Project"**

### Paso 2: Importar tu Repositorio

1. Selecciona tu repositorio de GitHub/GitLab/Bitbucket
2. Haz clic en **"Import"**

### Paso 3: Agregar Variables de Entorno

En la pantalla de configuración del proyecto:

1. Busca la sección **"Environment Variables"**
2. Agrega las 3 variables:

| Variable | Valor |
|----------|-------|
| `DROPBOX_APP_KEY` | Tu App Key de Dropbox |
| `DROPBOX_APP_SECRET` | Tu App Secret de Dropbox |
| `DROPBOX_REFRESH_TOKEN` | Tu Refresh Token obtenido anteriormente |

Ejemplo:
```
DROPBOX_APP_KEY = abc123xyz456def789
DROPBOX_APP_SECRET = xyz789abc456def123
DROPBOX_REFRESH_TOKEN = sl_0_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Paso 4: Desplegar

Haz clic en **"Deploy"** y espera a que se complete.

---

## 4. Desplegar en Vercel

### Opción A: Desde GitHub (Recomendado)

1. **Subir tu código a GitHub:**

```bash
git add .
git commit -m "feat: Add Dropbox API serverless integration"
git push origin main
```

2. **En Vercel:**
   - Haz clic en "Import Project"
   - Selecciona tu repositorio
   - Configura las variables de entorno (Paso 3)
   - Haz clic en "Deploy"

### Opción B: CLI de Vercel

```bash
# Instalar Vercel CLI (global)
npm install -g vercel

# Desplegar
vercel

# Agregar variables de entorno
vercel env add DROPBOX_APP_KEY
vercel env add DROPBOX_APP_SECRET
vercel env add DROPBOX_REFRESH_TOKEN

# Desplegar a producción
vercel --prod
```

---

## 5. Actualizar el Frontend

### Cambiar los archivos HTML para usar el nuevo servicio

#### En `galeria-dropbox.html`

Reemplaza esta línea:
```html
<script src="dropbox-service.js"></script>
```

Por esta:
```html
<script src="dropbox-service-vercel.js"></script>
```

#### En `admin-dropbox.html`

Reemplaza esta línea:
```html
<script src="dropbox-service.js"></script>
```

Por esta:
```html
<script src="dropbox-service-vercel.js"></script>
```

### El archivo `dropbox-config.js` NO necesita cambios

Mantenlo con valores de ejemplo (no credenciales reales):

```javascript
const DropboxConfig = {
    APP_KEY: 'ESTOS_VALORES_NO_SE_USAN',
    APP_SECRET: 'ESTOS_VALORES_NO_SE_USAN',
    REFRESH_TOKEN: 'ESTOS_VALORES_NO_SE_USAN',
    
    PROJECTS_FOLDER: '/Proyectos',
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    CACHE_TTL: 5 * 60 * 1000
};
```

---

## 6. Verificar que Funciona

### Test 1: Abrir la Galería

1. Ve a tu URL de Vercel (ej: `https://mi-portfolio.vercel.app/galeria-dropbox.html`)
2. Verifica que carguen los proyectos desde Dropbox
3. Abre la consola (F12) y busca mensajes de éxito

### Test 2: Panel de Administración

1. Ve a `https://mi-portfolio.vercel.app/admin-dropbox.html`
2. Verifica que aparezca la lista de proyectos
3. Intenta subir una imagen de prueba

### Test 3: Ver Logs de Vercel

En el dashboard de Vercel:
1. Haz clic en tu proyecto
2. Ve a **"Functions"** o **"Deployments"**
3. Haz clic en los logs para ver detalles

---

## 7. Troubleshooting

### Error: "Server configuration error"

**Causa:** Las variables de entorno no están configuradas.

**Solución:**
1. Ve al dashboard de Vercel
2. Haz clic en tu proyecto
3. Ve a **"Settings"** → **"Environment Variables"**
4. Verifica que las 3 variables estén ahí
5. Vuelve a desplegar (haz clic en el deployment más reciente → "Redeploy")

---

### Error: "Failed to refresh access token"

**Causa:** El Refresh Token es inválido o expiró.

**Solución:**
1. Obtén un nuevo Refresh Token y actualiza la variable en Vercel
2. Vuelve a desplegar

---

### La API no responde (404)

**Causa:** El archivo `api/dropbox.js` no está en el lugar correcto.

**Solución:**
1. Verifica que exista la carpeta `api/` en la raíz
2. Verifica que `dropbox.js` esté dentro de esa carpeta
3. Sube los cambios a Git y redeploy

---

### CORS errors en la consola

Esto es normal si son errores de terceros. El frontend llama a `/api/dropbox` que maneja CORS correctamente.

---

## 📝 Checklist Final

- [ ] Archivo `api/dropbox.js` existe
- [ ] Variables de entorno configuradas en Vercel
- [ ] `galeria-dropbox.html` usa `dropbox-service-vercel.js`
- [ ] `admin-dropbox.html` usa `dropbox-service-vercel.js`
- [ ] Código subido a GitHub/GitLab
- [ ] Proyecto desplegado en Vercel
- [ ] Verificar que las imágenes cargan
- [ ] Verificar que el upload funciona

---

## 🎉 ¡Listo!

Tu portfolio ahora está seguro en Vercel con las credenciales de Dropbox protegidas en el backend.

---

## 📞 Notas Importantes

1. **Las credenciales nunca se exponen:** Vercel ejecuta `api/dropbox.js` en el servidor
2. **No tendrás que configurar nada más:** El cliente se comunica solo a través de `/api/dropbox`
3. **Escala automáticamente:** Vercel maneja múltiples usuarios sin problemas
4. **Caché en el navegador:** El servicio cachea resultados 5 minutos para reducir latencia

---

¡Tu portfolio de arquitectura está listo para el mundo! 🏗️
