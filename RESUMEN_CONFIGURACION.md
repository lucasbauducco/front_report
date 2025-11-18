# 🎉 Configuración Completa - Frontend con API Django JWT

## ✅ Archivos Configurados

### 1. **`src/boot/axios.js`**
   - ✅ URL base configurada: `http://127.0.0.1:8000/api_report`
   - ✅ Interceptor para agregar token Bearer automáticamente
   - ✅ Interceptor para renovar token automáticamente cuando expira
   - ✅ Timeout aumentado a 30 segundos

### 2. **`src/utils/auth.js`**
   - ✅ Funciones de login/logout actualizadas
   - ✅ Usa LocalStorage de Quasar para tokens `access` y `refresh`
   - ✅ Función `loadUserDetail()` para cargar datos del usuario
   - ✅ Función `isAdmin()` para verificar permisos

### 3. **`src/pages/LoginPage.vue`**
   - ✅ Formulario de login completo con validación
   - ✅ Integración con API Django JWT
   - ✅ Notificaciones de éxito/error
   - ✅ Redirección automática después del login

### 4. **`src/services/registros.service.js`** ⭐ NUEVO
   - ✅ Servicio completo para CRUD de registros
   - ✅ Métodos para todas las operaciones:
     - `getRegistros(params)` - Lista con filtros
     - `getRegistro(id)` - Obtener uno
     - `createRegistro(data)` - Crear
     - `updateRegistro(id, data)` - Actualizar completo
     - `patchRegistro(id, data)` - Actualizar parcial
     - `deleteRegistro(id)` - Eliminar (soft delete)

### 5. **`src/pages/RegistrosPage.vue`** ⭐ NUEVO
   - ✅ Página completa con tabla de registros
   - ✅ Filtros funcionales (búsqueda, fechas, estado, año)
   - ✅ Paginación integrada
   - ✅ Acciones: Ver, Editar, Eliminar
   - ✅ Confirmación de eliminación

### 6. **`src/router/routes.js`**
   - ✅ Ruta agregada: `/registros` → RegistrosPage

### 7. **`API_SETUP.md`** ⭐ NUEVO
   - ✅ Documentación completa de la configuración
   - ✅ Instrucciones para Django
   - ✅ Ejemplos de uso
   - ✅ Solución de problemas

---

## 🚀 Cómo Usar

### 1. Configurar Django (Backend)

Tu API de Django **debe tener** estos endpoints:

```python
# En tu urls.py principal
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # ... otras rutas
    path('api_report/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api_report/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api_report/registros/', RegistroListCreateView.as_view(), name='registro-list-create'),
    path('api_report/registros/<int:pk>/', RegistroDetailView.as_view(), name='registro-detail'),
]
```

**Instalar paquetes necesarios:**
```bash
pip install djangorestframework djangorestframework-simplejwt django-cors-headers
```

**Configurar `settings.py`:**
```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... otros middlewares
]

# CORS para desarrollo
CORS_ALLOWED_ORIGINS = [
    "http://localhost:9000",
    "http://127.0.0.1:9000",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

### 2. Iniciar Backend (Django)

```bash
# En tu directorio de Django
python manage.py runserver
```

Verifica que esté corriendo en: `http://127.0.0.1:8000`

### 3. Iniciar Frontend (Quasar)

```bash
# En el directorio c:\Lucas\front_report
npm run dev
```

El frontend correrá en: `http://localhost:9000`

### 4. Probar la Aplicación

1. **Login:**
   - Ve a: `http://localhost:9000/#/login`
   - Ingresa tus credenciales de Django
   - Deberías ser redirigido a la página principal

2. **Ver Registros:**
   - Ve a: `http://localhost:9000/#/registros`
   - Deberías ver una tabla con tus registros
   - Prueba los filtros y la paginación

3. **Verificar Tokens:**
   - Abre DevTools (F12)
   - Application → Local Storage → `http://localhost:9000`
   - Deberías ver `access` y `refresh` tokens

---

## 💡 Ejemplos de Uso del Servicio

### En cualquier componente Vue:

```vue
<script setup>
import { ref } from 'vue'
import { registrosService } from 'src/services/registros.service'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const registros = ref([])

// Obtener registros con filtros
const cargarRegistros = async () => {
  try {
    const response = await registrosService.getRegistros({
      page: 1,
      page_size: 20,
      fecha_desde: '2024-01-01',
      activo: true,
      search: 'texto'
    })
    
    registros.value = response.results
    console.log('Total:', response.count)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar registros'
    })
  }
}

// Crear un nuevo registro
const crearRegistro = async () => {
  try {
    const nuevoRegistro = await registrosService.createRegistro({
      usuario: 1,
      sucursal: 1,
      tarea: 1,
      observaciones: 'Mi nuevo registro',
      ano_contable: 2024
    })
    
    $q.notify({
      type: 'positive',
      message: 'Registro creado exitosamente'
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

// Actualizar un registro
const actualizarRegistro = async (id) => {
  try {
    const actualizado = await registrosService.patchRegistro(id, {
      observaciones: 'Registro actualizado'
    })
    
    $q.notify({
      type: 'positive',
      message: 'Registro actualizado'
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

// Eliminar un registro (soft delete)
const eliminarRegistro = async (id) => {
  try {
    await registrosService.deleteRegistro(id)
    
    $q.notify({
      type: 'positive',
      message: 'Registro eliminado'
    })
    
    cargarRegistros() // Recargar la lista
  } catch (error) {
    console.error('Error:', error)
  }
}
</script>
```

---

## 🔍 Endpoints Disponibles

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api_report/token/` | Obtener tokens (login) |
| POST | `/api_report/token/refresh/` | Renovar access token |

**Ejemplo de Login:**
```javascript
// Se hace automáticamente en LoginPage.vue
const response = await api.post('/token/', {
  username: 'mi_usuario',
  password: 'mi_contraseña'
})
// Response: { access: '...', refresh: '...' }
```

### Registros

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api_report/registros/` | Lista paginada con filtros |
| POST | `/api_report/registros/` | Crear nuevo registro |
| GET | `/api_report/registros/{id}/` | Obtener un registro |
| PUT | `/api_report/registros/{id}/` | Actualizar completo |
| PATCH | `/api_report/registros/{id}/` | Actualizar parcial |
| DELETE | `/api_report/registros/{id}/` | Soft delete |

**Filtros disponibles en GET:**
- `page` - Número de página
- `page_size` - Tamaño de página (default: 20, max: 100)
- `usuario` - ID del usuario
- `sucursal` - ID de sucursal
- `subempresa` - ID de subempresa
- `tarea` - ID de tarea
- `empresa` - ID de empresa
- `grupo_empresa` - ID de grupo empresa
- `fecha_desde` - Fecha desde (YYYY-MM-DD)
- `fecha_hasta` - Fecha hasta (YYYY-MM-DD)
- `activo` - true/false
- `ano_contable` - Año contable
- `search` - Búsqueda en observaciones

**Ejemplo:**
```javascript
const response = await registrosService.getRegistros({
  page: 1,
  page_size: 20,
  fecha_desde: '2024-01-01',
  fecha_hasta: '2024-12-31',
  activo: true,
  search: 'importante'
})

// Response:
// {
//   count: 150,
//   next: 'http://...?page=2',
//   previous: null,
//   results: [...]
// }
```

---

## 🔐 Flujo de Autenticación

```
1. Usuario ingresa credenciales en LoginPage
        ↓
2. POST /token/ → Obtiene access + refresh tokens
        ↓
3. Tokens se guardan en LocalStorage
        ↓
4. Cada petición incluye: Authorization: Bearer {access}
        ↓
5. Si access expira (401) → Interceptor renueva automáticamente
        ↓
6. POST /token/refresh/ → Nuevo access token
        ↓
7. Reintenta petición original con nuevo token
        ↓
8. Si refresh también expiró → Redirige a login
```

---

## 🐛 Solución de Problemas

### Error: CORS policy
**Síntoma:** Error de CORS en la consola del navegador

**Solución:**
```python
# En Django settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:9000",
    "http://127.0.0.1:9000",
]
```

### Error: 401 Unauthorized constante
**Síntoma:** Todas las peticiones dan 401

**Posibles causas:**
1. Verifica que el token se esté guardando:
   - DevTools → Application → Local Storage
   - Debe haber `access` y `refresh`

2. Verifica la configuración JWT en Django:
   ```python
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
   }
   ```

3. Verifica que el middleware de autenticación esté configurado

### No se puede conectar a la API
**Síntoma:** Network error o Connection refused

**Verifica:**
1. Django está corriendo: `python manage.py runserver`
2. La URL en `axios.js` es correcta: `http://127.0.0.1:8000/api_report`
3. No hay firewall bloqueando el puerto 8000

### Error 404 en /registros/
**Síntoma:** Endpoint no encontrado

**Verifica:**
1. La ruta en Django está configurada correctamente
2. El prefijo es correcto: `/api_report/registros/`
3. La vista `RegistroListCreateView` está registrada

---

## 📚 Documentación Adicional

- [Quasar Framework](https://quasar.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Axios](https://axios-http.com/)

---

## 🎯 Próximos Pasos

1. ✅ **Autenticación JWT configurada**
2. ✅ **Servicio de registros creado**
3. ✅ **Página de registros funcional**
4. 📝 Personalizar la interfaz según tus necesidades
5. 📝 Agregar más filtros o campos si es necesario
6. 📝 Implementar la funcionalidad de edición completa
7. 📝 Agregar validaciones adicionales
8. 📝 Configurar para producción

---

## ✨ Características Implementadas

- ✅ Login con JWT
- ✅ Renovación automática de tokens
- ✅ Interceptores de Axios configurados
- ✅ Servicio de registros completo
- ✅ Página de registros con tabla
- ✅ Filtros funcionales
- ✅ Paginación
- ✅ Acciones CRUD
- ✅ Notificaciones de éxito/error
- ✅ Confirmación de eliminación
- ✅ Manejo de errores

---

¡Todo está listo para empezar a trabajar! 🚀

