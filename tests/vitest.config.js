/**
 * Vitest configuration for performance and unit testing
 * Includes benchmarking setup and DOM environment configuration
 */

import { defineConfig } from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Environment configuration
    environment: 'jsdom',
    
    // Global test settings
    globals: true,
    
    // Setup files
    setupFiles: [
      './tests/setup/global-setup.js',
      './tests/setup/dom-setup.js',
      './tests/setup/performance-setup.js'
    ],
    
    // Include patterns for test files
    include: [
      'tests/**/*.{test,spec}.{js,mjs,ts}',
      'tests/**/*.bench.{js,mjs,ts}',
      'app/**/*.{test,spec}.{js,mjs,ts}',
      'server/**/*.{test,spec}.{js,mjs,ts}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.nuxt',
      'coverage',
      'tests/framework/cucumber-runner.js' // Separate Cucumber runner
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        '.nuxt/**',
        'dist/**',
        'coverage/**',
        '*.config.{js,ts}',
        'nuxt.config.{js,ts}',
        'app.config.{js,ts}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Performance and timeout settings
    testTimeout: 30000, // 30 seconds for performance tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 10000,
    
    // Reporter configuration
    reporter: ['default', 'html', 'json'],
    outputFile: {
      html: './tests/reports/test-results.html',
      json: './tests/reports/test-results.json'
    },
    
    // Benchmark configuration
    benchmark: {
      outputFile: './tests/reports/benchmark-results.json',
      reporterOptions: {
        default: {
          colors: true
        }
      }
    },
    
    // Pool configuration for parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
        useAtomics: true
      }
    },
    
    // Retry configuration
    retry: 2,
    
    // Test isolation
    isolate: true,
    
    // Mock configuration
    deps: {
      external: ['jsdom']
    },
    
    // Define configuration for different test types
    workspace: [
      {
        // Unit tests configuration
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.js'],
          environment: 'node'
        }
      },
      {
        // Integration tests configuration  
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.js'],
          environment: 'jsdom'
        }
      },
      {
        // E2E tests configuration
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.js'],
          environment: 'jsdom',
          testTimeout: 60000 // Longer timeout for E2E tests
        }
      },
      {
        // Performance tests configuration
        test: {
          name: 'performance',
          include: ['tests/performance/**/*.test.js'],
          environment: 'jsdom',
          testTimeout: 120000, // 2 minutes for performance tests
          retry: 0, // No retries for performance tests
          benchmark: {
            include: ['**/*.bench.js']
          }
        }
      }
    ]
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './app'),
      '~': resolve(__dirname, './'),
      'tests': resolve(__dirname, './tests')
    }
  },
  
  // Define global constants
  define: {
    __TEST__: true,
    __PERFORMANCE_TEST__: process.env.NODE_ENV === 'test'
  },
  
  // Esbuild configuration for faster compilation
  esbuild: {
    target: 'node18'
  }
})
