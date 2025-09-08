import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    // Main entry point
    'src/index',
    // Modular exports for tree-shaking
    'src/cucumber',
    'src/utils',
    'src/composables',
    'src/testing'
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    esbuild: {
      target: 'node18'
    }
  },
  externals: [
    'nuxt',
    '@nuxt/kit',
    '@nuxt/test-utils',
    'vitest',
    '@amiceli/vitest-cucumber',
    'playwright-core',
    'happy-dom'
  ]
})