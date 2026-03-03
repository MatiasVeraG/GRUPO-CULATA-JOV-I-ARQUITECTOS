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
    match /projects/{projectId} {
      allow read: if true;  // Lectura pública
      allow write: if request.auth != null;  // Solo usuarios autenticados pueden escribir
    }
  }
}
```

3. Haz clic en "Publicar" (Publish)

### 6. Habilitar Firebase Authentication

1. En el menú lateral de Firebase Console, ve a "Authentication"
2. Haz clic en "Get started" o "Comenzar"
3. Ve a la pestaña "Sign-in method" (Método de inicio de sesión)
4. Haz clic en "Email/Password"
5. Activa la primera opción (Email/password)
6. Haz clic en "Guardar" o "Save"

### 7. Crear usuario administrador

1. En Authentication, ve a la pestaña "Users" (Usuarios)
2. Haz clic en "Add user" o "Agregar usuario"
3. Ingresa el email: **admin@culatajovai.admin**
4. Ingresa una contraseña segura (esta será la nueva contraseña del panel admin)
5. Haz clic en "Add user" o "Agregar usuario"

**⚠️ Importante:** 
- Guarda esta contraseña en un lugar seguro
- Esta contraseña NO está en el código fuente
- Para iniciar sesión en el panel admin, usa "admin" como usuario (se convertirá automáticamente a admin@culatajovai.admin)

### 8. Probar la configuración

1. Abre tu sitio web localmente
2. Ve al panel de administración (admin.html)
3. Inicia sesión con:
   - Usuario: **admin**
   - Contraseña: La que configuraste en Firebase Authentication
4. Intenta agregar un proyecto nuevo
5. Si todo funciona, verás el proyecto en la página de trabajos

### 9. Desplegar en Vercel

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
- Las reglas de Firestore permiten lectura pública pero solo escritura para usuarios autenticados
- El sistema usa Firebase Authentication para proteger el panel de administración
- La contraseña del admin NO está en el código fuente, está guardada de forma segura en Firebase
- Los datos se almacenan en la nube de Firebase, no en localStorage del navegador
- Todos los cambios que hagas desde el panel admin se reflejarán inmediatamente para todos los visitantes

## Seguridad:

- ✅ **Authentication:** El panel admin está protegido con Firebase Authentication
- ✅ **Contraseña segura:** Las contraseñas se almacenan hasheadas en Firebase, nunca en texto plano
- ✅ **Reglas de Firestore:** Solo usuarios autenticados pueden agregar/editar/eliminar proyectos
- ✅ **Sesión segura:** La sesión se valida en tiempo real con Firebase
- ⚠️ **Recordatorio:** Nunca compartas tu contraseña de administrador

## Solución de problemas:

Si ves errores en la consola del navegador:
1. Verifica que los valores en `firebase-config.js` sean correctos
2. Asegúrate de haber habilitado Firestore Database
3. Verifica que Firebase Authentication esté habilitado con Email/Password
4. Confirma que el usuario admin@culatajovai.admin existe en Authentication > Users
5. Revisa que las reglas de seguridad estén configuradas correctamente
6. Limpia la caché del navegador y recarga la página
