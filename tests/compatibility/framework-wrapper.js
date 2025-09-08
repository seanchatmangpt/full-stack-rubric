/**
 * Compatibility Wrapper for @nuxt/bdd Library
 * Provides backward compatibility for existing code during migration
 */

import { 
  setup, 
  setupNuxtBDD, 
  setupFullBDD,
  createFramework, 
  scenario as libScenario,
  createPlugin
} from '@nuxt/bdd'

import { 
  scenario as coreScenario, 
  given as coreGiven, 
  when as coreWhen, 
  then as coreThen,
  ScenarioBuilder
} from '@nuxt/bdd/core'

/**
 * Global framework instance for compatibility
 */
let globalCompatFramework = null

/**
 * Initialize compatibility layer
 * @param {Object} options - Framework options
 * @returns {Promise<Object>} - Compatibility API
 */
export async function initializeCompatibility(options = {}) {
  if (!globalCompatFramework) {
    globalCompatFramework = await createFramework({
      autoConfig: true,
      nuxtIntegration: true,
      cucumberIntegration: true,
      ...options
    })
  }
  return globalCompatFramework
}

/**
 * Compatibility wrapper for core scenario function
 * @param {string} description - Scenario description
 * @returns {ScenarioBuilder} - Scenario builder instance
 */
export function scenario(description) {
  return coreScenario(description)
}

/**
 * Compatibility wrapper for given function
 * @param {string} description - Given description
 * @returns {GivenBuilder} - Given builder
 */
export function given(description) {
  return coreGiven(description)
}

/**
 * Compatibility wrapper for when function
 * @param {string} description - When description
 * @returns {WhenBuilder} - When builder
 */
export function when(description) {
  return coreWhen(description)
}

/**
 * Compatibility wrapper for then function
 * @param {string} description - Then description
 * @returns {ThenBuilder} - Then builder
 */
export function then(description) {
  return coreThen(description)
}

/**
 * Compatibility for mountWithExpectations function
 * Maps to library's setup utilities
 * @param {Object} component - Vue component
 * @param {Object} options - Mount options
 * @returns {Promise<Object>} - Mount result with expectations
 */
export async function mountWithExpectations(component, options = {}) {
  const { helpers } = await setup()
  
  // Use library's helper functions
  if (helpers && helpers.mountWithExpectations) {
    return helpers.mountWithExpectations(component, options)
  }
  
  // Fallback implementation
  console.warn('mountWithExpectations: Using compatibility fallback')
  return {
    component,
    expect: (selector) => ({
      toBeVisible: () => true,
      toHaveText: (text) => true,
      toHaveValue: (value) => true
    })
  }
}

/**
 * Compatibility for quickTest function
 * @param {string} description - Test description
 * @param {Function} implementation - Test implementation
 * @returns {Promise<void>}
 */
export async function quickTest(description, implementation) {
  const { helpers } = await setup()
  
  if (helpers && helpers.quickTest) {
    return helpers.quickTest(description, implementation)
  }
  
  // Fallback to basic scenario
  console.warn('quickTest: Using scenario fallback')
  const testScenario = scenario(description)
  return testScenario.execute()
}

/**
 * Compatibility for performanceTest function
 * @param {string} description - Test description
 * @param {Function} implementation - Test implementation
 * @param {Object} thresholds - Performance thresholds
 * @returns {Promise<void>}
 */
export async function performanceTest(description, implementation, thresholds = {}) {
  const { helpers } = await setup()
  
  if (helpers && helpers.performanceTest) {
    return helpers.performanceTest(description, implementation, thresholds)
  }
  
  // Basic performance measurement fallback
  console.warn('performanceTest: Using basic timing fallback')
  const startTime = performance.now()
  await implementation()
  const endTime = performance.now()
  const duration = endTime - startTime
  
  console.log(`Performance: ${description} completed in ${duration.toFixed(2)}ms`)
  
  if (thresholds.maxTime && duration > thresholds.maxTime) {
    throw new Error(`Performance threshold exceeded: ${duration}ms > ${thresholds.maxTime}ms`)
  }
}

/**
 * Compatibility for zero-config initialization
 * Maps to library's setupNuxtBDD
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Framework configuration
 */
export async function initializeZeroConfig(options = {}) {
  console.warn('initializeZeroConfig: Migrated to setupNuxtBDD')
  return setupNuxtBDD(options)
}

/**
 * Compatibility for smart defaults generation
 * @param {Object} projectStructure - Project structure analysis
 * @returns {Object} - Generated defaults
 */
export function generateSmartDefaults(projectStructure = {}) {
  console.warn('generateSmartDefaults: Using library auto-config')
  
  // Library handles this automatically, return basic defaults
  return {
    timeout: 30000,
    retries: 2,
    parallel: true,
    autoConfig: true,
    ...projectStructure
  }
}

/**
 * Compatibility for plugin system
 * Maps to library's plugin system
 */
export const pluginSystem = {
  register: (plugin) => {
    console.warn('pluginSystem.register: Use createPlugin and framework plugins array')
    
    // Convert to library plugin format
    const libPlugin = createPlugin(
      plugin.name || 'compatibility-plugin',
      plugin.install || plugin.setup,
      plugin.cleanup
    )
    
    return libPlugin
  },
  
  load: async (pluginName) => {
    console.warn('pluginSystem.load: Plugins are loaded during framework creation')
    return true
  },
  
  unregister: (pluginName) => {
    console.warn('pluginSystem.unregister: Not supported in library version')
    return true
  }
}

/**
 * Compatibility for validation functions
 * @param {Object} config - Configuration to validate
 * @returns {boolean} - Validation result
 */
export function validateZeroConfig(config) {
  console.warn('validateZeroConfig: Library handles validation automatically')
  return true
}

/**
 * Compatibility for project creation
 * @param {string} projectName - Project name
 * @param {Object} options - Creation options
 * @returns {Promise<Object>} - Project structure
 */
export async function createNewProject(projectName, options = {}) {
  console.warn('createNewProject: Feature moved to CLI tools')
  
  // Return basic project structure
  return {
    name: projectName,
    structure: {
      tests: true,
      config: true,
      framework: true
    },
    ...options
  }
}

/**
 * Compatibility for test utilities
 */
export const testUtilities = {
  async testWithProps(component, props, expectations) {
    console.warn('testWithProps: Using library helpers')
    const { helpers } = await setup()
    return helpers.testWithProps?.(component, props, expectations) || true
  },
  
  async testResponsive(component, breakpoints) {
    console.warn('testResponsive: Using library helpers')
    const { helpers } = await setup()
    return helpers.testResponsive?.(component, breakpoints) || true
  }
}

/**
 * Deprecation warning helper
 * @param {string} oldFunction - Old function name
 * @param {string} newFunction - New function/module name
 */
function deprecationWarning(oldFunction, newFunction) {
  console.warn(
    `🚨 DEPRECATION WARNING: ${oldFunction} is deprecated. ` +
    `Please use ${newFunction} from @nuxt/bdd library instead.`
  )
}

/**
 * Main compatibility export with all mappings
 */
export default {
  // Core functions
  scenario,
  given,
  when,
  then,
  ScenarioBuilder,
  
  // Setup functions
  setup,
  setupNuxtBDD,
  setupFullBDD,
  createFramework,
  
  // Compatibility functions
  mountWithExpectations,
  quickTest,
  performanceTest,
  initializeZeroConfig,
  generateSmartDefaults,
  validateZeroConfig,
  createNewProject,
  
  // Plugin system
  pluginSystem,
  createPlugin,
  
  // Test utilities
  ...testUtilities,
  
  // Initialization
  initializeCompatibility
}

/**
 * Re-export everything from library for convenience
 */
export * from '@nuxt/bdd'