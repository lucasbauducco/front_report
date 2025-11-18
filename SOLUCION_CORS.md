# 🔧 Solución al Problema de CORS y Login

## Problema Identificado

Cuando intentas hacer login, solo ves:
```
[18/Nov/2025 10:02:05] "OPTIONS /api_report/token/ HTTP/1.1" 200 497
```

Pero **NO** ves la petición POST que debería venir después. Esto indica un problema de CORS.

---

## ✅ Solución en Django

### 1. Verificar que `django-cors-headers` esté instalado

```bash
pip install django-cors-headers
```

### 2. Configurar `settings.py` EXACTAMENTE así:

```python
# settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # CORS debe estar ANTES de tus apps
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    
    # Tus apps aquí
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # ⚠️ CORS DEBE SER EL SEGUNDO MIDDLEWARE (después de Security)
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ===== CONFIGURACIÓN DE CORS =====
# Para desarrollo - permite todos los orígenes
CORS_ALLOW_ALL_ORIGINS = True  # Temporalmente para probar

# O específicamente:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:9000",
    "http://127.0.0.1:9000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# Permitir credenciales
CORS_ALLOW_CREDENTIALS = True

# Métodos permitidos
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Headers permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ===== CONFIGURACIÓN DE REST FRAMEWORK =====
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# ===== CONFIGURACIÓN DE JWT =====
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### 3. Reiniciar el servidor de Django

```bash
# Detener el servidor (Ctrl+C)
# Luego iniciar de nuevo:
python manage.py runserver
```

---

## 🔍 Depuración en el Frontend

### 1. Actualizar LoginPage.vue con más logs

Actualiza la función `handleLogin` para agregar logs de depuración:

```vue
<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { login } from 'src/utils/auth'
import { api } from 'boot/axios'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const $q = useQuasar()
    
    const username = ref('')
    const password = ref('')
    const loading = ref(false)

    async function handleLogin() {
      loading.value = true
      
      console.log('=== INICIANDO LOGIN ===')
      console.log('URL de API:', api.defaults.baseURL)
      console.log('Username:', username.value)
      
      try {
        console.log('Enviando petición POST a /token/')
        
        const response = await api.post('/token/', {
          username: username.value,
          password: password.value
        })

        console.log('✅ Respuesta recibida:', response.data)

        const { access, refresh } = response.data

        if (!access || !refresh) {
          throw new Error('No se recibieron los tokens')
        }

        console.log('Tokens recibidos - Access:', access.substring(0, 20) + '...')
        console.log('Tokens recibidos - Refresh:', refresh.substring(0, 20) + '...')

        login(access, refresh)
        
        console.log('✅ Login exitoso, redirigiendo...')

        $q.notify({
          type: 'positive',
          message: 'Inicio de sesión exitoso',
          position: 'top',
          timeout: 2000
        })

        router.push('/')
      } catch (error) {
        console.error('❌ ERROR EN LOGIN:', error)
        console.error('Error completo:', {
          message: error.message,
          response: error.response,
          request: error.request,
          config: error.config
        })
        
        let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.'
        
        if (error.response) {
          // El servidor respondió con un código de error
          console.error('Response status:', error.response.status)
          console.error('Response data:', error.response.data)
          errorMessage = error.response?.data?.detail || JSON.stringify(error.response.data)
        } else if (error.request) {
          // La petición se hizo pero no hubo respuesta
          console.error('No se recibió respuesta del servidor')
          errorMessage = 'No se puede conectar con el servidor. Verifica que Django esté corriendo.'
        } else {
          // Algo pasó al configurar la petición
          console.error('Error al configurar la petición:', error.message)
        }
        
        $q.notify({
          type: 'negative',
          message: errorMessage,
          position: 'top',
          timeout: 5000
        })
      } finally {
        loading.value = false
      }
    }

    return {
      username,
      password,
      loading,
      handleLogin
    }
  }
}
</script>
```

---

## 🧪 Probar la Configuración

### 1. Abrir la Consola del Navegador

1. F12 para abrir DevTools
2. Ir a la pestaña **Console**
3. Ir a la pestaña **Network**

### 2. Intentar Login

1. Ingresa usuario y contraseña
2. Click en "Iniciar Sesión"

### 3. Verificar en Console

Deberías ver:
```
=== INICIANDO LOGIN ===
URL de API: http://127.0.0.1:8000/api_report
Username: tu_usuario
Enviando petición POST a /token/
```

### 4. Verificar en Network

Deberías ver DOS peticiones:
1. **OPTIONS** `/api_report/token/` - Status: 200
2. **POST** `/api_report/token/` - Status: 200 (si las credenciales son correctas)

---

## 🔴 Posibles Errores y Soluciones

### Error 1: Solo ves OPTIONS, no POST

**Causa:** CORS no está configurado correctamente

**Solución:**
1. Verifica que `corsheaders` esté en `INSTALLED_APPS`
2. Verifica que `CorsMiddleware` esté en `MIDDLEWARE` como el SEGUNDO elemento
3. Usa `CORS_ALLOW_ALL_ORIGINS = True` temporalmente
4. Reinicia Django

### Error 2: POST da 401 Unauthorized

**Causa:** Credenciales incorrectas

**Solución:**
1. Verifica el usuario y contraseña
2. Crea un usuario de prueba:
   ```bash
   python manage.py createsuperuser
   ```

### Error 3: POST da 404 Not Found

**Causa:** La ruta no existe

**Solución:**
Verifica en `urls.py`:
```python
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('api_report/token/', TokenObtainPairView.as_view()),
]
```

### Error 4: "Network Error" en la consola

**Causa:** Django no está corriendo o URL incorrecta

**Solución:**
1. Verifica que Django esté corriendo: `python manage.py runserver`
2. Verifica la URL en axios.js: debe ser `http://127.0.0.1:8000/api_report`

---

## 📝 Checklist de Verificación

- [ ] `django-cors-headers` instalado
- [ ] `corsheaders` en `INSTALLED_APPS`
- [ ] `CorsMiddleware` en segunda posición de `MIDDLEWARE`
- [ ] `CORS_ALLOW_ALL_ORIGINS = True` (temporalmente)
- [ ] Django reiniciado después de cambios
- [ ] Django corriendo en `http://127.0.0.1:8000`
- [ ] Frontend corriendo en `http://localhost:9000`
- [ ] DevTools Console abierto para ver logs
- [ ] DevTools Network abierto para ver peticiones

---

## 🎯 Siguiente Paso

Después de aplicar estos cambios:

1. **Reinicia Django:** `python manage.py runserver`
2. **Recarga el navegador:** Ctrl+F5
3. **Abre DevTools:** F12 → Console + Network
4. **Intenta login nuevamente**
5. **Copia y pega aquí los logs que aparezcan en la consola**

Con esa información podremos identificar exactamente qué está pasando.

