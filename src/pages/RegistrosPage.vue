<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">Registros</div>
      
      <!-- Filtros -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Filtros</div>
        </q-card-section>
        
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="filtros.search"
                label="Buscar"
                outlined
                dense
                clearable
                @update:model-value="buscarRegistros"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="filtros.fecha_desde"
                label="Fecha Desde"
                type="date"
                outlined
                dense
                clearable
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="filtros.fecha_hasta"
                label="Fecha Hasta"
                type="date"
                outlined
                dense
                clearable
              />
            </div>

            <div class="col-12 col-md-4">
              <q-select
                v-model="filtros.activo"
                :options="opcionesActivo"
                label="Estado"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model.number="filtros.ano_contable"
                label="Año Contable"
                type="number"
                outlined
                dense
                clearable
              />
            </div>

            <div class="col-12 col-md-4 flex items-end">
              <q-btn
                label="Aplicar Filtros"
                color="primary"
                @click="cargarRegistros"
                :loading="loading"
                class="full-width"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabla de Registros -->
      <q-card>
        <q-card-section>
          <q-table
            :rows="registros"
            :columns="columnas"
            :loading="loading"
            row-key="id"
            :pagination.sync="pagination"
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
        <p>Total de registros: {{ totalRegistros }}</p>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { registrosService } from 'src/services/registros.service'

export default {
  name: 'RegistrosPage',
  
  setup() {
    const $q = useQuasar()
    
    const registros = ref([])
    const loading = ref(false)
    const totalRegistros = ref(0)
    
    const filtros = ref({
      search: '',
      fecha_desde: '',
      fecha_hasta: '',
      activo: null,
      ano_contable: null,
      usuario: null,
      sucursal: null,
      subempresa: null,
      tarea: null,
      empresa: null,
      grupo_empresa: null
    })

    const pagination = ref({
      sortBy: 'fecha_registro',
      descending: true,
      page: 1,
      rowsPerPage: 20,
      rowsNumber: 0
    })

    const opcionesActivo = [
      { label: 'Activo', value: true },
      { label: 'Inactivo', value: false }
    ]

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
        label: 'Fecha',
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
        field: row => row.usuario?.username || 'N/A',
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

    const cargarRegistros = async () => {
      loading.value = true
      
      try {
        // Preparar parámetros de consulta
        const params = {
          page: pagination.value.page,
          page_size: pagination.value.rowsPerPage
        }

        // Añadir filtros activos
        Object.keys(filtros.value).forEach(key => {
          if (filtros.value[key] !== null && filtros.value[key] !== '') {
            params[key] = filtros.value[key]
          }
        })

        const response = await registrosService.getRegistros(params)
        
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
        console.error('Error al cargar registros:', error)
        
        $q.notify({
          type: 'negative',
          message: error.response?.data?.detail || 'Error al cargar registros',
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

    const buscarRegistros = () => {
      // Resetear a la primera página al buscar
      pagination.value.page = 1
      cargarRegistros()
    }

    const verRegistro = (registro) => {
      $q.dialog({
        title: `Registro #${registro.id}`,
        message: registro.observaciones || 'Sin observaciones',
        html: true,
        ok: 'Cerrar'
      })
    }

    const editarRegistro = async (registro) => {
      $q.notify({
        type: 'info',
        message: 'Función de edición no implementada aún',
        position: 'top'
      })
      // Aquí puedes implementar la lógica de edición
    }

    const eliminarRegistro = async (registro) => {
      $q.dialog({
        title: 'Confirmar eliminación',
        message: `¿Estás seguro de que deseas eliminar el registro #${registro.id}?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await registrosService.deleteRegistro(registro.id)
          
          $q.notify({
            type: 'positive',
            message: 'Registro eliminado correctamente',
            position: 'top',
            timeout: 2000
          })
          
          cargarRegistros()
        } catch (error) {
          console.error('Error al eliminar registro:', error)
          
          $q.notify({
            type: 'negative',
            message: error.response?.data?.detail || 'Error al eliminar registro',
            position: 'top',
            timeout: 3000
          })
        }
      })
    }

    onMounted(() => {
      cargarRegistros()
    })

    return {
      registros,
      loading,
      totalRegistros,
      filtros,
      pagination,
      opcionesActivo,
      columnas,
      cargarRegistros,
      onRequest,
      buscarRegistros,
      verRegistro,
      editarRegistro,
      eliminarRegistro
    }
  }
}
</script>

<style scoped>
.q-table {
  /* Estilos personalizados si es necesario */
}
</style>

