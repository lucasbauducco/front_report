// src/utils/auth.js
import { ref } from 'vue'
import { api } from 'boot/axios'
import { LocalStorage } from 'quasar'

// Estados reactivos
export const isLoggedIn = ref(false)
export const user_detail = ref(null)

// Función para normalizar los datos del usuario
const normalizeUserData = (userData) => {
  if (!userData) return null
  
  // Crear una copia del objeto para no mutar el original
  const normalized = { ...userData }
  
  // Mapear nombre/apellido a first_name/last_name para compatibilidad
  if (normalized.nombre && !normalized.first_name) {
    normalized.first_name = normalized.nombre
  }
  if (normalized.apellido && !normalized.last_name) {
    normalized.last_name = normalized.apellido
  }
  
  // Si existe nombre_completo pero no first_name/last_name, intentar dividirlo
  if (normalized.nombre_completo && !normalized.first_name && !normalized.last_name) {
    const parts = normalized.nombre_completo.trim().split(/\s+/)
    if (parts.length > 0) {
      normalized.first_name = parts[0]
      if (parts.length > 1) {
        normalized.last_name = parts.slice(1).join(' ')
      }
    }
  }
  
  return normalized
}

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
    const response = await api.get('/user/me/')
    
    // Normalizar los datos antes de guardarlos
    user_detail.value = normalizeUserData(response.data)
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
  return user_detail.value?.is_admin === true || 
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
    // Normalizar los datos del usuario antes de guardarlos
    user_detail.value = normalizeUserData(userData)
    console.log('✅ Datos de usuario guardados:', user_detail.value)
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