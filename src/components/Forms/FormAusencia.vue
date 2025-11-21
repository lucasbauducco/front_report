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
          <div class="text-h6">{{ esModoEdicion ? 'Editar Ausencia' : 'Crear Ausencia' }}</div>
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
            <!-- Usuario (opcional) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.usuario"
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
                hint="Usuario (opcional - si no se selecciona, se usa el usuario autenticado)"
                clearable
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

            <!-- Tipo de ausencia* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.tipo_ausencia"
                :options="tiposAusencia"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                hint="Tipo de ausencia*"
                :rules="[val => !!val || 'El tipo de ausencia es requerido']"
              />
            </div>

            <!-- Motivo* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.motivo"
                :options="motivos"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                hint="Motivo*"
                :rules="[val => !!val || 'El motivo es requerido']"
              />
            </div>

            <!-- Cantidad de horas (solo para ausencia parcial) -->
            <div v-if="formData.tipo_ausencia === 'parcial'" class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model.number="formData.cantidad_horas"
                type="number"
                step="0.01"
                min="0"
                hint="Cantidad de horas* (requerido para ausencia parcial)"
                :rules="[
                  val => (formData.tipo_ausencia !== 'parcial' || (val !== null && val !== undefined && val !== '')) || 'La cantidad de horas es requerida para ausencia parcial',
                  val => (formData.tipo_ausencia !== 'parcial' || val >= 0) || 'La cantidad de horas debe ser mayor o igual a 0'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="schedule" />
                </template>
              </q-input>
            </div>

            <!-- Cantidad de minutos (opcional, solo para ausencia parcial) -->
            <div v-if="formData.tipo_ausencia === 'parcial'" class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model.number="formData.cantidad_minutos"
                type="number"
                step="1"
                min="0"
                max="59"
                hint="Minutos adicionales (opcional, 0-59)"
                :rules="[
                  val => val === null || val === undefined || val === '' || (val >= 0 && val <= 59) || 'Los minutos deben estar entre 0 y 59'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="timer" />
                </template>
              </q-input>
            </div>

            <!-- Fecha Desde* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model="formData.fecha_desde"
                mask="####-##-##"
                hint="Fecha Desde* (YYYY-MM-DD)"
                :rules="[
                  val => !!val || 'La fecha desde es requerida',
                  val => validarFecha(val) || 'Formato inválido. Use YYYY-MM-DD'
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="formData.fecha_desde"
                        mask="YYYY-MM-DD"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Información de horas faltantes -->
            <AusenciaHorasbanner 
              :fecha="formData.fecha_desde"
              :usuario-id="formData.usuario"
            />

            <!-- Checkbox: Ausencia mayor a un día -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-checkbox
                v-model="masDeUnDia"
                label="Ausencia mayor a un día"
                class="q-mt-md"
              />
            </div>

            <!-- Fecha Hasta, habilitada solo si el checkbox está marcado -->
            <div v-if="masDeUnDia" class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model="formData.fecha_hasta"
                mask="####-##-##"
                hint="Fecha Hasta* (YYYY-MM-DD)"
                :rules="[
                  val => (masDeUnDia ? !!val : true) || 'La fecha hasta es requerida',
                  val => (masDeUnDia ? validarFecha(val) : true) || 'Formato inválido. Use YYYY-MM-DD',
                  val => validarRangoFechas() || 'La fecha hasta debe ser mayor o igual a la fecha desde'
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="formData.fecha_hasta"
                        mask="YYYY-MM-DD"
                        :min="formData.fecha_desde"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Estado activo (solo en modo edición) -->
            <div v-if="esModoEdicion" class="col-12 col-sm-6 col-md-4">
              <q-checkbox
                v-model="formData.activo"
                label="Activo"
                class="q-mt-md"
              />
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="row justify-start q-gutter-md q-mt-md">
            <q-btn
              :label="esModoEdicion ? 'Guardar Cambios' : 'Crear Ausencia'"
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
import { ausenciasService } from 'src/services/ausencias.service'
import { user_detail } from 'src/utils/auth'
import AusenciaHorasbanner from 'src/components/Banners/AusenciaHorasbanner.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  ausencia: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'guardado', 'cancelado'])

const $q = useQuasar()

// Computed para determinar si está en modo edición
const esModoEdicion = computed(() => !!props.ausencia && !!props.ausencia.id)

// Estado del formulario
const guardando = ref(false)
const masDeUnDia = ref(false)

// Datos del formulario
const formData = ref({
  usuario: null,
  tipo_ausencia: null,
  motivo: null,
  fecha_desde: null,
  fecha_hasta: null,
  cantidad_horas: null,
  cantidad_minutos: null,
  activo: true
})

// Opciones para selects
const opcionesUsuarios = ref([])

// Datos completos para filtrado
const usuariosCompletos = ref([])

// Opciones de tipos de ausencia
const tiposAusencia = [
  { value: 'parcial', label: 'Parcial' },
  { value: 'completo', label: 'Completo' }
]

// Opciones de motivos (se cargan desde el backend)
const motivos = ref([])

// Función para obtener nombre completo del usuario (sin cambios)
function obtenerNombreCompleto(usuario) {
  if (!usuario) return ''
  if (usuario.nombre_completo) {
    return usuario.nombre_completo
  }
  if (usuario.nombre && usuario.apellido) {
    return `${usuario.nombre} ${usuario.apellido}`.trim()
  }
  if (usuario.nombre) {
    return usuario.nombre
  }
  if (usuario.first_name && usuario.last_name) {
    return `${usuario.first_name} ${usuario.last_name}`.trim()
  }
  if (usuario.first_name) {
    return usuario.first_name
  }
  return usuario.username || 'Sin nombre'
}

// Formatear fecha a YYYY-MM-DD si es necesario
function formatearFecha(fecha) {
  if (!fecha) return null
  if (typeof fecha === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha
    const date = new Date(fecha)
    if (!isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  }
  return null
}

// Validar formato de fecha YYYY-MM-DD
function validarFecha(fecha) {
  if (!fecha) return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(fecha)) return false

  const partes = fecha.split('-')
  const anio = parseInt(partes[0])
  const mes = parseInt(partes[1])
  const dia = parseInt(partes[2])

  if (mes < 1 || mes > 12) return false
  if (dia < 1 || dia > 31) return false

  const fechaObj = new Date(anio, mes - 1, dia)
  return fechaObj.getFullYear() === anio &&
         fechaObj.getMonth() === mes - 1 &&
         fechaObj.getDate() === dia
}

// Validar rango de fechas
function validarRangoFechas() {
  if (!masDeUnDia.value || !formData.value.fecha_desde || !formData.value.fecha_hasta) {
    return true
  }
  const fechaDesde = new Date(formData.value.fecha_desde)
  const fechaHasta = new Date(formData.value.fecha_hasta)
  return fechaHasta >= fechaDesde
}

// Cargar datos iniciales
async function cargarDatos() {
  try {
    const [usuariosData, motivosData] = await Promise.all([
      ausenciasService.getUsuariosAsignados(),
      ausenciasService.getMotivosAusencia()
    ])
    usuariosCompletos.value = usuariosData

    motivos.value = motivosData.map(motivo => {
      if (motivo.value !== undefined && motivo.label !== undefined) {
        return motivo
      } else if (motivo.id !== undefined) {
        return {
          value: motivo.id,
          label: motivo.titulo || motivo.nombre || motivo.descripcion || `Motivo ${motivo.id}`
        }
      } else {
        return motivo
      }
    })

    // Pre-cargar el usuario logeado en las opciones si no está en modo edición
    if (!esModoEdicion.value && user_detail.value && user_detail.value.id) {
      const usuarioLogeado = usuariosCompletos.value.find(u => 
        u.id === user_detail.value.id || 
        u.userbase_id === user_detail.value.id ||
        u.usuario_id === user_detail.value.id
      )
      if (usuarioLogeado) {
        opcionesUsuarios.value = [usuarioLogeado]
      } else {
        opcionesUsuarios.value = []
      }
    } else {
      opcionesUsuarios.value = []
    }
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

// Cargar datos de la ausencia a editar (eliminando redundancia según el Serializer)
function cargarDatosAusencia() {
  if (!props.ausencia) return
  const ausencia = props.ausencia

  // El serializer ya trae usuario_id, motivo y tipo_ausencia como valores directos (ver contexto)
  formData.value.usuario = ausencia.usuario_id ?? null
  formData.value.tipo_ausencia = ausencia.tipo_ausencia ?? null
  formData.value.motivo = ausencia.motivo ?? null

  // Cantidad de horas y minutos ya llegan, solo mapear si corresponde
  if (ausencia.tipo_ausencia === 'parcial') {
    formData.value.cantidad_horas = ausencia.cantidad_horas != null ? parseFloat(ausencia.cantidad_horas) : null
    // Prefiere ausencia.cantidad_minutos porque el serializer lo computa
    formData.value.cantidad_minutos =
      ausencia.cantidad_minutos != null ? ausencia.cantidad_minutos : null
  } else {
    formData.value.cantidad_horas = null
    formData.value.cantidad_minutos = null
  }

  formData.value.fecha_desde = formatearFecha(ausencia.fecha_desde)
  formData.value.fecha_hasta = formatearFecha(ausencia.fecha_hasta)
  masDeUnDia.value = !!formData.value.fecha_hasta

  formData.value.activo = ausencia.activo !== undefined ? ausencia.activo : true

  // OpcionesUsuarios: pre-cargar la opción seleccionada si está en la lista de usuarios completos
  setTimeout(() => {
    if (formData.value.usuario && usuariosCompletos.value.length > 0) {
      const encontrado = usuariosCompletos.value.find(u =>
        u.id === formData.value.usuario ||
        u.userbase_id === formData.value.usuario ||
        u.usuario_id === formData.value.usuario
      )
      if (encontrado) {
        opcionesUsuarios.value = [encontrado]
      }
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
      opcionesUsuarios.value = usuariosCompletos.value.filter(usr => {
        const nombreCompleto = obtenerNombreCompleto(usr).toLowerCase()
        return nombreCompleto.includes(needle) ||
               usr.nombre?.toLowerCase().includes(needle) ||
               usr.apellido?.toLowerCase().includes(needle) ||
               usr.first_name?.toLowerCase().includes(needle) ||
               usr.last_name?.toLowerCase().includes(needle) ||
               usr.username?.toLowerCase().includes(needle)
      }).slice(0, 20)
    }
  })
}

// Guardar formulario
async function guardar() {
  guardando.value = true

  try {
    // Validar campos requeridos antes de enviar
    if (!formData.value.tipo_ausencia) throw new Error('El tipo de ausencia es requerido')
    if (!formData.value.motivo) throw new Error('El motivo es requerido')
    if (!formData.value.fecha_desde || !validarFecha(formData.value.fecha_desde)) {
      throw new Error('La fecha desde es requerida y debe tener formato YYYY-MM-DD')
    }
    if (masDeUnDia.value && (!formData.value.fecha_hasta || !validarFecha(formData.value.fecha_hasta))) {
      throw new Error('La fecha hasta es requerida cuando la ausencia es mayor a un día')
    }
    if (!validarRangoFechas()) {
      throw new Error('La fecha hasta debe ser mayor o igual a la fecha desde')
    }

    // Validar cantidad de horas para ausencia parcial
    if (formData.value.tipo_ausencia === 'parcial') {
      if (formData.value.cantidad_horas === null || formData.value.cantidad_horas === undefined || formData.value.cantidad_horas === '') {
        throw new Error('La cantidad de horas es requerida para ausencia parcial')
      }
      if (formData.value.cantidad_horas < 0) {
        throw new Error('La cantidad de horas no puede ser negativa')
      }
      if (
        formData.value.cantidad_minutos !== null &&
        formData.value.cantidad_minutos !== undefined &&
        formData.value.cantidad_minutos !== ''
      ) {
        if (formData.value.cantidad_minutos < 0 || formData.value.cantidad_minutos > 59) {
          throw new Error('Los minutos deben estar entre 0 y 59')
        }
      }
    }

    // Preparar datos según el formato de la API
    // usuario y motivo son IDs según el serializer
    let usuarioId = null
    if (formData.value.usuario) {
      usuarioId = typeof formData.value.usuario === 'object' && formData.value.usuario.id
        ? formData.value.usuario.id
        : formData.value.usuario
    }

    let motivoId = null
    if (formData.value.motivo) {
      motivoId = typeof formData.value.motivo === 'object' && (formData.value.motivo.value || formData.value.motivo.id)
        ? formData.value.motivo.value ?? formData.value.motivo.id
        : formData.value.motivo
    }

    const datosParaBackend = {
      tipo_ausencia: formData.value.tipo_ausencia,
      motivo_id: motivoId,
      fecha_desde: formData.value.fecha_desde
    }

    if (usuarioId) datosParaBackend.userbase_id = usuarioId

    if (masDeUnDia.value && formData.value.fecha_hasta) {
      datosParaBackend.fecha_hasta = formData.value.fecha_hasta
    } else if (esModoEdicion.value) {
      datosParaBackend.fecha_hasta = null
    }

    if (formData.value.tipo_ausencia === 'parcial') {
      if (formData.value.cantidad_horas !== null && formData.value.cantidad_horas !== undefined) {
        datosParaBackend.cantidad_horas = parseFloat(formData.value.cantidad_horas)
      }
      if (
        formData.value.cantidad_minutos !== null &&
        formData.value.cantidad_minutos !== undefined &&
        formData.value.cantidad_minutos !== ''
      ) {
        datosParaBackend.cantidad_minutos = parseInt(formData.value.cantidad_minutos)
      }
    }

    if (esModoEdicion.value) {
      datosParaBackend.activo = formData.value.activo

      if (!props.ausencia.id) throw new Error('No se puede editar: falta el ID de la ausencia')

      const resultado = await ausenciasService.patchAusencias(props.ausencia.id, datosParaBackend)
      $q.notify({
        type: 'positive',
        message: 'Ausencia actualizada exitosamente',
        position: 'top',
        timeout: 3000
      })
      emit('guardado', resultado)
    } else {
      const resultado = await ausenciasService.createAusencias(datosParaBackend)
      $q.notify({
        type: 'positive',
        message: 'Ausencia creada exitosamente',
        position: 'top',
        timeout: 3000
      })
      emit('guardado', resultado)
    }

    cerrarFormulario()
  } catch (error) {
    let mensajeError = `Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} la ausencia`
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      if (status === 400) {
        mensajeError = data.detail || data.message || 'Error en los datos proporcionados. Verifica todos los campos requeridos.'
        if (data.userbase_id || data.usuario) {
          const usuarioError = data.userbase_id || data.usuario
          mensajeError += `\nUsuario: ${Array.isArray(usuarioError) ? usuarioError.join(', ') : usuarioError}`
        }
        if (data.fecha_desde) {
          mensajeError += `\nFecha desde: ${Array.isArray(data.fecha_desde) ? data.fecha_desde.join(', ') : data.fecha_desde}`
        }
        if (data.fecha_hasta) {
          mensajeError += `\nFecha hasta: ${Array.isArray(data.fecha_hasta) ? data.fecha_hasta.join(', ') : data.fecha_hasta}`
        }
        if (data.tipo_ausencia) {
          mensajeError += `\nTipo de ausencia: ${Array.isArray(data.tipo_ausencia) ? data.tipo_ausencia.join(', ') : data.tipo_ausencia}`
        }
        if (data.motivo_id || data.motivo) {
          const motivoError = data.motivo_id || data.motivo
          mensajeError += `\nMotivo: ${Array.isArray(motivoError) ? motivoError.join(', ') : motivoError}`
        }
        if (data.cantidad_horas) {
          mensajeError += `\nCantidad de horas: ${Array.isArray(data.cantidad_horas) ? data.cantidad_horas.join(', ') : data.cantidad_horas}`
        }
        if (data.cantidad_minutos) {
          mensajeError += `\nCantidad de minutos: ${Array.isArray(data.cantidad_minutos) ? data.cantidad_minutos.join(', ') : data.cantidad_minutos}`
        }
      } else if (status === 404) {
        mensajeError = esModoEdicion.value ? 'Ausencia no encontrada' : 'Usuario no encontrado'
      } else if (status === 401) {
        mensajeError = 'No autenticado. Por favor, inicia sesión nuevamente.'
      } else if (status === 403) {
        mensajeError = `No tienes permisos para ${esModoEdicion.value ? 'editar' : 'crear'} esta ausencia`
      } else {
        mensajeError = data.detail || data.message || `Error ${status}: Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} la ausencia`
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
  formData.value = {
    usuario: null,
    tipo_ausencia: null,
    motivo: null,
    fecha_desde: null,
    fecha_hasta: null,
    cantidad_horas: null,
    cantidad_minutos: null,
    activo: true
  }
  masDeUnDia.value = false
  if (props.ausencia) {
    cargarDatosAusencia()
  }
}

// Cerrar formulario
function cerrarFormulario() {
  emit('update:modelValue', false)
  emit('cancelado')
  resetearFormulario()
}

// Watch para limpiar fecha_hasta cuando se desmarca el checkbox
watch(masDeUnDia, (nuevo) => {
  if (!nuevo) {
    formData.value.fecha_hasta = null
  }
})

// Watch para limpiar cantidad_horas y cantidad_minutos cuando cambia el tipo de ausencia
watch(() => formData.value.tipo_ausencia, (nuevoTipo) => {
  if (nuevoTipo !== 'parcial') {
    formData.value.cantidad_horas = null
    formData.value.cantidad_minutos = null
  }
})


// Watch para cargar datos cuando se abre el modal o cambia la ausencia
watch(() => props.modelValue, async (nuevoValor) => {
  if (nuevoValor) {
    await cargarDatos()
    if (esModoEdicion.value) {
      setTimeout(() => {
        cargarDatosAusencia()
      }, 200)
    } else {
      // Establecer fecha de hoy
      const hoy = new Date()
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
      formData.value.fecha_desde = fechaHoy
      
      // Establecer usuario logeado por defecto
      if (user_detail.value && user_detail.value.id) {
        formData.value.usuario = user_detail.value.id
      }
    }
  }
})

watch(() => props.ausencia, (nuevaAusencia) => {
  if (nuevaAusencia && props.modelValue) {
    if (usuariosCompletos.value.length > 0) {
      cargarDatosAusencia()
    } else {
      setTimeout(() => {
        cargarDatosAusencia()
      }, 200)
    }
  }
}, { deep: true })

onMounted(async () => {
  if (props.modelValue) {
    await cargarDatos()
    if (esModoEdicion.value) {
      setTimeout(() => {
        cargarDatosAusencia()
      }, 200)
    } else {
      // Establecer fecha de hoy
      const hoy = new Date()
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
      formData.value.fecha_desde = fechaHoy
      
      // Establecer usuario logeado por defecto
      if (user_detail.value && user_detail.value.id) {
        formData.value.usuario = user_detail.value.id
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

