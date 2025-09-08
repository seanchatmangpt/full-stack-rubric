/**
 * Nuxt 4 Testing Helpers and Utilities
 * Comprehensive helper functions for Nuxt testing workflows
 */

/**
 * Create comprehensive Nuxt testing helpers
 * @param {Object} config - Configuration options
 * @returns {Object} Testing helpers
 */
export function createNuxtTestingHelpers(config = {}) {
  const helpers = {
    // Component helpers
    component: createComponentHelpers(config),
    
    // Server helpers
    server: createServerHelpers(config),
    
    // Composable helpers
    composable: createComposableHelpers(config),
    
    // SSR helpers
    ssr: createSSRHelpers(config),
    
    // Nitro helpers
    nitro: createNitroHelpers(config),
    
    // Authentication helpers
    auth: createAuthHelpers(config),
    
    // Form helpers
    form: createFormHelpers(config),
    
    // Navigation helpers
    navigation: createNavigationHelpers(config),
    
    // State helpers
    state: createStateHelpers(config),
    
    // Utility helpers
    utils: createUtilityHelpers(config)
  }

  return helpers
}

/**
 * Create component testing helpers
 * @param {Object} config - Configuration
 * @returns {Object} Component helpers
 */
function createComponentHelpers(config) {
  return {
    /**
     * Quick component mount with Nuxt context
     * @param {Object} component - Vue component
     * @param {Object} props - Component props
     * @returns {Promise<Object>} Mounted component
     */
    mount: async (component, props = {}) => {
      const { mountNuxtComponent } = await import('./component-tester.js')
      return await mountNuxtComponent(component, { propsData: props })
    },

    /**
     * Test component with different viewport sizes
     * @param {Object} component - Vue component
     * @param {Array} viewports - Viewport configurations
     * @returns {Promise<Array>} Test results
     */
    testResponsive: async (component, viewports) => {
      const { getComponentTester } = await import('./component-tester.js')
      const tester = getComponentTester()
      return await tester.testResponsiveBehavior(component, viewports)
    },

    /**
     * Test component accessibility
     * @param {Object} component - Vue component
     * @param {Object} props - Component props
     * @returns {Promise<Object>} Accessibility test result
     */
    testAccessibility: async (component, props = {}) => {
      const wrapper = await createComponentHelpers().mount(component, props)
      return wrapper.checkAccessibility()
    },

    /**
     * Create component snapshot
     * @param {Object} component - Vue component
     * @param {Object} options - Snapshot options
     * @returns {Promise<Object>} Component snapshot
     */
    snapshot: async (component, options = {}) => {
      const { getComponentTester } = await import('./component-tester.js')
      const tester = getComponentTester()
      return await tester.createSnapshot(component, options)
    }
  }
}

/**
 * Create server testing helpers
 * @param {Object} config - Configuration
 * @returns {Object} Server helpers
 */
function createServerHelpers(config) {
  return {
    /**
     * Quick API route test
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Test options
     * @returns {Promise<Object>} Test result
     */
    testAPI: async (endpoint, options = {}) => {
      const { testNuxtApiRoute } = await import('./server-tester.js')
      return await testNuxtApiRoute(endpoint, options)
    },

    /**
     * Load test an API endpoint
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Load test options
     * @returns {Promise<Object>} Load test result
     */
    loadTest: async (endpoint, options = {}) => {
      const { getServerTester } = await import('./server-tester.js')
      const tester = getServerTester()
      return await tester.loadTestEndpoint(endpoint, options)
    },

    /**
     * Test multiple API endpoints
     * @param {Array} endpoints - Endpoint configurations
     * @param {boolean} parallel - Run in parallel
     * @returns {Promise<Array>} Test results
     */
    testEndpoints: async (endpoints, parallel = false) => {
      const { getServerTester } = await import('./server-tester.js')
      const tester = getServerTester()
      
      return parallel 
        ? await tester.testApiEndpointsParallel(endpoints)
        : await tester.testApiEndpoints(endpoints)
    },

    /**
     * Mock API response
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {*} response - Mock response
     * @param {number} status - HTTP status
     */
    mockAPI: (method, endpoint, response, status = 200) => {
      const { getServerTester } = require('./server-tester.js')
      const tester = getServerTester()
      tester.mockApiResponse(method, endpoint, response, status)
    }
  }
}

/**
 * Create composable testing helpers
 * @param {Object} config - Configuration
 * @returns {Object} Composable helpers
 */
function createComposableHelpers(config) {
  return {
    /**
     * Test a composable function
     * @param {Function} composable - Composable function
     * @param {Object} options - Test options
     * @returns {Promise<Object>} Test result
     */
    test: async (composable, options = {}) => {
      const { testNuxtComposable } = await import('./composable-tester.js')
      return await testNuxtComposable(composable, options)
    },

    /**
     * Test composable with different arguments
     * @param {Function} composable - Composable function
     * @param {Array} argCombinations - Argument combinations
     * @returns {Promise<Array>} Test results
     */
    testVariations: async (composable, argCombinations) => {
      const { getComposableTester } = await import('./composable-tester.js')
      const tester = getComposableTester()
      return await tester.testComposableVariations(composable, argCombinations)
    },

    /**
     * Test composable reactivity
     * @param {Function} composable - Composable function
     * @param {Array} mutations - State mutations to test
     * @returns {Promise<Object>} Reactivity test result
     */
    testReactivity: async (composable, mutations) => {
      const { getComposableTester } = await import('./composable-tester.js')
      const tester = getComposableTester()
      return await tester.testComposableReactivity(composable, { mutations })
    },

    /**
     * Test composable lifecycle
     * @param {Function} composable - Composable function
     * @param {Object} options - Test options
     * @returns {Promise<Object>} Lifecycle test result
     */
    testLifecycle: async (composable, options = {}) => {
      const { getComposableTester } = await import('./composable-tester.js')
      const tester = getComposableTester()
      return await tester.testComposableLifecycle(composable, options)
    }
  }
}

/**
 * Create SSR testing helpers
 * @param {Object} config - Configuration
 * @returns {Object} SSR helpers
 */
function createSSRHelpers(config) {
  return {
    /**
     * Test server-side rendering
     * @param {string} route - Route to test
     * @param {Object} options - SSR options
     * @returns {Promise<Object>} SSR test result
     */
    testRender: async (route, options = {}) => {
      const { testNuxtSSR } = await import('./ssr-tester.js')
      return await testNuxtSSR(route, options)
    },

    /**
     * Test hydration
     * @param {string} route - Route to test
     * @returns {Promise<Object>} Hydration test result
     */
    testHydration: async (route) => {
      const { getSSRTester } = await import('./ssr-tester.js')
      const tester = getSSRTester({ enableHydration: true })
      const result = await tester.testSSR(route)
      return result.hydration
    },

    /**
     * Compare multiple routes
     * @param {Array} routes - Routes to compare
     * @param {Object} options - Comparison options
     * @returns {Promise<Object>} Comparison result
     */
    compareRoutes: async (routes, options = {}) => {
      const { getSSRTester } = await import('./ssr-tester.js')
      const tester = getSSRTester()
      return await tester.compareRoutes(routes, options)
    },

    /**
     * Validate SEO factors
     * @param {string} route - Route to validate
     * @returns {Promise<Object>} SEO validation result
     */
    validateSEO: async (route) => {
      const result = await createSSRHelpers().testRender(route)
      return result.success ? result.analysis.seo : { error: result.error }
    }
  }
}

/**
 * Create Nitro testing helpers
 * @param {Object} config - Configuration
 * @returns {Object} Nitro helpers
 */
function createNitroHelpers(config) {
  return {
    /**
     * Test Nitro handler
     * @param {string} path - Handler path
     * @param {Object} options - Test options
     * @returns {Promise<Object>} Test result
     */
    testHandler: async (path, options = {}) => {
      const { testNitroHandler } = await import('./nitro-runner.js')
      return await testNitroHandler(path, options)
    },

    /**
     * Test Nitro storage
     * @param {string} driver - Storage driver
     * @param {Object} options - Test options
     * @returns {Promise<Object>} Storage test result
     */
    testStorage: async (driver = 'memory', options = {}) => {
      const { getNitroRunner } = await import('./nitro-runner.js')
      const runner = getNitroRunner()
      return await runner.testStorage(driver, options)
    },

    /**
     * Benchmark handler performance
     * @param {string} path - Handler path
     * @param {Object} options - Benchmark options
     * @returns {Promise<Object>} Benchmark result
     */
    benchmark: async (path, options = {}) => {
      const { getNitroRunner } = await import('./nitro-runner.js')
      const runner = getNitroRunner()
      return await runner.benchmarkHandler(path, options)
    },

    /**
     * Test event handling
     * @param {string} eventName - Event name
     * @param {*} eventData - Event data
     * @param {Array} handlers - Expected handlers
     * @returns {Promise<Object>} Event test result
     */
    testEvent: async (eventName, eventData, handlers = []) => {
      const { getNitroRunner } = await import('./nitro-runner.js')
      const runner = getNitroRunner()
      return await runner.testEventHandling(eventName, eventData, handlers)
    }
  }
}

/**
 * Create authentication helpers
 * @param {Object} config - Configuration
 * @returns {Object} Auth helpers
 */
function createAuthHelpers(config) {
  return {
    /**
     * Login user for testing
     * @param {Object} credentials - User credentials
     * @returns {Promise<Object>} Auth result
     */
    login: async (credentials) => {
      // Mock login implementation
      const token = `mock-jwt-token-${Date.now()}`
      return {
        success: true,
        token,
        user: {
          id: 1,
          email: credentials.email,
          name: 'Test User'
        }
      }
    },

    /**
     * Create authenticated request headers
     * @param {string} token - Auth token
     * @returns {Object} Headers
     */
    createAuthHeaders: (token) => ({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }),

    /**
     * Test protected route
     * @param {string} endpoint - Protected endpoint
     * @param {string} token - Auth token
     * @returns {Promise<Object>} Test result
     */
    testProtectedRoute: async (endpoint, token) => {
      const headers = createAuthHelpers().createAuthHeaders(token)
      return await createServerHelpers().testAPI(endpoint, { headers })
    },

    /**
     * Test authentication middleware
     * @param {string} endpoint - Endpoint with auth middleware
     * @returns {Promise<Object>} Auth test result
     */
    testAuthMiddleware: async (endpoint) => {
      // Test without token (should fail)
      const unauthorizedResult = await createServerHelpers().testAPI(endpoint)
      
      // Test with token (should succeed)
      const token = 'mock-token'
      const authorizedResult = await createAuthHelpers().testProtectedRoute(endpoint, token)
      
      return {
        unauthorized: unauthorizedResult,
        authorized: authorizedResult,
        middlewareWorking: !unauthorizedResult.success && authorizedResult.success
      }
    }
  }
}

/**
 * Create form testing helpers
 * @param {Object} config - Configuration
 * @returns {Object} Form helpers
 */
function createFormHelpers(config) {
  return {
    /**
     * Fill form inputs
     * @param {Object} wrapper - Component wrapper
     * @param {Object} data - Form data
     * @returns {Promise<void>}
     */
    fillForm: async (wrapper, data) => {
      for (const [field, value] of Object.entries(data)) {
        const input = wrapper.find(`[name="${field}"], #${field}, [data-testid="${field}"]`)
        if (input.exists()) {
          await input.setValue(value)
          await input.trigger('input')
        }
      }
      await wrapper.vm.$nextTick()
    },

    /**
     * Submit form and wait for result
     * @param {Object} wrapper - Component wrapper
     * @param {string} selector - Form selector
     * @returns {Promise<void>}
     */
    submitForm: async (wrapper, selector = 'form') => {
      const form = wrapper.find(selector)
      if (form.exists()) {
        await form.trigger('submit')
        await wrapper.vm.$nextTick()
      }
    },

    /**
     * Test form validation
     * @param {Object} component - Form component
     * @param {Object} testCases - Validation test cases
     * @returns {Promise<Array>} Validation results
     */
    testValidation: async (component, testCases) => {
      const results = []
      
      for (const testCase of testCases) {
        const wrapper = await createComponentHelpers().mount(component)
        
        await createFormHelpers().fillForm(wrapper, testCase.data)
        await createFormHelpers().submitForm(wrapper)
        
        const hasErrors = wrapper.findAll('.error, .invalid').length > 0
        const expectedErrors = testCase.expectedErrors || false
        
        results.push({
          name: testCase.name,
          data: testCase.data,
          success: hasErrors === expectedErrors,
          hasErrors,
          expectedErrors
        })
      }
      
      return results
    }
  }
}

/**
 * Create navigation helpers
 * @param {Object} config - Configuration
 * @returns {Object} Navigation helpers
 */
function createNavigationHelpers(config) {
  return {
    /**
     * Navigate to route and wait
     * @param {Object} wrapper - Component wrapper
     * @param {string} path - Route path
     * @returns {Promise<void>}
     */
    navigateTo: async (wrapper, path) => {
      await wrapper.navigateTo(path)
      await wrapper.vm.$nextTick()
    },

    /**
     * Test route navigation
     * @param {Array} routes - Routes to test
     * @returns {Promise<Array>} Navigation results
     */
    testRoutes: async (routes) => {
      const results = []
      
      for (const route of routes) {
        try {
          const result = await createSSRHelpers().testRender(route)
          results.push({
            route,
            accessible: result.success,
            status: result.success ? 200 : 500,
            error: result.error
          })
        } catch (error) {
          results.push({
            route,
            accessible: false,
            status: 500,
            error: error.message
          })
        }
      }
      
      return results
    },

    /**
     * Test navigation links
     * @param {Object} wrapper - Component wrapper
     * @returns {Promise<Array>} Link test results
     */
    testLinks: async (wrapper) => {
      const links = wrapper.findAll('a[href], nuxt-link')
      const results = []
      
      for (const link of links) {
        const href = link.attributes('to') || link.attributes('href')
        
        results.push({
          href,
          text: link.text(),
          exists: !!href,
          isInternal: href && (href.startsWith('/') || href.startsWith('#')),
          isExternal: href && href.startsWith('http')
        })
      }
      
      return results
    }
  }
}

/**
 * Create state management helpers
 * @param {Object} config - Configuration
 * @returns {Object} State helpers
 */
function createStateHelpers(config) {
  return {
    /**
     * Get Pinia store
     * @param {string} storeName - Store name
     * @returns {Object} Store instance
     */
    getStore: (storeName) => {
      // Mock store getter
      return {
        state: {},
        actions: {},
        getters: {},
        $reset: jest.fn()
      }
    },

    /**
     * Test store actions
     * @param {Object} store - Store instance
     * @param {Array} actions - Actions to test
     * @returns {Promise<Array>} Action test results
     */
    testStoreActions: async (store, actions) => {
      const results = []
      
      for (const action of actions) {
        try {
          const result = await store[action.name](...(action.args || []))
          
          results.push({
            action: action.name,
            args: action.args,
            success: true,
            result
          })
        } catch (error) {
          results.push({
            action: action.name,
            args: action.args,
            success: false,
            error: error.message
          })
        }
      }
      
      return results
    },

    /**
     * Test state reactivity
     * @param {Object} store - Store instance
     * @param {Array} mutations - State mutations
     * @returns {Promise<Object>} Reactivity test result
     */
    testReactivity: async (store, mutations) => {
      const results = {
        mutations: [],
        allReactive: true
      }
      
      for (const mutation of mutations) {
        const before = JSON.stringify(store.state)
        
        // Apply mutation
        if (typeof mutation === 'function') {
          mutation(store.state)
        } else {
          Object.assign(store.state, mutation)
        }
        
        const after = JSON.stringify(store.state)
        const changed = before !== after
        
        results.mutations.push({
          mutation,
          changed
        })
        
        if (!changed) {
          results.allReactive = false
        }
      }
      
      return results
    }
  }
}

/**
 * Create utility helpers
 * @param {Object} config - Configuration
 * @returns {Object} Utility helpers
 */
function createUtilityHelpers(config) {
  return {
    /**
     * Wait for condition to be met
     * @param {Function} condition - Condition function
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<boolean>}
     */
    waitFor: async (condition, timeout = 5000) => {
      const start = Date.now()
      
      while (Date.now() - start < timeout) {
        if (await condition()) {
          return true
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      return false
    },

    /**
     * Create mock data
     * @param {string} type - Data type
     * @param {number} count - Number of items
     * @returns {Array} Mock data
     */
    createMockData: (type, count = 1) => {
      const generators = {
        user: () => ({
          id: Math.floor(Math.random() * 1000),
          name: 'Test User',
          email: 'test@example.com',
          createdAt: new Date().toISOString()
        }),
        post: () => ({
          id: Math.floor(Math.random() * 1000),
          title: 'Test Post',
          content: 'Test content',
          authorId: 1,
          createdAt: new Date().toISOString()
        })
      }
      
      const generator = generators[type] || generators.user
      return Array.from({ length: count }, generator)
    },

    /**
     * Deep clone object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone: (obj) => {
      if (obj === null || typeof obj !== 'object') return obj
      if (obj instanceof Date) return new Date(obj)
      if (obj instanceof Array) return obj.map(createUtilityHelpers().deepClone)
      if (typeof obj === 'object') {
        const cloned = {}
        Object.keys(obj).forEach(key => {
          cloned[key] = createUtilityHelpers().deepClone(obj[key])
        })
        return cloned
      }
    },

    /**
     * Generate random string
     * @param {number} length - String length
     * @returns {string} Random string
     */
    randomString: (length = 10) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let result = ''
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    },

    /**
     * Sleep for specified duration
     * @param {number} ms - Duration in milliseconds
     * @returns {Promise<void>}
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Nuxt testing workflow wrapper
 * @param {Object} nuxtContext - Nuxt context
 * @param {Object} config - Configuration
 * @returns {Object} Enhanced helpers with context
 */
export function withNuxtTesting(nuxtContext, config = {}) {
  const helpers = createNuxtTestingHelpers(config)
  
  // Initialize all testers with context
  const { initializeComponentTesting } = require('./component-tester.js')
  const { initializeServerTesting } = require('./server-tester.js') 
  const { initializeComposableTesting } = require('./composable-tester.js')
  const { initializeSSRTesting } = require('./ssr-tester.js')
  const { initializeNitroTesting } = require('./nitro-runner.js')
  
  initializeComponentTesting(nuxtContext, config)
  initializeServerTesting(nuxtContext, config)
  initializeComposableTesting(nuxtContext, config)
  initializeSSRTesting(nuxtContext, config)
  initializeNitroTesting(nuxtContext, config)
  
  return {
    ...helpers,
    context: nuxtContext,
    config
  }
}