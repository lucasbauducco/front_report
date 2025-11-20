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
          <div class="text-h6">Editar orden ID {{ registroId || 'Nuevo' }}</div>
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
                hint="Año contable"
                :rules="[val => !!val || 'El año contable es requerido']"
              />
            </div>

            <!-- Sucursal* -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.sucursal"
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

            <!-- Usuario* -->
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
                option-label="nombre"
                emit-value
                map-options
                hint="Usuario*"
                :rules="[val => !!val || 'El usuario es requerido']"
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

            <!-- Cliente* (Subempresa) -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                filled
                v-model="formData.empresa"
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
                v-model="formData.tarea"
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

            <!-- Cantidad de horas en formato HH:MM:SS* -->
            <div class="col-12 col-sm-6 col-md-4">
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
              label="Guardar"
              type="submit"
              color="primary"
              icon="save"
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

// Estado del formulario
const guardando = ref(false)

// ID del registro actual
const registroId = computed(() => props.registro?.id || null)

// Datos del formulario
const formData = ref({
  ano_contable: null,
  sucursal: null,
  usuario: null,
  empresa: null,
  fecha: null,
  tarea: null,
  tiempo_formato: '00:00:00', // Formato HH:MM:SS para el input
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

// Cargar datos iniciales
async function cargarDatos() {
  try {
    const [empresasData, tareasData, usuariosData, sucursalesData] = await Promise.all([
      registrosService.getEmpresas(),
      registrosService.getTareas(),
      registrosService.getUsuariosAsignados(),
      registrosService.getSucursales().catch(() => []) // Si falla, usar array vacío
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

// Formatear fecha del date picker al formato del input
function formatearFecha(fecha) {
  if (!fecha) return
  // fecha viene en formato YYYY-MM-DD, convertir a DD / MM / YYYY
  const partes = fecha.split('-')
  if (partes.length === 3) {
    formData.value.fecha = `${partes[2]} / ${partes[1]} / ${partes[0]}`
  }
}

// Convertir fecha del input al formato YYYY-MM-DD para el backend
function convertirFechaParaBackend(fechaStr) {
  if (!fechaStr) return null
  // fechaStr viene en formato DD / MM / YYYY
  const partes = fechaStr.split(' / ').filter(p => p.trim())
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`
  }
  return null
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
  
  // Formatear con ceros a la izquierda
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
  
  // Limpiar el formato y separar por :
  const partes = tiempoFormato.split(':').map(p => parseInt(p) || 0)
  
  if (partes.length < 3) {
    return 0
  }
  
  const horas = partes[0] || 0
  const minutos = partes[1] || 0
  const segundos = partes[2] || 0
  
  // Convertir todo a horas decimales
  const horasDecimales = horas + (minutos / 60) + (segundos / 3600)
  
  return horasDecimales
}

// Validar formato de tiempo HH:MM:SS
function validarFormatoTiempo(tiempoFormato) {
  if (!tiempoFormato || tiempoFormato === '') {
    return false
  }
  
  // Verificar que tenga el formato correcto (##:##:##)
  const regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/
  const match = tiempoFormato.match(regex)
  
  if (!match) {
    return false
  }
  
  const horas = parseInt(match[1])
  const minutos = parseInt(match[2])
  const segundos = parseInt(match[3])
  
  // Validar rangos
  if (horas < 0 || horas > 23) return false
  if (minutos < 0 || minutos > 59) return false
  if (segundos < 0 || segundos > 59) return false
  
  return true
}

// Convertir tiempo formato a texto legible (ej: "8 horas 30 minutos")
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

// Cargar datos del registro en el formulario
function cargarDatosRegistro() {
  if (!props.registro) {
    resetearFormulario()
    return
  }

  const registro = props.registro

  console.log('📋 Cargando registro en formulario:', JSON.stringify(registro, null, 2))

  // Función auxiliar para obtener ID de diferentes formas
  const obtenerId = (obj, camposPosibles = ['id']) => {
    if (!obj) return null
    // Si es un número directamente, retornarlo
    if (typeof obj === 'number') return obj
    
    // Si es un objeto, buscar el ID
    for (const campo of camposPosibles) {
      if (obj[campo] !== undefined && obj[campo] !== null) {
        return obj[campo]
      }
    }
    return null
  }

  // Función auxiliar para obtener objeto completo para select
  const obtenerObjeto = (obj, fallbackId = null) => {
    if (!obj) return null
    // Si es un número, buscar en los datos completos
    if (typeof obj === 'number') {
      return null // Se buscará después
    }
    // Si es un objeto, retornarlo directamente
    if (typeof obj === 'object') {
      return obj
    }
    return null
  }

  // Obtener IDs con diferentes intentos
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

  // Subempresa (Cliente/Empresa)
  // Nota: En el backend se usa "subempresa" aunque visualmente se muestre como "Empresa" o "Cliente"
  if (registro.subempresa) {
    empresaId = obtenerId(registro.subempresa)
  } else if (registro.subempresa_id) {
    empresaId = registro.subempresa_id
  } else if (registro.empresa) {
    empresaId = obtenerId(registro.empresa)
  } else if (registro.empresa_id) {
    empresaId = registro.empresa_id
  } else if (registro.cliente) {
    empresaId = obtenerId(registro.cliente)
  } else if (registro.cliente_id) {
    empresaId = registro.cliente_id
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
  // cantidad_horas ya incluye minutos y segundos en formato decimal
  // NO sumar cantidad_minutos porque ya está incluido en cantidad_horas
  const horasDecimales = parseFloat(registro.cantidad_horas) || 0
  const tiempoFormato = decimalATiempoFormato(horasDecimales)

  formData.value = {
    ano_contable: registro.ano_contable || new Date().getFullYear(),
    sucursal: sucursalId,
    usuario: usuarioId,
    empresa: empresaId,
    fecha: registro.fecha_registro || registro.fecha
      ? formatearFechaParaInput(registro.fecha_registro || registro.fecha)
      : null,
    tarea: tareaId,
    tiempo_formato: tiempoFormato,
    observaciones: registro.observaciones || ''
  }

  console.log('✅ Datos cargados en formulario:', formData.value)

  // Cargar opciones iniciales si hay valores
  // Esperar a que los datos completos estén cargados antes de buscar
  setTimeout(() => {
    // Sucursal
    if (sucursalId) {
      const sucursalObj = obtenerObjeto(registro.sucursal)
      if (sucursalObj) {
        opcionesSucursales.value = [sucursalObj]
      } else if (sucursalesCompletas.value.length > 0) {
        // Buscar en sucursales completas
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
        // Buscar en usuarios completos
        const encontrado = usuariosCompletos.value.find(u => 
          u.id === usuarioId || u.userbase_id === usuarioId || u.usuario_id === usuarioId
        )
        if (encontrado) {
          opcionesUsuarios.value = [encontrado]
        }
      }
    }

    // Subempresa (Cliente/Empresa)
    if (empresaId) {
      const empresaObj = obtenerObjeto(registro.subempresa || registro.empresa || registro.cliente)
      if (empresaObj) {
        opcionesEmpresas.value = [empresaObj]
      } else if (empresasCompletas.value.length > 0) {
        // Buscar en empresas completas
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
        // Buscar en tareas completas
        const encontrada = tareasCompletas.value.find(t => 
          t.id === tareaId || t.subrubro_id === tareaId || t.tarea_id === tareaId
        )
        if (encontrada) {
          opcionesTareas.value = [encontrada]
        }
      }
    }
  }, 500) // Esperar a que cargarDatos() termine
}

function formatearFechaParaInput(fechaStr) {
  if (!fechaStr) return null
  // fechaStr viene en formato YYYY-MM-DD o ISO
  const fecha = new Date(fechaStr)
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia} / ${mes} / ${anio}`
}

// Guardar formulario
async function guardar() {
  guardando.value = true

  try {
    // Validar campos requeridos antes de enviar
    if (!formData.value.sucursal) {
      throw new Error('La sucursal es requerida')
    }
    if (!formData.value.empresa) {
      throw new Error('El cliente (subempresa) es requerido')
    }
    if (!formData.value.fecha) {
      throw new Error('La fecha es requerida')
    }
    if (!formData.value.tarea) {
      throw new Error('La tarea es requerida')
    }
    if (!formData.value.tiempo_formato || !validarFormatoTiempo(formData.value.tiempo_formato)) {
      throw new Error('El tiempo es requerido y debe tener formato HH:MM:SS (ej: 08:30:00)')
    }
    if (!formData.value.observaciones) {
      throw new Error('Las observaciones son requeridas')
    }

    // Convertir tiempo formato HH:MM:SS a horas decimales
    // cantidad_horas incluye horas, minutos y segundos en formato decimal
    // NO enviar cantidad_minutos porque ya está incluido en cantidad_horas
    const cantidadHorasDecimal = tiempoFormatoADecimal(formData.value.tiempo_formato)

    // Preparar datos según el formato de la API
    const datosParaBackend = {
      sucursal: formData.value.sucursal,  // Requerido
      subempresa: formData.value.empresa,  // Requerido (se mapea de "empresa" a "subempresa")
      fecha_registro: convertirFechaParaBackend(formData.value.fecha),  // Requerido (YYYY-MM-DD)
      tarea: formData.value.tarea,  // Requerido
      cantidad_horas: cantidadHorasDecimal,  // Requerido (número decimal, incluye horas, minutos y segundos)
      observaciones: formData.value.observaciones  // Requerido
    }

    // Campos opcionales
    // NO enviar cantidad_minutos porque ya está incluido en cantidad_horas como decimal
    if (formData.value.ano_contable) {
      datosParaBackend.ano_contable = parseInt(formData.value.ano_contable)
    }

    // NO incluir usuario al editar (solo al crear)
    // if (formData.value.usuario && !registroId.value) {
    //   datosParaBackend.usuario = formData.value.usuario
    // }

    console.log('📤 Enviando datos al backend:', datosParaBackend)

    let resultado

    if (registroId.value) {
      // Actualizar registro existente usando PUT según la documentación
      resultado = await registrosService.updateRegistro(registroId.value, datosParaBackend)
    } else {
      // Crear nuevo registro
      // Agregar usuario solo al crear
      if (formData.value.usuario) {
        datosParaBackend.usuario = formData.value.usuario
      }
      resultado = await registrosService.createRegistro(datosParaBackend)
    }

    console.log('✅ Respuesta del backend:', resultado)

    $q.notify({
      type: 'positive',
      message: registroId.value 
        ? 'Registro actualizado correctamente' 
        : 'Registro creado correctamente',
      position: 'top',
      timeout: 2000
    })

    emit('guardado', resultado)
    cerrarFormulario()
  } catch (error) {
    console.error('❌ Error al guardar registro:', error)
    console.error('Detalles del error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    let mensajeError = 'Error al guardar el registro'
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 403) {
        // Registro no editable (restricciones de tiempo o permisos)
        mensajeError = data.detail || 'Este registro ya no puede ser editado. Solo se pueden editar registros con menos de 7 días de antigüedad.'
      } else if (status === 400) {
        // Error en los datos proporcionados
        mensajeError = data.detail || data.message || 'Error en los datos proporcionados. Verifica todos los campos requeridos.'
      } else if (status === 404) {
        mensajeError = 'Registro no encontrado'
      } else if (status === 401) {
        mensajeError = 'No autenticado. Por favor, inicia sesión nuevamente.'
      } else {
        mensajeError = data.detail || data.message || `Error ${status}: Error al guardar el registro`
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
    sucursal: null,
    usuario: null,
    empresa: null,
    fecha: null,
    tarea: null,
    tiempo_formato: '00:00:00',
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
    // Esperar un poco para que los datos se carguen antes de mapear el registro
    setTimeout(() => {
      cargarDatosRegistro()
    }, 300)
  }
})

watch(() => props.registro, () => {
  if (props.modelValue) {
    // Esperar un poco para que los datos se carguen
    setTimeout(() => {
      cargarDatosRegistro()
    }, 300)
  }
})

onMounted(async () => {
  if (props.modelValue) {
    await cargarDatos()
    setTimeout(() => {
      cargarDatosRegistro()
    }, 300)
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

