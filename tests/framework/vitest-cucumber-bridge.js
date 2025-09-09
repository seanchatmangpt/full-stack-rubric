/**
 * Vitest-Cucumber Integration Bridge
 * Clean interface for vitest-cucumber with core testing utilities
 */

import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { createStepFactory, StepDefinitionFactory } from './core-testing-utilities.js'

/**
 * Global step factory instance
 */
let globalStepFactory = null

/**
 * Get or create global step factory
 * @returns {StepDefinitionFactory} Step factory
 */
function getStepFactory() {
  if (!globalStepFactory) {
    globalStepFactory = createStepFactory()
  }
  return globalStepFactory
}

/**
 * Bridge Given function that integrates with core utilities
 * @param {string} pattern - Step pattern
 * @param {Function} implementation - Step implementation
 */
export function BridgeGiven(pattern, implementation) {
  const factory = getStepFactory()
  
  // Register with factory for pattern matching and context
  factory.Given(pattern, implementation)
  
  // Register with vitest-cucumber for actual execution
  Given(pattern, async function (...args) {
    const context = factory.getContext()
    const helpers = factory.getHelpers()
    
    // Execute with proper context and helpers
    return await implementation(context, helpers, ...args)
  })
}

/**
 * Bridge When function that integrates with core utilities
 * @param {string} pattern - Step pattern
 * @param {Function} implementation - Step implementation
 */
export function BridgeWhen(pattern, implementation) {
  const factory = getStepFactory()
  
  // Register with factory
  factory.When(pattern, implementation)
  
  // Register with vitest-cucumber
  When(pattern, async function (...args) {
    const context = factory.getContext()
    const helpers = factory.getHelpers()
    
    return await implementation(context, helpers, ...args)
  })
}

/**
 * Bridge Then function that integrates with core utilities
 * @param {string} pattern - Step pattern
 * @param {Function} implementation - Step implementation
 */
export function BridgeThen(pattern, implementation) {
  const factory = getStepFactory()
  
  // Register with factory
  factory.Then(pattern, implementation)
  
  // Register with vitest-cucumber
  Then(pattern, async function (...args) {
    const context = factory.getContext()
    const helpers = factory.getHelpers()
    
    return await implementation(context, helpers, ...args)
  })
}

/**
 * Clean API exports for step definitions
 */
export {
  BridgeGiven as Given,
  BridgeWhen as When,  
  BridgeThen as Then
}

/**
 * Setup function for test files
 * Call this at the beginning of step definition files
 * @param {Object} options - Setup options
 */
export function setupStepDefinitions(options = {}) {
  const factory = getStepFactory()
  
  // Initialize context before scenario
  beforeEach(() => {
    factory.beforeScenario(options.initialData)
  })
  
  // Cleanup after scenario
  afterEach(() => {
    factory.afterScenario()
  })
  
  return {
    factory,
    context: factory.getContext(),
    helpers: factory.getHelpers()
  }
}

/**
 * Utility to get current step context
 * @returns {StepContext} Current context
 */
export function getStepContext() {
  return getStepFactory().getContext()
}

/**
 * Utility to get step helpers
 * @returns {StepHelpers} Helper functions
 */
export function getStepHelpers() {
  return getStepFactory().getHelpers()
}

/**
 * Utility to get step factory for advanced use
 * @returns {StepDefinitionFactory} Step factory
 */
export function getFactory() {
  return getStepFactory()
}

/**
 * Export core utilities for direct access
 */
export {
  StepDefinitionFactory,
  CommonStepPatterns,
  ParameterPatterns,
  StepContext,
  StepHelpers
} from './core-testing-utilities.js'
