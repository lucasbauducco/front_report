<template>
  <div class="q-pa-md">
    <q-table
      flat
      bordered
      :title="title"
      :rows="rows"
      :columns="columns"
      :filter="filter"
      :loading="loading"
      :no-data-label="noDataLabel"
      :no-results-label="noResultsLabel"
      :row-key="rowKey"
      :rows-per-page-options="rowsPerPageOptions"
    >
      <template v-slot:top-right>
        <q-input 
          v-if="searchable"
          borderless 
          dense 
          debounce="300" 
          v-model="filter" 
          :placeholder="searchPlaceholder"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:no-data="{ icon, message, filter }">
        <div class="full-width row flex-center text-accent q-gutter-sm">
          <q-icon size="2em" name="sentiment_dissatisfied" />
          <span>
            {{ message }}
          </span>
          <q-icon size="2em" :name="filter ? 'filter_b_and_w' : icon" />
        </div>
      </template>

      <!-- Slot para acciones personalizadas en cada fila -->
      <template v-if="$slots.actions" v-slot:body-cell-actions="props">
        <q-td :props="props">
          <slot name="actions" :row="props.row"></slot>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { api } from 'src/boot/axios'

export default {
  name: 'DataTable',
  
  props: {
    // Título de la tabla
    title: {
      type: String,
      default: 'Datos'
    },
    
    // Columnas de la tabla (formato Quasar)
    columns: {
      type: Array,
      required: true
    },
    
    // Endpoint de la API para obtener los datos
    apiEndpoint: {
      type: String,
      required: true
    },
    
    // Función opcional para transformar los datos antes de mostrarlos
    dataParser: {
      type: Function,
      default: null
    },
    
    // Datos de respaldo en caso de error o respuesta vacía
    backupData: {
      type: Array,
      default: () => []
    },
    
    // Clave única para cada fila
    rowKey: {
      type: String,
      default: 'id'
    },
    
    // Habilitar búsqueda
    searchable: {
      type: Boolean,
      default: true
    },
    
    // Placeholder del buscador
    searchPlaceholder: {
      type: String,
      default: 'Buscar'
    },
    
    // Mensaje cuando no hay datos
    noDataLabel: {
      type: String,
      default: 'No se encontraron registros'
    },
    
    // Mensaje cuando no hay resultados de búsqueda
    noResultsLabel: {
      type: String,
      default: 'La búsqueda no encontró resultados'
    },
    
    // Opciones de filas por página
    rowsPerPageOptions: {
      type: Array,
      default: () => [10, 25, 50, 100]
    },
    
    // Auto-cargar datos al montar
    autoLoad: {
      type: Boolean,
      default: true
    },
    
    // Parámetros adicionales para la consulta API
    queryParams: {
      type: Object,
      default: () => ({})
    }
  },
  
  emits: ['data-loaded', 'data-error', 'refresh'],
  
  setup(props, { emit }) {
    const rows = ref([])
    const filter = ref('')
    const loading = ref(false)
    
    const fetchData = async () => {
      loading.value = true
      try {
        const resp = await api.get(props.apiEndpoint, { params: props.queryParams })
        
        // Si la API devuelve data no vacía
        if (resp.data && resp.data.length) {
          // Aplicar parser si existe
          rows.value = props.dataParser 
            ? resp.data.map(props.dataParser)
            : resp.data
          
          emit('data-loaded', rows.value)
        } else {
          // Si la API no devuelve nada, usar backup
          rows.value = props.backupData && Array.isArray(props.backupData)
            ? (props.dataParser ? props.backupData.map(props.dataParser) : props.backupData)
            : []
          
          emit('data-loaded', rows.value)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        
        // En caso de error, usar backup
        rows.value = props.backupData && Array.isArray(props.backupData)
          ? (props.dataParser ? props.backupData.map(props.dataParser) : props.backupData)
          : []
        
        emit('data-error', err)
      } finally {
        loading.value = false
      }
    }
    
    // Método público para refrescar datos
    const refresh = () => {
      fetchData()
      emit('refresh')
    }
    
    // Watch para cambios en queryParams
    watch(() => props.queryParams, () => {
      if (props.autoLoad) {
        fetchData()
      }
    }, { deep: true })
    
    onMounted(() => {
      if (props.autoLoad) {
        fetchData()
      }
    })
    
    return {
      rows,
      filter,
      loading,
      refresh,
      fetchData
    }
  }
}
</script>

