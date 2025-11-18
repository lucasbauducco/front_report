// src/utils/auth.js
import { ref } from 'vue'
import { api } from 'boot/axios'
import { LocalStorage } from 'quasar'

// Estados reactivos
export const isLoggedIn = ref(false)
export const user_detail = ref(null)

// Función para cargar los detalles del usuario
export const loadUserDetail = async () => {
  try {
    const token = LocalStorage.getItem('access')
    
    if (!token) {
      isLoggedIn.value = false
      user_detail.value = null
      return false
    }

    // Hacer petición para obtener detalles del usuario
    // Ajusta esta ruta según tu API de Django
    const response = await api.get('/user/me/')
    
    user_detail.value = response.data
    isLoggedIn.value = true
    
    return true
  } catch (error) {
    console.error('Error al cargar detalles del usuario:', error)
    isLoggedIn.value = false
    user_detail.value = null
    LocalStorage.remove('access')
    LocalStorage.remove('refresh')
    return false
  }
}

// Función para verificar si el usuario es administrador
export const isAdmin = async () => {
  // Si no hay detalles del usuario, intentar cargarlos
  if (!user_detail.value) {
    await loadUserDetail()
  }
  
  // Verificar si el usuario tiene rol de administrador
  // Ajusta esto según la estructura de tu API
  return user_detail.value?.is_admin === true || 
         user_detail.value?.role === 'admin' ||
         user_detail.value?.is_staff === true ||
         user_detail.value?.is_superuser === true
}

// Función para hacer login
export const login = (accessToken, refreshToken, userData = null) => {
  console.log('🔐 Guardando tokens en LocalStorage...')
  LocalStorage.set('access', accessToken)
  LocalStorage.set('refresh', refreshToken)
  
  // IMPORTANTE: Establecer isLoggedIn inmediatamente
  isLoggedIn.value = true
  
  console.log('✅ isLoggedIn establecido a true')
  
  if (userData) {
    user_detail.value = userData
    console.log('✅ Datos de usuario guardados:', userData)
  } else {
    // Intentar cargar detalles del usuario (opcional, no bloquea el login)
    console.log('🔄 Intentando cargar detalles del usuario...')
    loadUserDetail().catch(err => {
      console.warn('⚠️ No se pudieron cargar los detalles del usuario, pero el login es válido:', err.message)
      // No hacer nada, el login ya está establecido
    })
  }
}

// Función para hacer logout
export const logout = () => {
  LocalStorage.remove('access')
  LocalStorage.remove('refresh')
  user_detail.value = null
  isLoggedIn.value = false
}

// Inicializar al cargar el módulo
const token = LocalStorage.getItem('access')
if (token) {
  console.log('🔄 [AUTH INIT] Token encontrado en LocalStorage, estableciendo isLoggedIn = true')
  // Establecer isLoggedIn inmediatamente si hay un token
  isLoggedIn.value = true
  
  // Intentar cargar detalles del usuario en segundo plano (opcional)
  loadUserDetail().catch(err => {
    console.warn('⚠️ [AUTH INIT] No se pudieron cargar los detalles del usuario:', err.message)
    // No hacer nada, el token sigue siendo válido
  })
} else {
  console.log('ℹ️ [AUTH INIT] No hay token en LocalStorage, isLoggedIn = false')
}