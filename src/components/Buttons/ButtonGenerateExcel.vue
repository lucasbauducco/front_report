<template>
  <div class="">
    <q-btn
      :loading="enProceso"
      :disable="enProceso || !hasData"
      color="accent"
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
import { ausenciasService } from 'src/services/ausencias.service'
import { controlhorasService } from 'src/services/controlhoras.service'

export default {
  name: 'ButtonGenerateExcel',

  props: {
    // Tipo de Excel a generar: 'registros', 'ausencias', 'control_horas', etc.
    tipo: {
      type: String,
      default: 'registros',
      validator: (value) => ['registros', 'ausencias', 'control_horas'].includes(value)
    },
    
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
     * Obtiene el servicio correspondiente según el tipo
     */
    const obtenerServicio = () => {
      switch (props.tipo) {
        case 'registros':
          return registrosService
        case 'ausencias':
          return ausenciasService
        case 'control_horas':
          return controlhorasService
        default:
          console.warn(`Tipo de Excel no reconocido: ${props.tipo}, usando registros por defecto`)
          return registrosService
      }
    }

    /**
     * Mapea los filtros del frontend al formato esperado por el backend
     */
    const mapearFiltrosParaBackend = (filtros) => {
      const filtrosBackend = {}
      
      // Mapeo de nombres de filtros según el tipo
      let mapeo = {}
      
      if (props.tipo === 'registros') {
        mapeo = {
          empresa: 'subempresa_id',
          usuario: 'userbase_id',
          rubro: 'subrubro_id',
          tarea: 'tarea_id',
          fecha_desde: 'fecha_desde',
          fecha_hasta: 'fecha_hasta',
          ano_contable: 'ano_contable'
        }
      } else if (props.tipo === 'ausencias') {
        mapeo = {
          empresa: 'empresa',
          usuario: 'usuario',
          rubro: 'rubro',
          tarea: 'tarea',
          fecha_desde: 'fecha_desde',
          fecha_hasta: 'fecha_hasta',
          anioContable: 'ano_contable',
          tipo_ausencia: 'tipo_ausencia',
          motivo: 'motivo',
          activo: 'activo'
        }
      } else if (props.tipo === 'control_horas') {
        mapeo = {
          usuario: 'usuario',
          fecha_desde: 'fecha_desde',
          fecha_hasta: 'fecha_hasta',
          estado: 'estado',
          activo: 'activo'
        }
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
        const servicio = obtenerServicio()
        console.log(`🔄 Iniciando generación de Excel de ${props.tipo} en el backend...`)
        console.log('📋 Filtros a enviar:', props.filters)
        
        // Mapear filtros al formato del backend
        const filtrosBackend = mapearFiltrosParaBackend(props.filters)
        console.log('📤 Filtros mapeados:', filtrosBackend)
        
        // Llamar al endpoint de generación según el tipo
        let response
        if (props.tipo === 'registros') {
          response = await servicio.generarExcelRegistros(filtrosBackend)
        } else if (props.tipo === 'ausencias') {
          response = await servicio.generarExcelAusencias(filtrosBackend)
        } else if (props.tipo === 'control_horas') {
          response = await servicio.generarExcelControlHoras(filtrosBackend)
        } else {
          throw new Error(`Tipo de Excel no soportado: ${props.tipo}`)
        }
        
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
        const nombreArchivo = response.archivo?.nombre_archivo || `${props.tipo}.xlsx`
        emit('export-completed', nombreArchivo)
        
        // El estado "generando" se mantendrá activo hasta que el padre lo desactive
        // cuando detecte que el archivo está listo
        
      } catch (error) {
        console.error(`❌ Error al generar Excel de ${props.tipo}:`, error)
        
        // Manejar diferentes tipos de errores
        let mensaje = 'Error al generar el archivo Excel'
        let detalle = error.message
        
        // Manejar errores de timeout específicamente
        if (error.isTimeout || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          mensaje = 'Tiempo de espera agotado'
          detalle = 'La generación del Excel está tardando más de lo esperado. Esto puede deberse a una gran cantidad de datos. Por favor, intenta con filtros más específicos o contacta al administrador.'
        } else if (error.response) {
          // Error de respuesta del servidor
          if (error.response.status === 404) {
            mensaje = 'No hay registros para exportar'
            detalle = error.response.data?.detail || `No se encontraron ${props.tipo} con los filtros aplicados`
          } else if (error.response.status === 401) {
            mensaje = 'No autorizado'
            detalle = 'Debes iniciar sesión para generar el Excel'
          } else if (error.response.status === 400) {
            mensaje = 'Datos inválidos'
            detalle = error.response.data?.detail || 'Los filtros proporcionados no son válidos'
          } else if (error.response.status === 504 || error.response.status === 524) {
            // Errores de gateway timeout (Cloudflare)
            mensaje = 'Tiempo de espera agotado (Cloudflare)'
            detalle = 'El servidor tardó demasiado en responder. Por favor, intenta con filtros más específicos o contacta al administrador.'
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
          timeout: 7000
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
