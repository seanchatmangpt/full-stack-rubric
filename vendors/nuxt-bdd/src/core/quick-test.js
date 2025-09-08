/**
 * Core quickTest utility - Ultra-efficient component testing with smart defaults
 * @fileoverview Framework-agnostic quick testing utility extracted from nuxt-bdd
 */

import { mount, shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

/**
 * @typedef {Object} QuickTestOptions
 * @property {boolean} shallow - Use shallow mounting
 * @property {Object} props - Props to pass to component
 * @property {Object} slots - Slots to render  
 * @property {Object} global - Global config for mounting
 * @property {boolean} autoProps - Auto-generate props from component
 * @property {Array<string>} events - Events to test automatically
 * @property {boolean} a11y - Run accessibility tests
 * @property {Object} mocks - Framework composables to mock
 * @property {number} timeout - Test timeout in ms
 */

/**
 * One-liner component test with smart defaults and BDD-style expectations
 * @param {string} name - Test suite name
 * @param {Object} component - Vue component to test
 * @param {QuickTestOptions} options - Test configuration options
 * @returns {Object} Test suite with enhanced wrapper utilities
 */
export function quickTest(name, component, options = {}) {
  const {
    shallow = false,
    props = {},
    slots = {},
    global = {},
    autoProps = true,
    events = [],
    a11y = true,
    mocks = {},
    timeout = 5000
  } = options

  return describe(name, () => {
    let wrapper
    let mockContext

    beforeEach(async () => {
      // Setup mock context for Nuxt/framework
      mockContext = {
        $router: { push: vi.fn(), replace: vi.fn(), go: vi.fn() },
        $route: { params: {}, query: {}, path: '/', name: 'index' },
        $fetch: vi.fn(),
        $nuxt: { context: {} },
        ...mocks
      }

      const mountFunction = shallow ? shallowMount : mount
      const generatedProps = autoProps ? generateSmartProps(component) : {}
      
      wrapper = mountFunction(component, {
        props: { ...generatedProps, ...props },
        slots,
        global: {
          mocks: mockContext,
          stubs: {
            NuxtLink: true,
            NuxtPage: true,
            ClientOnly: true,
            Teleport: true,
            ...global.stubs
          },
          ...global
        }
      })
    }, timeout)

    // Core rendering test
    it('renders without errors', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.html()).toBeTruthy()
    })

    // Props validation 
    it('validates props correctly', async () => {
      const componentProps = component.props || {}
      
      for (const [propName, propConfig] of Object.entries(componentProps)) {
        if (propConfig.required) {
          expect(wrapper.props(propName)).toBeDefined()
        }
        
        if (propConfig.validator) {
          const propValue = wrapper.props(propName)
          if (propValue !== undefined) {
            expect(propConfig.validator(propValue)).toBe(true)
          }
        }
      }
    })

    // Event testing
    if (events.length > 0) {
      it('emits events correctly', async () => {
        for (const eventName of events) {
          const trigger = wrapper.find(`[data-testid="${eventName}-trigger"]`)
          if (trigger.exists()) {
            await trigger.trigger('click')
            expect(wrapper.emitted(eventName)).toBeTruthy()
          }
        }
      })
    }

    // Accessibility testing
    if (a11y) {
      it('meets accessibility standards', () => {
        const element = wrapper.element
        
        // Check interactive elements have labels
        const interactive = element.querySelectorAll('button, a, input, select, textarea')
        interactive.forEach(el => {
          const hasLabel = el.getAttribute('aria-label') || 
                          el.getAttribute('aria-labelledby') || 
                          el.textContent.trim()
          expect(hasLabel).toBeTruthy()
        })

        // Check images have alt text
        const images = element.querySelectorAll('img')
        images.forEach(img => {
          expect(img.getAttribute('alt')).toBeTruthy()
        })
      })
    }

    // Return enhanced wrapper with utilities
    return {
      wrapper,
      mockContext,
      
      // Enhanced interaction methods
      async rerender(newProps = {}) {
        await wrapper.setProps({ ...wrapper.props(), ...newProps })
        await nextTick()
      },

      async emitEvent(eventName, payload) {
        wrapper.vm.$emit(eventName, payload)
        await nextTick()
      },

      // Element finding utilities
      getByTestId(testId) {
        return wrapper.find(`[data-testid="${testId}"]`)
      },

      getAllByTestId(testId) {
        return wrapper.findAll(`[data-testid="${testId}"]`)
      },

      getByText(text) {
        return wrapper.findAll('*').filter(node => 
          node.text().includes(text)
        )[0]
      },

      // BDD-style expectations
      should: {
        render: () => {
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.html()).toBeTruthy()
          return { wrapper }
        },

        contain: (text) => {
          expect(wrapper.text()).toContain(text)
          return { wrapper }
        },

        haveClass: (className) => {
          expect(wrapper.classes()).toContain(className)
          return { wrapper }
        },

        emit: (event, payload = undefined) => {
          const emitted = wrapper.emitted(event)
          expect(emitted).toBeTruthy()
          if (payload !== undefined) {
            expect(emitted[emitted.length - 1]).toEqual(payload)
          }
          return { wrapper }
        }
      }
    }
  })
}

/**
 * Generate smart default props based on component definition
 * @param {Object} component - Vue component
 * @returns {Object} Generated props object
 */
function generateSmartProps(component) {
  const props = {}
  const componentProps = component.props || {}

  for (const [propName, propConfig] of Object.entries(componentProps)) {
    if (typeof propConfig === 'function') {
      props[propName] = getDefaultValueForType(propConfig)
    } else if (typeof propConfig === 'object') {
      if (propConfig.default !== undefined) {
        props[propName] = typeof propConfig.default === 'function' 
          ? propConfig.default() 
          : propConfig.default
      } else if (propConfig.type) {
        props[propName] = getDefaultValueForType(propConfig.type)
      }
    }
  }

  return props
}

/**
 * Get default value for prop type constructor
 * @param {Function} type - Prop type constructor
 * @returns {*} Default value for type
 */
function getDefaultValueForType(type) {
  const typeMap = {
    String: 'test-string',
    Number: 42,
    Boolean: true,
    Array: [],
    Object: {},
    Date: new Date(),
    Function: vi.fn()
  }

  return typeMap[type.name] || null
}

/**
 * Batch test multiple components with same options
 * @param {Array} components - Array of [name, component, options] tuples
 * @returns {Array} Array of test results
 */
export function batchTest(components) {
  return components.map(([name, component, options = {}]) => 
    quickTest(name, component, options)
  )
}

/**
 * Test component with multiple prop combinations (prop matrix testing)
 * @param {string} name - Test suite name
 * @param {Object} component - Vue component
 * @param {Array} propCombinations - Array of prop objects to test
 * @returns {Object} Test suite with prop combinations
 */
export function propMatrix(name, component, propCombinations) {
  return describe(`${name} - Prop Matrix`, () => {
    propCombinations.forEach((props, index) => {
      quickTest(`Combination ${index + 1}`, component, { props })
    })
  })
}

export default quickTest