import { config } from '@vue/test-utils';
import { Quasar, Notify, Dialog } from 'quasar';
import { createI18n } from 'vue-i18n';
import { createPinia } from 'pinia';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app');
vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('firebase/storage');

// Global Vue Test Utils configuration
config.global.plugins = [
  [
    Quasar,
    {
      plugins: { Notify, Dialog },
    },
  ],
  createPinia(),
  createI18n({
    legacy: false,
    locale: 'en-US',
    messages: {
      'en-US': {},
      'en-ES': {},
    },
  }),
];

// Mock Quasar's $q object
config.global.mocks = {
  $q: {
    notify: vi.fn(),
    dialog: vi.fn(),
    loading: {
      show: vi.fn(),
      hide: vi.fn(),
    },
  },
};

// Mock window.navigator for tests that might need it
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test',
    language: 'en-US',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
