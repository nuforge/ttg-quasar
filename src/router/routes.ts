import type { RouteRecordRaw } from 'vue-router';
import { requireAuth, requireGuest } from 'src/composables/useAuthGuard';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },

  // Authentication routes
  {
    path: '/login',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireGuest,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('pages/LoginPage.vue'),
        meta: { requiresGuest: true },
      },
    ],
  },

  // Events routes
  {
    path: '/events/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/EventsPage.vue'),
      },
    ],
  },
  {
    path: '/events/:id/:slug?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/EventPage.vue'),
      },
    ],
  },

  {
    path: '/games/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/GamesPage.vue') }],
  },
  {
    path: '/games/:id/:slug?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/GamePage.vue'),
      },
    ],
  },

  // Admin routes
  {
    path: '/admin/setup',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AdminSetup.vue'),
      },
    ],
  },
  {
    path: '/make-me-admin',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/MakeMeAdmin.vue'),
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/AdminDashboard.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
  {
    path: '/admin/games',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/AdminGames.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
  {
    path: '/admin/users',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/AdminUsers.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
  {
    path: '/admin/events',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/AdminEvents.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },

  // Other routes
  {
    path: '/players/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PlayersPage.vue') }],
  },
  {
    path: '/account',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/AccountPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/messages',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/MessagesPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/notifications',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/NotificationsPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/SettingsPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/game-shelf',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        component: () => import('pages/GameShelfPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
