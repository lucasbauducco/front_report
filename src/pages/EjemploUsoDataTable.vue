<template>
  <div>
    <!-- Ejemplo 1: Tabla simple de usuarios -->
    <DataTable
      title="Usuarios"
      api-endpoint="/usuarios/"
      :columns="usuariosColumns"
      row-key="id"
    />

    <!-- Ejemplo 2: Tabla con parser y backup data -->
    <DataTable
      title="Tareas"
      api-endpoint="/tareas/"
      :columns="tareasColumns"
      :data-parser="parseTarea"
      :backup-data="tareasBackup"
      row-key="id"
      search-placeholder="Buscar tarea..."
    />

    <!-- Ejemplo 3: Tabla con acciones personalizadas -->
    <DataTable
      title="Productos"
      api-endpoint="/productos/"
      :columns="productosColumns"
      row-key="id"
      @data-loaded="onProductosLoaded"
    >
      <!-- Slot para acciones personalizadas en cada fila -->
      <template #actions="{ row }">
        <q-btn 
          flat 
          dense 
          round 
          icon="edit" 
          @click="editarProducto(row)"
        />
        <q-btn 
          flat 
          dense 
          round 
          icon="delete" 
          color="negative"
          @click="eliminarProducto(row)"
        />
      </template>
    </DataTable>

    <!-- Ejemplo 4: Tabla con parámetros de consulta -->
    <DataTable
      ref="ventasTable"
      title="Ventas del Mes"
      api-endpoint="/ventas/"
      :columns="ventasColumns"
      :query-params="ventasParams"
      row-key="id"
    />
    
    <q-btn 
      label="Refrescar Ventas" 
      @click="refrescarVentas"
      class="q-mt-md"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import DataTable from 'src/components/DataTable.vue'

export default {
  name: 'EjemploUsoDataTable',
  
  components: {
    DataTable
  },

  setup() {
    const ventasTable = ref(null)

    // ========== EJEMPLO 1: Usuarios ==========
    const usuariosColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'nombre', label: 'Nombre', field: 'nombre_completo', align: 'left', sortable: true },
      { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
      { name: 'activo', label: 'Activo', field: row => row.activo ? 'Sí' : 'No', align: 'center', sortable: true },
    ]

    // ========== EJEMPLO 2: Tareas ==========
    const tareasColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
      { name: 'categoria', label: 'Categoría', field: 'categoria_nombre', align: 'left', sortable: true },
      { name: 'estado', label: 'Estado', field: 'estado', align: 'center', sortable: true },
    ]

    const tareasBackup = [
      { id: 1, nombre: 'Tarea de ejemplo', categoria: { nombre: 'General' }, estado: 'Pendiente' }
    ]

    const parseTarea = (tarea) => {
      return {
        ...tarea,
        categoria_nombre: tarea.categoria?.nombre || 'Sin categoría',
        estado: tarea.completada ? 'Completada' : 'Pendiente'
      }
    }

    // ========== EJEMPLO 3: Productos con acciones ==========
    const productosColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
      { name: 'precio', label: 'Precio', field: 'precio', align: 'right', sortable: true },
      { name: 'stock', label: 'Stock', field: 'stock', align: 'right', sortable: true },
      { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
    ]

    const editarProducto = (producto) => {
      console.log('Editar producto:', producto)
      // Aquí iría tu lógica de edición
    }

    const eliminarProducto = (producto) => {
      console.log('Eliminar producto:', producto)
      // Aquí iría tu lógica de eliminación
    }

    const onProductosLoaded = (data) => {
      console.log('Productos cargados:', data.length)
    }

    // ========== EJEMPLO 4: Ventas con parámetros ==========
    const ventasColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'fecha', label: 'Fecha', field: 'fecha', align: 'left', sortable: true },
      { name: 'cliente', label: 'Cliente', field: 'cliente_nombre', align: 'left', sortable: true },
      { name: 'total', label: 'Total', field: 'total', align: 'right', sortable: true },
    ]

    const ventasParams = ref({
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear()
    })

    const refrescarVentas = () => {
      if (ventasTable.value) {
        ventasTable.value.refresh()
      }
    }

    return {
      ventasTable,
      // Ejemplo 1
      usuariosColumns,
      // Ejemplo 2
      tareasColumns,
      tareasBackup,
      parseTarea,
      // Ejemplo 3
      productosColumns,
      editarProducto,
      eliminarProducto,
      onProductosLoaded,
      // Ejemplo 4
      ventasColumns,
      ventasParams,
      refrescarVentas
    }
  }
}
</script>


