/**
 * @fileoverview Main entry point for @nuxt/bdd library
 * @description Tree-shakable exports for enhanced BDD testing with Nuxt
 */

// Re-export all BDD utilities with tree-shaking support
export {
  VitestCucumberBridge,
  bddBridge,
  bddContext,
  registerGiven,
  registerWhen, 
  registerThen,
  mountWithBDD,
  getBDDContext,
  setBDDState,
  getBDDState
} from './bdd/vitest-cucumber-bridge.js'

// Re-export core utilities (when implemented)
// export * from './core/index.js'

// Re-export Nuxt integration (when implemented) 
// export * from './nuxt/index.js'

// Re-export configuration utilities (when implemented)
// export * from './config/index.js'

/**
 * Library version
 * @type {string}
 */
export const VERSION = '1.0.0'

/**
 * Default configuration for the library
 * @type {Object}
 */
export const DEFAULT_CONFIG = {
  autoCleanup: true,
  performanceTracking: false,
  mockDefaults: {},
  treeshaking: true
}

/**
 * Initialize the BDD library with custom configuration
 * @param {Object} config - Configuration options
 * @returns {VitestCucumberBridge} Configured BDD bridge instance
 */
export function createBDDBridge(config = {}) {
  const { VitestCucumberBridge } = await import('./bdd/vitest-cucumber-bridge.js')
  return new VitestCucumberBridge({
    ...DEFAULT_CONFIG,
    ...config
  })
}

/**
 * Check if running in development mode
 * @returns {boolean} Development mode status
 */
export function isDev() {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in test mode
 * @returns {boolean} Test mode status  
 */
export function isTest() {
  return process.env.NODE_ENV === 'test'
}