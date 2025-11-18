<template>
  <div class="q-pa-md">
    <q-btn
      :loading="enProceso"
      :disable="enProceso || !hasData"
      color="green-5"
      icon="description"
      :label="enProceso ? 'Creando archivo...' : 'Generar Excel'"
      @click="generarExcel"
    >
      <template v-slot:loading>
        <q-spinner-dots />
      </template>
      
      <q-tooltip v-if="!hasData">
        No hay datos disponibles para exportar
      </q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { registrosService } from 'src/services/registros.service'

export default {
  name: 'ButtonGenerateExcel',

  props: {
    // Datos a exportar (ya no es tan necesario, pero lo mantenemos por compatibilidad)
    data: {
      type: Array,
      required: false,
      default: () => []
    },
    
    // Columnas a incluir en el Excel (ya no es necesario, pero lo mantenemos)
    columns: {
      type: Array,
      required: false,
      default: () => []
    },
    
    // Nombre del archivo Excel (ya no es necesario, el backend lo maneja)
    fileName: {
      type: String,
      default: 'datos'
    },
    
    // Nombre de la hoja (ya no es necesario)
    sheetName: {
      type: String,
      default: 'Datos'
    },
    
    // Filtros aplicados (REQUERIDO para enviar al backend)
    filters: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['export-started', 'export-completed', 'export-error', 'generation-started', 'generation-completed'],

  setup(props, { emit }) {
    const $q = useQuasar()
    const loading = ref(false)
    const generando = ref(false)

    // El botón siempre está habilitado (el backend validará si hay datos)
    const hasData = computed(() => true)
    
    // Computed para saber si está en proceso (esperando respuesta o generando en background)
    const enProceso = computed(() => loading.value || generando.value)

    /**
     * Mapea los filtros del frontend al formato esperado por el backend
     */
    const mapearFiltrosParaBackend = (filtros) => {
      const filtrosBackend = {}
      
      // Mapeo de nombres de filtros
      const mapeo = {
        empresa: 'subempresa_id',
        usuario: 'userbase_id',
        rubro: 'subrubro_id',
        tarea: 'tarea_id',
        fecha_desde: 'fecha_desde',
        fecha_hasta: 'fecha_hasta',
        ano_contable: 'ano_contable'
      }
      
      // Aplicar mapeo
      Object.keys(filtros).forEach(key => {
        const valorFiltro = filtros[key]
        if (valorFiltro !== null && valorFiltro !== undefined && valorFiltro !== '') {
          const keyBackend = mapeo[key] || key
          filtrosBackend[keyBackend] = valorFiltro
        }
      })
      
      return filtrosBackend
    }

    /**
     * Genera el archivo Excel llamando al backend
     */
    const generarExcel = async () => {
      loading.value = true
      generando.value = true
      emit('export-started')
      emit('generation-started')

      try {
        console.log('🔄 Iniciando generación de Excel en el backend...')
        console.log('📋 Filtros a enviar:', props.filters)
        
        // Mapear filtros al formato del backend
        const filtrosBackend = mapearFiltrosParaBackend(props.filters)
        console.log('📤 Filtros mapeados:', filtrosBackend)
        
        // Llamar al endpoint de generación
        const response = await registrosService.generarExcelRegistros(filtrosBackend)
        
        console.log('✅ Respuesta del servidor:', response)
        
        // La petición se completó, pero el archivo sigue generándose en background
        loading.value = false
        
        $q.notify({
          type: 'positive',
          message: response.message || 'Excel generándose en segundo plano',
          caption: response.detail || 'El botón se habilitará cuando el archivo esté listo',
          position: 'top',
          timeout: 3000
        })

        // Emitir evento de completado con información del archivo
        emit('export-completed', response.archivo?.nombre_archivo || 'registros.xlsx')
        
        // El estado "generando" se mantendrá activo hasta que el padre lo desactive
        // cuando detecte que el archivo está listo
        
      } catch (error) {
        console.error('❌ Error al generar Excel:', error)
        
        // Manejar diferentes tipos de errores
        let mensaje = 'Error al generar el archivo Excel'
        let detalle = error.message
        
        if (error.response) {
          // Error de respuesta del servidor
          if (error.response.status === 404) {
            mensaje = 'No hay registros para exportar'
            detalle = error.response.data?.detail || 'No se encontraron registros con los filtros aplicados'
          } else if (error.response.status === 401) {
            mensaje = 'No autorizado'
            detalle = 'Debes iniciar sesión para generar el Excel'
          } else if (error.response.status === 400) {
            mensaje = 'Datos inválidos'
            detalle = error.response.data?.detail || 'Los filtros proporcionados no son válidos'
          } else {
            mensaje = error.response.data?.error || mensaje
            detalle = error.response.data?.detail || detalle
          }
        }
        
        $q.notify({
          type: 'negative',
          message: mensaje,
          caption: detalle,
          position: 'top',
          timeout: 5000
        })

        emit('export-error', error)
        
        // Si hay error, desactivar ambos estados
        loading.value = false
        generando.value = false
      }
    }
    
    // Exponer método para que el padre pueda desactivar el estado de generación
    const finalizarGeneracion = () => {
      generando.value = false
      emit('generation-completed')
    }

    return {
      loading,
      generando,
      enProceso,
      hasData,
      generarExcel,
      finalizarGeneracion
    }
  }
}
</script>

<style scoped>
/* Estilos opcionales */
</style>

