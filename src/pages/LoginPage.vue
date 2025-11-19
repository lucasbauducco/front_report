<template>
  <div class="login-container fullscreen flex flex-center">
    <div class="login-content q-pa-md">
      <!-- Logo configurable para cada empresa y nombre de producto -->
      <div class="login-logo-container q-mb-xl text-center" style="flex-direction: column; gap: 0.8rem;">
        <template v-if="!logoError">
          <img 
            :src="logoPath" 
            :alt="logoAlt"
            class="login-logo"
            @error="onLogoError"
          />
        </template>
        <span class="nimbus-typography-login login-app-title">
          <span class="login-app-title-main">nimbus</span>
          <span class="text-grey-3 login-app-title-report" style="font-weight: 300;">Report</span>
          <span class="text-grey-3" style="font-weight: 100;">+</span>
        </span>
      </div>
      
      <!-- Tarjeta de login -->
      <q-card class="login-card">
        <q-card-section class="login-card-header">
          <div class="login-title nimbus-typography-login">
            Iniciar Sesión
          </div>
        </q-card-section>
        
        <q-card-section class="login-card-body">
          <q-form @submit="handleLogin" class="q-gutter-md">
            <q-input
              v-model="username"
              label="Usuario"
              :rules="[val => !!val || 'El usuario es requerido']"
              outlined
              dense
              class="nimbus-input"
              color="primary"
            >
              <template v-slot:prepend>
                <q-icon name="person" class="nimbus-input-icon" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              label="Contraseña"
              type="password"
              :rules="[val => !!val || 'La contraseña es requerida']"
              outlined
              dense
              class="nimbus-input"
              color="primary"
            >
              <template v-slot:prepend>
                <q-icon name="lock" class="nimbus-input-icon" />
              </template>
            </q-input>

            <q-btn
              label="Iniciar Sesión"
              type="submit"
              color="primary"
              class="full-width nimbus-login-button"
              :loading="loading"
              unelevated
            />
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { login } from 'src/utils/auth'
import { api } from 'boot/axios'

const router = useRouter()
const $q = useQuasar()

// Importar configuración de marca
import { LOGO_PATH, LOGO_ALT } from 'src/config/branding'

// Configuración de logo (configurable en src/config/branding.js)
const logoPath = LOGO_PATH
const logoAlt = LOGO_ALT
const logoError = ref(false)

function onLogoError() {
  // Si el logo no se encuentra, ocultarlo
  logoError.value = true
  console.warn(`Logo no encontrado en: ${logoPath}`)
}

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

    // Extraer los tokens de la respuesta
    const { access, refresh } = response.data

    if (!access || !refresh) {
      throw new Error('No se recibieron los tokens')
    }

    console.log('Tokens recibidos - Access:', access.substring(0, 20) + '...')
    console.log('Tokens recibidos - Refresh:', refresh.substring(0, 20) + '...')

    // Guardar tokens y actualizar estado
    login(access, refresh)
    
    console.log('✅ Login exitoso, redirigiendo a /')

    // Notificación de éxito
    $q.notify({
      type: 'positive',
      message: 'Inicio de sesión exitoso',
      position: 'top',
      timeout: 2000
    })

    // Redireccionar a la página principal
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
      errorMessage = 'No se puede conectar con el servidor. Verifica que Django esté corriendo en http://127.0.0.1:8000'
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
</script>

<style lang="scss" scoped>
/* Contenedor principal con gradiente de fondo */
.login-container {
  background: linear-gradient(200deg, $primary 25%, $secondary 50%, $nimbus-purple-medium 75%);
  position: relative;
  overflow: hidden;
  
  /* Efecto de ondas de fondo opcional */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: float 20s infinite linear;
    pointer-events: none;
  }
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

.login-content {
  max-width: 420px;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Logo */
.login-logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 2rem;
}

.login-app-title {
  margin-top: 0.2rem;
  font-size: 1.5em;
  letter-spacing: 0.01em;
}
.login-app-title-main {
  font-weight: 600;
}
.login-app-title-report {
  margin-left: 3px;
  margin-right: 2px;
}

/* Original logo style */
.login-logo {
  height: 90px;
  width: auto;
  max-width: 320px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.login-logo:hover {
  transform: scale(1.05);
}

/* Tarjeta de login */
.login-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-card-header {
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
}

.login-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: $nimbus-white;
  letter-spacing: 0.02em;
  text-transform: none;
  margin: 0;
}

.login-card-body {
  padding: 2rem 1.5rem;
}

/* Tipografía Nimbus para login */
.nimbus-typography-login {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
}

/* Inputs con estilo Nimbus */
.nimbus-input {
  margin-bottom: 0.5rem;
  
  :deep(.q-field__label) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
    font-weight: 500;
    color: $nimbus-purple-dark;
  }
  
  :deep(.q-field__control) {
    color: $nimbus-purple-dark;
  }
  
  :deep(.q-field--outlined .q-field__control) {
    border-radius: 8px;
    border-color: $nimbus-lavender;
    transition: all 0.3s ease;
  }
  
  :deep(.q-field--outlined:hover .q-field__control) {
    border-color: $primary;
  }
  
  :deep(.q-field--focused .q-field__control) {
    border-color: $primary;
    border-width: 2px;
  }
  
  :deep(.q-field__native) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
    color: $nimbus-purple-dark;
    font-weight: 400;
  }
}

.nimbus-input-icon {
  color: $primary;
  font-size: 1.25rem;
}

/* Botón de login */
.nimbus-login-button {
  margin-top: 1rem;
  padding: 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.02em;
  border-radius: 8px;
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba($primary, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($primary, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  :deep(.q-btn__content) {
    color: $nimbus-white;
  }
}

/* Responsive */
@media (max-width: 600px) {
  .login-content {
    max-width: 100%;
    padding: 1rem;
  }
  
  .login-logo {
    height: 70px;
    max-width: 280px;
  }
  
  .login-app-title {
    font-size: 1.1em;
  }

  .login-title {
    font-size: 1.5rem;
  }
  
  .login-card-header {
    padding: 1.5rem 1rem 1rem;
  }
  
  .login-card-body {
    padding: 1.5rem 1rem;
  }
  
  .nimbus-login-button {
    padding: 0.625rem;
    font-size: 0.95rem;
  }
}
</style>
