# 📦 Guía de Configuración: Integración con Dropbox API

Esta guía te explica paso a paso cómo configurar la integración de tu portfolio de arquitectura con Dropbox para que las imágenes se carguen dinámicamente.

---

## 📋 Índice

1. [Crear la App en Dropbox Developer Console](#1-crear-la-app-en-dropbox-developer-console)
2. [Configurar los Scopes (Permisos)](#2-configurar-los-scopes-permisos)
3. [Obtener el Refresh Token](#3-obtener-el-refresh-token-permanente)
4. [Configurar la Aplicación](#4-configurar-la-aplicación)
5. [Crear la Estructura de Carpetas](#5-crear-la-estructura-de-carpetas)
6. [Verificar la Integración](#6-verificar-la-integración)
7. [Solución de Problemas](#7-solución-de-problemas)

---

## 1. Crear la App en Dropbox Developer Console

### Paso 1: Acceder a la Consola de Desarrolladores

1. Ve a [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Inicia sesión con la cuenta de Dropbox donde estarán las imágenes

### Paso 2: Crear una Nueva App

1. Haz clic en **"Create app"**
2. Configura las opciones:

| Campo | Valor a Seleccionar |
|-------|---------------------|
| **Choose an API** | Scoped access |
| **Choose the type of access** | Full Dropbox |
| **Name your app** | `GrupoCulataJovai-Portfolio` (o el nombre que prefieras) |

3. Acepta los términos y haz clic en **"Create app"**

### Paso 3: Guardar las Credenciales

Una vez creada la app, estarás en la página de configuración. Anota:

- **App key**: Se muestra en la sección "Settings" (ej: `abc123xyz...`)
- **App secret**: Haz clic en "Show" para revelarlo (ej: `xyz789abc...`)

> ⚠️ **IMPORTANTE**: Nunca compartas estas credenciales públicamente.

---

## 2. Configurar los Scopes (Permisos)

### Paso 1: Ir a la Pestaña "Permissions"

1. En tu app, haz clic en la pestaña **"Permissions"**
2. Marca los siguientes scopes:

### Scopes Necesarios

| Scope | Descripción |
|-------|-------------|
| ✅ `files.metadata.read` | Leer información de archivos y carpetas |
| ✅ `files.content.read` | Leer/descargar contenido de archivos (imágenes) |
| ✅ `files.content.write` | Subir archivos nuevos |

### Paso 2: Guardar Cambios

1. Haz clic en **"Submit"** en la parte inferior
2. Espera la confirmación de que los permisos fueron actualizados

---

## 3. Obtener el Refresh Token (Permanente)

El **Refresh Token** es la clave para que tu aplicación funcione indefinidamente sin que el cliente tenga que re-autenticarse. 

### ¿Por qué necesito un Refresh Token?

- Los **Access Tokens** de Dropbox expiran en **4 horas**
- El **Refresh Token** NO expira y permite obtener nuevos Access Tokens automáticamente
- Tu aplicación usa el Refresh Token para renovar el acceso sin intervención manual

### Paso 1: Generar la URL de Autorización

Construye esta URL reemplazando `TU_APP_KEY`:

```
https://www.dropbox.com/oauth2/authorize?client_id=TU_APP_KEY&token_access_type=offline&response_type=code
```

**Ejemplo:**
```
https://www.dropbox.com/oauth2/authorize?client_id=abc123xyz&token_access_type=offline&response_type=code
```

### Paso 2: Obtener el Authorization Code

1. Abre la URL en tu navegador
2. Inicia sesión en Dropbox (con la cuenta que tiene las imágenes)
3. Haz clic en **"Allow"** para autorizar la app
4. Dropbox mostrará un **código de autorización** (algo como: `ABC123XYZ789...`)
5. **Copia este código** - lo necesitarás en el siguiente paso

> ⚠️ Este código expira en minutos. Úsalo inmediatamente.

### Paso 3: Intercambiar el Código por el Refresh Token

Ejecuta este comando en tu terminal (PowerShell en Windows):

```powershell
# Reemplaza los valores con tus credenciales
$APP_KEY = "tu_app_key_aqui"
$APP_SECRET = "tu_app_secret_aqui"
$AUTH_CODE = "el_codigo_que_copiaste"

# Hacer la petición
$body = @{
    code = $AUTH_CODE
    grant_type = "authorization_code"
    client_id = $APP_KEY
    client_secret = $APP_SECRET
}

$response = Invoke-RestMethod -Uri "https://api.dropboxapi.com/oauth2/token" -Method POST -Body $body
$response | ConvertTo-Json
```

**O usando cURL (en cualquier terminal):**

```bash
curl -X POST https://api.dropboxapi.com/oauth2/token \
  -d code=EL_CODIGO_QUE_COPIASTE \
  -d grant_type=authorization_code \
  -d client_id=TU_APP_KEY \
  -d client_secret=TU_APP_SECRET
```

### Paso 4: Guardar el Refresh Token

La respuesta será algo como:

```json
{
    "access_token": "sl.xxxxx...",
    "token_type": "bearer",
    "expires_in": 14400,
    "refresh_token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "scope": "files.content.read files.content.write files.metadata.read",
    "uid": "12345678",
    "account_id": "dbid:XXXXXXXXXX"
}
```

**Guarda el valor de `refresh_token`** - Este es el token permanente que necesitas.

---

## 4. Configurar la Aplicación

### Paso 1: Editar el Archivo de Configuración

Abre el archivo `dropbox-config.js` y reemplaza los valores:

```javascript
const DropboxConfig = {
    // Reemplaza con tus credenciales
    APP_KEY: 'tu_app_key_real',
    APP_SECRET: 'tu_app_secret_real',
    REFRESH_TOKEN: 'tu_refresh_token_real',
    
    // Carpeta principal donde están los proyectos
    PROJECTS_FOLDER: '/Proyectos',
    
    // ... resto de la configuración
};
```

### Paso 2: Configuración de Seguridad (Producción)

Para un sitio en producción, considera estas opciones:

#### Opción A: Variables de Entorno (Recomendado con Backend)

Si tienes un backend (Node.js, PHP, etc.), mueve las credenciales a variables de entorno:

```javascript
// En el servidor
const config = {
    APP_KEY: process.env.DROPBOX_APP_KEY,
    APP_SECRET: process.env.DROPBOX_APP_SECRET,
    REFRESH_TOKEN: process.env.DROPBOX_REFRESH_TOKEN
};
```

#### Opción B: Proxy de API (Recomendado sin Backend)

Usa un servicio como Cloudflare Workers o Netlify Functions para ocultar las credenciales.

#### Opción C: Sitio Privado

Si el sitio es de uso interno/privado, las credenciales en el frontend pueden ser aceptables.

---

## 5. Crear la Estructura de Carpetas

En tu Dropbox, crea la siguiente estructura:

```
📁 Proyectos/
├── 📁 Casa Bosque/
│   ├── 🖼️ imagen1.jpg
│   ├── 🖼️ imagen2.jpg
│   └── 🖼️ imagen3.png
├── 📁 Edificio Alvear/
│   ├── 🖼️ foto1.jpg
│   └── 🖼️ foto2.jpg
├── 📁 Residencia Marina/
│   └── 🖼️ portada.jpg
└── ...más proyectos
```

### Reglas de la Estructura:

1. **Carpeta Principal**: Debe llamarse exactamente `/Proyectos` (o modificar `PROJECTS_FOLDER` en la config)
2. **Subcarpetas**: Cada subcarpeta dentro de `/Proyectos` es un proyecto individual
3. **Imágenes**: Solo se cargan archivos `.jpg`, `.jpeg`, `.png`, `.webp`
4. **Primera Imagen**: La primera imagen (alfabéticamente) se usa como portada

---

## 6. Verificar la Integración

### Test 1: Verificar las Credenciales

Abre la consola del navegador (F12) y ejecuta:

```javascript
dropboxService.refreshAccessToken().then(() => {
    console.log('✅ Conexión exitosa');
}).catch(err => {
    console.error('❌ Error:', err);
});
```

### Test 2: Listar Proyectos

```javascript
dropboxService.listProjects().then(projects => {
    console.log('Proyectos encontrados:', projects);
});
```

### Test 3: Obtener Imágenes

```javascript
dropboxService.getProjectImages('/Proyectos/NombreDelProyecto').then(images => {
    console.log('Imágenes:', images);
});
```

---

## 7. Solución de Problemas

### Error: "Invalid refresh token"

**Causa**: El refresh token es incorrecto o fue revocado.

**Solución**: Genera un nuevo refresh token siguiendo el Paso 3.

---

### Error: "App not authorized"

**Causa**: Los scopes no están configurados correctamente.

**Solución**: 
1. Ve a la pestaña "Permissions" en tu app
2. Verifica que los 3 scopes estén marcados
3. Genera un nuevo authorization code y refresh token

---

### Error: "Path not found"

**Causa**: La carpeta `/Proyectos` no existe.

**Solución**: Crea la carpeta en tu Dropbox con ese nombre exacto.

---

### Las imágenes no cargan

**Posibles causas**:
1. Los temporary links expiraron (duran 4 horas)
2. Los archivos no tienen extensión válida
3. CORS bloqueando las peticiones

**Solución**: Recarga la página para obtener nuevos links temporales.

---

### Error: "Rate limit exceeded"

**Causa**: Demasiadas peticiones a la API.

**Solución**: 
- Implementa caché (ya incluido en el servicio)
- Espera unos minutos antes de reintentar
- Considera batch requests para múltiples archivos

---

## 📞 Soporte

Si tienes problemas con la integración:

1. Revisa la [documentación oficial de Dropbox API](https://www.dropbox.com/developers/documentation)
2. Verifica los logs en la consola del navegador
3. Asegúrate de que las credenciales estén correctas

---

## 📝 Resumen de Credenciales Necesarias

| Credencial | Dónde Obtenerla | Expira |
|------------|-----------------|--------|
| App Key | Developer Console > Settings | No |
| App Secret | Developer Console > Settings | No |
| Refresh Token | Proceso OAuth (Paso 3) | No |
| Access Token | Generado automáticamente | Sí (4h) |

---

¡Tu portfolio ahora se alimenta directamente de Dropbox! 🎉
