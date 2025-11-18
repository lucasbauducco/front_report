<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">Registros</div>
      
      <!-- Formulario de filtros -->
      <FormFiltros 
        @filtros-aplicados="aplicarFiltros"
        @filtros-reseteados="resetearFiltros"
      />
      
      <!-- Botones de Excel -->
      <div class="q-mb-md row q-gutter-md">
        <ButtonGenerateExcel
          ref="buttonGenerateExcel"
          :data="registros"
          :columns="columnsForExcel"
          :filters="filtrosActuales"
          file-name="registros"
          sheet-name="Registros"
          @export-started="onExportStarted"
          @export-completed="onExportCompleted"
          @generation-started="onGenerationStarted"
          @generation-completed="onGenerationCompleted"
        />
        
        <!-- Botón para descargar Excel existente -->
        <q-btn
          v-if="archivoExcelExiste"
          color="secondary"
          icon="download"
          label="Descargar Excel Generado"
          @click="descargarExcelExistente"
          :loading="descargandoExcel"
        >
          <q-tooltip v-if="fechaUltimoExcel">
            Último archivo generado: {{ formatearFecha(fechaUltimoExcel) }}
          </q-tooltip>
        </q-btn>
      </div>
      
      <!-- Tabla de Registros -->
      <q-card>
        <q-card-section>
          <q-table
            :rows="registros"
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

            <template v-slot:body-cell-acciones="props">
              <q-td :props="props">
                <q-btn
                  flat
                  dense
                  round
                  icon="visibility"
                  color="primary"
                  @click="verRegistro(props.row)"
                >
                  <q-tooltip>Ver detalles</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  icon="edit"
                  color="warning"
                  @click="editarRegistro(props.row)"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  @click="eliminarRegistro(props.row)"
                >
                  <q-tooltip>Eliminar</q-tooltip>
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
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { registrosService } from 'src/services/registros.service'
import FormFiltros from 'src/components/FormFiltros.vue'
import ButtonGenerateExcel from 'src/components/ButtonGenerateExcel.vue'

const $q = useQuasar()

const registros = ref([])
const loading = ref(false)
const totalRegistros = ref(0)
const filtrosActuales = ref({})
const archivoExcelExiste = ref(false)
const fechaUltimoExcel = ref(null)
const descargandoExcel = ref(false)
const buttonGenerateExcel = ref(null)

const pagination = ref({
  sortBy: 'fecha_registro',
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
    name: 'fecha_registro',
    label: 'Fecha Registro',
    field: 'fecha_registro',
    align: 'left',
    sortable: true,
    format: val => {
      if (!val) return ''
      const fecha = new Date(val)
      return fecha.toLocaleDateString('es-ES')
    }
  },
  {
    name: 'usuario',
    label: 'Usuario',
    field: row => row.usuario?.username || row.usuario?.nombre_completo || 'N/A',
    align: 'left',
    sortable: false
  },
  {
    name: 'sucursal',
    label: 'Sucursal',
    field: row => row.sucursal?.nombre || 'N/A',
    align: 'left',
    sortable: false
  },
  {
    name: 'tarea',
    label: 'Tarea',
    field: row => row.tarea?.nombre || 'N/A',
    align: 'left',
    sortable: false
  },
  {
    name: 'cantidad_horas',
    label: 'Horas',
    field: 'cantidad_horas',
    align: 'right',
    sortable: true,
    format: val => val ? parseFloat(val).toFixed(2) : '0.00'
  },
  {
    name: 'observaciones',
    label: 'Observaciones',
    field: 'observaciones',
    align: 'left',
    sortable: false
  },
  {
    name: 'activo',
    label: 'Estado',
    field: 'activo',
    align: 'center',
    sortable: true
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center',
    sortable: false
  }
]

// Columnas para exportar a Excel (con más detalles)
const columnsForExcel = [
  { name: 'id', label: 'ID', field: 'id' },
  { 
    name: 'fecha_registro', 
    label: 'Fecha Registro', 
    field: row => {
      if (!row.fecha_registro) return ''
      const fecha = new Date(row.fecha_registro)
      return fecha.toLocaleDateString('es-ES')
    }
  },
  { name: 'usuario', label: 'Usuario', field: row => row.usuario?.username || row.usuario?.nombre_completo || '' },
  { name: 'sucursal', label: 'Sucursal', field: row => row.sucursal?.nombre || '' },
  { name: 'subempresa', label: 'Subempresa', field: row => row.subempresa?.nombre || '' },
  { name: 'tarea', label: 'Tarea', field: row => row.tarea?.nombre || '' },
  { name: 'cantidad_horas', label: 'Cantidad Horas', field: 'cantidad_horas' },
  { name: 'observaciones', label: 'Observaciones', field: 'observaciones' },
  { name: 'activo', label: 'Activo', field: row => row.activo ? 'Sí' : 'No' },
  { name: 'categoria', label: 'Categoria', field: row => row.categoria?.descripcion || '' },
  { name: 'empresa', label: 'Empresa', field: row => row.empresa?.nombre || '' },
  { name: 'grupo_empresa', label: 'Grupo Empresa', field: row => row.grupo_empresa?.nombre || '' },
  { name: 'ano_contable', label: 'Año Contable', field: 'ano_contable' },
  { 
    name: 'fecha_generado', 
    label: 'Fecha Generado', 
    field: row => {
      if (!row.fecha_generado) return ''
      const fecha = new Date(row.fecha_generado)
      return fecha.toLocaleDateString('es-ES')
    }
  },
  { name: 'created_by', label: 'Creado Por', field: row => row.created_by?.username || '' },
  { 
    name: 'created_at', 
    label: 'Creado el', 
    field: row => {
      if (!row.created_at) return ''
      const fecha = new Date(row.created_at)
      return fecha.toLocaleDateString('es-ES')
    }
  }
]

const cargarRegistros = async () => {
  loading.value = true
  
  try {
    console.log('🔄 Cargando registros con filtros:', filtrosActuales.value)
    
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

    console.log('📤 Parámetros de petición:', params)

    const response = await registrosService.getRegistros(params)
    
    console.log('✅ Respuesta recibida:', response)
    
    registros.value = response.results
    totalRegistros.value = response.count
    pagination.value.rowsNumber = response.count

    $q.notify({
      type: 'positive',
      message: `Se cargaron ${response.results.length} registros`,
      position: 'top',
      timeout: 1500
    })
  } catch (error) {
    console.error('❌ Error al cargar registros:', error)
    
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || 'Error al cargar registros. Verifica que Django esté corriendo.',
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
  
  cargarRegistros()
}

// Manejo de filtros desde FormFiltros
const aplicarFiltros = (filtros) => {
  console.log('🔍 Filtros aplicados desde FormFiltros:', filtros)
  
  // Mapeo de nombres de filtros del frontend al backend
  const mapeoFiltros = {
    empresa: 'empresa',
    usuarioAsignado: 'usuario',
    rubro: 'rubro',
    tarea: 'tarea',
    fechaDesde: 'fecha_desde',
    fechaHasta: 'fecha_hasta',
    anioContable: 'ano_contable'
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
  cargarRegistros()
}

const resetearFiltros = () => {
  console.log('🔄 Filtros reseteados')
  filtrosActuales.value = {}
  pagination.value.page = 1
  
  // Recargar registros sin filtros
  cargarRegistros()
}

const verRegistro = (registro) => {
  $q.dialog({
    title: `Registro #${registro.id}`,
    message: registro.observaciones || 'Sin observaciones',
    html: true,
    ok: {
      label: 'Cerrar',
      color: 'primary'
    },
    style: 'max-width: 800px'
  })
}

const editarRegistro = async (registro) => {
  console.log('✏️ Editar registro:', registro)
  $q.notify({
    type: 'info',
    message: `Función de edición no implementada aún para registro #${registro.id}`,
    position: 'top',
    timeout: 2000
  })
  // Aquí puedes implementar la lógica de edición
  // Por ejemplo, abrir un diálogo con un formulario
}

const eliminarRegistro = async (registro) => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de que deseas eliminar el registro #${registro.id}?`,
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
      console.log('🗑️ Eliminando registro:', registro.id)
      
      await registrosService.deleteRegistro(registro.id)
      
      $q.notify({
        type: 'positive',
        message: 'Registro eliminado correctamente',
        position: 'top',
        timeout: 2000
      })
      
      // Recargar la lista
      cargarRegistros()
    } catch (error) {
      console.error('❌ Error al eliminar registro:', error)
      
      $q.notify({
        type: 'negative',
        message: error.response?.data?.detail || 'Error al eliminar registro',
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
    const response = await registrosService.getExcelRegistros()
    
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
    
    const response = await registrosService.downloadExcelRegistros()
    
    // Crear un blob y descargarlo
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Obtener el nombre del archivo desde la respuesta, headers o usar uno por defecto
    let fileName = response.fileName || 'registros_generado.xlsx'
    
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

// Cargar registros al montar el componente
onMounted(() => {
  console.log('🚀 Componente IndexPage montado, cargando registros...')
  cargarRegistros()
  verificarArchivoExcel()
})
</script>

