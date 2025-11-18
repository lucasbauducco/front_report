# Configuración de Variables de Entorno

## Crear archivo `.env`

Aunque por ahora la URL está hardcodeada en `axios.js`, es una buena práctica usar variables de entorno para configuraciones que pueden cambiar.

### 1. Crear el archivo `.env` en la raíz del proyecto

Crea un archivo llamado `.env` con el siguiente contenido:

```bash
# API de Django
VITE_API_BASE_URL=http://127.0.0.1:8000/api_report
VITE_API_TIMEOUT=30000
```

### 2. Usar variables de entorno en `axios.js`

Si quieres usar las variables de entorno, actualiza `src/boot/axios.js`:

```javascript
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api_report',
  timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 3. Diferentes ambientes

Puedes crear diferentes archivos para cada ambiente:

#### `.env.development` (desarrollo)
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api_report
VITE_API_TIMEOUT=30000
```

#### `.env.production` (producción)
```bash
VITE_API_BASE_URL=https://tu-servidor.com/api_report
VITE_API_TIMEOUT=10000
```

### 4. ⚠️ Importante

- El archivo `.env` ya está en `.gitignore`, así que NO se subirá a Git
- Comparte el archivo `.env.example` con tu equipo como referencia
- Cada desarrollador debe crear su propio `.env` local
- Para variables de entorno con Vite, **DEBEN** empezar con `VITE_`

### 5. Ejemplo `.env.example`

Crea un archivo `.env.example` para compartir con tu equipo:

```bash
# API de Django - Copia este archivo a .env y ajusta los valores
VITE_API_BASE_URL=http://127.0.0.1:8000/api_report
VITE_API_TIMEOUT=30000

# Otras configuraciones futuras
# VITE_GOOGLE_ANALYTICS_ID=
# VITE_SENTRY_DSN=
```

## Uso en Componentes Vue

También puedes usar las variables de entorno directamente en componentes:

```vue
<script setup>
const apiUrl = import.meta.env.VITE_API_BASE_URL
console.log('API URL:', apiUrl)
</script>
```

## Variables de Entorno Predefinidas de Vite

Vite también proporciona estas variables:

- `import.meta.env.MODE` - El modo de la app ('development' o 'production')
- `import.meta.env.BASE_URL` - La URL base de la app
- `import.meta.env.PROD` - true si está en producción
- `import.meta.env.DEV` - true si está en desarrollo

## Reiniciar el Servidor

Después de cambiar variables de entorno, debes **reiniciar el servidor de desarrollo**:

```bash
# Detener con Ctrl+C
# Luego iniciar de nuevo:
npm run dev
```

---

**Nota:** Por ahora, la configuración está funcionando sin variables de entorno. Esta es solo una mejora opcional para el futuro.

