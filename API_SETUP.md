# Configuración de API con Django y JWT

Este documento explica cómo está configurado el frontend para conectarse con tu API de Django usando autenticación JWT (JSON Web Tokens).

## 📋 Configuración de la API

### URL Base
La API está configurada en `src/boot/axios.js`:
```javascript
baseURL: 'http://127.0.0.1:8000/api_report'
```

## 🔐 Autenticación JWT

### Endpoints de Autenticación

Tu API de Django debe tener estos endpoints configurados (usando `djangorestframework-simplejwt`):

1. **Login (Obtener tokens)**
   ```
   POST http://127.0.0.1:8000/api_report/token/
   Body: {
     "username": "tu_usuario",
     "password": "tu_contraseña"
   }
   Response: {
     "access": "token_de_acceso",
     "refresh": "token_de_refresco"
   }
   ```

2. **Refresh Token (Renovar access token)**
   ```
   POST http://127.0.0.1:8000/api_report/token/refresh/
   Body: {
     "refresh": "token_de_refresco"
   }
   Response: {
     "access": "nuevo_token_de_acceso"
   }
   ```

3. **Obtener datos del usuario (opcional)**
   ```
   GET http://127.0.0.1:8000/api_report/user/me/
   Headers: {
     "Authorization": "Bearer token_de_acceso"
   }
   ```

### Configuración en Django

Asegúrate de tener en tu `settings.py` de Django:

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',  # Para CORS
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... otros middlewares
]

# Configuración de CORS (para desarrollo)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:9000",  # Puerto de Quasar
    "http://127.0.0.1:9000",
]

CORS_ALLOW_CREDENTIALS = True

# Configuración de REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# Configuración de JWT
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

Y en tu `urls.py`:

```python
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # ...
    path('api_report/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api_report/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # ...
]
```

## 🔄 Flujo de Autenticación en el Frontend

### 1. Login
El usuario ingresa sus credenciales en `src/pages/LoginPage.vue`:
- Se envían username y password al endpoint `/token/`
- Se reciben los tokens `access` y `refresh`
- Los tokens se guardan en LocalStorage usando Quasar
- Se redirige al usuario a la página principal

### 2. Peticiones Autenticadas
Cuando se hace una petición a la API:
- El interceptor en `axios.js` añade automáticamente el header:
  ```
  Authorization: Bearer {access_token}
  ```

### 3. Renovación Automática de Token
Si el access token expira (error 401):
- El interceptor de axios detecta el error
- Automáticamente llama al endpoint `/token/refresh/` con el refresh token
- Obtiene un nuevo access token
- Reintenta la petición original con el nuevo token
- Si el refresh token también expiró, redirige al login

### 4. Logout
Al hacer logout:
- Se eliminan ambos tokens del LocalStorage
- Se limpia el estado de usuario
- Se redirige al login

## 📦 Servicio de Registros

### Uso del Servicio

El servicio `registrosService` está en `src/services/registros.service.js`:

```javascript
import { registrosService } from 'src/services/registros.service'

// Obtener registros con filtros
const data = await registrosService.getRegistros({
  page: 1,
  page_size: 20,
  usuario: 1,
  fecha_desde: '2024-01-01',
  fecha_hasta: '2024-12-31',
  activo: true,
  search: 'texto a buscar'
})

// Obtener un registro específico
const registro = await registrosService.getRegistro(1)

// Crear un nuevo registro
const nuevoRegistro = await registrosService.createRegistro({
  usuario: 1,
  sucursal: 1,
  tarea: 1,
  // ... otros campos
})

// Actualizar un registro
const actualizado = await registrosService.updateRegistro(1, {
  // campos a actualizar
})

// Eliminar un registro (soft delete)
await registrosService.deleteRegistro(1)
```

### Ejemplo en un Componente Vue

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { registrosService } from 'src/services/registros.service'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const registros = ref([])
const loading = ref(false)

const cargarRegistros = async () => {
  loading.value = true
  try {
    const response = await registrosService.getRegistros({
      page: 1,
      page_size: 20
    })
    
    registros.value = response.results
    
    // Información de paginación
    console.log('Total:', response.count)
    console.log('Siguiente:', response.next)
    console.log('Anterior:', response.previous)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar registros',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarRegistros()
})
</script>
```

## 🛠️ Archivos Modificados

### `src/boot/axios.js`
- Configurada la URL base: `http://127.0.0.1:8000/api_report`
- Interceptor de request: añade el token Bearer automáticamente
- Interceptor de response: maneja la renovación automática del token

### `src/utils/auth.js`
- Funciones para login, logout y verificación de autenticación
- Usa LocalStorage de Quasar para almacenar tokens
- Gestiona el estado reactivo del usuario

### `src/pages/LoginPage.vue`
- Formulario de login con validación
- Integración con la API de Django
- Notificaciones de éxito/error

### `src/services/registros.service.js` (NUEVO)
- Servicio completo para operaciones CRUD de registros
- Métodos para filtrado y búsqueda
- Manejo de errores

## 🧪 Probar la Configuración

1. **Iniciar tu API de Django:**
   ```bash
   python manage.py runserver
   ```

2. **Iniciar el frontend de Quasar:**
   ```bash
   npm run dev
   ```

3. **Probar el login:**
   - Ve a http://localhost:9000/#/login
   - Ingresa tus credenciales de Django
   - Deberías ser redirigido a la página principal

4. **Verificar tokens en el navegador:**
   - Abre las DevTools (F12)
   - Ve a Application > Local Storage
   - Deberías ver `access` y `refresh` tokens

## 🐛 Solución de Problemas

### Error de CORS
Si ves errores de CORS en la consola:
- Asegúrate de tener `django-cors-headers` instalado
- Verifica la configuración de CORS en Django settings
- Añade el puerto de tu frontend a `CORS_ALLOWED_ORIGINS`

### Token no válido
Si recibes errores 401 constantemente:
- Verifica que la fecha/hora del sistema esté correcta
- Revisa la configuración de `SIMPLE_JWT` en Django
- Verifica que el token se esté enviando correctamente en los headers

### No se puede conectar a la API
- Verifica que Django esté corriendo en `http://127.0.0.1:8000`
- Revisa que la URL en `axios.js` sea correcta
- Verifica que no haya firewalls bloqueando la conexión

## 📝 Notas Adicionales

- Los tokens se almacenan en LocalStorage y persisten entre recargas de página
- El sistema maneja automáticamente la renovación de tokens
- Todas las peticiones incluyen automáticamente el token de autenticación
- El logout limpia completamente el estado de autenticación

