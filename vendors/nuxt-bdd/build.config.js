/**
 * @fileoverview Modern build configuration for tree-shakable library distribution
 * @description Unbuild configuration for ESM/CJS dual package with TypeScript declarations
 */

import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  // Entry points for different library modules
  entries: [
    // Main entry point
    {
      input: 'src/index',
      name: 'index'
    },
    // BDD utilities entry
    {
      input: 'src/bdd/index',
      outDir: 'dist/bdd',
      name: 'index'
    },
    // Nuxt integration entry
    {
      input: 'src/nuxt/index',
      outDir: 'dist/nuxt', 
      name: 'index'
    },
    // Configuration utilities entry
    {
      input: 'src/config/index',
      outDir: 'dist/config',
      name: 'index'
    },
    // Core utilities entry
    {
      input: 'src/core/index',
      outDir: 'dist/core',
      name: 'index'
    }
  ],

  // Output directory
  outDir: 'dist',

  // Clean output directory before build
  clean: true,

  // Generate TypeScript declaration files
  declaration: true,

  // Generate source maps for debugging
  sourcemap: true,

  // Build for both ESM and CommonJS
  rollup: {
    emitCJS: true,
    cjsBridge: true,
    inlineDependencies: false,
    
    // External dependencies (don't bundle)
    external: [
      '@amiceli/vitest-cucumber',
      '@vue/test-utils', 
      'vitest',
      'vue',
      'nuxt',
      '@nuxt/test-utils',
      'jsdom'
    ],

    // Rollup options for advanced optimization
    rollup: {
      output: {
        exports: 'named',
        generatedCode: {
          constBindings: true,
          arrowFunctions: true
        }
      },
      
      // Tree-shaking optimization
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },

      // Plugin configuration for optimization
      plugins: []
    }
  },

  // Stub mode for development (faster builds)
  stub: process.env.NODE_ENV === 'development',

  // Hook for custom build process
  hooks: {
    'build:before': () => {
      console.log('🚀 Building tree-shakable library...')
    },
    'build:done': (ctx) => {
      console.log('✅ Build completed successfully!')
      console.log(`📦 Generated ${ctx.buildEntries.length} entry points`)
      console.log(`📁 Output directory: ${ctx.options.outDir}`)
    }
  },

  // Additional build options
  replace: {
    __DEV__: process.env.NODE_ENV === 'development',
    __TEST__: process.env.NODE_ENV === 'test'
  },

  // Failover for missing entries
  failOnWarn: false,

  // Advanced tree-shaking with side-effect annotations
  externals: [
    // Mark these as external to prevent bundling
    /^@amiceli\/vitest-cucumber/,
    /^@vue\/test-utils/,
    /^vitest/,
    /^vue/,
    /^nuxt/
  ]
})