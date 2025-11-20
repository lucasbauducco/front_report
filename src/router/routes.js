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
      {path: 'licencias', name: 'licencias', component: () => import('pages/LicenciasPage.vue')},
      {path: 'control_horas', name: 'controlhoras', component: () => import('pages/ControlHorasPage.vue') },
    ]
  },
  { path: '/:catchAll(.*)*', component: () => import('src/pages/Errors/ErrorNotFound.vue'), meta: { requiresAuth: true } }
];

export default routes;
