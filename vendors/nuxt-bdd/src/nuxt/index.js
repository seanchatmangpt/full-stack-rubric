/**
 * Nuxt 4 Testing Integration Suite
 * Comprehensive testing utilities for modern Nuxt applications
 */

export { NuxtTestBridge, getNuxtBridge, initializeNuxtTesting } from './nuxt-bridge.js'
export { NuxtComponentTester } from './component-tester.js'
export { NuxtServerTester } from './server-tester.js'
export { NuxtComposableTester } from './composable-tester.js'
export { NuxtSSRTester } from './ssr-tester.js'
export { NitroTestRunner } from './nitro-runner.js'
export { createNuxtTestingHelpers, withNuxtTesting } from './helpers.js'
export { setupNuxtTestEnvironment, teardownNuxtTestEnvironment } from './environment.js'

/**
 * Main Nuxt testing suite factory
 * @param {Object} options - Configuration options
 * @returns {Object} Complete Nuxt testing suite
 */
export function createNuxtTestingSuite(options = {}) {
  const config = {
    server: true,
    browser: false,
    ssr: true,
    nitro: true,
    components: true,
    composables: true,
    logLevel: 'warn',
    ...options
  }

  return {
    bridge: getNuxtBridge(config),
    components: new NuxtComponentTester(config),
    server: new NuxtServerTester(config), 
    composables: new NuxtComposableTester(config),
    ssr: new NuxtSSRTester(config),
    nitro: new NitroTestRunner(config),
    helpers: createNuxtTestingHelpers(config),
    config
  }
}