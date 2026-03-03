# Configuración de Firebase para Grupo Culata Jovái Arquitectos

## Pasos para configurar Firebase:

### 1. Crear un proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o "Add project"
3. Nombra tu proyecto (ejemplo: "culata-jovai-web")
4. Deshabilita Google Analytics (opcional, no es necesario para este proyecto)
5. Haz clic en "Crear proyecto"

### 2. Registrar tu aplicación web

1. En la página de inicio de tu proyecto, haz clic en el ícono web (</>) para agregar una app web
2. Registra tu app con un nombre (ejemplo: "Sitio Web Culata Jovái")
3. NO marques "Firebase Hosting" (usarás Vercel)
4. Haz clic en "Registrar app"

### 3. Copiar la configuración de Firebase

Firebase te mostrará un código similar a este:

```javascript
const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

1. Copia estos valores
2. Abre el archivo `firebase-config.js` en tu proyecto
3. Reemplaza los valores de la configuración con los que copiaste

### 4. Habilitar Cloud Firestore

1. En el menú lateral de Firebase Console, ve a "Firestore Database"
2. Haz clic en "Crear base de datos" o "Create database"
3. Selecciona **"Comenzar en modo de producción"** (Production mode)
4. Elige la ubicación más cercana a tu audiencia (ejemplo: `southamerica-east1` para Sudamérica)
5. Haz clic en "Habilitar" o "Enable"

### 5. Configurar reglas de seguridad de Firestore

1. Una vez creada la base de datos, ve a la pestaña "Reglas" (Rules)
2. Reemplaza las reglas existentes con estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura pública de proyectos
    match /projects/{projectId} {
      allow read: if true;
      allow write: if false; // Solo permitir escritura desde el panel admin
    }
  }
}
```

3. Haz clic en "Publicar" (Publish)

### 6. Probar la configuración

1. Abre tu sitio web localmente
2. Ve al panel de administración (admin.html)
3. Inicia sesión (contraseña por defecto: "admin123")
4. Intenta agregar un proyecto nuevo
5. Si todo funciona, verás el proyecto en la página de trabajos

### 7. Desplegar en Vercel

Una vez que hayas configurado Firebase:

1. Haz commit de tus cambios:
   ```bash
   git add .
   git commit -m "Configurar Firebase"
   git push origin main
   ```

2. Ve a [Vercel](https://vercel.com)
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un sitio estático
5. Haz clic en "Deploy"

¡Listo! Tu sitio ahora funcionará con Firebase en producción.

## Notas importantes:

- **No subas las credenciales de Firebase a un repositorio público** si contienen información sensible
- Las reglas de Firestore actuales permiten lectura pública pero no escritura (solo desde el navegador donde estés autenticado como admin)
- Para mayor seguridad, considera implementar Firebase Authentication para el panel de administración
- Los datos se almacenan en la nube de Firebase, no en localStorage del navegador
- Todos los cambios que hagas desde el panel admin se reflejarán inmediatamente para todos los visitantes

## Solución de problemas:

Si ves errores en la consola del navegador:
1. Verifica que los valores en `firebase-config.js` sean correctos
2. Asegúrate de haber habilitado Firestore Database
3. Revisa que las reglas de seguridad estén configuradas correctamente
4. Limpia la caché del navegador y recarga la página
