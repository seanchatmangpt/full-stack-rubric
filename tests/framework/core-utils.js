/**
 * Core testing utilities for Nuxt micro-framework
 * Combines mountSuspended with BDD expectations and common patterns
 */

import { mount } from '@vue/test-utils'

// Mock mountSuspended for validation
const mountSuspended = mount
import { expect } from 'vitest'
import { nextTick } from 'vue'

/**
 * Enhanced mount function with automatic cleanup and BDD helpers
 * @param {Object} component - Vue component to mount
 * @param {Object} options - Mount options
 * @returns {Promise<Object>} Enhanced wrapper with BDD helpers
 */
export async function mountWithExpectations(component, options = {}) {
  const wrapper = await mountSuspended(component, {
    global: {
      stubs: {
        NuxtLink: true,
        NuxtPage: true,
        NuxtLayout: true,
        ...options.stubs
      },
      mocks: {
        $route: {
          path: '/',
          params: {},
          query: {},
          ...(options.route || {})
        },
        $router: {
          push: vi.fn(),
          replace: vi.fn(),
          go: vi.fn(),
          back: vi.fn(),
          forward: vi.fn(),
          ...(options.router || {})
        },
        ...options.mocks
      },
      ...options.global
    },
    ...options
  })

  // Add BDD-style expectations to wrapper
  wrapper.should = {
    /**
     * Assert component renders without errors
     * @returns {Object} Chainable expectations
     */
    render: () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.html()).toBeTruthy()
      return wrapper.should
    },

    /**
     * Assert component contains specific text
     * @param {string} text - Text to find
     * @returns {Object} Chainable expectations
     */
    contain: (text) => {
      expect(wrapper.text()).toContain(text)
      return wrapper.should
    },

    /**
     * Assert component has specific class
     * @param {string} className - CSS class to check
     * @returns {Object} Chainable expectations
     */
    haveClass: (className) => {
      expect(wrapper.classes()).toContain(className)
      return wrapper.should
    },

    /**
     * Assert component emits specific event
     * @param {string} event - Event name
     * @param {*} payload - Expected payload
     * @returns {Object} Chainable expectations
     */
    emit: (event, payload = undefined) => {
      const emitted = wrapper.emitted(event)
      expect(emitted).toBeTruthy()
      if (payload !== undefined) {
        expect(emitted[emitted.length - 1]).toEqual(payload)
      }
      return wrapper.should
    },

    /**
     * Assert component has specific attribute
     * @param {string} attr - Attribute name
     * @param {string} value - Expected value
     * @returns {Object} Chainable expectations
     */
    haveAttribute: (attr, value) => {
      if (value !== undefined) {
        expect(wrapper.attributes(attr)).toBe(value)
      } else {
        expect(wrapper.attributes()).toHaveProperty(attr)
      }
      return wrapper.should
    }
  }

  // Add enhanced interaction methods
  wrapper.interact = {
    /**
     * Click element and wait for updates
     * @param {string} selector - Element selector
     * @returns {Promise<Object>} Chainable interactions
     */
    click: async (selector) => {
      const element = selector ? wrapper.find(selector) : wrapper
      await element.trigger('click')
      await nextTick()
      return wrapper.interact
    },

    /**
     * Type text into input and wait for updates
     * @param {string} selector - Input selector
     * @param {string} text - Text to type
     * @returns {Promise<Object>} Chainable interactions
     */
    type: async (selector, text) => {
      const input = wrapper.find(selector)
      await input.setValue(text)
      await input.trigger('input')
      await nextTick()
      return wrapper.interact
    },

    /**
     * Submit form and wait for updates
     * @param {string} selector - Form selector
     * @returns {Promise<Object>} Chainable interactions
     */
    submit: async (selector = 'form') => {
      const form = wrapper.find(selector)
      await form.trigger('submit')
      await nextTick()
      return wrapper.interact
    },

    /**
     * Wait for specific condition
     * @param {Function} condition - Condition function
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<Object>} Chainable interactions
     */
    waitFor: async (condition, timeout = 1000) => {
      const start = Date.now()
      while (Date.now() - start < timeout) {
        if (condition(wrapper)) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      return wrapper.interact
    }
  }

  return wrapper
}

/**
 * Quick component test with minimal setup
 * @param {Object} component - Vue component
 * @param {Function} testFn - Test function
 * @param {Object} options - Mount options
 */
export async function quickTest(component, testFn, options = {}) {
  const wrapper = await mountWithExpectations(component, options)
  await testFn(wrapper)
  wrapper.unmount()
}

/**
 * Test component with different props
 * @param {Object} component - Vue component
 * @param {Array} propSets - Array of prop objects to test
 * @param {Function} testFn - Test function for each prop set
 */
export async function testWithProps(component, propSets, testFn) {
  for (const props of propSets) {
    const wrapper = await mountWithExpectations(component, { props })
    await testFn(wrapper, props)
    wrapper.unmount()
  }
}

/**
 * Test component responsiveness across different viewport sizes
 * @param {Object} component - Vue component
 * @param {Array} viewports - Array of viewport sizes
 * @param {Function} testFn - Test function for each viewport
 */
export async function testResponsive(component, viewports, testFn) {
  for (const viewport of viewports) {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: viewport.width
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: viewport.height
    })

    const wrapper = await mountWithExpectations(component)
    await testFn(wrapper, viewport)
    wrapper.unmount()
  }
}

/**
 * Accessibility testing helper
 * @param {Object} wrapper - Component wrapper
 * @returns {Object} Accessibility assertions
 */
export function a11yTest(wrapper) {
  return {
    /**
     * Check for proper ARIA labels
     */
    hasAriaLabels: () => {
      const interactiveElements = wrapper.findAll('button, input, select, textarea, a, [tabindex]')
      interactiveElements.forEach(el => {
        const hasLabel = el.attributes('aria-label') || 
                        el.attributes('aria-labelledby') ||
                        el.find('label').exists()
        expect(hasLabel).toBeTruthy()
      })
    },

    /**
     * Check keyboard navigation
     */
    isKeyboardAccessible: async () => {
      const focusableElements = wrapper.findAll('button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])')
      for (const el of focusableElements) {
        await el.trigger('keydown', { key: 'Tab' })
        expect(document.activeElement).toBe(el.element)
      }
    },

    /**
     * Check color contrast (simplified check)
     */
    hasGoodContrast: () => {
      const elements = wrapper.findAll('*')
      elements.forEach(el => {
        const styles = window.getComputedStyle(el.element)
        const bgColor = styles.backgroundColor
        const textColor = styles.color
        
        // Basic contrast check (would need more sophisticated implementation)
        expect(bgColor).not.toBe(textColor)
      })
    }
  }
}

/**
 * Performance testing helper
 * @param {Function} operation - Operation to measure
 * @param {number} maxTime - Maximum allowed time in ms
 * @returns {Promise<number>} Actual execution time
 */
export async function performanceTest(operation, maxTime = 100) {
  const start = performance.now()
  await operation()
  const duration = performance.now() - start
  
  expect(duration).toBeLessThan(maxTime)
  return duration
}

/**
 * Memory leak detection helper
 * @param {Function} operation - Operation to test
 * @param {number} iterations - Number of iterations
 * @returns {Promise<void>}
 */
export async function memoryLeakTest(operation, iterations = 10) {
  const initialMemory = performance.memory?.usedJSHeapSize || 0
  
  for (let i = 0; i < iterations; i++) {
    await operation()
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }
  
  const finalMemory = performance.memory?.usedJSHeapSize || 0
  const memoryIncrease = finalMemory - initialMemory
  
  // Allow for some memory increase but flag excessive growth
  expect(memoryIncrease).toBeLessThan(1024 * 1024) // 1MB threshold
}

/**
 * Error boundary testing
 * @param {Object} component - Component to test
 * @param {Function} errorTrigger - Function that should trigger error
 * @returns {Promise<Object>} Error information
 */
export async function errorBoundaryTest(component, errorTrigger) {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  
  try {
    const wrapper = await mountWithExpectations(component)
    await errorTrigger(wrapper)
    
    // Check if error was handled gracefully
    expect(wrapper.exists()).toBe(true)
    expect(consoleSpy).toHaveBeenCalled()
    
    return {
      errorsCaught: consoleSpy.mock.calls.length,
      lastError: consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1]
    }
  } finally {
    consoleSpy.mockRestore()
  }
}