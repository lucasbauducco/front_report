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
          <div class="text-h6">Crear Registro(s) de Horas</div>
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
            <!-- Año contable -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.ano_contable"
                :options="aniosOpciones"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                hint="Año contable*"
                :rules="[val => !!val || 'El año contable es requerido']"
              />
            </div>

            <!-- Usuario (opcional) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.userbase_id"
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                :options="opcionesUsuarios"
                @filter="filterUsuarios"
                option-value="id"
                option-label="nombre"
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

            <!-- Sucursal* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.sucursal_id"
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                :options="opcionesSucursales"
                @filter="filterSucursales"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                hint="Sucursal*"
                :rules="[val => !!val || 'La sucursal es requerida']"
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

            <!-- Subempresas* (múltiple selección) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.empresas_id"
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                :options="opcionesEmpresas"
                @filter="filterEmpresas"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                multiple
                hint="Subempresas* (seleccione una o más - las horas se dividirán equitativamente)"
                :rules="[
                  val => (val && val.length > 0) || 'Debe seleccionar al menos una subempresa'
                ]"
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

            <!-- Fecha* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model="formData.fecha"
                mask="####-##-##"
                hint="Fecha* (YYYY-MM-DD)"
                :rules="[
                  val => !!val || 'La fecha es requerida',
                  val => validarFecha(val) || 'Formato inválido. Use YYYY-MM-DD'
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="formData.fecha"
                        mask="YYYY-MM-DD"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Tarea* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.tarea_id"
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                :options="opcionesTareas"
                @filter="filterTareas"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                hint="Tarea*"
                :rules="[val => !!val || 'La tarea es requerida']"
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

            <!-- Cantidad de horas* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model.number="formData.cantidad_horas"
                type="number"
                step="0.01"
                min="0"
                hint="Cantidad de horas* (número)"
                :rules="[
                  val => val !== null && val !== undefined && val !== '' || 'La cantidad de horas es requerida',
                  val => val >= 0 || 'La cantidad de horas debe ser mayor o igual a 0'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="schedule" />
                </template>
              </q-input>
            </div>

            <!-- Cantidad de minutos (opcional) -->
            <div class="col-12 col-sm-6 col-md-4">
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
          </div>

          <!-- Resumen de horas por subempresa -->
          <q-banner
            v-if="formData.empresas_id && formData.empresas_id.length > 0 && formData.cantidad_horas"
            class="bg-info text-white q-mt-md"
          >
            <template v-slot:avatar>
              <q-icon name="info" />
            </template>
            <div class="text-weight-bold">Resumen de distribución de horas:</div>
            <div class="q-mt-sm">
              Total de horas: <strong>{{ totalHorasFormateado }}</strong>
              <br>
              Se crearán <strong>{{ formData.empresas_id.length }}</strong> registro(s) de <strong>{{ horasPorSubempresa }}</strong> horas cada uno
            </div>
          </q-banner>

          <!-- Observaciones -->
          <div class="col-12">
            <q-input
              filled
              v-model="formData.observaciones"
              type="textarea"
              hint="Observaciones*"
              rows="4"
              :rules="[val => !!val || 'Las observaciones son requeridas']"
            />
          </div>

          <!-- Botones de acción -->
          <div class="row justify-start q-gutter-md q-mt-md">
            <q-btn
              label="Crear Registro(s)"
              type="submit"
              color="primary"
              icon="add"
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
import { ref, watch, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import registrosService from 'src/services/registros.service'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'guardado', 'cancelado'])

const $q = useQuasar()

// Estado del formulario
const guardando = ref(false)

// Datos del formulario
const formData = ref({
  ano_contable: new Date().getFullYear(),
  userbase_id: null,
  sucursal_id: null,
  empresas_id: [],
  fecha: null,
  tarea_id: null,
  cantidad_horas: null,
  cantidad_minutos: null,
  observaciones: ''
})

// Opciones para selects
const opcionesSucursales = ref([])
const opcionesUsuarios = ref([])
const opcionesEmpresas = ref([])
const opcionesTareas = ref([])

// Datos completos para filtrado
const sucursalesCompletas = ref([])
const usuariosCompletos = ref([])
const empresasCompletas = ref([])
const tareasCompletas = ref([])

// Opciones de años (últimos 10 años y próximos 2)
const aniosOpciones = computed(() => {
  const anioActual = new Date().getFullYear()
  const anios = []
  for (let i = anioActual - 10; i <= anioActual + 2; i++) {
    anios.push({ value: i, label: i.toString() })
  }
  return anios
})

// Calcular total de horas (horas + minutos convertidos a horas)
const totalHoras = computed(() => {
  const horas = parseFloat(formData.value.cantidad_horas) || 0
  const minutos = parseFloat(formData.value.cantidad_minutos) || 0
  return horas + (minutos / 60)
})

// Formatear total de horas
const totalHorasFormateado = computed(() => {
  const total = totalHoras.value
  const horas = Math.floor(total)
  const minutosDecimales = (total - horas) * 60
  const minutos = Math.floor(minutosDecimales)
  
  if (minutos === 0) {
    return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
  }
  return `${horas} ${horas === 1 ? 'hora' : 'horas'} y ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
})

// Calcular horas por subempresa
const horasPorSubempresa = computed(() => {
  if (!formData.value.empresas_id || formData.value.empresas_id.length === 0) {
    return '0.00'
  }
  const horasPorRegistro = totalHoras.value / formData.value.empresas_id.length
  return horasPorRegistro.toFixed(2)
})

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

// Cargar datos iniciales
async function cargarDatos() {
  try {
    const [empresasData, tareasData, usuariosData, sucursalesData] = await Promise.all([
      registrosService.getEmpresas(),
      registrosService.getTareas(),
      registrosService.getUsuariosAsignados(),
      registrosService.getSucursales().catch(() => [])
    ])

    empresasCompletas.value = empresasData
    tareasCompletas.value = tareasData
    usuariosCompletos.value = usuariosData
    sucursalesCompletas.value = sucursalesData || []

    // Inicializar opciones
    opcionesEmpresas.value = []
    opcionesTareas.value = []
    opcionesUsuarios.value = []
    opcionesSucursales.value = []
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

// Métodos de filtrado
function filterSucursales(val, update) {
  update(() => {
    if (!val || val === '') {
      opcionesSucursales.value = sucursalesCompletas.value.slice(0, 20)
    } else {
      const needle = val.toLowerCase()
      opcionesSucursales.value = sucursalesCompletas.value.filter(
        suc => suc.nombre?.toLowerCase().includes(needle)
      ).slice(0, 20)
    }
  })
}

function filterUsuarios(val, update) {
  update(() => {
    if (!val || val === '') {
      opcionesUsuarios.value = usuariosCompletos.value.slice(0, 20)
    } else {
      const needle = val.toLowerCase()
      opcionesUsuarios.value = usuariosCompletos.value.filter(
        usr => usr.nombre?.toLowerCase().includes(needle) ||
               usr.username?.toLowerCase().includes(needle)
      ).slice(0, 20)
    }
  })
}

function filterEmpresas(val, update) {
  update(() => {
    if (!val || val === '') {
      opcionesEmpresas.value = empresasCompletas.value.slice(0, 20)
    } else {
      const needle = val.toLowerCase()
      opcionesEmpresas.value = empresasCompletas.value.filter(
        emp => emp.nombre?.toLowerCase().includes(needle)
      ).slice(0, 20)
    }
  })
}

function filterTareas(val, update) {
  update(() => {
    if (!val || val === '') {
      opcionesTareas.value = tareasCompletas.value.slice(0, 20)
    } else {
      const needle = val.toLowerCase()
      opcionesTareas.value = tareasCompletas.value.filter(
        tar => tar.nombre?.toLowerCase().includes(needle)
      ).slice(0, 20)
    }
  })
}

// Guardar formulario
async function guardar() {
  guardando.value = true

  try {
    // Validar campos requeridos antes de enviar
    if (!formData.value.sucursal_id) {
      throw new Error('La sucursal es requerida')
    }
    if (!formData.value.empresas_id || formData.value.empresas_id.length === 0) {
      throw new Error('Debe seleccionar al menos una subempresa')
    }
    if (!formData.value.fecha || !validarFecha(formData.value.fecha)) {
      throw new Error('La fecha es requerida y debe tener formato YYYY-MM-DD')
    }
    if (!formData.value.tarea_id) {
      throw new Error('La tarea es requerida')
    }
    if (formData.value.cantidad_horas === null || formData.value.cantidad_horas === undefined || formData.value.cantidad_horas === '') {
      throw new Error('La cantidad de horas es requerida')
    }
    if (formData.value.cantidad_horas < 0) {
      throw new Error('La cantidad de horas debe ser mayor o igual a 0')
    }
    if (formData.value.cantidad_minutos !== null && formData.value.cantidad_minutos !== undefined && formData.value.cantidad_minutos !== '') {
      if (formData.value.cantidad_minutos < 0 || formData.value.cantidad_minutos > 59) {
        throw new Error('Los minutos deben estar entre 0 y 59')
      }
    }
    if (!formData.value.observaciones) {
      throw new Error('Las observaciones son requeridas')
    }

    // Preparar datos según el formato de la API
    const datosParaBackend = {
      sucursal_id: formData.value.sucursal_id,
      empresas_id: formData.value.empresas_id,
      fecha: formData.value.fecha,
      tarea_id: formData.value.tarea_id,
      cantidad_horas: parseFloat(formData.value.cantidad_horas),
      observaciones: formData.value.observaciones,
      ano_contable: parseInt(formData.value.ano_contable)
    }

    // Campos opcionales
    if (formData.value.userbase_id) {
      datosParaBackend.userbase_id = formData.value.userbase_id
    }

    if (formData.value.cantidad_minutos !== null && formData.value.cantidad_minutos !== undefined && formData.value.cantidad_minutos !== '') {
      datosParaBackend.cantidad_minutos = parseInt(formData.value.cantidad_minutos)
    }

    console.log('📤 Enviando datos al backend:', datosParaBackend)

    const resultado = await registrosService.createRegistro(datosParaBackend)

    console.log('✅ Respuesta del backend:', resultado)

    // Mostrar mensaje de éxito con información sobre los registros creados
    let mensaje = `Registro(s) creado(s) exitosamente`
    if (resultado.count) {
      mensaje = `${resultado.count} registro(s) creado(s) exitosamente`
    }

    // Si hay advertencias, mostrarlas
    if (resultado.advertencias && resultado.advertencias.length > 0) {
      $q.notify({
        type: 'warning',
        message: mensaje,
        caption: resultado.advertencias.join(', '),
        position: 'top',
        timeout: 5000
      })
    } else {
      $q.notify({
        type: 'positive',
        message: mensaje,
        position: 'top',
        timeout: 3000
      })
    }

    emit('guardado', resultado)
    cerrarFormulario()
  } catch (error) {
    console.error('❌ Error al crear registro:', error)
    console.error('Detalles del error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    let mensajeError = 'Error al crear el registro'
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 400) {
        // Error en los datos proporcionados
        mensajeError = data.detail || data.message || 'Error en los datos proporcionados. Verifica todos los campos requeridos.'
        
        // Si hay errores específicos de campos, mostrarlos
        if (data.empresas_id) {
          mensajeError += `\nSubempresas: ${Array.isArray(data.empresas_id) ? data.empresas_id.join(', ') : data.empresas_id}`
        }
        if (data.cantidad_horas) {
          mensajeError += `\nCantidad de horas: ${Array.isArray(data.cantidad_horas) ? data.cantidad_horas.join(', ') : data.cantidad_horas}`
        }
        if (data.fecha) {
          mensajeError += `\nFecha: ${Array.isArray(data.fecha) ? data.fecha.join(', ') : data.fecha}`
        }
      } else if (status === 404) {
        mensajeError = 'Usuario no encontrado'
      } else if (status === 401) {
        mensajeError = 'No autenticado. Por favor, inicia sesión nuevamente.'
      } else if (status === 403) {
        mensajeError = 'No tienes permisos para crear este registro'
      } else {
        mensajeError = data.detail || data.message || `Error ${status}: Error al crear el registro`
      }
    } else if (error.message) {
      // Error de validación del frontend
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
    ano_contable: new Date().getFullYear(),
    userbase_id: null,
    sucursal_id: null,
    empresas_id: [],
    fecha: null,
    tarea_id: null,
    cantidad_horas: null,
    cantidad_minutos: null,
    observaciones: ''
  }
}

// Cerrar formulario
function cerrarFormulario() {
  emit('update:modelValue', false)
  emit('cancelado')
  resetearFormulario()
}

// Watch para cargar datos cuando se abre el modal
watch(() => props.modelValue, async (nuevoValor) => {
  if (nuevoValor) {
    await cargarDatos()
    // Establecer fecha por defecto a hoy
    const hoy = new Date()
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    formData.value.fecha = fechaHoy
  }
})

onMounted(async () => {
  if (props.modelValue) {
    await cargarDatos()
    // Establecer fecha por defecto a hoy
    const hoy = new Date()
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    formData.value.fecha = fechaHoy
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

