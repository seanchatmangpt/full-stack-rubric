/**
 * @fileoverview Vitest configuration for nuxt-bdd library tests
 * @description Test configuration optimized for BDD library testing
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Test files
    include: [
      'unit/**/*.test.js',
      'integration/**/*.test.js', 
      'performance/**/*.test.js',
      'compatibility/**/*.test.js',
      'examples/**/*.test.js',
      'bdd/**/*.steps.js'
    ],
    
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts'
    ],

    // Global test setup
    setupFiles: [
      './setup/global-setup.js',
      './setup/performance-setup.js'
    ],

    // Test timeouts
    testTimeout: 10000, // 10 seconds for complex integration tests
    hookTimeout: 5000,
    
    // Coverage configuration
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'dist/**',
        '**/[.]**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        '**/virtual:*',
        '**/__x00__*',
        '**/\x00*',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/setup/**',
        '**/*.config.{js,cjs,mjs,ts}'
      ],
      include: [
        '../src/**/*.js'
      ],
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },

    // Globals
    globals: true,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './reports/test-results.json',
      html: './reports/test-results.html'
    },

    // Retry configuration
    retry: 2,
    
    // Pool configuration
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false
      }
    },

    // Browser testing (for integration tests)
    browser: {
      enabled: false, // Enable when needed
      name: 'chromium'
    },

    // Watch options
    watch: {
      ignore: ['**/coverage/**', '**/reports/**']
    },

    // Benchmark configuration
    benchmark: {
      include: ['performance/**/*.bench.js'],
      exclude: ['**/node_modules/**'],
      reporters: ['verbose']
    }
  },

  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '~': resolve(__dirname, '../'),
      '@tests': resolve(__dirname, './'),
    }
  },

  // Define constants for tests
  define: {
    __TEST__: true,
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },

  // Esbuild configuration
  esbuild: {
    target: 'node14'
  }
})