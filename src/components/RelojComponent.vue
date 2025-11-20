<template>
  <div
    v-if="visible"
    ref="relojContainer"
    class="reloj-flotante"
    :style="containerStyle"
    @mousedown="startDrag"
  >
    <q-card class="reloj-card shadow-3">
      <q-card-section class="q-pa-sm">
        <!-- Barra de arrastre y controles -->
        <div class="row items-center justify-between q-mb-xs">
          <div class="col-auto cursor-move">
            <q-icon name="drag_indicator" size="sm" class="text-grey-6" />
          </div>
          <div class="col-auto">
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="close"
              @click="toggleVisibility"
              class="q-mr-xs"
            />
          </div>
        </div>

        <!-- Display del cronómetro -->
        <div class="text-center q-mb-sm">
          <div class="reloj-display">
            {{ tiempoFormateado }}
          </div>
        </div>

        <!-- Botones de control -->
        <div class="row justify-center q-gutter-xs">
          <q-btn
            v-if="!controlActivo"
            round
            dense
            color="positive"
            icon="play_arrow"
            @click="iniciarControl"
            :loading="cargando"
            size="sm"
          />
          <q-btn
            v-else
            round
            dense
            color="negative"
            icon="stop"
            @click="finalizarControl"
            :loading="cargando"
            size="sm"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>

  <!-- Botón flotante para mostrar el reloj cuando está oculto -->
  <q-btn
    v-else
    fab
    color="primary"
    icon="access_time"
    class="reloj-fab"
    @click="toggleVisibility"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { LocalStorage } from 'quasar'
import { api } from 'boot/axios'

const $q = useQuasar()

// Estado del componente
const visible = ref(true)
const relojContainer = ref(null)
const cargando = ref(false)
const controlActivo = ref(false)
const segundos = ref(0)
const interval = ref(null)

// Estado de arrastre
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 100, y: 100 })

// Claves de localStorage
const STORAGE_KEY_VISIBLE = 'reloj_visible'
const STORAGE_KEY_POSITION = 'reloj_position'
const STORAGE_KEY_SEGUNDOS = 'reloj_segundos'
const STORAGE_KEY_ACTIVO = 'reloj_activo'

// Cargar estado guardado
function cargarEstado() {
  const savedVisible = LocalStorage.getItem(STORAGE_KEY_VISIBLE)
  if (savedVisible !== null) {
    visible.value = savedVisible
  }

  const savedPosition = LocalStorage.getItem(STORAGE_KEY_POSITION)
  if (savedPosition) {
    position.value = savedPosition
  }

  const savedSegundos = LocalStorage.getItem(STORAGE_KEY_SEGUNDOS)
  if (savedSegundos !== null) {
    segundos.value = savedSegundos
  }

  const savedActivo = LocalStorage.getItem(STORAGE_KEY_ACTIVO)
  if (savedActivo !== null) {
    controlActivo.value = savedActivo
    if (savedActivo) {
      iniciarCronometro()
    }
  }
}

// Guardar estado
function guardarEstado() {
  LocalStorage.set(STORAGE_KEY_VISIBLE, visible.value)
  LocalStorage.set(STORAGE_KEY_POSITION, position.value)
  LocalStorage.set(STORAGE_KEY_SEGUNDOS, segundos.value)
  LocalStorage.set(STORAGE_KEY_ACTIVO, controlActivo.value)
}

// Formatear tiempo
const tiempoFormateado = computed(() => {
  const h = String(Math.floor(segundos.value / 3600)).padStart(2, '0')
  const m = String(Math.floor((segundos.value % 3600) / 60)).padStart(2, '0')
  const s = String(segundos.value % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})

// Estilo del contenedor
const containerStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  cursor: isDragging.value ? 'grabbing' : 'default'
}))

// Iniciar cronómetro
function iniciarCronometro() {
  if (interval.value) clearInterval(interval.value)
  interval.value = setInterval(() => {
    segundos.value++
    guardarEstado()
  }, 1000)
}

// Detener cronómetro
function detenerCronometro() {
  if (interval.value) {
    clearInterval(interval.value)
    interval.value = null
  }
}

// Obtener ubicación
async function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no disponible'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 40000, maximumAge: 0 }
    )
  })
}

// Obtener estado del control desde el backend
async function obtenerEstadoControl() {
  try {
    const response = await api.get('/control-horas/estado/')
    
    if (response.data.control_activo) {
      controlActivo.value = true
      if (response.data.segundos_transcurridos !== null && response.data.segundos_transcurridos !== undefined) {
        segundos.value = response.data.segundos_transcurridos
        iniciarCronometro()
      }
      guardarEstado()
    } else {
      controlActivo.value = false
      segundos.value = 0
      detenerCronometro()
      guardarEstado()
    }
  } catch (error) {
    console.error('Error al obtener estado del control:', error)
    // No mostrar error al usuario, solo loguear
  }
}

// Iniciar control
async function iniciarControl() {
  cargando.value = true
  try {
    const position = await obtenerUbicacion()
    const lat = position.coords.latitude
    const lon = position.coords.longitude

    const response = await api.post('/control-horas/iniciar/', {
      lat,
      lon
    })

    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: response.data.message || 'Control iniciado correctamente',
        position: 'top',
        timeout: 3000
      })

      if (response.data.segundos_transcurridos !== undefined) {
        segundos.value = response.data.segundos_transcurridos
      }

      controlActivo.value = true
      iniciarCronometro()
      guardarEstado()
    } else {
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Error al iniciar control',
        position: 'top',
        timeout: 3000
      })
    }
  } catch (error) {
    console.error('Error al iniciar control:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al iniciar control: ' + error.message,
      position: 'top',
      timeout: 3000
    })
  } finally {
    cargando.value = false
  }
}

// Finalizar control
async function finalizarControl() {
  cargando.value = true
  try {
    const position = await obtenerUbicacion()
    const lat = position.coords.latitude
    const lon = position.coords.longitude

    detenerCronometro()

    const response = await api.post('/control-horas/detener/', {
      lat,
      lon
    })

    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: response.data.message || 'Control finalizado correctamente',
        position: 'top',
        timeout: 3000
      })

      controlActivo.value = false
      segundos.value = 0
      guardarEstado()
    } else {
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Error al finalizar control',
        position: 'top',
        timeout: 3000
      })
      if (controlActivo.value) {
        iniciarCronometro()
      }
    }
  } catch (error) {
    console.error('Error al finalizar control:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al finalizar control: ' + error.message,
      position: 'top',
      timeout: 3000
    })
    if (controlActivo.value) {
      iniciarCronometro()
    }
  } finally {
    cargando.value = false
  }
}

// Toggle visibilidad
function toggleVisibility() {
  visible.value = !visible.value
  guardarEstado()
}

// Funciones de arrastre
function startDrag(event) {
  // Solo arrastrar si se hace clic en la barra de arrastre o en el card (pero no en botones)
  const target = event.target
  const clickedButton = target.closest('button')
  
  // Si se hizo clic en un botón, no arrastrar
  if (clickedButton) {
    return
  }

  // Permitir arrastrar desde cualquier parte del card excepto botones
  const isDragHandle = target.closest('.reloj-card') && !clickedButton

  if (!isDragHandle) {
    return
  }

  isDragging.value = true
  const rect = relojContainer.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

function onDrag(event) {
  if (!isDragging.value) return

  const maxX = window.innerWidth - (relojContainer.value?.offsetWidth || 260)
  const maxY = window.innerHeight - (relojContainer.value?.offsetHeight || 150)

  position.value = {
    x: Math.max(0, Math.min(event.clientX - dragOffset.value.x, maxX)),
    y: Math.max(0, Math.min(event.clientY - dragOffset.value.y, maxY))
  }
}

function stopDrag() {
  if (isDragging.value) {
    isDragging.value = false
    guardarEstado()
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }
}

// Lifecycle
onMounted(async () => {
  // Primero cargar estado guardado localmente
  cargarEstado()
  
  // Luego sincronizar con el backend para obtener el estado real
  await obtenerEstadoControl()
  
  // Si hay un control activo según el backend, actualizar el cronómetro
  if (controlActivo.value && segundos.value > 0) {
    iniciarCronometro()
  }
})

onUnmounted(() => {
  detenerCronometro()
  stopDrag()
})
</script>

<style scoped>
.reloj-flotante {
  position: fixed;
  z-index: 2000;
  user-select: none;
  max-width: 260px;
  width: 100%;
}

.reloj-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.reloj-display {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.cursor-move {
  cursor: move;
}

.reloj-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
}

/* Responsive */
@media (max-width: 600px) {
  .reloj-flotante {
    max-width: 240px;
  }

  .reloj-display {
    font-size: 1.5rem;
  }
}
</style>
