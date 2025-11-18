import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { LocalStorage } from 'quasar'

// Configuración de la instancia de axios
const api = axios.create({ 
  baseURL: 'http://127.0.0.1:8000/api_report',
  timeout: 30000, // Timeout de 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
})

// Variable para evitar múltiples llamadas simultáneas de refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(
  config => {
    const token = LocalStorage.getItem('access')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config

    // Verifica si el error es un 401 y que el código sea "token_not_valid"
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'token_not_valid' &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/token/refresh/')
    ) {
      if (isRefreshing) {
        // Si ya se está refrescando el token, encolar la petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = LocalStorage.getItem('refresh')

      if (!refreshToken) {
        // Si no hay refresh token, limpiar y redirigir
        handleLogout()
        return Promise.reject(error)
      }

      try {
        // Intenta refrescar el token
        const response = await api.post('/token/refresh/', {
          refresh: refreshToken
        })

        const { access } = response.data

        // Guardar el nuevo token
        LocalStorage.set('access', access)
        
        // Actualizar el header de la petición original
        originalRequest.headers.Authorization = `Bearer ${access}`
        
        // Procesar la cola de peticiones pendientes
        processQueue(null, access)
        
        isRefreshing = false

        // Reintentar la petición original
        return api(originalRequest)
      } catch (refreshError) {
        // Si el refresh token es inválido, hacer logout
        processQueue(refreshError, null)
        isRefreshing = false
        
        console.error('Error al renovar el token:', refreshError)
        handleLogout()
        
        return Promise.reject(refreshError)
      }
    }

    // Para cualquier otro error, rechazar normalmente
    return Promise.reject(error)
  }
)

// Función centralizada para manejar el logout
const handleLogout = () => {
  LocalStorage.remove('access')
  LocalStorage.remove('refresh')
  // Redirigir al login
  window.location.href = '/#/login'
}

export default defineBoot(({ app }) => {
  // Para usar dentro de archivos Vue (Options API) a través de this.$axios y this.$api
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }

