<template>
    <q-page padding>
      <div class="q-pa-md">
        <div class="report-page-title-container">
          <div class="report-page-title">Control de Horas</div>    
        </div>
        
        <!-- Formulario de filtros -->
        <FormFiltros 
          tipo="control_horas"
          @filtros-aplicados="aplicarFiltros"
          @filtros-reseteados="resetearFiltros"
        />
        
        <!-- Botones de Excel -->
        <div class="q-mb-md row q-gutter-md">
          <ButtonGenerateExcel
            ref="buttonGenerateExcel"
            tipo="control_horas"
            :data="controlHorasFiltradas"
            :columns="columnsForExcel"  
            :filters="filtrosActuales"
            file-name="control_horas"
            sheet-name="Control de Horas"
            @export-started="onExportStarted"
            @export-completed="onExportCompleted"
            @generation-started="onGenerationStarted"
            @generation-completed="onGenerationCompleted"
          />
          
          <!-- Botón para descargar Excel existente -->
          <div class="">
              <q-btn
                v-if="archivoExcelExiste"
                color="secondary"
                icon="download"
                label=""
                @click="descargarExcelExistente"
                :loading="descargandoExcel"
              >
                <q-tooltip v-if="fechaUltimoExcel">
                  Último archivo generado: {{ formatearFecha(fechaUltimoExcel) }}
                </q-tooltip>
              </q-btn>
          </div>
        </div>
        
        <!-- Botón para crear registro -->
        <div v-if="user_detail?.is_subadministrador || user_detail?.is_admin || user_detail?.is_staff" class="q-mb-md">
          <q-btn
            color="primary"
            icon="add"
            label="Crear Control de Horas"
            @click="mostrarFormCrear = true"
          />
        </div>
        
        <!-- Botón para mostrar/ocultar inactivos -->
        <div class="q-mb-md flex justify-end">
          <q-toggle
            v-model="mostrarInactivos"
            label=""
            color="primary"
            :false-value="false"
            :true-value="true"
          />
        </div>
        
        <!-- Tabla de Control de Horas -->
        <q-card>
          <q-card-section>
            <q-table
              :rows="controlHorasFiltradas"
              :columns="columnas"
              :loading="loading"
              row-key="id"
              v-model:pagination="pagination"
              @request="onRequest"
              binary-state-sort
              flat
              bordered
            >
              <template v-slot:body-cell-activo="props">
                <q-td :props="props">
                  <q-badge
                    :color="props.row.activo ? 'positive' : 'negative'"
                    :label="props.row.activo ? 'Activo' : 'Inactivo'"
                  />
                </q-td>
              </template>
  
              <template v-if="user_detail?.is_subadministrador || user_detail?.is_admin || user_detail?.is_staff" v-slot:body-cell-acciones="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    color="warning"
                    @click="editarControlHora(props.row)"
                  >
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
  
        <!-- Información de paginación -->
        <div class="q-mt-md text-center">
          <p class="text-grey-7">Total de registros: <strong>{{ totalRegistros }}</strong></p>
        </div>
      </div>
  
    <!-- Modal unificado de control de hora (crear/editar) -->
      <FormControlHoras
        v-model="mostrarFormEditar"
        :controlHora="controlHoraEditando"
        @guardado="onControlHoraGuardada"
        @cancelado="onControlHoraCancelada"
      />
  
      <!-- Modal de creación de control de hora -->
      <FormControlHoras
        v-model="mostrarFormCrear"
        @guardado="onControlHoraCreado"
        @cancelado="onControlHoraCreacionCancelado"
      />
    </q-page>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import { useQuasar } from 'quasar'
  import { controlhorasService } from 'src/services/controlhoras.service'
  import FormFiltros from 'src/components/Forms/FormFiltros.vue'
  import ButtonGenerateExcel from 'src/components/Buttons/ButtonGenerateExcel.vue'
  import FormControlHoras from 'src/components/Forms/FormControlHoras.vue'
  import { user_detail } from 'src/utils/auth'
  const $q = useQuasar()
  
  const controlHoras = ref([])
  const loading = ref(false)
  const totalRegistros = ref(0)
  const filtrosActuales = ref({})
  const archivoExcelExiste = ref(false)
  const fechaUltimoExcel = ref(null)
  const descargandoExcel = ref(false)
  const buttonGenerateExcel = ref(null)
  const mostrarFormEditar = ref(false)
  const controlHoraEditando = ref(null)
  const mostrarFormCrear = ref(false)
  const mostrarInactivos = ref(false) // Por defecto oculta los inactivos
  
  const pagination = ref({
    sortBy: 'fecha',
    descending: true,
    page: 1,
    rowsPerPage: 20,
    rowsNumber: 0
  })
  
  // Columnas para la tabla
  const columnas = [
    {
      name: 'id',
      label: 'ID',
      field: 'id',
      align: 'left',
      sortable: true
    },
    {
      name: 'fecha',
      label: 'Fecha',
      field: 'fecha',
      align: 'left',
      sortable: true,
      format: val => {
        if (!val) return ''
        const fecha = new Date(val)
        return fecha.toLocaleDateString('es-ES')
      }
    },
    {
      name: 'tiempo_inicio',
      label: 'Inicio',
      field: 'tiempo_inicio',
      align: 'left',
      sortable: true,
      format: val => {
        if (!val) return ''
        const fecha = new Date(val)
        return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    },
    {
      name: 'tiempo_fin',
      label: 'Fin',
      field: 'tiempo_fin',
      align: 'left',
      sortable: true,
      format: val => {
        if (!val) return '-'
        const fecha = new Date(val)
        return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    },
    {
      name: 'usuario',
      label: 'Usuario',
      field: row => row.usuario_nombre || 'N/A',
      align: 'left',
      sortable: false
    },
    {
      name: 'horas_totales',
      label: 'Horas Totales',
      field: 'horas_totales',
      align: 'right',
      sortable: true,
      format: val => {
        if (!val) return '00:00:00'
        const horas = Math.floor(val)
        const minutosDecimales = (val - horas) * 60
        const minutos = Math.floor(minutosDecimales)
        const segundos = Math.round((minutosDecimales - minutos) * 60)
        const pad = n => n.toString().padStart(2, '0')
        return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`
      }
    },
    {
      name: 'estado',
      label: 'Estado',
      field: row => row.estado_display || row.estado || 'N/A',
      align: 'center',
      sortable: true
    },
    {
      name: 'activo',
      label: 'Activo',
      field: 'activo',
      align: 'center',
      sortable: true
    },
    {
      name: 'acciones',
      label: 'Acciones',
      field: 'acciones',
      align: 'center',
      sortable: false,
      requiredAuth: true,
      show: (user_detail) => user_detail?.is_subadministrador || user_detail?.is_admin || user_detail?.is_staff
    }
  ]
  
  // Columnas para exportar a Excel (con más detalles)
  const columnsForExcel = [
    { name: 'id', label: 'ID', field: 'id' },
    { 
      name: 'fecha', 
      label: 'Fecha', 
      field: row => {
        if (!row.fecha) return ''
        const fecha = new Date(row.fecha)
        return fecha.toLocaleDateString('es-ES')
      }
    },
    { 
      name: 'tiempo_inicio', 
      label: 'Tiempo Inicio', 
      field: row => {
        if (!row.tiempo_inicio) return ''
        const fecha = new Date(row.tiempo_inicio)
        return fecha.toLocaleString('es-ES')
      }
    },
    { 
      name: 'tiempo_fin', 
      label: 'Tiempo Fin', 
      field: row => {
        if (!row.tiempo_fin) return ''
        const fecha = new Date(row.tiempo_fin)
        return fecha.toLocaleString('es-ES')
      }
    },
    { name: 'usuario', label: 'Usuario', field: row => row.usuario_nombre || '' },
    { name: 'horas_totales', label: 'Horas Totales', field: 'horas_totales' },
    { name: 'estado', label: 'Estado', field: row => row.estado_display || row.estado || '' },
    { name: 'activo', label: 'Activo', field: row => row.activo ? 'Sí' : 'No' },
    { name: 'coor_inicio_x', label: 'Coordenada X Inicio', field: 'coor_inicio_x' },
    { name: 'coor_inicio_y', label: 'Coordenada Y Inicio', field: 'coor_inicio_y' },
    { name: 'coor_fin_x', label: 'Coordenada X Fin', field: 'coor_fin_x' },
    { name: 'coor_fin_y', label: 'Coordenada Y Fin', field: 'coor_fin_y' },
    { name: 'creado_por', label: 'Creado Por', field: row => row.creado_por_nombre || '' },
    { 
      name: 'created_at', 
      label: 'Creado el', 
      field: row => {
        if (!row.created_at) return ''
        const fecha = new Date(row.created_at)
        return fecha.toLocaleString('es-ES')
      }
    },
    { name: 'modificado_por', label: 'Modificado Por', field: row => row.modificado_por_nombre || '' },
    { 
      name: 'updated_at', 
      label: 'Modificado el', 
      field: row => {
        if (!row.updated_at) return ''
        const fecha = new Date(row.updated_at)
        return fecha.toLocaleString('es-ES')
      }
    }
  ]
  
  const cargarControlHoras = async () => {
    loading.value = true
    
    try {
      console.log('🔄 Cargando control de horas con filtros:', filtrosActuales.value)
      
      // Preparar parámetros de consulta
      const params = {
        page: pagination.value.page,
        page_size: pagination.value.rowsPerPage
      }
  
      // Añadir filtros activos
      Object.keys(filtrosActuales.value).forEach(key => {
        if (filtrosActuales.value[key] !== null && filtrosActuales.value[key] !== '') {
          params[key] = filtrosActuales.value[key]
        }
      })

      // Si mostrarInactivos está desactivado, filtrar solo activos
      if (!mostrarInactivos.value) {
        params.activo = 'true'
      }
  
      console.log('📤 Parámetros de petición:', params)
  
      const response = await controlhorasService.getControlHoras(params)
      
      console.log('✅ Respuesta recibida:', response)
      
      // Log del primer registro para debug
      if (response.results && response.results.length > 0) {
        console.log('📋 Primer control de hora (estructura):', JSON.stringify(response.results[0], null, 2))
      }
      
      controlHoras.value = response.results
      totalRegistros.value = response.count
      pagination.value.rowsNumber = response.count
  
      $q.notify({
        type: 'positive',
        message: `Se cargaron ${response.results.length} control de horas`,
        position: 'top',
        timeout: 1500
      })
    } catch (error) {
      console.error('❌ Error al cargar control de horas:', error)
      
      $q.notify({
        type: 'negative',
        message: error.response?.data?.detail || 'Error al cargar control de horas. Verifica que Django esté corriendo.',
        position: 'top',
        timeout: 3000
      })
    } finally {
      loading.value = false
    }
  }
  
  const onRequest = (props) => {
    const { page, rowsPerPage, sortBy, descending } = props.pagination
    
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
    
    cargarControlHoras()
  }
  
  // Manejo de filtros desde FormFiltros
  const aplicarFiltros = (filtros) => {
    console.log('🔍 Filtros aplicados desde FormFiltros:', filtros)
    
    // Mapeo de nombres de filtros del frontend al backend
    const mapeoFiltros = {
      usuarioAsignado: 'usuario',
      fechaDesde: 'fecha_desde',
      fechaHasta: 'fecha_hasta',
      estado: 'estado'
    }
    
    // Convertir filtros del formato camelCase a snake_case
    const filtrosMapeados = {}
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== '' && mapeoFiltros[key]) {
        filtrosMapeados[mapeoFiltros[key]] = filtros[key]
      }
    })
    
    console.log('📝 Filtros mapeados para el backend:', filtrosMapeados)
    filtrosActuales.value = filtrosMapeados
    
    // Resetear a la primera página al aplicar filtros
    pagination.value.page = 1
    
    // Cargar registros con los nuevos filtros
    cargarControlHoras()
  }
  
  const resetearFiltros = () => {
    console.log('🔄 Filtros reseteados')
    filtrosActuales.value = {}
    pagination.value.page = 1
    
    // Recargar registros sin filtros
    cargarControlHoras()
  }
  
  
const editarControlHora = async (controlHora) => {
    console.log('✏️ Editar control de hora:', controlHora)    
    controlHoraEditando.value = controlHora
    mostrarFormEditar.value = true
  }
  
  const onControlHoraGuardada = (controlHoraActualizada) => {
    console.log('✅ Control de hora guardada:', controlHoraActualizada)   
    // Recargar la lista de registros
    cargarControlHoras()
  }
  
  const onControlHoraCancelada = () => {   
    controlHoraEditando.value = null
  } 
  
  const onControlHoraCreado = (resultado) => {
    console.log('✅ Control de hora(s) creada(s):', resultado)
    // Recargar la lista de control de horas
    cargarControlHoras()
  }
  
  const onControlHoraCreacionCancelado = () => {
    // No hacer nada, solo cerrar el modal
  }
  
  const eliminarControlHora = async (controlHora) => {
    $q.dialog({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la control de hora #${controlHora.id}?`,
      cancel: {
        label: 'Cancelar',
        color: 'grey',
        flat: true
      },
      ok: {
        label: 'Eliminar',
        color: 'negative'
      },
      persistent: true
    }).onOk(async () => {
      try {
        console.log('🗑️ Eliminando control de hora:', controlHora.id)
        
        await controlhorasService.deleteControlHora(controlHora.id)
        
        $q.notify({
          type: 'positive',
          message: 'Control de hora eliminada correctamente',
          position: 'top',
          timeout: 2000
        })
        
        // Recargar la lista
        cargarControlHoras()
      } catch (error) {
        console.error('❌ Error al eliminar control de hora:', error)
        
        $q.notify({
          type: 'negative',
          message: error.response?.data?.detail || 'Error al eliminar control de hora',
          position: 'top',
          timeout: 3000
        })
      }
    })
  }
  
  // Manejo de eventos de exportación
  const onExportStarted = () => {
    console.log('📊 Iniciando exportación a Excel...')
    $q.notify({
      type: 'info',
      message: 'Generando archivo Excel...',
      position: 'top',
      timeout: 1000
    })
  }
  
  const onExportCompleted = (fileName) => {
    console.log('✅ Exportación completada:', fileName)
    
    // Verificar nuevamente si existe archivo después de generar
    verificarArchivoExcel()
  }
  
  // Manejo de eventos de generación
  const onGenerationStarted = () => {
    console.log('🏁 Generación iniciada en el backend')
  }
  
  const onGenerationCompleted = () => {
    console.log('🎉 Generación completada')
  }
  
  // Verificar si existe un archivo Excel generado
  const verificarArchivoExcel = async () => {
    try {
    const response = await controlhorasService.getExcelControlHoras()
      
      console.log('🔍 Verificando archivo Excel:', response)
      
      // El backend retorna el objeto Archivo serializado
      if (response && response.id) {
        // Verificar si el archivo tiene una URL válida
        const tieneArchivo = response.file_url || response.file || response.archivo
        
        // Solo mostrar el botón si el archivo ya no está procesando Y tiene un archivo
        if (!response.procesando && tieneArchivo) {
          archivoExcelExiste.value = true
          fechaUltimoExcel.value = response.fecha_generado || response.created_at
          console.log('📊 Archivo Excel existente detectado:', response)
          
          // Desactivar el estado de generación del botón si está activo
          if (buttonGenerateExcel.value?.finalizarGeneracion) {
            buttonGenerateExcel.value.finalizarGeneracion()
            console.log('✅ Estado de generación desactivado - archivo listo')
            
            $q.notify({
              type: 'positive',
              message: '¡Archivo generado exitosamente!',
              caption: 'Ya puedes descargarlo usando el botón "Descargar Excel Generado"',
              position: 'top',
              timeout: 3000
            })
          }
        } else if (response.procesando) {
          // El archivo se está procesando aún
          archivoExcelExiste.value = false
          fechaUltimoExcel.value = null
          console.log('⏳ Archivo Excel en proceso de generación... (porcentaje: ' + (response.porcentaje || 0) + '%)')
          
          // Verificar nuevamente en 3 segundos
          setTimeout(() => {
            verificarArchivoExcel()
          }, 3000)
        } else {
          // Existe el registro pero no tiene archivo
          archivoExcelExiste.value = false
          fechaUltimoExcel.value = null
          console.log('⚠️ Registro de archivo existe pero sin URL de archivo')
        }
      } else {
        archivoExcelExiste.value = false
        fechaUltimoExcel.value = null
      }
    } catch (error) {
      // Si el endpoint devuelve 404 u otro error, asumimos que no existe
      archivoExcelExiste.value = false
      fechaUltimoExcel.value = null
      
      if (error.response?.status === 404) {
        console.log('ℹ️ No hay archivo Excel generado aún')
      } else {
        console.error('❌ Error al verificar archivo Excel:', error)
      }
    }
  }
  
  // Descargar el archivo Excel existente
  const descargarExcelExistente = async () => {
    descargandoExcel.value = true
    
    try {
      console.log('📥 Descargando archivo Excel existente...')
      
    const response = await controlhorasService.downloadExcelControlHoras()
      
      // Crear un blob y descargarlo
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Obtener el nombre del archivo desde la respuesta, headers o usar uno por defecto
      let fileName = response.fileName || 'ausencias_generado.xlsx'
      
      const contentDisposition = response.headers['content-disposition']
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '')
        }
      }
      
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      
      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      $q.notify({
        type: 'positive',
        message: `Archivo "${fileName}" descargado exitosamente`,
        position: 'top',
        timeout: 2000
      })
    } catch (error) {
      console.error('❌ Error al descargar archivo Excel:', error)
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      })
      
      let mensaje = 'Error al descargar el archivo Excel'
      let caption = ''
      
      if (error.message === 'No se encontró la URL del archivo') {
        mensaje = 'El archivo no está disponible aún'
        caption = 'El campo "archivo" no existe en la respuesta del servidor. Revisa la consola para más detalles.'
      } else if (error.response?.status === 404) {
        mensaje = 'Archivo no encontrado'
        caption = 'El archivo puede haber sido eliminado o la URL es incorrecta'
      } else if (error.response?.data?.detail) {
        mensaje = error.response.data.detail
      } else if (error.message) {
        caption = error.message
      }
      
      $q.notify({
        type: 'negative',
        message: mensaje,
        caption: caption,
        position: 'top',
        timeout: 5000
      })
    } finally {
      descargandoExcel.value = false
    }
  }
  
  // Formatear fecha para mostrar en tooltip
  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    
    const date = new Date(fecha)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
        
  // Computed para filtrar control de horas según el estado de mostrarInactivos
  const controlHorasFiltradas = computed(() => {
    // El filtrado de activos/inactivos se hace en el backend
    // Este computed solo retorna los datos cargados
    return controlHoras.value
  })

  // Watch para recargar cuando cambia mostrarInactivos
  watch(mostrarInactivos, () => {
    pagination.value.page = 1
    cargarControlHoras()
  })
  
  // Cargar control de horas al montar el componente
  onMounted(() => {
    console.log('🚀 Componente ListarHorasPage montado, cargando control de horas...')
    cargarControlHoras()
    verificarArchivoExcel()
  })
  </script>
  
  <style lang="scss" scoped>
  /* Contenedor del título con fondo y separador */
  .report-page-title-container {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 1.5rem 1.25rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-left: 4px solid $primary;
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, $primary 0%, transparent 100%);
    }
  }
  
  /* Tipografía report para títulos de página */
  .report-page-title {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
    font-size: 2.5rem;
    font-weight: 600;
    color: $primary;
    margin: 0;
    user-select: none;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  
  @media (max-width: 600px) {
    .report-page-title-container {
      padding: 1rem 0.875rem;
      margin-bottom: 1rem;
    }
    
    .report-page-title {
      font-size: 1.75rem;
    }
  }
  </style>
  