# DataTable - Componente Reutilizable

Componente de tabla reutilizable basado en Quasar Table con funcionalidades integradas de carga de datos desde API, búsqueda, paginación y más.

## 📋 Características

- ✅ Carga automática de datos desde API
- ✅ Búsqueda integrada
- ✅ Paginación configurable
- ✅ Indicador de carga
- ✅ Datos de respaldo (backup) en caso de error
- ✅ Parser de datos personalizable
- ✅ Slots para acciones personalizadas
- ✅ Eventos para monitorear carga de datos
- ✅ Método público `refresh()` para recargar datos
- ✅ Soporte para parámetros de consulta dinámicos

## 🚀 Uso Básico

```vue
<template>
  <DataTable
    title="Mis Datos"
    api-endpoint="/api/datos/"
    :columns="columns"
    row-key="id"
  />
</template>

<script>
import DataTable from 'src/components/DataTable.vue'

export default {
  components: { DataTable },
  
  setup() {
    const columns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
    ]

    return { columns }
  }
}
</script>
```

## 📝 Props

### Requeridas

| Prop | Tipo | Descripción |
|------|------|-------------|
| `columns` | Array | Columnas de la tabla (formato Quasar Table) |
| `api-endpoint` | String | Endpoint de la API para obtener los datos |

### Opcionales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | String | `'Datos'` | Título de la tabla |
| `data-parser` | Function | `null` | Función para transformar cada registro antes de mostrarlo |
| `backup-data` | Array | `[]` | Datos de respaldo en caso de error o respuesta vacía |
| `row-key` | String | `'id'` | Clave única para cada fila |
| `searchable` | Boolean | `true` | Habilitar/deshabilitar búsqueda |
| `search-placeholder` | String | `'Buscar'` | Placeholder del campo de búsqueda |
| `no-data-label` | String | `'No se encontraron registros'` | Mensaje cuando no hay datos |
| `no-results-label` | String | `'La búsqueda no encontró resultados'` | Mensaje cuando no hay resultados de búsqueda |
| `rows-per-page-options` | Array | `[10, 25, 50, 100]` | Opciones de filas por página |
| `auto-load` | Boolean | `true` | Cargar datos automáticamente al montar |
| `query-params` | Object | `{}` | Parámetros adicionales para la consulta API |

## 🎯 Eventos

| Evento | Parámetros | Descripción |
|--------|-----------|-------------|
| `data-loaded` | `(data: Array)` | Se emite cuando los datos se cargan exitosamente |
| `data-error` | `(error: Error)` | Se emite cuando ocurre un error al cargar datos |
| `refresh` | - | Se emite cuando se llama al método refresh() |

## 🎨 Slots

### `actions`

Slot para agregar acciones personalizadas en cada fila.

**Scope:** `{ row }` - El registro de la fila actual

**Ejemplo:**

```vue
<DataTable
  :columns="columns"
  api-endpoint="/productos/"
>
  <template #actions="{ row }">
    <q-btn flat dense round icon="edit" @click="editar(row)" />
    <q-btn flat dense round icon="delete" @click="eliminar(row)" />
  </template>
</DataTable>
```

**Nota:** Debes incluir una columna con `name: 'actions'` en tu array de columnas.

## 📚 Ejemplos de Uso

### Ejemplo 1: Tabla Simple

```vue
<DataTable
  title="Usuarios"
  api-endpoint="/usuarios/"
  :columns="columns"
  row-key="id"
/>
```

### Ejemplo 2: Con Parser y Backup Data

```vue
<template>
  <DataTable
    title="Registros"
    api-endpoint="/registros/"
    :columns="columns"
    :data-parser="parseRegistro"
    :backup-data="backupData"
  />
</template>

<script>
import backupData from '../assets/backup.json'

export default {
  setup() {
    const parseRegistro = (reg) => {
      return {
        ...reg,
        usuario_nombre: reg.usuario?.nombre_completo || '',
        fecha_formateada: reg.fecha ? reg.fecha.slice(0, 10) : '',
      }
    }

    const columns = [
      { name: 'id', label: 'ID', field: 'id', sortable: true },
      { name: 'usuario', label: 'Usuario', field: 'usuario_nombre', sortable: true },
      { name: 'fecha', label: 'Fecha', field: 'fecha_formateada', sortable: true },
    ]

    return { columns, parseRegistro, backupData }
  }
}
</script>
```

### Ejemplo 3: Con Acciones Personalizadas

```vue
<template>
  <DataTable
    title="Productos"
    api-endpoint="/productos/"
    :columns="columns"
  >
    <template #actions="{ row }">
      <q-btn 
        flat dense round 
        icon="edit" 
        @click="editarProducto(row)"
      />
      <q-btn 
        flat dense round 
        icon="delete" 
        color="negative"
        @click="eliminarProducto(row)"
      />
    </template>
  </DataTable>
</template>

<script>
export default {
  setup() {
    const columns = [
      { name: 'id', label: 'ID', field: 'id', sortable: true },
      { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true },
      { name: 'precio', label: 'Precio', field: 'precio', sortable: true },
      { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
    ]

    const editarProducto = (producto) => {
      console.log('Editar:', producto)
    }

    const eliminarProducto = (producto) => {
      console.log('Eliminar:', producto)
    }

    return { columns, editarProducto, eliminarProducto }
  }
}
</script>
```

### Ejemplo 4: Con Parámetros de Consulta y Refresh

```vue
<template>
  <div>
    <DataTable
      ref="tablaRef"
      title="Ventas"
      api-endpoint="/ventas/"
      :columns="columns"
      :query-params="params"
    />
    
    <q-btn label="Refrescar" @click="refrescar" />
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const tablaRef = ref(null)
    
    const params = ref({
      mes: 11,
      anio: 2025
    })

    const columns = [
      { name: 'id', label: 'ID', field: 'id', sortable: true },
      { name: 'total', label: 'Total', field: 'total', sortable: true },
    ]

    const refrescar = () => {
      if (tablaRef.value) {
        tablaRef.value.refresh()
      }
    }

    return { tablaRef, columns, params, refrescar }
  }
}
</script>
```

### Ejemplo 5: Con Eventos

```vue
<template>
  <DataTable
    title="Clientes"
    api-endpoint="/clientes/"
    :columns="columns"
    @data-loaded="onDataLoaded"
    @data-error="onDataError"
  />
</template>

<script>
import { useQuasar } from 'quasar'

export default {
  setup() {
    const $q = useQuasar()

    const columns = [
      { name: 'id', label: 'ID', field: 'id', sortable: true },
      { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true },
    ]

    const onDataLoaded = (data) => {
      $q.notify({
        type: 'positive',
        message: `${data.length} clientes cargados`
      })
    }

    const onDataError = (error) => {
      $q.notify({
        type: 'negative',
        message: 'Error al cargar clientes'
      })
    }

    return { columns, onDataLoaded, onDataError }
  }
}
</script>
```

## 🔧 Métodos Públicos

### `refresh()`

Recarga los datos desde la API.

```vue
<template>
  <DataTable ref="tabla" ... />
  <q-btn @click="recargar" label="Recargar" />
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const tabla = ref(null)
    
    const recargar = () => {
      tabla.value.refresh()
    }
    
    return { tabla, recargar }
  }
}
</script>
```

### `fetchData()`

Método interno expuesto para cargar datos manualmente (similar a `refresh()`).

## 💡 Tips

1. **Parser de datos**: Usa `data-parser` para transformar datos anidados o formatear fechas antes de mostrarlos.

2. **Backup data**: Siempre proporciona `backup-data` para desarrollo o cuando la API no esté disponible.

3. **Query params reactivos**: Los `query-params` son reactivos, cuando cambien se recargarán los datos automáticamente.

4. **Columnas con funciones**: Puedes usar funciones en el campo `field` de las columnas para transformar datos:
   ```javascript
   { 
     name: 'activo', 
     label: 'Activo', 
     field: row => row.activo ? 'Sí' : 'No' 
   }
   ```

5. **Desactivar auto-carga**: Si necesitas cargar datos manualmente, usa `:auto-load="false"` y llama a `fetchData()` cuando lo necesites.

## 🎨 Personalización

El componente usa clases de Quasar, puedes personalizarlo con CSS o props adicionales de `q-table` modificando el componente base.

## 📦 Dependencias

- Vue 3 (Composition API)
- Quasar Framework
- Axios (configurado en `boot/axios`)


