/**
 * @fileoverview Nuxt BDD Integration Layer - Main Entry Point
 * @description Complete BDD integration layer for vitest-cucumber with enhanced utilities,
 * standard Gherkin compliance, and declarative patterns (no fluent chains).
 */

import { VitestCucumberBridge } from './vitest-cucumber-bridge.js'
import { StepHelpers } from './step-helpers.js'

// Core BDD Bridge
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
} from './vitest-cucumber-bridge.js'

// Step Definition Helpers
export {
  StepHelpers,
  stepHelpers,
  commonSteps
} from './step-helpers.js'

// Feature File Parser
export {
  FeatureParser,
  featureParser,
  parseFeature,
  validateFeature,
  extractStepPatterns,
  generateStepDefinitions
} from './feature-parser.js'

// Step Discovery System
export {
  StepDiscovery,
  stepDiscovery,
  discoverSteps,
  generateMissingSteps,
  generateCoverageReport
} from './step-discovery.js'

// Re-export vitest-cucumber core for convenience
export {
  Given,
  When,
  Then,
  Before,
  After,
  Step,
  defineConfig as defineCucumberConfig
} from '@amiceli/vitest-cucumber'

/**
 * Initialize BDD environment with common configuration
 * @param {Object} config - BDD configuration
 * @returns {Object} Configured BDD environment
 */
export function initializeBDD(config = {}) {
  const {
    autoCleanup = true,
    performanceTracking = false,
    mockDefaults = {},
    stepHelpers: stepHelpersConfig = {}
  } = config

  const bridge = new VitestCucumberBridge({
    autoCleanup,
    performanceTracking,
    mockDefaults
  })

  const helpers = new StepHelpers({
    trackPerformance: performanceTracking,
    autoAssert: true,
    ...stepHelpersConfig
  })

  return { bridge, helpers }
}

/**
 * Create a pre-configured BDD test suite
 * @param {string} suiteName - Test suite name
 * @param {Object} config - Suite configuration
 * @returns {Object} Test suite utilities
 */
export function createBDDSuite(suiteName, config = {}) {
  const bddEnv = initializeBDD(config)
  
  return {
    suiteName,
    bridge: bddEnv.bridge,
    helpers: bddEnv.helpers,
    mount: (component, options) => bddEnv.bridge.mountComponent({ component, ...options }),
    step: (type, pattern, handler) => bddEnv.bridge.registerStep(type, pattern, handler),
    getMetrics: () => bddEnv.bridge.getPerformanceMetrics(),
    cleanup: () => bddEnv.bridge.cleanup()
  }
}

export default {
  VitestCucumberBridge,
  StepHelpers,
  initializeBDD,
  createBDDSuite
}