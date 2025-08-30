import { defineConfig } from 'vitest/config';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: 'src/css/quasar.variables.scss',
    }),
  ],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', 'dist/', 'src/boot/', '*.config.*', 'src/assets/data/'],
    },
    include: ['test/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.nuxt'],
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean {
      // Suppress Vue and Router warnings during tests to clean up output
      if (
        type === 'stderr' &&
        (log.includes('[Vue warn]') ||
          log.includes('[Vue Router warn]') ||
          log.includes('[intlify]') ||
          log.includes('🔧 Development Mode'))
      ) {
        return false; // Don't log these warnings
      }
      return true; // Log everything else
    },
  },
});
