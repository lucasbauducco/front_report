<template>
  <div class="col-12">
    <!-- Banner con información de horas faltantes -->
    <q-banner
      v-if="horasFaltantesInfo && esFechaValida"
      :class="horasFaltantesInfo.completo ? 'bg-positive text-white' : 'bg-warning text-white'"
      rounded
    >
      <template v-slot:avatar>
        <q-icon 
          :name="horasFaltantesInfo.completo ? 'check_circle' : 'warning'" 
          size="md"
        />
      </template>
      <div class="text-subtitle2">
        {{ horasFaltantesInfo.completo ? 'Día completo' : 'Horas faltantes en este día' }}
      </div>
      <div class="row q-gutter-md q-mt-xs">
        <div>
          <strong>Carga horaria:</strong> {{ horasFaltantesInfo.carga_horaria }} hs
        </div>
        <div>
          <strong>Horas registradas:</strong> {{ horasFaltantesInfo.horas_registradas }} hs
        </div>
        <div>
          <strong>Horas ausencias:</strong> {{ horasFaltantesInfo.horas_ausencias }} hs
        </div>
        <div>
          <strong>Horas totales:</strong> {{ horasFaltantesInfo.horas_totales }} hs
        </div>
        <div v-if="!horasFaltantesInfo.completo">
          <strong>Horas faltantes:</strong> {{ horasFaltantesInfo.horas_faltantes }} hs
        </div>
      </div>
    </q-banner>

    <!-- Banner de carga -->
    <q-banner
      v-else-if="cargando"
      class="bg-grey-3"
      rounded
    >
      <template v-slot:avatar>
        <q-spinner color="primary" size="md" />
      </template>
      <div class="text-subtitle2 text-grey-8">
        Consultando horas faltantes...
      </div>
    </q-banner>

    <!-- Banner de información (sin fecha válida) -->
    <q-banner
      v-else
      class="bg-grey-3"
      rounded
    >
      <template v-slot:avatar>
        <q-icon name="info" color="grey-7" size="md" />
      </template>
      <div class="text-subtitle2 text-grey-8">
        Selecciona una fecha válida para ver las horas faltantes
      </div>
    </q-banner>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { ausenciasService } from 'src/services/ausencias.service'

const props = defineProps({
  fecha: {
    type: String,
    default: null
  },
  usuarioId: {
    type: [Number, String],
    default: null
  }
})

const $q = useQuasar()

// Estado del componente
const horasFaltantesInfo = ref(null)
const cargando = ref(false)

// Computed para validar la fecha
const esFechaValida = computed(() => {
  return validarFecha(props.fecha)
})

// Función para validar formato de fecha YYYY-MM-DD
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

// Función para consultar horas faltantes
async function consultarHorasFaltantes() {
  if (!props.fecha || !validarFecha(props.fecha)) {
    horasFaltantesInfo.value = null
    return
  }

  cargando.value = true
  try {
    const usuarioId = props.usuarioId 
      ? (typeof props.usuarioId === 'object' ? props.usuarioId.id : props.usuarioId)
      : null
    
    const resultado = await ausenciasService.getHorasFaltantes(props.fecha, usuarioId)
    horasFaltantesInfo.value = resultado
  } catch (error) {
    console.error('Error al consultar horas faltantes:', error)
    horasFaltantesInfo.value = null
    
    // Solo mostrar error si no es un 400 (usuario sin carga horaria)
    if (error.response?.status !== 400) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        message: 'Error al consultar horas faltantes',
        timeout: 2000
      })
    }
  } finally {
    cargando.value = false
  }
}

// Watch para consultar horas faltantes cuando cambia la fecha
watch(() => props.fecha, (nuevaFecha) => {
  if (nuevaFecha) {
    consultarHorasFaltantes()
  } else {
    horasFaltantesInfo.value = null
  }
})

// Watch para consultar horas faltantes cuando cambia el usuario
watch(() => props.usuarioId, () => {
  if (props.fecha && validarFecha(props.fecha)) {
    consultarHorasFaltantes()
  }
})

// Consultar al montar si hay fecha válida
if (props.fecha && validarFecha(props.fecha)) {
  consultarHorasFaltantes()
}
</script>