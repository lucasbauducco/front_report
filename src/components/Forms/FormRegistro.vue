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
            {{ esModoEdicion ? `Editar Registro ID ${registroId || 'Nuevo'}` : 'Crear Registro(s) de Horas' }}
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

            <!-- Usuario (opcional en crear, requerido en editar) -->
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
                :option-label="(usr) => obtenerNombreCompleto(usr)"
                emit-value
                map-options
                :hint="esModoEdicion ? 'Usuario*' : 'Usuario (opcional - si no se selecciona, se usa el usuario autenticado)'"
                :rules="esModoEdicion ? [val => !!val || 'El usuario es requerido'] : []"
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

            <!-- Subempresas* (múltiple en crear, single en editar) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                v-if="!esModoEdicion"
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
              
              <q-select
                v-else
                filled
                v-model="formData.empresa_id"
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
                hint="Cliente* (Subempresa)"
                :rules="[val => !!val || 'El cliente (subempresa) es requerido']"
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
                v-if="!esModoEdicion"
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
              
              <q-input
                v-else
                filled
                v-model="formData.fecha"
                mask="## / ## / ####"
                hint="Fecha*"
                :rules="[val => !!val || 'La fecha es requerida']"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="formData.fecha"
                        mask="YYYY-MM-DD"
                        @update:model-value="formatearFecha"
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

            <!-- Cantidad de horas (modo crear) -->
            <template v-if="!esModoEdicion">
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
            </template>

            <!-- Tiempo formato HH:MM:SS (modo editar) -->
            <div v-else class="col-12 col-sm-6 col-md-4">
              <q-input
                filled
                v-model="formData.tiempo_formato"
                mask="##:##:##"
                fill-mask="#"
                hint="Tiempo* (HH:MM:SS)"
                placeholder="00:00:00"
                :rules="[
                  val => !!val || 'El tiempo es requerido',
                  val => validarFormatoTiempo(val) || 'Formato inválido. Use HH:MM:SS (ej: 08:30:00)'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="access_time" />
                </template>
                <template v-slot:hint>
                  <div>
                    Formato: HH:MM:SS (ej: 08:30:00 para 8 horas 30 minutos)
                    <br>
                    <span class="text-caption text-grey-6">
                      Equivale a: {{ tiempoAFormatoTexto(formData.tiempo_formato) }}
                    </span>
                  </div>
                </template>
              </q-input>
            </div>
          </div>

          <!-- Resumen de horas por subempresa (solo en modo crear) -->
          <q-banner
            v-if="!esModoEdicion && formData.empresas_id && formData.empresas_id.length > 0 && formData.cantidad_horas"
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
              :label="esModoEdicion ? 'Guardar Cambios' : 'Crear Registro(s)'"
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
import { ref, watch, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import registrosService from 'src/services/registros.service'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  registro: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'guardado', 'cancelado'])

const $q = useQuasar()

// Computed para determinar si está en modo edición
const esModoEdicion = computed(() => !!props.registro && !!props.registro.id)
const registroId = computed(() => props.registro?.id || null)

// Estado del formulario
const guardando = ref(false)

// Datos del formulario (unificado para ambos modos)
const formData = ref({
  ano_contable: new Date().getFullYear(),
  userbase_id: null,
  sucursal_id: null,
  empresas_id: [], // Para modo crear (múltiple)
  empresa_id: null, // Para modo editar (single)
  fecha: null,
  tarea_id: null,
  cantidad_horas: null, // Para modo crear
  cantidad_minutos: null, // Para modo crear
  tiempo_formato: '00:00:00', // Para modo editar
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

// Calcular total de horas (solo para modo crear)
const totalHoras = computed(() => {
  if (esModoEdicion.value) return 0
  const horas = parseFloat(formData.value.cantidad_horas) || 0
  const minutos = parseFloat(formData.value.cantidad_minutos) || 0
  return horas + (minutos / 60)
})

// Formatear total de horas (solo para modo crear)
const totalHorasFormateado = computed(() => {
  if (esModoEdicion.value) return '0 horas'
  const total = totalHoras.value
  const horas = Math.floor(total)
  const minutosDecimales = (total - horas) * 60
  const minutos = Math.floor(minutosDecimales)
  
  if (minutos === 0) {
    return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
  }
  return `${horas} ${horas === 1 ? 'hora' : 'horas'} y ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
})

// Calcular horas por subempresa (solo para modo crear)
const horasPorSubempresa = computed(() => {
  if (esModoEdicion.value || !formData.value.empresas_id || formData.value.empresas_id.length === 0) {
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

// Validar formato de tiempo HH:MM:SS (solo para modo editar)
function validarFormatoTiempo(tiempoFormato) {
  if (!tiempoFormato || tiempoFormato === '') {
    return false
  }
  
  const regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/
  const match = tiempoFormato.match(regex)
  
  if (!match) {
    return false
  }
  
  const horas = parseInt(match[1])
  const minutos = parseInt(match[2])
  const segundos = parseInt(match[3])
  
  if (horas < 0 || horas > 23) return false
  if (minutos < 0 || minutos > 59) return false
  if (segundos < 0 || segundos > 59) return false
  
  return true
}

// Convertir tiempo formato a texto legible
function tiempoAFormatoTexto(tiempoFormato) {
  if (!tiempoFormato || tiempoFormato === '' || !validarFormatoTiempo(tiempoFormato)) {
    return '0 horas'
  }
  
  const partes = tiempoFormato.split(':').map(p => parseInt(p) || 0)
  const horas = partes[0] || 0
  const minutos = partes[1] || 0
  const segundos = partes[2] || 0
  
  let texto = ''
  
  if (horas > 0) {
    texto += `${horas} ${horas === 1 ? 'hora' : 'horas'}`
  }
  
  if (minutos > 0) {
    if (texto) texto += ' '
    texto += `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  }
  
  if (segundos > 0 && horas === 0 && minutos === 0) {
    texto += `${segundos} ${segundos === 1 ? 'segundo' : 'segundos'}`
  }
  
  return texto || '0 horas'
}

// Convertir horas decimales a formato HH:MM:SS
function decimalATiempoFormato(horasDecimales) {
  if (horasDecimales === null || horasDecimales === undefined || horasDecimales === '') {
    return '00:00:00'
  }
  
  const totalHoras = parseFloat(horasDecimales) || 0
  const horas = Math.floor(totalHoras)
  const minutosDecimales = (totalHoras - horas) * 60
  const minutos = Math.floor(minutosDecimales)
  const segundos = Math.round((minutosDecimales - minutos) * 60)
  
  const horasStr = horas.toString().padStart(2, '0')
  const minutosStr = minutos.toString().padStart(2, '0')
  const segundosStr = segundos.toString().padStart(2, '0')
  
  return `${horasStr}:${minutosStr}:${segundosStr}`
}

// Convertir formato HH:MM:SS a horas decimales
function tiempoFormatoADecimal(tiempoFormato) {
  if (!tiempoFormato || tiempoFormato === '') {
    return 0
  }
  
  const partes = tiempoFormato.split(':').map(p => parseInt(p) || 0)
  
  if (partes.length < 3) {
    return 0
  }
  
  const horas = partes[0] || 0
  const minutos = partes[1] || 0
  const segundos = partes[2] || 0
  
  return horas + (minutos / 60) + (segundos / 3600)
}

// Formatear fecha para input (modo editar: DD / MM / YYYY)
function formatearFecha(fecha) {
  if (!fecha) return
  const partes = fecha.split('-')
  if (partes.length === 3) {
    formData.value.fecha = `${partes[2]} / ${partes[1]} / ${partes[0]}`
  }
}

// Convertir fecha del input al formato YYYY-MM-DD para el backend (modo editar)
function convertirFechaParaBackend(fechaStr) {
  if (!fechaStr) return null
  const partes = fechaStr.split(' / ').filter(p => p.trim())
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`
  }
  return null
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

// Cargar datos del registro en el formulario (modo editar)
function cargarDatosRegistro() {
  if (!props.registro) {
    return
  }

  const registro = props.registro

  console.log('📋 Cargando registro en formulario:', JSON.stringify(registro, null, 2))

  // Obtener IDs
  let sucursalId = null
  let usuarioId = null
  let empresaId = null
  let tareaId = null

  // Sucursal
  if (registro.sucursal) {
    sucursalId = obtenerId(registro.sucursal)
  } else if (registro.sucursal_id) {
    sucursalId = registro.sucursal_id
  }

  // Usuario
  if (registro.usuario) {
    usuarioId = obtenerId(registro.usuario, ['id', 'userbase_id', 'usuario_id'])
  } else if (registro.usuario_id || registro.userbase_id) {
    usuarioId = registro.usuario_id || registro.userbase_id
  }

  // Subempresa
  if (registro.subempresa) {
    empresaId = obtenerId(registro.subempresa)
  } else if (registro.subempresa_id) {
    empresaId = registro.subempresa_id
  } else if (registro.empresa) {
    empresaId = obtenerId(registro.empresa)
  } else if (registro.empresa_id) {
    empresaId = registro.empresa_id
  }

  // Tarea
  if (registro.tarea) {
    tareaId = obtenerId(registro.tarea)
  } else if (registro.tarea_id || registro.subrubro_id) {
    tareaId = registro.tarea_id || registro.subrubro_id
  } else if (registro.subrubro) {
    tareaId = obtenerId(registro.subrubro)
  }

  // Convertir horas decimales a formato HH:MM:SS
  const horasDecimales = parseFloat(registro.cantidad_horas) || 0
  const tiempoFormato = decimalATiempoFormato(horasDecimales)

  // Formatear fecha
  let fechaFormateada = null
  if (registro.fecha_registro || registro.fecha) {
    const fechaStr = registro.fecha_registro || registro.fecha
    if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
      // Formato YYYY-MM-DD
      const partes = fechaStr.split('-')
      if (partes.length === 3) {
        fechaFormateada = `${partes[2]} / ${partes[1]} / ${partes[0]}`
      }
    } else {
      fechaFormateada = fechaStr
    }
  }

  formData.value = {
    ano_contable: registro.ano_contable || new Date().getFullYear(),
    userbase_id: usuarioId,
    sucursal_id: sucursalId,
    empresa_id: empresaId,
    fecha: fechaFormateada,
    tarea_id: tareaId,
    tiempo_formato: tiempoFormato,
    observaciones: registro.observaciones || ''
  }

  console.log('✅ Datos cargados en formulario:', formData.value)

  // Cargar opciones iniciales
  setTimeout(() => {
    // Sucursal
    if (sucursalId) {
      const sucursalObj = obtenerObjeto(registro.sucursal)
      if (sucursalObj) {
        opcionesSucursales.value = [sucursalObj]
      } else if (sucursalesCompletas.value.length > 0) {
        const encontrada = sucursalesCompletas.value.find(s => s.id === sucursalId)
        if (encontrada) {
          opcionesSucursales.value = [encontrada]
        }
      }
    }

    // Usuario
    if (usuarioId) {
      const usuarioObj = obtenerObjeto(registro.usuario)
      if (usuarioObj) {
        opcionesUsuarios.value = [usuarioObj]
      } else if (usuariosCompletos.value.length > 0) {
        const encontrado = usuariosCompletos.value.find(u => 
          u.id === usuarioId || u.userbase_id === usuarioId || u.usuario_id === usuarioId
        )
        if (encontrado) {
          opcionesUsuarios.value = [encontrado]
        }
      }
    }

    // Subempresa
    if (empresaId) {
      const empresaObj = obtenerObjeto(registro.subempresa || registro.empresa)
      if (empresaObj) {
        opcionesEmpresas.value = [empresaObj]
      } else if (empresasCompletas.value.length > 0) {
        const encontrada = empresasCompletas.value.find(e => e.id === empresaId)
        if (encontrada) {
          opcionesEmpresas.value = [encontrada]
        }
      }
    }

    // Tarea
    if (tareaId) {
      const tareaObj = obtenerObjeto(registro.tarea || registro.subrubro)
      if (tareaObj) {
        opcionesTareas.value = [tareaObj]
      } else if (tareasCompletas.value.length > 0) {
        const encontrada = tareasCompletas.value.find(t => 
          t.id === tareaId || t.subrubro_id === tareaId || t.tarea_id === tareaId
        )
        if (encontrada) {
          opcionesTareas.value = [encontrada]
        }
      }
    }
  }, 500)
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
    if (esModoEdicion.value) {
      // Validaciones para modo editar
      if (!formData.value.sucursal_id) {
        throw new Error('La sucursal es requerida')
      }
      if (!formData.value.empresa_id) {
        throw new Error('El cliente (subempresa) es requerida')
      }
      if (!formData.value.fecha) {
        throw new Error('La fecha es requerida')
      }
      if (!formData.value.tarea_id) {
        throw new Error('La tarea es requerida')
      }
      if (!formData.value.tiempo_formato || !validarFormatoTiempo(formData.value.tiempo_formato)) {
        throw new Error('El tiempo es requerido y debe tener formato HH:MM:SS (ej: 08:30:00)')
      }
      if (!formData.value.observaciones) {
        throw new Error('Las observaciones son requeridas')
      }

      // Convertir tiempo formato a horas decimales
      const cantidadHorasDecimal = tiempoFormatoADecimal(formData.value.tiempo_formato)

      // Preparar datos para editar
      const datosParaBackend = {
        sucursal: formData.value.sucursal_id,
        subempresa: formData.value.empresa_id,
        fecha_registro: convertirFechaParaBackend(formData.value.fecha),
        tarea: formData.value.tarea_id,
        cantidad_horas: cantidadHorasDecimal,
        observaciones: formData.value.observaciones
      }

      if (formData.value.ano_contable) {
        datosParaBackend.ano_contable = parseInt(formData.value.ano_contable)
      }

      console.log('📤 Enviando datos al backend para actualizar:', datosParaBackend)
      const resultado = await registrosService.updateRegistro(registroId.value, datosParaBackend)
      
      console.log('✅ Respuesta del backend:', resultado)
      
      $q.notify({
        type: 'positive',
        message: 'Registro actualizado correctamente',
        position: 'top',
        timeout: 3000
      })
      
      emit('guardado', resultado)
    } else {
      // Validaciones para modo crear
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

      // Preparar datos para crear
      const datosParaBackend = {
        sucursal_id: formData.value.sucursal_id,
        empresas_id: formData.value.empresas_id,
        fecha: formData.value.fecha,
        tarea_id: formData.value.tarea_id,
        cantidad_horas: parseFloat(formData.value.cantidad_horas),
        observaciones: formData.value.observaciones,
        ano_contable: parseInt(formData.value.ano_contable)
      }

      if (formData.value.userbase_id) {
        datosParaBackend.userbase_id = formData.value.userbase_id
      }

      if (formData.value.cantidad_minutos !== null && formData.value.cantidad_minutos !== undefined && formData.value.cantidad_minutos !== '') {
        datosParaBackend.cantidad_minutos = parseInt(formData.value.cantidad_minutos)
      }

      console.log('📤 Enviando datos al backend para crear:', datosParaBackend)
      const resultado = await registrosService.createRegistro(datosParaBackend)
      
      console.log('✅ Respuesta del backend:', resultado)
      
      let mensaje = `Registro(s) creado(s) exitosamente`
      if (resultado.count) {
        mensaje = `${resultado.count} registro(s) creado(s) exitosamente`
      }

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
    }

    cerrarFormulario()
  } catch (error) {
    console.error(`❌ Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} registro:`, error)
    console.error('Detalles del error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    let mensajeError = `Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} el registro`
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 403) {
        mensajeError = data.detail || 'Este registro ya no puede ser editado. Solo se pueden editar registros con menos de 7 días de antigüedad.'
      } else if (status === 400) {
        mensajeError = data.detail || data.message || 'Error en los datos proporcionados. Verifica todos los campos requeridos.'
        
        if (data.empresas_id || data.subempresa) {
          mensajeError += `\nSubempresas: ${Array.isArray(data.empresas_id || data.subempresa) ? (data.empresas_id || data.subempresa).join(', ') : (data.empresas_id || data.subempresa)}`
        }
        if (data.cantidad_horas) {
          mensajeError += `\nCantidad de horas: ${Array.isArray(data.cantidad_horas) ? data.cantidad_horas.join(', ') : data.cantidad_horas}`
        }
        if (data.fecha || data.fecha_registro) {
          mensajeError += `\nFecha: ${Array.isArray(data.fecha || data.fecha_registro) ? (data.fecha || data.fecha_registro).join(', ') : (data.fecha || data.fecha_registro)}`
        }
      } else if (status === 404) {
        mensajeError = esModoEdicion.value ? 'Registro no encontrado' : 'Usuario no encontrado'
      } else if (status === 401) {
        mensajeError = 'No autenticado. Por favor, inicia sesión nuevamente.'
      } else if (status === 403) {
        mensajeError = `No tienes permisos para ${esModoEdicion.value ? 'editar' : 'crear'} este registro`
      } else {
        mensajeError = data.detail || data.message || `Error ${status}: Error al ${esModoEdicion.value ? 'actualizar' : 'crear'} el registro`
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
  if (esModoEdicion.value && props.registro) {
    cargarDatosRegistro()
  } else {
    formData.value = {
      ano_contable: new Date().getFullYear(),
      userbase_id: null,
      sucursal_id: null,
      empresas_id: [],
      empresa_id: null,
      fecha: null,
      tarea_id: null,
      cantidad_horas: null,
      cantidad_minutos: null,
      tiempo_formato: '00:00:00',
      observaciones: ''
    }
  }
}

// Cerrar formulario
function cerrarFormulario() {
  emit('update:modelValue', false)
  emit('cancelado')
  resetearFormulario()
}

// Watch para cargar datos cuando se abre el modal o cambia el registro
watch(() => props.modelValue, async (nuevoValor) => {
  if (nuevoValor) {
    await cargarDatos()
    if (esModoEdicion.value) {
      setTimeout(() => {
        cargarDatosRegistro()
      }, 200)
    } else {
      // Establecer fecha por defecto a hoy solo en modo creación
      const hoy = new Date()
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
      formData.value.fecha = fechaHoy
    }
  }
})

watch(() => props.registro, (nuevoRegistro) => {
  if (nuevoRegistro && props.modelValue) {
    if (sucursalesCompletas.value.length > 0) {
      cargarDatosRegistro()
    } else {
      setTimeout(() => {
        cargarDatosRegistro()
      }, 200)
    }
  }
}, { deep: true })

onMounted(async () => {
  if (props.modelValue) {
    await cargarDatos()
    if (esModoEdicion.value) {
      setTimeout(() => {
        cargarDatosRegistro()
      }, 200)
    } else {
      const hoy = new Date()
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
      formData.value.fecha = fechaHoy
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

