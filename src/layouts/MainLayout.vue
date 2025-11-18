<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          Mi Aplicación
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="220"
    >
      <q-list>
        <q-item-label header>
          Menú
        </q-item-label>

        <q-item
          v-for="item in menuItems"
          :key="item.label"
          clickable
          :active="isRouteActive(item)"
          @click="goToRoute(item)"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const leftDrawerOpen = ref(false)

const menuItems = [
  {
    label: 'Inicio',
    icon: 'home',
    route: { name: 'index' }
  },
  {
    label: 'Perfil',
    icon: 'person',
    route: { name: 'perfil' }
  },
  {
    label: 'Ajustes',
    icon: 'settings',
    route: { name: 'ajustes' }
  }
  // Puedes agregar más items aquí
]

const router = useRouter()
const route = useRoute()

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
</script>
