# Report - Sistema de Gestión de Registros y Reportes

Sistema frontend desarrollado con **Quasar Framework** y **Vue 3** para la gestión de registros de horas trabajadas, con funcionalidades de creación, edición, filtrado y exportación a Excel.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Desarrollo](#-desarrollo)
- [Build y Despliegue](#-build-y-despliegue)
- [Adaptación a Otros Backends](#-adaptación-a-otros-backends)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)

## ✨ Características

- 🔐 **Autenticación JWT** con refresh token automático
- 📊 **Gestión de Registros** (CRUD completo)
- 🔍 **Filtros Avanzados** por empresa, usuario, tarea, fechas, año contable
- 📝 **Formularios Intuitivos** para crear y editar registros
- 📥 **Exportación a Excel** con procesamiento asíncrono
- 🎨 **Diseño Responsive** con Quasar Framework
- ⚡ **Paginación** y ordenamiento de datos
- 🎯 **Validaciones** en tiempo real

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 20.x (recomendado: 22.x o 24.x)
- **npm** >= 6.13.4 o **yarn** >= 1.21.1
- Un backend API compatible (ver sección [Adaptación a Otros Backends](#-adaptación-a-otros-backends))

## 🚀 Instalación

1. **Clonar el repositorio** (o descargar el proyecto)

```bash
git clone <url-del-repositorio>
cd front_report
```

2. **Instalar dependencias**

```bash
npm install
# o
yarn install
```

3. **Configurar el backend** (ver sección [Configuración](#-configuración))

## ⚙️ Configuración

### Configuración del Backend API

El proyecto está configurado para conectarse a un backend API. Por defecto, la URL base está configurada en:

**Archivo:** `src/boot/axios.js`

```javascript
const api = axios.create({ 
  baseURL: 'http://127.0.0.1:8000/api_report',
  timeout: 30000,
  // ...
})
```

**Para cambiar la URL del backend:**

1. Edita el archivo `src/boot/axios.js`
2. Modifica la propiedad `baseURL` con la URL de tu backend:

```javascript
baseURL: 'https://tu-backend.com/api_report',
```

**Alternativa usando variables de entorno (recomendado para producción):**

Puedes crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api_report
```

Y luego modificar `src/boot/axios.js`:

```javascript
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api_report',
  // ...
})
```

### Configuración de Colores Empresariales

Los colores de la aplicación se configuran en:

**Archivo:** `src/css/quasar.variables.scss`

```scss
$primary   : #7B04BA;   // PANTONE 2084 C
$secondary : #8e61fa;   // PANTONE 2101 C
```

Modifica estas variables según tu paleta de colores corporativa.

## 💻 Desarrollo

### Iniciar servidor de desarrollo

```bash
npm run dev
# o
yarn dev
# o
quasar dev
```

El servidor se iniciará en `http://localhost:9000` (puerto por defecto de Quasar).

### Estructura de archivos principales

```
src/
├── boot/              # Archivos de inicialización
│   ├── axios.js       # Configuración de API y interceptores
│   └── auth_router.js # Guard de autenticación
├── components/        # Componentes Vue reutilizables
│   ├── FormCrearRegistro.vue
│   ├── FormEditarOrden.vue
│   ├── FormFiltros.vue
│   └── ButtonGenerateExcel.vue
├── pages/             # Páginas de la aplicación
│   ├── LoginPage.vue
│   └── RegistrosPage.vue
├── services/          # Servicios de API
│   └── registros.service.js
├── router/            # Configuración de rutas
│   └── routes.js
└── utils/             # Utilidades
    └── auth.js        # Funciones de autenticación
```

## 🏗️ Build y Despliegue

### Build para Producción

```bash
npm run build
# o
yarn build
# o
quasar build
```

Esto generará los archivos estáticos en la carpeta `dist/spa/`.

### Modos de Despliegue

#### 1. Despliegue Estático (SPA)

Los archivos generados en `dist/spa/` pueden ser servidos por cualquier servidor web estático:

- **Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /ruta/a/dist/spa;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- **Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### 2. Despliegue con Docker

Crea un `Dockerfile`:

```dockerfile
FROM nginx:alpine
COPY dist/spa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Despliegue en Vercel/Netlify

1. Conecta tu repositorio
2. Configura el comando de build: `npm run build`
3. Directorio de salida: `dist/spa`
4. Configura variables de entorno si usas `.env`

## 🔌 Adaptación a Otros Backends

Para adaptar este proyecto a un backend diferente, necesitas asegurar que tu API implemente los siguientes endpoints y estructuras:

### 1. Autenticación

#### Login
```
POST /api_report/token/
Body: { "username": "user", "password": "pass" }
Response: { "access": "token", "refresh": "refresh_token" }
```

#### Refresh Token
```
POST /api_report/token/refresh/
Body: { "refresh": "refresh_token" }
Response: { "access": "new_token" }
```

#### Obtener Usuario Actual
```
GET /api_report/user/me/
Headers: { "Authorization": "Bearer <token>" }
Response: { 
  "id": 1, 
  "username": "user",
  "is_admin": true,  // o "role": "admin", "is_staff": true, etc.
  // ... otros campos
}
```

**Archivos a modificar:**
- `src/boot/axios.js` - Cambiar `baseURL` y ajustar interceptores si es necesario
- `src/utils/auth.js` - Ajustar `isAdmin()` según la estructura de respuesta de tu API

### 2. Endpoints de Registros

#### Listar Registros (con paginación)
```
GET /api_report/registros/
Query params:
  - page: número de página
  - page_size: tamaño de página
  - empresa: ID de empresa (opcional)
  - usuario: ID de usuario (opcional)
  - tarea: ID de tarea (opcional)
  - fecha_desde: YYYY-MM-DD (opcional)
  - fecha_hasta: YYYY-MM-DD (opcional)
  - ano_contable: número (opcional)

Response: {
  "count": 100,
  "next": "url",
  "previous": "url",
  "results": [
    {
      "id": 1,
      "fecha_registro": "2024-01-15",
      "cantidad_horas": 8.5,
      "observaciones": "Texto",
      "activo": true,
      "ano_contable": 2024,
      "usuario_nombre": "Nombre Usuario",
      "sucursal_nombre": "Nombre Sucursal",
      "subempresa_nombre": "Nombre Subempresa",
      "tarea_nombre": "Nombre Tarea",
      // ... otros campos
    }
  ]
}
```

#### Crear Registro
```
POST /api_report/registros/
Body: {
  "sucursal_id": 1,
  "empresas_id": [1, 2],  // Array para múltiples subempresas
  "fecha": "2024-01-15",
  "tarea_id": 1,
  "cantidad_horas": 8.5,
  "cantidad_minutos": 30,  // opcional
  "observaciones": "Texto",
  "ano_contable": 2024,
  "userbase_id": 1  // opcional
}

Response: {
  "count": 2,  // número de registros creados
  "advertencias": []  // array de advertencias si las hay
}
```

#### Actualizar Registro
```
PUT /api_report/registros/{id}/
Body: {
  "sucursal": 1,  // ID, no sucursal_id
  "subempresa": 1,  // ID, no subempresa_id
  "fecha_registro": "2024-01-15",
  "tarea": 1,  // ID
  "cantidad_horas": 8.5,  // decimal (incluye horas, minutos y segundos)
  "observaciones": "Texto",
  "ano_contable": 2024
}

Response: { /* registro actualizado */ }
```

#### Eliminar Registro (Soft Delete)
```
DELETE /api_report/registros/{id}/
Response: 204 No Content
```

#### Obtener Registro por ID
```
GET /api_report/registros/{id}/
Response: { /* objeto registro completo */ }
```

### 3. Endpoints de Catálogos

#### Empresas
```
GET /api_report/empresas/
Response: [
  { "id": 1, "nombre": "Empresa 1" },
  { "id": 2, "nombre": "Empresa 2" }
]
```

#### Sucursales
```
GET /api_report/sucursales/
Response: [
  { "id": 1, "nombre": "Sucursal 1" }
]
// O con paginación:
Response: {
  "results": [...],
  "count": 10
}
```

#### Tareas
```
GET /api_report/tareas/
Response: [
  { "id": 1, "nombre": "Tarea 1" }
]
```

#### Rubros
```
GET /api_report/rubros/
Response: [
  { "id": 1, "nombre": "Rubro 1" }
]
```

#### Usuarios Asignados
```
GET /api_report/usuarios-asignados/
Response: [
  { 
    "id": 1, 
    "nombre": "Nombre Completo",
    "username": "usuario",
    "userbase_id": 1  // opcional, según tu estructura
  }
]
```

### 4. Endpoints de Excel

#### Generar Excel
```
POST /api_report/excel/registros/generar/
Body: {
  "subempresa_id": 1,  // opcional
  "userbase_id": 1,    // opcional
  "subrubro_id": 1,    // opcional
  "tarea_id": 1,       // opcional
  "fecha_desde": "2024-01-01",  // opcional
  "fecha_hasta": "2024-12-31",  // opcional
  "ano_contable": 2024  // opcional
}

Response: {
  "message": "Excel generándose en segundo plano",
  "detail": "El archivo estará disponible pronto",
  "archivo": {
    "id": 1,
    "nombre_archivo": "registros_2024.xlsx"
  }
}
```

#### Verificar Estado del Excel
```
GET /api_report/excel/registros/
Response: {
  "id": 1,
  "procesando": false,
  "porcentaje": 100,
  "fecha_generado": "2024-01-15T10:30:00Z",
  "file_url": "https://...",  // o "file" o "archivo"
  "nombre_archivo": "registros_2024.xlsx"
}
```

#### Descargar Excel
```
GET /api_report/excel/registros/descargar/
// O usar directamente la URL del archivo desde file_url
Response: Blob (archivo Excel)
```

### 5. Estructura de Errores

Tu API debe retornar errores en el siguiente formato:

```json
{
  "detail": "Mensaje de error general",
  // O para errores de validación:
  "campo": ["Error específico del campo"],
  "otro_campo": ["Otro error"]
}
```

Códigos de estado HTTP importantes:
- `200` - Éxito
- `201` - Creado
- `400` - Error de validación
- `401` - No autenticado
- `403` - Sin permisos
- `404` - No encontrado
- `500` - Error del servidor

### 6. Archivos a Modificar para Adaptar

1. **`src/boot/axios.js`**
   - Cambiar `baseURL`
   - Ajustar interceptores si tu API usa un formato diferente de tokens

2. **`src/services/registros.service.js`**
   - Modificar los endpoints según tu API
   - Ajustar el mapeo de datos si la estructura es diferente

3. **`src/utils/auth.js`**
   - Ajustar `isAdmin()` según cómo tu API indique los permisos
   - Modificar `loadUserDetail()` si el endpoint es diferente

4. **Componentes de formularios:**
   - `src/components/FormCrearRegistro.vue`
   - `src/components/FormEditarOrden.vue`
   - Ajustar los campos según tu modelo de datos

## 📁 Estructura del Proyecto

```
front_report/
├── public/              # Archivos estáticos públicos
├── src/
│   ├── assets/          # Imágenes, fuentes, etc.
│   ├── boot/            # Archivos de inicialización
│   ├── components/      # Componentes Vue reutilizables
│   ├── css/             # Estilos globales y variables
│   ├── layouts/         # Layouts de la aplicación
│   ├── pages/           # Páginas/vistas
│   ├── router/          # Configuración de rutas
│   ├── services/        # Servicios de API
│   ├── stores/          # Stores de Pinia (si se usan)
│   └── utils/           # Utilidades y helpers
├── .gitignore
├── package.json
├── quasar.config.js     # Configuración de Quasar
└── README.md
```

## 🛠️ Tecnologías Utilizadas

- **Vue 3** - Framework JavaScript progresivo
- **Quasar Framework** - Framework Vue con componentes Material Design
- **Axios** - Cliente HTTP para peticiones API
- **Vue Router** - Enrutador oficial de Vue
- **Pinia** - Store de estado (opcional)
- **SCSS** - Preprocesador CSS

## 📝 Notas Adicionales

- El proyecto usa **modo hash** para el router (`/#/ruta`)
- Los tokens JWT se almacenan en `LocalStorage`
- El timeout de las peticiones API es de 30 segundos
- El proyecto está configurado para usar Material Icons

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 👤 Autor

**Lucas Bauducco**
- Email: lucasbauducco@gmail.com

---

**Versión:** 0.0.1
