/**
 * @fileoverview Vitest configuration for the typing tutor test suite
 * Configures testing environment, plugins, and file patterns
 */

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * @typedef {import('vitest/config').UserConfig} VitestConfig
 */

/**
 * Vitest configuration for testing
 * @type {VitestConfig}
 */
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
      'tests/**/*.spec.js',
      'tests/**/*.steps.js'
    ],
    testTimeout: 15000,
    hookTimeout: 15000
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
    include: ['@vue/test-utils', 'jsdom', 'vitest']
  }
})