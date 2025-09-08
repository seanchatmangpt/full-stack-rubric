/**
 * Core Testing Utilities - Main exports for nuxt-bdd library
 * @fileoverview Entry point for all core testing utilities
 */

// Quick Test utilities
export {
  quickTest,
  batchTest,
  propMatrix
} from './quick-test.js'

// Component helpers
export {
  mountWithExpectations,
  quickMount,
  testWithProps,
  testResponsive,
  createMountFactory,
  mockNuxtComposables
} from './component-helpers.js'

// Data factories
export {
  DataFactory,
  UserFactory,
  ContentFactory,
  FormFactory,
  APIFactory,
  ScenarioFactory,
  testData
} from './data-factories.js'

// Test context management
export {
  TestContext,
  globalContext,
  createTestContext,
  ContextHelpers,
  createContextHelpers
} from './test-context.js'

// Enhanced assertions
export {
  A11yAssertions,
  PerformanceAssertions,
  ComponentAssertions,
  APIAssertions,
  FormAssertions,
  BDDExpectations,
  should,
  customMatchers,
  a11y,
  performance,
  component,
  api,
  form
} from './assertions.js'

// Performance testing
export {
  PerformanceTester,
  perf,
  perfTest,
  memoryLeakTest,
  renderPerfTest
} from './performance.js'

/**
 * Create a complete testing environment with all utilities
 * @param {Object} options - Configuration options
 * @returns {Object} Complete testing environment
 */
export function createTestingEnvironment(options = {}) {
  const {
    seed = 42,
    performanceThresholds = {},
    contextData = {},
    globalMocks = {}
  } = options

  // Setup test context
  const context = createTestContext()
  const helpers = createContextHelpers(context)

  // Setup data factories
  testData.setSeed(seed)
  
  // Setup performance testing
  Object.assign(perf.thresholds, performanceThresholds)

  // Setup context data
  Object.entries(contextData).forEach(([key, value]) => {
    context.set(key, value)
  })

  // Setup global mocks
  const mocks = mockNuxtComposables(globalMocks)

  return {
    // Testing utilities
    quickTest,
    quickMount,
    mountWithExpectations,
    
    // Data generation
    UserFactory,
    ContentFactory,
    FormFactory,
    APIFactory,
    ScenarioFactory,
    
    // Context management
    context,
    helpers,
    
    // Performance testing
    perf,
    perfTest,
    renderPerfTest,
    
    // Assertions
    should,
    a11y,
    component,
    api,
    form,
    
    // Mocks
    mocks,
    
    // Cleanup function
    cleanup: () => {
      helpers.reset()
      perf.reset()
      testData.clearFixtures()
    }
  }
}

/**
 * Default testing environment for quick setup
 */
export const defaultEnvironment = createTestingEnvironment()

/**
 * Common test scenarios
 */
export const scenarios = {
  /**
   * Setup authenticated user scenario
   * @param {Object} userOverrides - User data overrides
   * @returns {Object} Authentication scenario
   */
  authenticatedUser: (userOverrides = {}) => {
    return ScenarioFactory.createAuthScenario()
  },

  /**
   * Setup CRUD operation scenario
   * @param {Function} factory - Data factory function
   * @returns {Object} CRUD scenario
   */
  crudOperations: (factory = ContentFactory.create) => {
    return ScenarioFactory.createCRUDScenario(factory)
  },

  /**
   * Setup form validation scenario
   * @returns {Object} Form validation scenario
   */
  formValidation: () => {
    return ScenarioFactory.createValidationScenario()
  }
}

/**
 * Common test patterns
 */
export const patterns = {
  /**
   * Test component with multiple viewport sizes
   * @param {Object} component - Vue component
   * @param {Function} testFn - Test function
   * @param {Array} viewports - Viewport configurations
   */
  responsive: (component, testFn, viewports = [
    { width: 320, height: 568 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1024, height: 768 }, // Desktop small
    { width: 1920, height: 1080 } // Desktop large
  ]) => {
    return testResponsive(component, viewports, testFn)
  },

  /**
   * Test component accessibility
   * @param {Object} component - Vue component
   * @param {Object} options - Test options
   */
  accessibility: async (component, options = {}) => {
    const wrapper = await mountWithExpectations(component, options)
    a11y.hasAriaLabels(wrapper)
    a11y.hasImageAltText(wrapper)
    a11y.hasProperHeadingHierarchy(wrapper)
    wrapper.unmount()
  },

  /**
   * Performance test component rendering
   * @param {string} name - Component name
   * @param {Object} component - Vue component
   * @param {Object} options - Test options
   */
  performance: async (name, component, options = {}) => {
    const renderFn = async () => {
      const wrapper = await mountWithExpectations(component, options)
      wrapper.unmount()
    }
    
    return renderPerfTest(name, renderFn, options)
  }
}

/**
 * Version information
 */
export const version = '1.0.0'

/**
 * Default export for convenience
 */
export default {
  // Core functions
  quickTest,
  quickMount,
  mountWithExpectations,
  
  // Factories
  UserFactory,
  ContentFactory,
  FormFactory,
  
  // Utilities
  should,
  perf,
  scenarios,
  patterns,
  
  // Environment
  createTestingEnvironment,
  defaultEnvironment,
  
  // Version
  version
}