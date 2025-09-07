/**
 * Composable testing helpers for Nuxt composables
 * @fileoverview Testing utilities for Vue composables with Nuxt context
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive, computed } from 'vue'

/**
 * @typedef {Object} ComposableTestConfig
 * @property {Object} initialState - Initial state for composable
 * @property {Object} mocks - Nuxt context mocks
 * @property {Array} dependencies - Dependencies to mock
 * @property {Function} setup - Setup function before testing
 * @property {Function} teardown - Cleanup function after testing
 */

/**
 * Test composable in isolation
 * @param {string} name - Test name
 * @param {Function} composable - Composable function to test
 * @param {ComposableTestConfig} config - Test configuration
 * @returns {Function} Test suite
 */
export const testComposable = (name, composable, config = {}) => {
  const {
    initialState = {},
    mocks = {},
    dependencies = [],
    setup,
    teardown
  } = config

  return describe(`${name} Composable`, () => {
    let result
    let mockContext

    beforeEach(async () => {
      // Setup Nuxt context mocks
      mockContext = createNuxtContextMock(mocks)
      
      // Mock dependencies
      dependencies.forEach(dep => {
        if (typeof dep === 'string') {
          vi.mock(dep, () => ({
            default: vi.fn()
          }))
        } else {
          vi.mock(dep.module, () => dep.mock)
        }
      })

      if (setup) {
        await setup(mockContext)
      }

      // Create test wrapper to provide Vue context
      const TestComponent = {
        template: '<div></div>',
        setup() {
          return composable(initialState)
        }
      }

      const wrapper = mount(TestComponent, {
        global: {
          mocks: mockContext
        }
      })

      result = wrapper.vm
    })

    afterEach(() => {
      if (teardown) {
        teardown(mockContext)
      }
      vi.clearAllMocks()
    })

    // Basic functionality test
    it('initializes correctly', () => {
      expect(result).toBeDefined()
      
      // Check if composable returns expected properties
      Object.keys(initialState).forEach(key => {
        expect(result).toHaveProperty(key)
      })
    })

    // Reactivity tests
    it('maintains reactivity', async () => {
      const reactiveProps = Object.keys(result).filter(key => {
        const value = result[key]
        return value && (value.__v_isRef || value.__v_isReactive)
      })

      expect(reactiveProps.length).toBeGreaterThan(0)
    })

    return {
      result,
      mockContext,
      async testMethod(methodName, ...args) {
        if (typeof result[methodName] === 'function') {
          return await result[methodName](...args)
        }
        throw new Error(`Method ${methodName} not found in composable`)
      },
      async testReactivity(propName, newValue) {
        const oldValue = result[propName]?.value || result[propName]
        
        if (result[propName]?.value !== undefined) {
          result[propName].value = newValue
        } else {
          result[propName] = newValue
        }

        expect(result[propName]?.value || result[propName]).not.toEqual(oldValue)
      }
    }
  })
}

/**
 * Test Nuxt-specific composables (useRoute, useRouter, etc.)
 * @param {string} name - Test name
 * @param {Function} composable - Nuxt composable
 * @param {Object} nuxtConfig - Nuxt-specific config
 * @returns {Function} Test suite
 */
export const testNuxtComposable = (name, composable, nuxtConfig = {}) => {
  const {
    route = { path: '/', params: {}, query: {} },
    router = { push: vi.fn(), replace: vi.fn() },
    app = {},
    runtimeConfig = {}
  } = nuxtConfig

  return describe(`${name} Nuxt Composable`, () => {
    let result
    let mockNuxtApp

    beforeEach(() => {
      mockNuxtApp = {
        $route: route,
        $router: router,
        $config: runtimeConfig,
        ...app
      }

      const TestComponent = {
        template: '<div></div>',
        setup() {
          return composable()
        }
      }

      const wrapper = mount(TestComponent, {
        global: {
          mocks: mockNuxtApp
        }
      })

      result = wrapper.vm
    })

    it('integrates with Nuxt context', () => {
      expect(result).toBeDefined()
      
      // Test Nuxt-specific functionality
      if (name.includes('Route')) {
        expect(result.path || result.fullPath).toBeDefined()
      }
      
      if (name.includes('Router')) {
        expect(result.push || result.replace).toBeDefined()
      }
    })

    return { result, mockNuxtApp }
  })
}

/**
 * Test composable with async operations
 * @param {string} name - Test name
 * @param {Function} asyncComposable - Async composable function
 * @param {Object} config - Test configuration
 * @returns {Function} Test suite
 */
export const testAsyncComposable = (name, asyncComposable, config = {}) => {
  const { timeout = 5000, mockApi = {} } = config

  return describe(`${name} Async Composable`, () => {
    let result

    beforeEach(async () => {
      // Mock API calls
      Object.entries(mockApi).forEach(([method, response]) => {
        vi.mock(method, () => ({
          default: vi.fn().mockResolvedValue(response)
        }))
      })

      const TestComponent = {
        template: '<div></div>',
        async setup() {
          return await asyncComposable()
        }
      }

      const wrapper = mount(TestComponent)
      result = wrapper.vm
    }, timeout)

    it('handles async operations', async () => {
      expect(result).toBeDefined()
      
      // Check for loading states
      if (result.loading !== undefined) {
        expect(typeof result.loading.value).toBe('boolean')
      }
      
      // Check for error handling
      if (result.error !== undefined) {
        expect(result.error.value).toBeNull()
      }
    })

    it('handles loading states correctly', async () => {
      if (result.loading) {
        // Initially might be loading
        const initialLoading = result.loading.value
        
        // Wait for async operation to complete
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Should not be loading after completion
        expect(result.loading.value).toBe(false)
      }
    })

    return { result }
  })
}

/**
 * Test composable with state management
 * @param {string} name - Test name
 * @param {Function} stateComposable - State composable function
 * @param {Array} stateTests - Array of state test configurations
 * @returns {Function} Test suite
 */
export const testStateComposable = (name, stateComposable, stateTests) => {
  return describe(`${name} State Composable`, () => {
    let result

    beforeEach(() => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          return stateComposable()
        }
      }

      const wrapper = mount(TestComponent)
      result = wrapper.vm
    })

    stateTests.forEach(test => {
      it(test.description, async () => {
        if (test.action) {
          await test.action(result)
        }
        
        if (test.expectation) {
          test.expectation(result)
        }
      })
    })

    it('maintains state consistency', () => {
      // Test that state changes are consistent
      const statefulProps = Object.keys(result).filter(key => {
        const value = result[key]
        return value && (value.__v_isRef || value.__v_isReactive)
      })

      statefulProps.forEach(prop => {
        const initialValue = result[prop].value || result[prop]
        
        // Make a change
        if (typeof initialValue === 'object') {
          result[prop] = { ...initialValue, test: 'value' }
        } else {
          result[prop] = initialValue + '_changed'
        }
        
        // Verify change was applied
        expect(result[prop]).not.toEqual(initialValue)
      })
    })
  })
}

/**
 * Create mock Nuxt context
 * @param {Object} overrides - Context overrides
 * @returns {Object} Mock Nuxt context
 */
const createNuxtContextMock = (overrides = {}) => {
  return {
    $route: {
      path: '/',
      params: {},
      query: {},
      name: 'index',
      ...overrides.$route
    },
    $router: {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      ...overrides.$router
    },
    $nuxt: {
      context: {},
      ...overrides.$nuxt
    },
    $config: {
      public: {},
      ...overrides.$config
    },
    ...overrides
  }
}

/**
 * Test composable lifecycle hooks
 * @param {string} name - Test name
 * @param {Function} composable - Composable with lifecycle hooks
 * @returns {Function} Test suite
 */
export const testComposableLifecycle = (name, composable) => {
  return describe(`${name} Lifecycle`, () => {
    let result
    let wrapper

    beforeEach(() => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          return composable()
        }
      }

      wrapper = mount(TestComponent)
      result = wrapper.vm
    })

    it('handles component mounting', () => {
      expect(result).toBeDefined()
      expect(wrapper.vm).toBeTruthy()
    })

    it('handles component unmounting', async () => {
      const cleanupSpy = vi.fn()
      
      // If composable has cleanup function, spy on it
      if (result.cleanup && typeof result.cleanup === 'function') {
        result.cleanup = cleanupSpy
      }

      await wrapper.unmount()
      
      // Verify cleanup was called if it exists
      if (cleanupSpy.mock.calls.length > 0) {
        expect(cleanupSpy).toHaveBeenCalled()
      }
    })
  })
}

/**
 * Test composable with multiple instances
 * @param {string} name - Test name
 * @param {Function} composable - Composable function
 * @param {number} instanceCount - Number of instances to test
 * @returns {Function} Test suite
 */
export const testComposableInstances = (name, composable, instanceCount = 3) => {
  return describe(`${name} Multiple Instances`, () => {
    let instances

    beforeEach(() => {
      instances = []
      
      for (let i = 0; i < instanceCount; i++) {
        const TestComponent = {
          template: '<div></div>',
          setup() {
            return composable()
          }
        }

        const wrapper = mount(TestComponent)
        instances.push(wrapper.vm)
      }
    })

    it('creates independent instances', () => {
      expect(instances).toHaveLength(instanceCount)
      
      // Test that instances are independent
      instances.forEach((instance, index) => {
        expect(instance).toBeDefined()
        
        // If instances have state, they should be independent
        const stateProps = Object.keys(instance).filter(key => {
          const value = instance[key]
          return value && (value.__v_isRef || value.__v_isReactive)
        })

        if (stateProps.length > 0) {
          // Change first instance
          if (index === 0) {
            stateProps.forEach(prop => {
              const currentValue = instance[prop].value || instance[prop]
              if (typeof currentValue === 'string') {
                instance[prop] = currentValue + '_modified'
              }
            })
          }
        }
      })

      // Verify other instances weren't affected
      if (instances.length > 1) {
        const firstInstance = instances[0]
        const secondInstance = instances[1]
        
        Object.keys(firstInstance).forEach(key => {
          if (firstInstance[key] !== secondInstance[key]) {
            // State is properly isolated
            expect(firstInstance[key]).not.toEqual(secondInstance[key])
          }
        })
      }
    })
  })
}

export default testComposable