# Grupo Culata Jovái Arquitectos - Portfolio Web

## 🏛️ Descripción
Portfolio minimalista para estudio de arquitectura con sistema de administración de proyectos.

## 🚀 Características

- Diseño minimalista y arquitectónico
- Sistema de filtros por categoría
- Modal de proyectos con descripción
- Panel de administración completo
- Responsive design
- Sin frameworks pesados

## 📂 Archivos Principales

- `index.html` - Página principal con galería de proyectos
- `nosotros.html` - Página "Nosotros" / Estudio
- `admin.html` - Página de login de administrador
- `admin-panel.html` - Panel de administración de proyectos
- `styles.css` - Estilos globales
- `script.js` - JavaScript principal
- `admin-script.js` - JavaScript del panel de administración

## 🔐 Acceso al Panel de Administrador

### Credenciales:
- **Usuario:** `admin`
- **Contraseña:** `culatajovai2026`

### Acceso:
1. Ir al footer de la página principal
2. Click en "ADMIN" (enlace discreto)
3. O acceder directamente a `admin.html`

## 🎨 Categorías de Proyectos

- Vivienda unifamiliar
- Vivienda multifamiliar
- Comercial
- Espacio público
- No construido

## 🛠️ Panel de Administración

El panel permite:
- ✅ Agregar nuevos proyectos
- ✏️ Editar proyectos existentes
- 🗑️ Eliminar proyectos
- 📁 Asignar categorías
- 🖼️ Gestionar imágenes

Los datos se guardan en `localStorage` del navegador.

## 🎯 Filtros de Búsqueda

En la página principal, los usuarios pueden filtrar proyectos por:
- Todos
- Vivienda unifamiliar
- Vivienda multifamiliar
- Comercial
- Espacio público
- No construido

## 📱 Responsive

La página es completamente responsive y se adapta a:
- 📱 Móviles (hasta 480px)
- 📱 Tablets (hasta 768px)
- 💻 Desktop (1024px+)

## 🎨 Paleta de Colores

- **Blanco:** #FFFFFF
- **Negro:** #000000
- **Crimson Red:** #DC143C

## ⚙️ Funcionalidades Técnicas

- Preloader con logo
- Header sticky
- Smooth scroll
- Animaciones suaves
- Modal de proyectos
- Filtrado dinámico
- CRUD completo de proyectos
- Persistencia con localStorage

## 📝 Nota

Para cambiar las credenciales de administrador, editar el archivo `admin.html` en las líneas:
```javascript
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'culatajovai2026';
```

---

**© 2026 Grupo Culata Jovái Arquitectos**
