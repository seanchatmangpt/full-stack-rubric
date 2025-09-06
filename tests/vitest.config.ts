/**
 * @fileoverview Vitest configuration for typing tutor testing infrastructure
 * Comprehensive test setup with performance monitoring and browser simulation
 */

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  test: {
    // Test environment configuration
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    
    // Setup files
    setupFiles: [
      './setup/global-setup.ts',
      './setup/dom-setup.ts',
      './setup/performance-setup.ts'
    ],
    
    // Test inclusion patterns
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],
    
    // Test exclusion patterns
    exclude: [
      'node_modules',
      'dist',
      '.nuxt',
      'coverage'
    ],
    
    // Test timeout configuration
    testTimeout: 10000, // 10 seconds for complex tests
    hookTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      all: true,
      clean: true
    },
    
    // Reporter configuration
    reporter: [
      'verbose',
      'json',
      'html'
    ],
    
    // Performance benchmarking
    benchmark: {
      include: ['tests/performance/**/*.bench.ts'],
      reporters: ['verbose', 'json']
    },
    
    // Parallel execution
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Watch mode configuration
    watch: true,
    
    // File watching options
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**'
    ],
    
    // Test retry configuration
    retry: 2,
    
    // Sequence configuration
    sequence: {
      shuffle: false,
      concurrent: true
    },
    
    // Browser testing configuration (for e2e tests)
    browser: {
      enabled: false, // Enable when needed for browser-specific testing
      name: 'chrome',
      provider: 'webdriverio',
      headless: true
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
      '~': resolve(__dirname, '../'),
      'tests': resolve(__dirname, './')
    }
  },
  
  // Define global constants
  define: {
    __TEST__: true,
    __DEV__: false
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'vue',
      '@vue/test-utils',
      'vitest'
    ]
  },
  
  // Build configuration for testing
  build: {
    target: 'node14',
    sourcemap: true
  }
})