// Vitest configuration for the typing tutor test suite
// Configures testing environment, plugins, and file patterns

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      'tests/setup/dom-setup.js',
      'tests/setup/global-setup.js'
    ],
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/coverage/**',
      '**/*.d.ts'
    ],
    testTimeout: 15000,
    hookTimeout: 15000,
    fakeTimers: {
      shouldClearNativeTimers: true
    },
    isolate: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['app/utils/**/*.js', 'app/composables/**/*.js'],
      exclude: ['**/*.config.js', '**/*.test.js', '**/*.spec.js']
    },
    // Enhanced environment configuration for better DOM compatibility
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        pretendToBeVisual: true,
        includeNodeLocations: true
      }
    },
    // Better error handling for failed tests
    onConsoleLog(log, type) {
      if (type === 'stderr' && (log.includes('insertBefore') || log.includes('parent'))) {
        return false // Suppress DOM insertion warnings in test output
      }
    },

    // Disable TypeScript checking completely
    typecheck: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './'),
      '~': resolve(process.cwd(), './'),
      'tests': resolve(process.cwd(), './tests'),
      'app': resolve(process.cwd(), './app'),
      'server': resolve(process.cwd(), './server')
    }
  },
  optimizeDeps: {
    include: ['@vue/test-utils', 'jsdom', 'vitest'],
    exclude: ['monaco-editor']
  },
  // Mock Monaco Editor for tests to avoid resolution issues
  define: {
    'process.env.NODE_ENV': '"test"'
  }
})
