<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center q-pb-none">
        <div class="row items-center q-gutter-sm">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            @click="cerrarFormulario"
          />
          <div class="text-h6">
            {{ esModoEdicion ? `Editar Control de Hora ID ${controlHoraId || 'Nuevo'}` : 'Crear Control de Hora' }}
          </div>
        </div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="cerrarFormulario"
        />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form
          @submit="guardar"
          @reset="resetearFormulario"
          class="q-gutter-md"
        >
          <div class="row q-gutter-md">
            <!-- Usuario* (userbase) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.userbase"
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                :options="opcionesUsuarios"
                @filter="filterUsuarios"
                option-value="id"
                :option-label="(usr) => obtenerNombreCompleto(usr)"
                emit-value
                map-options
                hint="Usuario*"
                :rules="[val => !!val || 'El usuario es requerido']"
                :clearable="!esModoEdicion"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Tiempo Inicio* (DateTime) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model="formData.tiempo_inicio"
                mask="####-##-## ##:##:##"
                hint="Tiempo Inicio* (YYYY-MM-DD HH:MM:SS)"
                placeholder="YYYY-MM-DD HH:MM:SS"
                :rules="[
                  val => !!val || 'El tiempo de inicio es requerido',
                  val => validarDateTime(val) || 'Formato inválido. Use YYYY-MM-DD HH:MM:SS'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="schedule" />
                </template>
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale" ref="qDateProxyInicio">
                      <div>
                        <q-date
                          v-model="fechaInicio"
                          mask="YYYY-MM-DD"
                          @update:model-value="actualizarFechaInicio"
                        />
                        <q-time
                          v-model="horaInicio"
                          mask="HH:mm:ss"
                          format24h
                          @update:model-value="actualizarHoraInicio"
                        />
                        <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </div>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Tiempo Fin (opcional, DateTime) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model="formData.tiempo_fin"
                mask="####-##-## ##:##:##"
                hint="Tiempo Fin (opcional, YYYY-MM-DD HH:MM:SS)"
                placeholder="YYYY-MM-DD HH:MM:SS"
                :rules="[
                  val => !val || validarDateTime(val) || 'Formato inválido. Use YYYY-MM-DD HH:MM:SS'
                ]"
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="schedule" />
                </template>
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale" ref="qDateProxyFin">
                      <div>
                        <q-date
                          v-model="fechaFin"
                          mask="YYYY-MM-DD"
                          @update:model-value="actualizarFechaFin"
                        />
                        <q-time
                          v-model="horaFin"
                          mask="HH:mm:ss"
                          format24h
                          @update:model-value="actualizarHoraFin"
                        />
                        <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </div>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="row justify-start q-gutter-md q-mt-md">
            <q-btn
              :label="esModoEdicion ? 'Guardar Cambios' : 'Crear Control de Hora'"
              type="submit"
              color="primary"
              :icon="esModoEdicion ? 'save' : 'add'"
              :loading="guardando"
            />
            <q-btn
              label="Cancelar"
              type="reset"
              color="grey"
              flat
              @click="cerrarFormulario"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { controlhorasService } from 'src/services/controlhoras.service'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  controlHora: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'guardado', 'cancelado'])

const $q = useQuasar()

// Computed para determinar si está en modo edición
const esModoEdicion = computed(() => !!props.controlHora && !!props.controlHora.id)
const controlHoraId = computed(() => props.controlHora?.id || null)

// Estado del formulario
const guardando = ref(false)

// Datos del formulario
const formData = ref({
  userbase: null,
  tiempo_inicio: null,
  tiempo_fin: null
})

// Variables para los datetime pickers
const fechaInicio = ref(null)
const horaInicio = ref(null)
const fechaFin = ref(null)
const horaFin = ref(null)

// Opciones para selects
const opcionesUsuarios = ref([])

// Datos completos para filtrado
const usuariosCompletos = ref([])


// Validar formato de datetime YYYY-MM-DD HH:MM:SS
function validarDateTime(datetime) {
  if (!datetime) return false
  const regex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})$/
  const match = datetime.match(regex)
  
  if (!match) return false
  
  const anio = parseInt(match[1])
  const mes = parseInt(match[2])
  const dia = parseInt(match[3])
  const horas = parseInt(match[4])
  const minutos = parseInt(match[5])
  const segundos = parseInt(match[6])
  
  if (mes < 1 || mes > 12) return false
  if (dia < 1 || dia > 31) return false
  if (horas < 0 || horas > 23) return false
  if (minutos < 0 || minutos > 59) return false
  if (segundos < 0 || segundos > 59) return false
  
  const fechaObj = new Date(anio, mes - 1, dia, horas, minutos, segundos)
  return fechaObj.getFullYear() === anio &&
         fechaObj.getMonth() === mes - 1 &&
         fechaObj.getDate() === dia &&
         fechaObj.getHours() === horas &&
         fechaObj.getMinutes() === minutos &&
         fechaObj.getSeconds() === segundos
}

// Formatear datetime ISO a YYYY-MM-DD HH:MM:SS
function formatearDateTime(datetime) {
  if (!datetime) return null
  const date = new Date(datetime)
  if (isNaN(date.getTime())) return null
  
  const anio = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  const horas = String(date.getHours()).padStart(2, '0')
  const minutos = String(date.getMinutes()).padStart(2, '0')
  const segundos = String(date.getSeconds()).padStart(2, '0')
  
  return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`
}

// Convertir datetime string a formato que espera el backend (YYYY-MM-DDTHH:MM:SS)
function datetimeAISO(datetimeString) {
  if (!datetimeString) return null
  // Si ya tiene formato correcto, solo reemplazar espacio por T
  if (datetimeString.includes(' ')) {
    return datetimeString.replace(' ', 'T')
  }
  // Si ya tiene T, devolverlo tal cual
  if (datetimeString.includes('T')) {
    // Asegurarse de que no tenga milisegundos ni Z
    return datetimeString.split('.')[0].replace('Z', '')
  }
  // Si no tiene formato esperado, intentar parsearlo
  const date = new Date(datetimeString)
  if (isNaN(date.getTime())) {
    console.error('Error al convertir datetime:', datetimeString)
    return null
  }
  // Formatear manualmente sin milisegundos ni Z
  const anio = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  const horas = String(date.getHours()).padStart(2, '0')
  const minutos = String(date.getMinutes()).padStart(2, '0')
  const segundos = String(date.getSeconds()).padStart(2, '0')
  return `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}`
}

// Actualizar fecha inicio
function actualizarFechaInicio(fecha) {
  fechaInicio.value = fecha
  if (fecha && horaInicio.value) {
    formData.value.tiempo_inicio = `${fecha} ${horaInicio.value}`
  } else if (fecha) {
    const ahora = new Date()
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    const segundos = String(ahora.getSeconds()).padStart(2, '0')
    horaInicio.value = `${horas}:${minutos}:${segundos}`
    formData.value.tiempo_inicio = `${fecha} ${horaInicio.value}`
  }
}

// Actualizar hora inicio
function actualizarHoraInicio(hora) {
  horaInicio.value = hora
  if (fechaInicio.value && hora) {
    formData.value.tiempo_inicio = `${fechaInicio.value} ${hora}`
  } else if (hora && !fechaInicio.value) {
    const hoy = new Date()
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    fechaInicio.value = fechaHoy
    formData.value.tiempo_inicio = `${fechaHoy} ${hora}`
  }
}

// Actualizar fecha fin
function actualizarFechaFin(fecha) {
  fechaFin.value = fecha
  if (fecha && horaFin.value) {
    formData.value.tiempo_fin = `${fecha} ${horaFin.value}`
  } else if (fecha) {
    const ahora = new Date()
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    const segundos = String(ahora.getSeconds()).padStart(2, '0')
    horaFin.value = `${horas}:${minutos}:${segundos}`
    formData.value.tiempo_fin = `${fecha} ${horaFin.value}`
  }
}

// Actualizar hora fin
function actualizarHoraFin(hora) {
  horaFin.value = hora
  if (fechaFin.value && hora) {
    formData.value.tiempo_fin = `${fechaFin.value} ${hora}`
  } else if (hora && !fechaFin.value) {
    const hoy = new Date()
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    fechaFin.value = fechaHoy
    formData.value.tiempo_fin = `${fechaHoy} ${hora}`
  }
}

// Función auxiliar para obtener ID
function obtenerId(obj, camposPosibles = ['id']) {
  if (!obj) return null
  if (typeof obj === 'number') return obj
  
  for (const campo of camposPosibles) {
    if (obj[campo] !== undefined && obj[campo] !== null) {
      return obj[campo]
    }
  }
  return null
}

// Función auxiliar para obtener objeto completo
function obtenerObjeto(obj) {
  if (!obj) return null
  if (typeof obj === 'number') {
    return null
  }
  if (typeof obj === 'object') {
    return obj
  }
  return null
}

// Función para obtener nombre completo del usuario
function obtenerNombreCompleto(usuario) {
  if (!usuario) return ''
  // Si tiene nombre_completo, usarlo
  if (usuario.nombre_completo) {
    return usuario.nombre_completo
  }
  // Si tiene nombre y apellido, combinarlos
  if (usuario.nombre && usuario.apellido) {
    return `${usuario.nombre} ${usuario.apellido}`.trim()
  }
  // Si solo tiene nombre
  if (usuario.nombre) {
    return usuario.nombre
  }
  // Si tiene first_name y last_name
  if (usuario.first_name && usuario.last_name) {
    return `${usuario.first_name} ${usuario.last_name}`.trim()
  }
  // Si solo tiene first_name
  if (usuario.first_name) {
    return usuario.first_name
  }
  // Fallback a username
  return usuario.username || 'Sin nombre'
}

// Cargar datos iniciales
async function cargarDatos() {
  try {
    const usuariosData = await controlhorasService.getUsuariosAsignados()
    
    usuariosCompletos.value = usuariosData
    
    // Inicializar opciones
    opcionesUsuarios.value = []
  } catch (error) {
    console.error('Error al cargar datos:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: 'Error al cargar datos del formulario'
    })
  }
}

// Cargar datos del control de hora en el formulario (modo editar)
function cargarDatosControlHora() {
  if (!props.controlHora) {
    return
  }

  const controlHora = props.controlHora

  console.log('📋 Cargando control de hora en formulario:', JSON.stringify(controlHora, null, 2))

  // Obtener ID del usuario según el serializer
  // El serializer tiene: userbase (objeto), usuario_id (read_only), usuario_nombre (read_only)
  let userbaseId = null
  if (controlHora.usuario_id) {
    // Priorizar usuario_id del serializer (más confiable)
    userbaseId = controlHora.usuario_id
  } else if (controlHora.userbase) {
    // Si viene el objeto userbase, extraer el ID
    userbaseId = obtenerId(controlHora.userbase, ['id', 'userbase_id'])
  }

  // Tiempos (datetime)
  const tiempoInicio = controlHora.tiempo_inicio ? formatearDateTime(controlHora.tiempo_inicio) : null
  const tiempoFin = controlHora.tiempo_fin ? formatearDateTime(controlHora.tiempo_fin) : null

  formData.value = {
    userbase: userbaseId,
    tiempo_inicio: tiempoInicio,
    tiempo_fin: tiempoFin
  }

  // Actualizar variables de los pickers
  if (tiempoInicio) {
    const partesInicio = tiempoInicio.split(' ')
    fechaInicio.value = partesInicio[0] || null
    horaInicio.value = partesInicio[1] || null
  } else {
    fechaInicio.value = null
    horaInicio.value = null
  }

  if (tiempoFin) {
    const partesFin = tiempoFin.split(' ')
    fechaFin.value = partesFin[0] || null
    horaFin.value = partesFin[1] || null
  } else {
    fechaFin.value = null
    horaFin.value = null
  }

  console.log('✅ Datos cargados en formulario:', formData.value)
  console.log('🔍 Userbase ID encontrado:', userbaseId)

  // Cargar opciones iniciales si hay valores
  setTimeout(() => {
    if (userbaseId) {
      // Intentar obtener el objeto userbase del serializer
      const userbaseObj = obtenerObjeto(controlHora.userbase)
      if (userbaseObj) {
        opcionesUsuarios.value = [userbaseObj]
        console.log('✅ Userbase encontrado desde objeto userbase:', userbaseObj)
      } else if (usuariosCompletos.value.length > 0) {
        // Buscar en la lista completa de usuarios
        const encontrado = usuariosCompletos.value.find(u => 
          u.id === userbaseId || u.userbase_id === userbaseId || u.usuario_id === userbaseId
        )
        if (encontrado) {
          opcionesUsuarios.value = [encontrado]
          console.log('✅ Userbase encontrado en lista completa:', encontrado)
        } else {
          console.warn('⚠️ Userbase no encontrado en lista completa. ID buscado:', userbaseId)
          console.warn('📋 IDs disponibles:', usuariosCompletos.value.map(u => ({ id: u.id, userbase_id: u.userbase_id, usuario_id: u.usuario_id })))
        }
      } else {
        console.warn('⚠️ Lista de usuarios aún no cargada')
      }
    } else {
      console.warn('⚠️ No se encontró userbase ID en el control de hora')
      console.warn('📋 Datos de controlHora:', { 
        usuario_id: controlHora.usuario_id, 
        userbase: controlHora.userbase
      })
    }
  }, 100)
}

// Métodos de filtrado
function filterUsuarios(val, update) {
  update(() => {
    if (!val || val === '') {
      opcionesUsuarios.value = usuariosCompletos.value.slice(0, 20)
    } else {
      const needle = val.toLowerCase()
      opcionesUsuarios.value = usuariosCompletos.value.filter(
        usr => {
          const nombreCompleto = obtenerNombreCompleto(usr).toLowerCase()
          return nombreCompleto.includes(needle) ||
                 usr.nombre?.toLowerCase().includes(needle) ||
                 usr.apellido?.toLowerCase().includes(needle) ||
                 usr.first_name?.toLowerCase().includes(needle) ||
                 usr.last_name?.toLowerCase().includes(needle) ||
                 usr.username?.toLowerCase().includes(needle)
        }
      ).slice(0, 20)
    }
  })
}


// Guardar formulario
async function guardar() {
  guardando.value = true

  try {
    // Validar campos requeridos
    if (!formData.value.userbase) {
      throw new Error('El usuario es requerido')
    }
    if (!formData.value.tiempo_inicio || !validarDateTime(formData.value.tiempo_inicio)) {
      throw new Error('El tiempo de inicio es requerido y debe tener formato YYYY-MM-DD HH:MM:SS')
    }
    // tiempo_fin es opcional, solo validar si se proporciona
    if (formData.value.tiempo_fin && !validarDateTime(formData.value.tiempo_fin)) {
      throw new Error('El tiempo de fin debe tener formato YYYY-MM-DD HH:MM:SS')
    }

    // Preparar datos según el formato de la API
    // El backend espera userbase_id, fecha (requerido) y datetime ISO para tiempo_inicio y tiempo_fin
    const tiempoInicioISO = datetimeAISO(formData.value.tiempo_inicio)
    
    // Extraer la fecha del tiempo_inicio para enviarla como campo fecha (requerido por el backend)
    // El backend espera fecha en formato datetime también
    const datosParaBackend = {
      userbase_id: formData.value.userbase,
      fecha: tiempoInicioISO, // El backend requiere fecha además de tiempo_inicio
      tiempo_inicio: tiempoInicioISO
    }

    // tiempo_fin es opcional, solo enviar si se proporciona
    if (formData.value.tiempo_fin) {
      datosParaBackend.tiempo_fin = datetimeAISO(formData.value.tiempo_fin)
    }

    if (esModoEdicion.value) {
      if (!props.controlHora.id) {
        throw new Error('No se puede editar: falta el ID del control de hora')
      }

      console.log('📤 Enviando datos al backend para actualizar:', datosParaBackend)
      const resultado = await controlhorasService.patchControlHora(controlHoraId.value, datosParaBackend)
      
      console.log('✅ Respuesta del backend:', resultado)
      
      $q.notify({
        type: 'positive',
        message: 'Control de hora actualizado exitosamente',
        position: 'top',
        timeout: 3000
      })
      
      emit('guardado', resultado)
    } else {
      console.log('📤 Enviando datos al backend para crear:', datosParaBackend)
      const resultado = await controlhorasService.createControlHora(datosParaBackend)
      
      console.log('✅ Respuesta del backend:', resultado)
      
      $q.notify({
        type: 'positive',
        message: 'Control de hora creado exitosamente',
        position: 'top',
        timeout: 3000
      })
      
      emit('guardado', resultado)
    }

    cerrarFormulario()
  } catch (error) {
    console.error(`❌ Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} control de hora:`, error)
    console.error('Detalles del error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    let mensajeError = `Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} el control de hora`
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 400) {
        mensajeError = data.detail || data.message || 'Error en los datos proporcionados. Verifica todos los campos requeridos.'
      } else if (status === 404) {
        mensajeError = esModoEdicion.value ? 'Control de hora no encontrado' : 'Usuario no encontrado'
      } else if (status === 401) {
        mensajeError = 'No autenticado. Por favor, inicia sesión nuevamente.'
      } else if (status === 403) {
        mensajeError = `No tienes permisos para ${esModoEdicion.value ? 'editar' : 'crear'} este control de hora`
      } else {
        mensajeError = data.detail || data.message || `Error ${status}: Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} el control de hora`
      }
    } else if (error.message) {
      mensajeError = error.message
    }

    $q.notify({
      type: 'negative',
      message: mensajeError,
      position: 'top',
      timeout: 5000,
      actions: [{ icon: 'close', color: 'white' }]
    })
  } finally {
    guardando.value = false
  }
}

// Resetear formulario
function resetearFormulario() {
  if (esModoEdicion.value && props.controlHora) {
    cargarDatosControlHora()
  } else {
    formData.value = {
      userbase: null,
      tiempo_inicio: null,
      tiempo_fin: null
    }
    // Resetear variables de los pickers
    fechaInicio.value = null
    horaInicio.value = null
    fechaFin.value = null
    horaFin.value = null
  }
}

// Cerrar formulario
function cerrarFormulario() {
  emit('update:modelValue', false)
  emit('cancelado')
  resetearFormulario()
}

// Watch para cargar datos cuando se abre el modal o cambia el control de hora
watch(() => props.modelValue, async (nuevoValor) => {
  if (nuevoValor) {
    await cargarDatos()
    if (esModoEdicion.value) {
      setTimeout(() => {
        cargarDatosControlHora()
      }, 200)
    } else {
      // Establecer datetime de inicio por defecto a ahora solo en modo creación
      const ahora = new Date()
      const datetimeInicio = formatearDateTime(ahora.toISOString())
      formData.value.tiempo_inicio = datetimeInicio
      if (datetimeInicio) {
        const partes = datetimeInicio.split(' ')
        fechaInicio.value = partes[0] || null
        horaInicio.value = partes[1] || null
      }
    }
  }
})

watch(() => props.controlHora, (nuevoControlHora) => {
  if (nuevoControlHora && props.modelValue) {
    if (usuariosCompletos.value.length > 0) {
      cargarDatosControlHora()
    } else {
      setTimeout(() => {
        cargarDatosControlHora()
      }, 200)
    }
  }
}, { deep: true })

onMounted(async () => {
  if (props.modelValue) {
    await cargarDatos()
    if (esModoEdicion.value) {
      setTimeout(() => {
        cargarDatosControlHora()
      }, 200)
    } else {
      // Establecer datetime de inicio por defecto a ahora solo en modo creación
      const ahora = new Date()
      const datetimeInicio = formatearDateTime(ahora.toISOString())
      formData.value.tiempo_inicio = datetimeInicio
      if (datetimeInicio) {
        const partes = datetimeInicio.split(' ')
        fechaInicio.value = partes[0] || null
        horaInicio.value = partes[1] || null
      }
    }
  }
})
</script>

<style scoped>
.q-card {
  max-width: 1200px;
  width: 100%;
}

@media (max-width: 600px) {
  .q-card {
    max-width: 100%;
  }
}
</style>
