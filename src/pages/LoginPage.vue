<template>
  <div class="fullscreen flex flex-center bg-grey-2">
    <div class="q-pa-md" style="max-width: 400px; width: 100%">
      <q-card>
        <q-card-section>
          <div class="text-h6 text-center">Iniciar Sesión</div>
        </q-card-section>
        
        <q-card-section>
          <q-form @submit="handleLogin" class="q-gutter-md">
            <q-input
              v-model="username"
              label="Usuario"
              :rules="[val => !!val || 'El usuario es requerido']"
              outlined
              dense
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              label="Contraseña"
              type="password"
              :rules="[val => !!val || 'La contraseña es requerida']"
              outlined
              dense
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
            </q-input>

            <q-btn
              label="Iniciar Sesión"
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
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
