import { mount, VueWrapper } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import { vi } from 'vitest';

export interface TestOptions {
  shallow?: boolean;
  global?: {
    plugins?: any[];
    mocks?: Record<string, unknown>;
    stubs?: Record<string, unknown>;
  };
  props?: Record<string, unknown>;
  slots?: any;
}

/**
 * Creates a properly configured Vue Test Utils wrapper with Quasar, Pinia, and i18n
 */
export function createTestWrapper(component: unknown, options: TestOptions = {}) {
  const pinia = createPinia();
  const i18n = createI18n({
    legacy: false,
    locale: 'en-US',
    messages: {
      'en-US': {
        player: 'Player',
        players: 'Players',
        event: 'Event',
        events: 'Events',
        game: 'Game',
        games: 'Games',
        search: 'Search',
        loading: 'Loading...',
        noResults: 'No results found',
        welcome: 'Welcome',
        login: 'Login',
        logout: 'Logout',
        admin: 'Admin',
        settings: 'Settings',
      },
      'en-ES': {
        player: 'Jugador',
        players: 'Jugadores',
        event: 'Evento',
        events: 'Eventos',
        game: 'Juego',
        games: 'Juegos',
        search: 'Buscar',
        loading: 'Cargando...',
        noResults: 'No se encontraron resultados',
        welcome: 'Bienvenido',
        login: 'Iniciar sesión',
        logout: 'Cerrar sesión',
        admin: 'Administrador',
        settings: 'Configuración',
      },
    },
  });

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/players', component: { template: '<div>Players</div>' } },
      { path: '/games', component: { template: '<div>Games</div>' } },
      { path: '/events', component: { template: '<div>Events</div>' } },
      { path: '/admin', component: { template: '<div>Admin</div>' } },
      { path: '/settings', component: { template: '<div>Settings</div>' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div>Not Found</div>' } }, // Catch-all route
    ],
  });

  const defaultOptions = {
    global: {
      plugins: [
        [
          Quasar,
          {
            plugins: ['Notify', 'Dialog', 'Loading'],
          },
        ],
        pinia,
        i18n,
        router,
      ],
      mocks: {
        $q: {
          notify: vi.fn(),
          dialog: vi.fn(),
          loading: {
            show: vi.fn(),
            hide: vi.fn(),
          },
        },
        $t: (key: string) => key, // Simple translation mock
        $router: {
          push: vi.fn(),
          replace: vi.fn(),
          go: vi.fn(),
          back: vi.fn(),
          forward: vi.fn(),
        },
        $route: {
          path: '/',
          query: {},
          params: {},
          hash: '',
          fullPath: '/',
          matched: [],
          name: undefined,
          redirectedFrom: undefined,
        },
      },
      stubs: {
        'router-link': {
          template: '<a><slot /></a>',
          props: ['to'],
        },
        'router-view': {
          template: '<div><slot /></div>',
        },
        'q-page': {
          template: '<div class="q-page"><slot /></div>',
        },
        'q-page-container': {
          template: '<div class="q-page-container"><slot /></div>',
        },
        'q-icon': {
          template: '<i class="q-icon" :class="name"><slot /></i>',
          props: ['name', 'size'],
        },
      },
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    global: {
      ...defaultOptions.global,
      ...options.global,
      plugins: [...defaultOptions.global.plugins, ...(options.global?.plugins || [])],
      mocks: {
        ...defaultOptions.global.mocks,
        ...options.global?.mocks,
      },
      stubs: {
        ...defaultOptions.global.stubs,
        ...options.global?.stubs,
      },
    },
  };

  return mount(component, mergedOptions);
}

/**
 * Creates mock data for testing
 */
export const createMockPlayer = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  name: 'Test Player',
  email: 'test@example.com',
  joinDate: new Date('2023-01-01'),
  bio: 'Test bio',
  preferences: {
    favoriteGames: [1, 2],
    preferredGenres: ['Strategy', 'RPG'],
  },
  ...overrides,
});

export const createMockEvent = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  title: 'Test Event',
  description: 'Test event description',
  date: new Date('2024-01-01'),
  location: 'Test Location',
  gameId: 1,
  maxPlayers: 4,
  ...overrides,
});

export const createMockGame = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  name: 'Test Game',
  description: 'Test game description',
  minPlayers: 2,
  maxPlayers: 4,
  playTime: 60,
  complexity: 3,
  genre: 'Strategy',
  ...overrides,
});

/**
 * Waits for Vue's nextTick and any pending promises
 */
export async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Helper to wait for reactive updates
 */
export async function waitForReactivity() {
  await new Promise((resolve) => setTimeout(resolve, 10));
}
