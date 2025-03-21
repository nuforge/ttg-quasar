import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/events/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EventsPage.vue') }],
  },
  {
    path: '/games/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/GamesPage.vue') }],
  },
  {
    path: '/players/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PlayersPage.vue') }],
  },

  {
    path: '/account',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/AccountPage.vue') }],
  },
  {
    path: '/messages',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/MessagesPage.vue') }],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SettingsPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
