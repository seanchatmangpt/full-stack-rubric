/**
 * Nuxt 4 Testing Environment Setup
 * Environment configuration and lifecycle management for Nuxt testing
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

/**
 * Setup Nuxt testing environment
 * @param {Object} options - Environment options
 * @returns {Promise<Object>} Environment context
 */
export async function setupNuxtTestEnvironment(options = {}) {
  const config = {
    // Core options
    server: true,
    browser: false,
    ssr: true,
    nitro: true,
    
    // Test runners
    enableComponentTesting: true,
    enableServerTesting: true,
    enableComposableTesting: true,
    enableSSRTesting: true,
    enableNitroTesting: true,
    
    // Performance
    timeout: 30000,
    retries: 2,
    
    // Cleanup
    autoCleanup: true,
    cleanupTimeout: 5000,
    
    ...options
  }


  const environment = {
    config,
    testers: {},
    hooks: {
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: []
    },
    cleanup: []
  }

  try {
    // Initialize Nuxt bridge
    if (config.server || config.ssr) {
      const { initializeNuxtTesting } = await import('./nuxt-bridge.js')
      environment.testers.nuxtBridge = await initializeNuxtTesting(config)
    }

    // Initialize component tester
    if (config.enableComponentTesting) {
      const { initializeComponentTesting } = await import('./component-tester.js')
      environment.testers.componentTester = initializeComponentTesting(
        environment.testers.nuxtBridge?.getContext(),
        config
      )
    }

    // Initialize server tester
    if (config.enableServerTesting) {
      const { initializeServerTesting } = await import('./server-tester.js')
      environment.testers.serverTester = initializeServerTesting(
        environment.testers.nuxtBridge?.getContext(),
        config
      )
    }

    // Initialize composable tester
    if (config.enableComposableTesting) {
      const { initializeComposableTesting } = await import('./composable-tester.js')
      environment.testers.composableTester = initializeComposableTesting(
        environment.testers.nuxtBridge?.getContext(),
        config
      )
    }

    // Initialize SSR tester
    if (config.enableSSRTesting && config.ssr) {
      const { initializeSSRTesting } = await import('./ssr-tester.js')
      environment.testers.ssrTester = initializeSSRTesting(
        environment.testers.nuxtBridge?.getContext(),
        config
      )
    }

    // Initialize Nitro runner
    if (config.enableNitroTesting && config.nitro) {
      const { initializeNitroTesting } = await import('./nitro-runner.js')
      environment.testers.nitroRunner = initializeNitroTesting(
        environment.testers.nuxtBridge?.getContext(),
        config
      )
    }

    // Setup global test hooks
    setupGlobalTestHooks(environment)

    
    return environment

  } catch (error) {
    throw error
  }
}

/**
 * Setup global test hooks
 * @param {Object} environment - Environment context
 * @private
 */
function setupGlobalTestHooks(environment) {
  const { config, testers, hooks } = environment

  // Global beforeAll hook
  beforeAll(async () => {
    
    for (const hook of hooks.beforeAll) {
      await hook(environment)
    }
    
    // Initialize all testers if not already done
    for (const [name, tester] of Object.entries(testers)) {
      if (tester && tester.initialize && !tester.initialized) {
        await tester.initialize(testers.nuxtBridge?.getContext())
      }
    }
  }, config.timeout)

  // Global afterAll hook
  afterAll(async () => {
    
    for (const hook of hooks.afterAll) {
      await hook(environment)
    }

    // Cleanup all testers
    if (config.autoCleanup) {
      await teardownNuxtTestEnvironment(environment)
    }
  }, config.cleanupTimeout)

  // Global beforeEach hook
  beforeEach(async () => {
    // Reset state for each test
    for (const hook of hooks.beforeEach) {
      await hook(environment)
    }

    // Reset testers if needed
    for (const [name, tester] of Object.entries(testers)) {
      if (tester && tester.resetTestState) {
        await tester.resetTestState()
      }
    }
  })

  // Global afterEach hook
  afterEach(async () => {
    // Cleanup after each test
    for (const hook of hooks.afterEach) {
      await hook(environment)
    }

    // Cleanup scenario-specific resources
    for (const [name, tester] of Object.entries(testers)) {
      if (tester && tester.cleanupScenario) {
        await tester.cleanupScenario()
      }
    }
  })
}

/**
 * Teardown Nuxt testing environment
 * @param {Object} environment - Environment context
 * @returns {Promise<void>}
 */
export async function teardownNuxtTestEnvironment(environment) {

  try {
    // Run cleanup functions
    for (const cleanup of environment.cleanup) {
      if (typeof cleanup === 'function') {
        await cleanup()
      }
    }

    // Cleanup all testers
    const cleanupPromises = Object.entries(environment.testers).map(async ([name, tester]) => {
      if (tester && tester.cleanup) {
        await tester.cleanup()
      }
    })

    await Promise.allSettled(cleanupPromises)


  } catch (error) {
  }
}

/**
 * Add environment hook
 * @param {Object} environment - Environment context
 * @param {string} hookType - Hook type (beforeAll, afterAll, beforeEach, afterEach)
 * @param {Function} hookFunction - Hook function
 */
export function addEnvironmentHook(environment, hookType, hookFunction) {
  if (environment.hooks[hookType]) {
    environment.hooks[hookType].push(hookFunction)
  }
}

/**
 * Add cleanup function
 * @param {Object} environment - Environment context
 * @param {Function} cleanupFunction - Cleanup function
 */
export function addCleanupFunction(environment, cleanupFunction) {
  environment.cleanup.push(cleanupFunction)
}

/**
 * Get environment tester
 * @param {Object} environment - Environment context
 * @param {string} testerName - Tester name
 * @returns {Object} Tester instance
 */
export function getEnvironmentTester(environment, testerName) {
  return environment.testers[testerName]
}

/**
 * Create test suite with environment
 * @param {string} suiteName - Test suite name
 * @param {Object} options - Suite options
 * @returns {Promise<Object>} Test suite environment
 */
export async function createTestSuite(suiteName, options = {}) {

  const suiteConfig = {
    name: suiteName,
    isolated: false,
    timeout: 30000,
    ...options
  }

  const environment = await setupNuxtTestEnvironment(suiteConfig)

  // Add suite-specific cleanup
  addCleanupFunction(environment, async () => {
  })

  return {
    ...environment,
    suite: {
      name: suiteName,
      config: suiteConfig,
      startTime: Date.now()
    }
  }
}

/**
 * Create isolated test environment
 * @param {string} testName - Test name
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Isolated test environment
 */
export async function createIsolatedTestEnvironment(testName, options = {}) {

  const isolatedConfig = {
    ...options,
    isolated: true,
    autoCleanup: true
  }

  const environment = await setupNuxtTestEnvironment(isolatedConfig)

  // Add test-specific context
  environment.test = {
    name: testName,
    startTime: Date.now(),
    isolated: true
  }

  return environment
}

/**
 * Validate test environment
 * @param {Object} environment - Environment to validate
 * @returns {Object} Validation result
 */
export function validateTestEnvironment(environment) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    testers: {}
  }

  // Check required components
  const requiredTesters = ['nuxtBridge']
  
  requiredTesters.forEach(testerName => {
    if (!environment.testers[testerName]) {
      validation.errors.push(`Required tester missing: ${testerName}`)
      validation.isValid = false
    }
  })

  // Validate each tester
  Object.entries(environment.testers).forEach(([name, tester]) => {
    const testerValidation = {
      initialized: !!tester,
      hasCleanup: !!(tester && tester.cleanup),
      hasReset: !!(tester && tester.resetTestState)
    }

    if (!testerValidation.initialized) {
      validation.warnings.push(`Tester not initialized: ${name}`)
    }

    if (!testerValidation.hasCleanup) {
      validation.warnings.push(`Tester missing cleanup method: ${name}`)
    }

    validation.testers[name] = testerValidation
  })

  return validation
}

/**
 * Get environment status
 * @param {Object} environment - Environment context
 * @returns {Object} Environment status
 */
export function getEnvironmentStatus(environment) {
  return {
    config: environment.config,
    testers: Object.keys(environment.testers),
    hooks: Object.keys(environment.hooks).reduce((acc, key) => {
      acc[key] = environment.hooks[key].length
      return acc
    }, {}),
    cleanup: environment.cleanup.length,
    validation: validateTestEnvironment(environment)
  }
}

/**
 * Default environment configuration
 */
export const defaultEnvironmentConfig = {
  server: true,
  browser: false,
  ssr: true,
  nitro: true,
  enableComponentTesting: true,
  enableServerTesting: true,
  enableComposableTesting: true,
  enableSSRTesting: true,
  enableNitroTesting: true,
  timeout: 30000,
  retries: 2,
  autoCleanup: true,
  cleanupTimeout: 5000
}

/**
 * Quick setup for common scenarios
 */

/**
 * Setup for component testing only
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Component testing environment
 */
export async function setupComponentTestingOnly(options = {}) {
  return setupNuxtTestEnvironment({
    ...defaultEnvironmentConfig,
    enableServerTesting: false,
    enableSSRTesting: false,
    enableNitroTesting: false,
    ssr: false,
    nitro: false,
    ...options
  })
}

/**
 * Setup for server testing only
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Server testing environment
 */
export async function setupServerTestingOnly(options = {}) {
  return setupNuxtTestEnvironment({
    ...defaultEnvironmentConfig,
    enableComponentTesting: false,
    enableSSRTesting: false,
    browser: false,
    ...options
  })
}

/**
 * Setup for full-stack testing
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Full-stack testing environment
 */
export async function setupFullStackTesting(options = {}) {
  return setupNuxtTestEnvironment({
    ...defaultEnvironmentConfig,
    ...options
  })
}