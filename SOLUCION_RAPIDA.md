# 🚀 Solución Rápida al Problema de Login

## El Problema
Solo ves `OPTIONS /api_report/token/ HTTP/1.1 200` pero la petición POST no se ejecuta y no se redirige.

---

## ✅ Solución en 5 Pasos

### 1️⃣ Instalar django-cors-headers en Django

```bash
pip install django-cors-headers
```

---

### 2️⃣ Editar `settings.py` de Django

Busca `INSTALLED_APPS` y agrega `corsheaders`:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'corsheaders',  # ⬅️ AGREGAR ESTO
    'rest_framework',
    'rest_framework_simplejwt',
    
    # tus apps...
]
```

---

### 3️⃣ Editar `MIDDLEWARE` en `settings.py`

Agrega `CorsMiddleware` como el **SEGUNDO** middleware:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ⬅️ AGREGAR ESTO AQUÍ (2do lugar)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

---

### 4️⃣ Agregar configuración de CORS al final de `settings.py`

```python
# Configuración de CORS (al final del archivo)
CORS_ALLOW_ALL_ORIGINS = True  # Para desarrollo - permite todos los orígenes
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
```

---

### 5️⃣ Reiniciar Django y probar

```bash
# Detener Django (Ctrl+C)
# Luego iniciar de nuevo:
python manage.py runserver
```

---

## 🧪 Probar el Login

1. **Recargar el navegador** con Ctrl+F5
2. **Abrir DevTools** (F12) → pestaña **Console** y **Network**
3. **Ir a login:** `http://localhost:9000/#/login`
4. **Ingresar credenciales** y hacer click en "Iniciar Sesión"
5. **Ver la consola** - deberías ver:
   ```
   === INICIANDO LOGIN ===
   URL de API: http://127.0.0.1:8000/api_report
   Username: tu_usuario
   Enviando petición POST a /token/
   ✅ Respuesta recibida: {access: "...", refresh: "..."}
   Tokens recibidos - Access: eyJhbGciOiJIUzI1NiIs...
   Tokens recibidos - Refresh: eyJhbGciOiJIUzI1NiIs...
   ✅ Login exitoso, redirigiendo a /
   ```

6. **Ver Network** - deberías ver:
   - OPTIONS `/api_report/token/` - Status: 200
   - POST `/api_report/token/` - Status: 200

---

## ❌ Si Sigue Sin Funcionar

Copia y pega aquí:

1. **Lo que aparece en la consola del navegador** (DevTools → Console)
2. **Lo que aparece en Network** (DevTools → Network → click en la petición)
3. **Lo que aparece en la terminal de Django**

Con esa información podré ayudarte mejor.

---

## 📝 Verificación Rápida

Antes de probar, verifica:

- [ ] `pip install django-cors-headers` ejecutado
- [ ] `corsheaders` agregado a `INSTALLED_APPS`
- [ ] `CorsMiddleware` en 2da posición de `MIDDLEWARE`
- [ ] `CORS_ALLOW_ALL_ORIGINS = True` agregado
- [ ] Django reiniciado
- [ ] Navegador recargado con Ctrl+F5

---

## 🎯 Lo que Cambió en el Frontend

Ya actualicé `LoginPage.vue` para que muestre más información de depuración en la consola. Ahora cuando intentes hacer login verás exactamente qué está pasando.

¡Prueba estos cambios y cuéntame qué sale en la consola! 🚀

