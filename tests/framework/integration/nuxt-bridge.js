/**
 * Nuxt Bridge - Seamless integration with @nuxt/test-utils
 * Provides auto-configuration and context management for Nuxt testing
 */

import { setupNuxt, createTest } from '@nuxt/test-utils'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

/**
 * Nuxt Test Bridge Configuration
 */
export class NuxtTestBridge {
  constructor(options = {}) {
    this.options = {
      // Default Nuxt test configuration
      server: true,
      browser: false,
      runner: 'vitest',
      logLevel: 'warn',
      ...options
    }
    
    this.nuxt = null
    this.testContext = null
    this.scenarios = new Map()
  }

  /**
   * Initialize Nuxt test environment
   * @param {Object} nuxtConfig - Nuxt configuration overrides
   * @returns {Promise<void>}
   */
  async initialize(nuxtConfig = {}) {
    try {
      this.nuxt = await setupNuxt({
        ...this.options,
        ...nuxtConfig
      })
      
      this.testContext = await createTest(this.nuxt)
      
      // Setup global test hooks
      this.setupGlobalHooks()
      
      return this.nuxt
    } catch (error) {
      throw new Error(`Failed to initialize Nuxt test environment: ${error.message}`)
    }
  }

  /**
   * Setup global test hooks for Nuxt integration
   * @private
   */
  setupGlobalHooks() {
    beforeAll(async () => {
      if (!this.nuxt) {
        await this.initialize()
      }
    })

    afterAll(async () => {
      await this.cleanup()
    })

    beforeEach(async () => {
      // Reset test state for each scenario
      this.resetTestState()
    })

    afterEach(async () => {
      // Cleanup scenario-specific resources
      await this.cleanupScenario()
    })
  }

  /**
   * Enhance scenario with Nuxt context
   * @param {ScenarioBuilder} scenario - Scenario to enhance
   * @returns {ScenarioBuilder}
   */
  enhanceScenario(scenario) {
    // Add Nuxt context to scenario
    scenario.context.nuxt = this.nuxt
    scenario.context.$fetch = this.testContext?.$fetch
    scenario.context.router = this.testContext?.router
    scenario.context.app = this.testContext?.app

    // Add Nuxt-specific helpers
    this.addNuxtHelpers(scenario)

    // Register scenario for lifecycle management
    this.scenarios.set(scenario.description, scenario)

    return scenario
  }

  /**
   * Add Nuxt-specific helpers to scenario
   * @param {ScenarioBuilder} scenario - Scenario to enhance
   * @private
   */
  addNuxtHelpers(scenario) {
    // Add navigation helpers
    scenario.navigateTo = async (path) => {
      await scenario.context.router?.push(path)
      scenario.context.currentPath = path
    }

    // Add API call helpers
    scenario.callApi = async (endpoint, options = {}) => {
      return await scenario.context.$fetch(endpoint, options)
    }

    // Add component testing helpers
    scenario.renderComponent = async (component, props = {}) => {
      // Integration with @nuxt/test-utils component testing
      return await this.testContext.renderComponent(component, props)
    }

    // Add store helpers (if using Pinia/Vuex)
    scenario.getStore = (storeName) => {
      return scenario.context.app?.$pinia?.state?.[storeName]
    }

    // Add plugin access helpers
    scenario.getPlugin = (pluginName) => {
      return scenario.context.app?.[`$${pluginName}`]
    }
  }

  /**
   * Reset test state between scenarios
   * @private
   */
  resetTestState() {
    if (this.testContext) {
      // Reset router to initial state
      this.testContext.router?.replace('/')
      
      // Clear any cached data
      this.testContext.clearCache?.()
      
      // Reset stores to initial state
      this.resetStores()
    }
  }

  /**
   * Reset all stores to initial state
   * @private
   */
  resetStores() {
    if (this.testContext?.app?.$pinia) {
      // Reset Pinia stores
      this.testContext.app.$pinia.state = {}
    }
    
    if (this.testContext?.app?.$store) {
      // Reset Vuex store
      this.testContext.app.$store.replaceState({})
    }
  }

  /**
   * Cleanup scenario-specific resources
   * @private
   */
  async cleanupScenario() {
    // Clear any pending timers or intervals
    this.clearTimers()
    
    // Reset DOM state if testing with browser
    if (this.options.browser) {
      await this.resetDomState()
    }
    
    // Clear any mocked APIs
    this.clearApiMocks()
  }

  /**
   * Clear all timers and intervals
   * @private
   */
  clearTimers() {
    // Clear any global timers that might affect tests
    if (typeof window !== 'undefined') {
      // Clear all timeouts and intervals (implementation depends on test environment)
    }
  }

  /**
   * Reset DOM state in browser tests
   * @private
   */
  async resetDomState() {
    // Reset to clean DOM state
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '<div id="__nuxt"></div>'
    }
  }

  /**
   * Clear API mocks
   * @private
   */
  clearApiMocks() {
    // Reset any mocked fetch calls or API responses
    this.apiMocks?.clear()
  }

  /**
   * Mock API endpoints for testing
   * @param {string} endpoint - API endpoint to mock
   * @param {*} response - Mock response
   * @param {Object} options - Mock options
   */
  mockApi(endpoint, response, options = {}) {
    if (!this.apiMocks) {
      this.apiMocks = new Map()
    }
    
    this.apiMocks.set(endpoint, {
      response,
      options: {
        method: 'GET',
        status: 200,
        ...options
      }
    })

    // Integrate with Nuxt's $fetch mocking if available
    if (this.testContext?.$fetch?.mockImplementation) {
      this.testContext.$fetch.mockImplementation(async (url, opts) => {
        const mock = this.apiMocks.get(url)
        if (mock && (!opts?.method || opts.method === mock.options.method)) {
          return mock.response
        }
        // Fallback to original implementation
        return this.originalFetch(url, opts)
      })
    }
  }

  /**
   * Get current Nuxt context for external use
   * @returns {Object}
   */
  getContext() {
    return {
      nuxt: this.nuxt,
      testContext: this.testContext,
      $fetch: this.testContext?.$fetch,
      router: this.testContext?.router,
      app: this.testContext?.app
    }
  }

  /**
   * Cleanup all resources
   * @private
   */
  async cleanup() {
    try {
      // Close all scenarios
      for (const scenario of this.scenarios.values()) {
        await scenario.cleanup?.()
      }
      this.scenarios.clear()

      // Close Nuxt test context
      if (this.testContext?.close) {
        await this.testContext.close()
      }

      // Close Nuxt instance
      if (this.nuxt?.close) {
        await this.nuxt.close()
      }

      this.nuxt = null
      this.testContext = null
    } catch (error) {
      console.error('Error during Nuxt test cleanup:', error)
    }
  }

  /**
   * Create a new scenario with Nuxt integration
   * @param {string} description - Scenario description
   * @returns {ScenarioBuilder}
   */
  createScenario(description) {
    const { scenario } = require('../core')
    const newScenario = scenario(description)
    return this.enhanceScenario(newScenario)
  }
}

/**
 * Global Nuxt bridge instance
 */
let globalBridge = null

/**
 * Get or create global Nuxt bridge instance
 * @param {Object} options - Bridge options
 * @returns {NuxtTestBridge}
 */
export function getNuxtBridge(options = {}) {
  if (!globalBridge) {
    globalBridge = new NuxtTestBridge(options)
  }
  return globalBridge
}

/**
 * Initialize Nuxt testing environment
 * @param {Object} options - Configuration options
 * @returns {Promise<NuxtTestBridge>}
 */
export async function initializeNuxtTesting(options = {}) {
  const bridge = getNuxtBridge(options)
  await bridge.initialize()
  return bridge
}

/**
 * Auto-configuration based on Nuxt config
 * @param {string} nuxtConfigPath - Path to nuxt.config file
 * @returns {Object}
 */
export function autoConfigureFromNuxt(nuxtConfigPath = './nuxt.config') {
  try {
    // Load Nuxt configuration
    const nuxtConfig = require(nuxtConfigPath)
    
    // Extract relevant test configuration
    return {
      modules: nuxtConfig.modules || [],
      plugins: nuxtConfig.plugins || [],
      css: nuxtConfig.css || [],
      build: nuxtConfig.build || {},
      // Add other relevant config
    }
  } catch (error) {
    console.warn('Could not auto-configure from Nuxt config:', error.message)
    return {}
  }
}