const routes = [
  {
    path: '/login/',
    component: () => import('layouts/LoginLayout.vue'),
    meta: {requiresAuth: false},
    children: [
      {path: '', name: 'login', component: () => import('pages/LoginPage.vue')}
    ]
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: {requiresAuth: true},
    children: [
      {path: '', name: 'index', component: () => import('pages/IndexPage.vue')},
      {path: 'registros', name: 'registros', component: () => import('pages/IndexPage.vue')},
    ]
  },
  {path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue'), meta: {requiresAuth: true}}
]

export default routes
