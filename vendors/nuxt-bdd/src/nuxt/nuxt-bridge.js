/**
 * Enhanced Nuxt Bridge - Nuxt 4 Compatible Testing Integration
 * Extracted and improved from framework patterns with Nuxt 4 support
 */

import { setupNuxt, createTest } from '@nuxt/test-utils'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

/**
 * Enhanced Nuxt Test Bridge for Nuxt 4
 * Provides seamless integration with modern Nuxt testing patterns
 */
export class NuxtTestBridge {
  /**
   * @param {Object} options - Bridge configuration
   */
  constructor(options = {}) {
    this.options = {
      server: true,
      browser: false,
      runner: 'vitest',
      logLevel: 'warn',
      nitro: true,
      ssr: true,
      buildDir: '.nuxt-test',
      rootDir: process.cwd(),
      ...options
    }
    
    this.nuxt = null
    this.testContext = null
    this.scenarios = new Map()
    this.hooks = {
      beforeInit: [],
      afterInit: [],
      beforeCleanup: [],
      afterCleanup: []
    }
  }

  /**
   * Initialize Nuxt 4 test environment with enhanced capabilities
   * @param {Object} nuxtConfig - Nuxt configuration overrides
   * @returns {Promise<Object>} Nuxt instance
   */
  async initialize(nuxtConfig = {}) {
    try {
      // Execute pre-init hooks
      for (const hook of this.hooks.beforeInit) {
        await hook(this.options)
      }

      // Enhanced Nuxt 4 setup
      this.nuxt = await setupNuxt({
        ...this.options,
        nuxtConfig: {
          // Nuxt 4 specific configurations
          future: {
            compatibilityVersion: 4
          },
          experimental: {
            watcher: 'parcel',
            asyncContext: true
          },
          nitro: {
            experimental: {
              wasm: true
            }
          },
          ...nuxtConfig
        }
      })
      
      this.testContext = await createTest(this.nuxt)
      
      // Enhanced context with Nuxt 4 features
      this.setupEnhancedContext()
      
      // Setup lifecycle hooks
      this.setupLifecycleHooks()
      
      // Execute post-init hooks
      for (const hook of this.hooks.afterInit) {
        await hook(this.nuxt, this.testContext)
      }
      
      return this.nuxt
    } catch (error) {
      throw new Error(`Failed to initialize Nuxt 4 test environment: ${error.message}`)
    }
  }

  /**
   * Setup enhanced test context with Nuxt 4 capabilities
   * @private
   */
  setupEnhancedContext() {
    if (!this.testContext) return

    // Add Nuxt 4 specific helpers
    this.testContext.nuxt4 = {
      // Server-side utilities
      callServerFunction: async (fnName, ...args) => {
        return await this.testContext.$fetch(`/api/__test__/server-function`, {
          method: 'POST',
          body: { fnName, args }
        })
      },

      // Composable testing
      testComposable: async (composableName, options = {}) => {
        const { useState, useNuxtApp, useRouter } = await import('#app')
        return { useState, useNuxtApp, useRouter }
      },

      // SSR testing
      renderSSR: async (component, props = {}) => {
        return await this.testContext.renderToString(component, props)
      },

      // Nitro testing
      testNitroRoute: async (route, options = {}) => {
        return await this.testContext.$fetch(route, {
          method: 'GET',
          ...options
        })
      }
    }

    // Enhanced router utilities
    this.testContext.router = {
      ...this.testContext.router,
      navigateAndWait: async (path, timeout = 5000) => {
        await this.testContext.router.push(path)
        return new Promise(resolve => setTimeout(resolve, timeout))
      }
    }

    // Enhanced fetch utilities
    const originalFetch = this.testContext.$fetch
    this.testContext.$fetch = async (url, options = {}) => {
      const result = await originalFetch(url, {
        retry: 1,
        timeout: 10000,
        ...options
      })
      return result
    }
  }

  /**
   * Setup comprehensive lifecycle hooks
   * @private
   */
  setupLifecycleHooks() {
    beforeAll(async () => {
      if (!this.nuxt) {
        await this.initialize()
      }
    })

    afterAll(async () => {
      await this.cleanup()
    })

    beforeEach(async () => {
      await this.resetTestState()
    })

    afterEach(async () => {
      await this.cleanupScenario()
    })
  }

  /**
   * Enhanced scenario enhancement with Nuxt 4 patterns
   * @param {Object} scenario - Scenario to enhance
   * @returns {Object} Enhanced scenario
   */
  enhanceScenario(scenario) {
    // Core Nuxt context
    scenario.context.nuxt = this.nuxt
    scenario.context.$fetch = this.testContext?.$fetch
    scenario.context.router = this.testContext?.router
    scenario.context.app = this.testContext?.app
    scenario.context.nuxt4 = this.testContext?.nuxt4

    // Add comprehensive Nuxt helpers
    this.addNuxtHelpers(scenario)
    this.addNuxt4Helpers(scenario)
    this.addSSRHelpers(scenario)
    this.addNitroHelpers(scenario)

    // Register for lifecycle management
    this.scenarios.set(scenario.description, scenario)

    return scenario
  }

  /**
   * Add comprehensive Nuxt testing helpers
   * @param {Object} scenario - Target scenario
   * @private
   */
  addNuxtHelpers(scenario) {
    // Navigation helpers
    scenario.navigateTo = async (path) => {
      await scenario.context.router?.navigateAndWait(path)
      scenario.context.currentPath = path
    }

    // API testing helpers
    scenario.callApi = async (endpoint, options = {}) => {
      const response = await scenario.context.$fetch(endpoint, options)
      scenario.context.lastApiResponse = response
      return response
    }

    // Component testing helpers
    scenario.renderComponent = async (component, props = {}) => {
      const rendered = await this.testContext?.renderComponent?.(component, props)
      scenario.context.lastRenderedComponent = rendered
      return rendered
    }

    // Store management helpers
    scenario.getStore = (storeName) => {
      return scenario.context.app?.$pinia?.state?.[storeName] || 
             scenario.context.app?.$store?.state?.[storeName]
    }

    scenario.resetStore = (storeName) => {
      if (scenario.context.app?.$pinia) {
        delete scenario.context.app.$pinia.state[storeName]
      }
    }

    // Plugin access helpers
    scenario.getPlugin = (pluginName) => {
      return scenario.context.app?.[`$${pluginName}`]
    }

    // Session helpers
    scenario.setAuthToken = (token) => {
      scenario.context.user.token = token
      if (scenario.context.app?.$auth) {
        scenario.context.app.$auth.setToken('local', token)
      }
    }
  }

  /**
   * Add Nuxt 4 specific helpers
   * @param {Object} scenario - Target scenario
   * @private
   */
  addNuxt4Helpers(scenario) {
    // Server function testing
    scenario.callServerFunction = async (fnName, ...args) => {
      return await scenario.context.nuxt4?.callServerFunction(fnName, ...args)
    }

    // Composable testing
    scenario.testComposable = async (composableName, initialData = {}) => {
      return await scenario.context.nuxt4?.testComposable(composableName, { initialData })
    }

    // Auto-imports testing
    scenario.testAutoImport = async (importName) => {
      try {
        const module = await import('#imports')
        return module[importName]
      } catch (error) {
        throw new Error(`Auto-import '${importName}' not found: ${error.message}`)
      }
    }

    // Middleware testing
    scenario.testMiddleware = async (middlewareName, routeContext = {}) => {
      const middleware = await import(`~/middleware/${middlewareName}`)
      return await middleware.default(routeContext)
    }
  }

  /**
   * Add SSR-specific helpers
   * @param {Object} scenario - Target scenario
   * @private
   */
  addSSRHelpers(scenario) {
    // Server-side rendering helpers
    scenario.renderSSR = async (component, props = {}) => {
      return await scenario.context.nuxt4?.renderSSR(component, props)
    }

    // Hydration testing
    scenario.testHydration = async (component, props = {}) => {
      const serverHtml = await scenario.renderSSR(component, props)
      const clientHtml = await scenario.renderComponent(component, props)
      return {
        serverHtml,
        clientHtml,
        matches: serverHtml === clientHtml
      }
    }

    // Meta testing
    scenario.getPageMeta = () => {
      return scenario.context.app?.$nuxt?.$head || {}
    }
  }

  /**
   * Add Nitro-specific helpers  
   * @param {Object} scenario - Target scenario
   * @private
   */
  addNitroHelpers(scenario) {
    // Nitro route testing
    scenario.testNitroRoute = async (route, options = {}) => {
      return await scenario.context.nuxt4?.testNitroRoute(route, options)
    }

    // Nitro handler testing
    scenario.testNitroHandler = async (handlerPath, event = {}) => {
      const handler = await import(`~/server/api/${handlerPath}`)
      return await handler.default(event)
    }

    // Nitro storage testing
    scenario.testNitroStorage = async (key, value = null) => {
      const storage = scenario.context.app?.$nitro?.storage
      if (value !== null) {
        await storage?.setItem(key, value)
      }
      return await storage?.getItem(key)
    }
  }

  /**
   * Enhanced state reset with Nuxt 4 support
   * @private
   */
  async resetTestState() {
    if (!this.testContext) return

    // Reset router
    await this.testContext.router?.replace('/')
    
    // Clear caches
    this.testContext.clearCache?.()
    
    // Reset stores comprehensively
    await this.resetAllStores()
    
    // Clear Nitro storage
    await this.clearNitroStorage()
    
    // Reset auto-imports cache
    this.resetAutoImportsCache()
  }

  /**
   * Comprehensive store reset
   * @private
   */
  async resetAllStores() {
    if (this.testContext?.app) {
      // Reset Pinia stores
      if (this.testContext.app.$pinia) {
        const stores = this.testContext.app.$pinia._s
        for (const store of stores.values()) {
          store.$reset?.()
        }
      }
      
      // Reset Vuex store
      if (this.testContext.app.$store) {
        await this.testContext.app.$store.dispatch('$reset')
      }
    }
  }

  /**
   * Clear Nitro storage for testing
   * @private
   */
  async clearNitroStorage() {
    const storage = this.testContext?.app?.$nitro?.storage
    if (storage) {
      const keys = await storage.getKeys()
      for (const key of keys) {
        await storage.removeItem(key)
      }
    }
  }

  /**
   * Reset auto-imports cache
   * @private
   */
  resetAutoImportsCache() {
    // Clear module cache for auto-imports
    if (typeof require !== 'undefined' && require.cache) {
      Object.keys(require.cache).forEach(key => {
        if (key.includes('#imports') || key.includes('#app')) {
          delete require.cache[key]
        }
      })
    }
  }

  /**
   * Enhanced scenario cleanup
   * @private
   */
  async cleanupScenario() {
    // Clear timers
    this.clearAllTimers()
    
    // Reset DOM if in browser mode
    if (this.options.browser) {
      await this.resetDomState()
    }
    
    // Clear API mocks
    this.clearApiMocks()
    
    // Clear Nuxt 4 specific caches
    await this.clearNuxt4Caches()
  }

  /**
   * Clear Nuxt 4 specific caches
   * @private
   */
  async clearNuxt4Caches() {
    // Clear server function cache
    if (this.testContext?.nuxt4?.clearServerFunctionCache) {
      this.testContext.nuxt4.clearServerFunctionCache()
    }
    
    // Clear composable cache
    if (this.testContext?.nuxt4?.clearComposableCache) {
      this.testContext.nuxt4.clearComposableCache()
    }
  }

  /**
   * Clear all timers and intervals
   * @private
   */
  clearAllTimers() {
    // Clear all timeouts and intervals
    let id = setTimeout(() => {}, 0)
    while (id--) {
      clearTimeout(id)
      clearInterval(id)
    }
  }

  /**
   * Reset DOM state for browser tests
   * @private
   */
  async resetDomState() {
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '<div id="__nuxt"></div>'
      // Wait for potential DOM mutations
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  /**
   * Enhanced API mocking for Nuxt 4
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
        delay: 0,
        ...options
      }
    })

    // Enhanced fetch mocking for Nuxt 4
    if (this.testContext?.$fetch?.mockImplementation) {
      this.testContext.$fetch.mockImplementation(async (url, opts = {}) => {
        const mock = this.apiMocks.get(url)
        if (mock && (!opts.method || opts.method === mock.options.method)) {
          // Simulate network delay
          if (mock.options.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, mock.options.delay))
          }
          
          // Simulate error responses
          if (mock.options.status >= 400) {
            const error = new Error(`API Error: ${mock.options.status}`)
            error.statusCode = mock.options.status
            throw error
          }
          
          return mock.response
        }
        
        return this.originalFetch?.(url, opts)
      })
    }
  }

  /**
   * Clear all API mocks
   * @private
   */
  clearApiMocks() {
    this.apiMocks?.clear()
    if (this.testContext?.$fetch?.mockRestore) {
      this.testContext.$fetch.mockRestore()
    }
  }

  /**
   * Add lifecycle hook
   * @param {string} hookName - Hook name
   * @param {Function} fn - Hook function
   */
  addHook(hookName, fn) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].push(fn)
    }
  }

  /**
   * Get current test context for external use
   * @returns {Object} Current test context
   */
  getContext() {
    return {
      nuxt: this.nuxt,
      testContext: this.testContext,
      $fetch: this.testContext?.$fetch,
      router: this.testContext?.router,
      app: this.testContext?.app,
      nuxt4: this.testContext?.nuxt4
    }
  }

  /**
   * Comprehensive cleanup
   * @private
   */
  async cleanup() {
    try {
      // Execute pre-cleanup hooks
      for (const hook of this.hooks.beforeCleanup) {
        await hook(this.nuxt, this.testContext)
      }

      // Close all scenarios
      for (const scenario of this.scenarios.values()) {
        await scenario.cleanup?.()
      }
      this.scenarios.clear()

      // Close test context
      if (this.testContext?.close) {
        await this.testContext.close()
      }

      // Close Nuxt instance
      if (this.nuxt?.close) {
        await this.nuxt.close()
      }

      // Execute post-cleanup hooks
      for (const hook of this.hooks.afterCleanup) {
        await hook()
      }

      this.nuxt = null
      this.testContext = null
    } catch (error) {
    }
  }

  /**
   * Create enhanced scenario with Nuxt 4 integration
   * @param {string} description - Scenario description
   * @returns {Object} Enhanced scenario
   */
  createScenario(description) {
    const { scenario } = require('../core')
    const newScenario = scenario(description)
    return this.enhanceScenario(newScenario)
  }
}

/**
 * Global enhanced bridge instance
 */
let globalBridge = null

/**
 * Get or create enhanced Nuxt bridge
 * @param {Object} options - Bridge options
 * @returns {NuxtTestBridge} Bridge instance
 */
export function getNuxtBridge(options = {}) {
  if (!globalBridge) {
    globalBridge = new NuxtTestBridge(options)
  }
  return globalBridge
}

/**
 * Initialize Nuxt 4 testing environment
 * @param {Object} options - Configuration options
 * @returns {Promise<NuxtTestBridge>} Initialized bridge
 */
export async function initializeNuxtTesting(options = {}) {
  const bridge = getNuxtBridge(options)
  await bridge.initialize()
  return bridge
}