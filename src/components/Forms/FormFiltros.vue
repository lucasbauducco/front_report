<template>
  <div class="q-pa-md q-mx-auto filtro-centro-contenedor">
    <!-- Botón para mostrar/ocultar filtros -->
    <div class="row justify-center q-mb-md">
      <q-btn
        :icon="filtrosVisibles ? 'expand_less' : 'expand_more'"
        :label="filtrosVisibles ? 'Ocultar Filtros' : 'Mostrar Filtros'"
        color="primary"
        outline
        @click="toggleFiltros"
        class="filtros-toggle-btn"
      >
        <q-badge
          v-if="hayFiltrosActivos"
          color="accent"
          floating
          rounded
        />
      </q-btn>
    </div>

    <!-- Formulario de filtros con transición -->
    <transition
      name="slide-fade"
      appear
    >
      <q-form
        v-show="filtrosVisibles"
        @submit="filtrar"
        @reset="onReset"
        class="q-gutter-md form-background"
      >
      <div class="q-pa-md">
        <div class="q-gutter-md row justify-center">
            <!-- Empresa (solo para registros y ausencias) -->
            <q-select
              v-if="tipo !== 'control_horas'"
              filled
              v-model="empresa"
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
              hint="Empresa"
              style="width: 230px; padding-bottom: 16px"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Usuarios asignados -->
            <q-select
              filled
              v-model="usuarioAsignado"
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
              hint="Usuarios asignados"
              style="width: 230px; padding-bottom: 16px"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Rubros (solo para registros) -->
            <q-select
              v-if="tipo === 'registros'"
              filled
              v-model="rubro"
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              :options="opcionesRubros"
              @filter="filterRubros"
              option-value="id"
              option-label="nombre"
              emit-value
              map-options
              hint="Rubros"
              style="width: 230px; padding-bottom: 16px"
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
      </div>

      <div class="q-pa-md">
        <div class="q-gutter-md row justify-center">
            <!-- Tareas (solo para registros) -->
            <q-select
              v-if="tipo === 'registros'"
              filled
              v-model="tarea"
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
              hint="Tareas"
              style="width: 230px; padding-bottom: 16px"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            
            <!-- Fecha desde -->
            <div style="min-width: 130px; padding-bottom: 16px; display: flex; flex-direction: column; align-items: flex-start;">
              <q-input
                filled
                v-model="fechaDesde"
                mask="####-##-##"
                hint="Fecha desde"
                stack-label
                style="width: 160px;"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="fechaDesde" mask="YYYY-MM-DD"/>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <!-- Fecha hasta -->
            <div style="min-width: 130px; padding-bottom: 16px; display: flex; flex-direction: column; align-items: flex-start;">
              <q-input
                filled
                v-model="fechaHasta"
                mask="####-##-##"
                hint="Fecha hasta"
                stack-label
                style="width: 160px;"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="fechaHasta" mask="YYYY-MM-DD"/>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
        </div>
      </div>

      <div class="q-pa-md">
        <div class="q-gutter-md row justify items-center">
          <!-- Año contable (solo para registros) -->
          <q-input
            v-if="tipo === 'registros'"
            filled
            type="number"
            v-model="anioContable"
            label="Año contable:"
            lazy-rules
            style="width: 180px; min-width: 130px"
            :rules="[
              val => val !== null && val !== '' || 'Ingrese el año contable',
              val => val > 1900 && val < 2100 || 'Ingrese un año válido'
            ]"
          />

          <div class="q-ml-md" style="display: flex; gap: 8px;">
            <q-btn label="Aplicar filtros" type="submit" color="primary" icon="filter_list"/>
            <q-btn label="Limpiar filtros" type="reset" color="negative" flat icon="delete" />
          </div>
        </div>
      </div>
    </q-form>
    </transition>
  </div>
</template>

<style scoped>
.form-background {
  background-color:rgb(233, 233, 233);
  margin: 10px;
}
.filtro-centro-contenedor {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.filtros-toggle-btn {
  min-width: 180px;
}

.filtro-row {
  width: 100%;
  justify-content: left;
  gap: 24px;
}

/* Transiciones para mostrar/ocultar */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@media (max-width: 800px) {
  .filtro-centro-contenedor {
    max-width: 100vw;
    padding: 0 !important;
  }
  .filtro-row {
    flex-direction: column !important;
    align-items: center;
    gap: 10px;
  }
  
  .filtros-toggle-btn {
    min-width: 150px;
    font-size: 0.875rem;
  }
}
</style>

<script>
import { useQuasar } from 'quasar'
import { ref, computed, onMounted } from 'vue'
import registrosService from 'src/services/registros.service'

export default {
  props: {
    tipo: {
      type: String,
      default: 'registros', // 'registros', 'ausencias', 'control_horas'
      validator: (value) => ['registros', 'ausencias', 'control_horas'].includes(value)
    }
  },
  emits: ['filtros-aplicados', 'filtros-reseteados'],
  
  setup (props, { emit }) {
    const $q = useQuasar()

    // Estado de visibilidad del formulario
    const filtrosVisibles = ref(false)

    // Estado de los filtros
    const empresa = ref(null)
    const usuarioAsignado = ref(null)
    const rubro = ref(null)
    const tarea = ref(null)
    const fechaDesde = ref(null)
    const fechaHasta = ref(null)
    const anioContable = ref(null)

    // Computed para verificar si hay filtros activos
    const hayFiltrosActivos = computed(() => {
      if (props.tipo === 'control_horas') {
        return !!(
          usuarioAsignado.value ||
          fechaDesde.value ||
          fechaHasta.value
        )
      } else if (props.tipo === 'ausencias') {
        return !!(
          empresa.value ||
          usuarioAsignado.value ||
          fechaDesde.value ||
          fechaHasta.value
        )
      } else {
        // registros
        return !!(
          empresa.value ||
          usuarioAsignado.value ||
          rubro.value ||
          tarea.value ||
          fechaDesde.value ||
          fechaHasta.value ||
          anioContable.value
        )
      }
    })

    // Función para mostrar/ocultar filtros
    function toggleFiltros() {
      filtrosVisibles.value = !filtrosVisibles.value
    }

    // Opciones para selects
    const opcionesEmpresas = ref([])
    const opcionesUsuarios = ref([])
    const opcionesRubros = ref([])
    const opcionesTareas = ref([])

    // Datos originales completos
    const empresasCompletas = ref([])
    const usuariosCompletos = ref([])
    const rubrosCompletos = ref([])
    const tareasCompletas = ref([])

    // Cargar datos iniciales
    async function cargarDatosFiltros() {
      try {
        if (props.tipo === 'control_horas') {
          // Solo cargar usuarios para control de horas
          const usuariosData = await registrosService.getUsuariosAsignados()
          usuariosCompletos.value = usuariosData
          opcionesUsuarios.value = []
        } else {
          // Cargar todos los datos en paralelo para registros y ausencias
          const [empresasData, rubrosData, tareasData, usuariosData] = await Promise.all([
            registrosService.getEmpresas(),
            registrosService.getRubros(),
            registrosService.getTareas(),
            registrosService.getUsuariosAsignados()
          ])

          // Guardar datos completos
          empresasCompletas.value = empresasData
          rubrosCompletos.value = rubrosData
          tareasCompletas.value = tareasData
          usuariosCompletos.value = usuariosData

          // Inicializar opciones (vacías hasta que el usuario busque)
          opcionesEmpresas.value = []
          opcionesRubros.value = []
          opcionesTareas.value = []
        }
        
        // Inicializar opciones de usuarios (siempre necesario)
        opcionesUsuarios.value = []
      } catch (error) {
        console.error('Error al cargar datos de filtros:', error)
        $q.notify({
          color: 'negative',
          textColor: 'white',
          icon: 'error',
          message: 'Error al cargar datos de filtros'
        })
      }
    }

    // Métodos de filtrado para autocomplete
    function filterEmpresas (val, update) {
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

    function filterUsuarios (val, update) {
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

    function filterRubros (val, update) {
      update(() => {
        if (!val || val === '') {
          opcionesRubros.value = rubrosCompletos.value.slice(0, 20)
        } else {
          const needle = val.toLowerCase()
          opcionesRubros.value = rubrosCompletos.value.filter(
            rub => rub.nombre?.toLowerCase().includes(needle)
          ).slice(0, 20)
        }
      })
    }

    function filterTareas (val, update) {
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

    // Cargar datos al montar el componente
    onMounted(() => {
      cargarDatosFiltros()
    })

    // PETICIÓN FILTRAR:
    async function filtrar () {
      const filtros = {
        empresa: empresa.value,
        usuarioAsignado: usuarioAsignado.value,
        rubro: rubro.value,
        tarea: tarea.value,
        fechaDesde: fechaDesde.value,
        fechaHasta: fechaHasta.value,
        anioContable: anioContable.value
      }
      
      // Emitir los filtros aplicados
      emit('filtros-aplicados', filtros)
      
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'filter_list',
        message: 'Filtros aplicados'
      })
    }

    function onReset () {
      empresa.value = null
      usuarioAsignado.value = null
      rubro.value = null
      tarea.value = null
      fechaDesde.value = null
      fechaHasta.value = null
      anioContable.value = null
      
      // Emitir evento de reset
      emit('filtros-reseteados')
      
      $q.notify({
        color: 'blue-4',
        textColor: 'white',
        icon: 'clear_all',
        message: 'Filtros limpiados'
      })
    }

    return {
      filtrosVisibles,
      hayFiltrosActivos,
      toggleFiltros,

      empresa,
      usuarioAsignado,
      rubro,
      tarea,
      fechaDesde,
      fechaHasta,
      anioContable,

      opcionesEmpresas,
      opcionesUsuarios,
      opcionesRubros,
      opcionesTareas,

      filterEmpresas,
      filterUsuarios,
      filterRubros,
      filterTareas,

      filtrar,
      onReset,
      cargarDatosFiltros
    }
  }
}
</script>