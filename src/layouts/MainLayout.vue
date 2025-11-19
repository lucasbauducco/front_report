<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="report-header">
      <q-toolbar class="q-py-sm">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        
        <q-toolbar-title>
          <span class="report-typography">
            <span class="text-grey-3" style="font-weight: 300;">Report</span><span class="text-grey-3" style="font-weight: 100;">+</span>
          </span>
        </q-toolbar-title>
        
        <!-- Logo configurable para cada empresa - alineado a la derecha, con link externo -->
        <div v-if="!logoError" class="logo-container q-ml-auto">
          <a 
            href="https://www.sistemasreport.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            tabindex="-1"
            aria-label="Sitio web Sistemas report"
          >
            <img 
              :src="logoPath" 
              :alt="logoAlt"
              class="company-logo"
              @error="onLogoError"
            />
          </a>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="240"
      class="report-drawer"
    >
      <q-list class="report-menu-list">
        <q-item-label header class="report-menu-header">
          <q-icon name="cloud" class="q-mr-md" />
        </q-item-label>

        <q-item
          v-for="item in menuItems"
          :key="item.label"
          clickable
          :active="isRouteActive(item)"
          @click="goToRoute(item)"
          class="report-menu-item"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" class="report-menu-icon" />
          </q-item-section>
          <q-item-section>
            <div class="report-menu-label">{{ item.label }}</div>
          </q-item-section>
        </q-item>

        <!-- Separador antes de la sección de usuario -->
        <q-separator class="q-my-md" />

        <!-- Información del usuario -->
        <q-item class="report-user-info">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="person" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="report-user-name text-primary">
              {{ userDisplayName }}
            </q-item-label>
            <q-item-label caption class="report-user-email text-teal">
              {{ userEmail }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Botón de cerrar sesión -->
        <q-item 
          clickable 
          @click="handleLogout"
          class="report-logout-item"
        >
          <q-item-section avatar>
            <q-icon name="logout" class="report-menu-icon" />
          </q-item-section>
          <q-item-section>
            <div class="report-menu-label">Cerrar Sesión</div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="report-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LOGO_PATH, LOGO_ALT, COMPANY_NAME } from 'src/config/branding'
import { user_detail, logout } from 'src/utils/auth'
import { useQuasar } from 'quasar'

const leftDrawerOpen = ref(false)
const $q = useQuasar()
const router = useRouter()
const route = useRoute()

// Configuración de logo (configurable en src/config/branding.js)
const logoPath = LOGO_PATH
const logoAlt = LOGO_ALT
const companyName = COMPANY_NAME
const logoError = ref(false)

function onLogoError() {
  // Si el logo no se encuentra, ocultarlo
  logoError.value = true
  console.warn(`Logo no encontrado en: ${logoPath}`)
}

const menuItems = [
  {
    label: 'Inicio',
    icon: 'dashboard',
    route: { name: 'index' }
  },
  {
    label: 'Perfil',
    icon: 'person',
    route: { name: 'perfil' }
  },
  {
    label: 'Ajustes',
    icon: 'tune',
    route: { name: 'ajustes' }
  }
  // Puedes agregar más items aquí
]

// Computed para obtener el nombre del usuario
const userDisplayName = computed(() => {
  if (!user_detail.value) return 'Usuario'
  
  // Intentar obtener nombre completo
  if (user_detail.value.first_name && user_detail.value.last_name) {
    return `${user_detail.value.first_name} ${user_detail.value.last_name}`
  }
  if (user_detail.value.first_name) {
    return user_detail.value.first_name
  }
  if (user_detail.value.username) {
    return user_detail.value.username
  }
  if (user_detail.value.name) {
    return user_detail.value.name
  }
  return 'Usuario'
})

// Computed para obtener el email del usuario
const userEmail = computed(() => {
  if (!user_detail.value) return ''
  return user_detail.value.email || user_detail.value.username || ''
})

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function goToRoute(item) {
  if (!isRouteActive(item)) {
    router.push(item.route)
  }
}

function isRouteActive(item) {
  // Compara por nombre, ya que es el método recomendado por Vue Router
  return item.route.name && route.name === item.route.name
}

function handleLogout() {
  $q.dialog({
    title: 'Cerrar Sesión',
    message: '¿Estás seguro de que deseas cerrar sesión?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    logout()
    $q.notify({
      type: 'info',
      message: 'Sesión cerrada correctamente',
      position: 'top',
      timeout: 2000
    })
    router.push({ name: 'login' })
  })
}
</script>

<style lang="scss" scoped>
.logo-container {
  display: flex;
  align-items: center;
  height: auto;
  min-width: 100px;
  margin-left: auto;
}

.company-logo {
  height: 40px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;
}

.company-logo:hover {
  transform: scale(1.02);
  cursor: pointer;
}

/* Responsive */
@media (max-width: 600px) {
  .company-logo {
    height: 32px;
    max-width: 150px;
  }
  
  .logo-container {
    min-width: 100px;
  }
}

/* Tipografía report */
.report-typography {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: #FFFFFF;
  letter-spacing: 0.02em;
  text-transform: lowercase;
  user-select: none;
}


/* Responsive tipografía */
@media (max-width: 600px) {
  .report-typography {
    font-size: 1.25rem;
  }
}

/* Colores de fondo usando la paleta report */
.report-header {
  background: $report-purple-medium !important; /* Morado oscuro principal */
}

.report-page-container {
  background: $report-purple-low !important; /* Lavanda claro para el fondo del main */
  min-height: 100vh;
}

/* Estilos del menú lateral report */
.report-drawer {
  background: linear-gradient(200deg, $primary 25%, $secondary 50%, $report-purple-medium 75%);
  border-right: 2px solid $report-lavender;
}

.report-menu-header {
  background: linear-gradient(200deg, $primary 25%, $secondary 50%, $report-purple-medium 75%);
  color: $report-white !important;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  padding: 18px 0;
  margin: 0 ;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  
  .q-icon {
    font-size: 1.5rem;
    color: $report-white;
  }
}


.report-menu-item {
  margin: 0.25rem 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, $primary 0%, $secondary 100%);
    transition: width 0.3s ease;
    z-index: 0;
  }
  
  .q-item__section {
    position: relative;
    z-index: 1;
  }
  
  &:hover {
    background: rgba($report-lavender, 0.3);
    transform: translateX(4px);
    
    &::before {
      width: 4px;
    }
    
    .report-menu-icon {
      color: $primary;
      transform: scale(1.1);
    }
    
    .report-menu-label {
      color: $primary;
      font-weight: 600;
    }
  }
  
  &.q-item--active {
    background: linear-gradient(90deg, rgba($primary, 0.15) 0%, rgba($secondary, 0.1) 100%);
    border-left: 4px solid $primary;
    
    &::before {
      width: 4px;
    }
    
    .report-menu-icon {
      color: $primary;
    }
    
    .report-menu-label {
      color: $primary;
      font-weight: 600;
    }
  }
}

.report-menu-icon {
  color: $report-purple-medium;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.report-menu-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
  font-size: 0.95rem;
  color: $report-purple-dark;
  transition: all 0.3s ease;
  font-weight: 500;
}

/* Estilos para la información del usuario */
.report-user-info {
  margin: 0.5rem 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.report-user-name {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: $report-white;
  line-height: 1.2;
}

.report-user-email {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Inter', 'SF Pro Display', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.2;
  margin-top: 0.25rem;
}

/* Estilos para el botón de cerrar sesión */
.report-logout-item {
  margin: 0.25rem 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, $negative 0%, rgba($negative, 0.7) 100%);
    transition: width 0.3s ease;
    z-index: 0;
  }
  
  .q-item__section {
    position: relative;
    z-index: 1;
  }
  
  &:hover {
    background: rgba($negative, 0.2);
    transform: translateX(4px);
    
    &::before {
      width: 4px;
    }
    
    .report-menu-icon {
      color: $negative;
      transform: scale(1.1);
    }
    
    .report-menu-label {
      color: $negative;
      font-weight: 600;
    }
  }
}

</style>
