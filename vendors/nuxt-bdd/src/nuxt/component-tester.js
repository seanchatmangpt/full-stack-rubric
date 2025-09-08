/**
 * Nuxt 4 Component Testing Utilities
 * Advanced component testing with Vue Test Utils integration
 */

import { mount, shallowMount, createLocalVue } from '@vue/test-utils'
import { createPinia } from 'pinia'

/**
 * Nuxt Component Tester
 * Comprehensive component testing with Nuxt 4 context
 */
export class NuxtComponentTester {
  /**
   * @param {Object} options - Tester configuration
   */
  constructor(options = {}) {
    this.options = {
      shallow: false,
      attachTo: null,
      propsData: {},
      slots: {},
      mocks: {},
      stubs: {},
      provide: {},
      ...options
    }
    
    this.nuxtContext = null
    this.mountedComponents = new Set()
    this.defaultMocks = new Map()
    this.defaultStubs = new Map()
  }

  /**
   * Initialize component tester with Nuxt context
   * @param {Object} nuxtContext - Nuxt test context
   */
  initialize(nuxtContext) {
    this.nuxtContext = nuxtContext
    this.setupDefaultMocks()
    this.setupDefaultStubs()
  }

  /**
   * Setup default Nuxt mocks
   * @private
   */
  setupDefaultMocks() {
    // Core Nuxt mocks
    this.defaultMocks.set('$nuxt', {
      context: this.nuxtContext,
      $router: this.nuxtContext?.router,
      $route: { path: '/', params: {}, query: {} }
    })

    this.defaultMocks.set('$fetch', this.nuxtContext?.$fetch || jest.fn())
    this.defaultMocks.set('$router', this.nuxtContext?.router || {
      push: jest.fn(),
      replace: jest.fn(),
      go: jest.fn()
    })

    // Nuxt 4 specific mocks
    this.defaultMocks.set('useNuxtApp', () => ({
      $router: this.defaultMocks.get('$router'),
      $fetch: this.defaultMocks.get('$fetch')
    }))

    this.defaultMocks.set('useState', (key, init) => {
      const state = new Map()
      return {
        value: state.get(key) || (typeof init === 'function' ? init() : init)
      }
    })

    this.defaultMocks.set('useRoute', () => ({
      path: '/',
      params: {},
      query: {},
      meta: {}
    }))
  }

  /**
   * Setup default component stubs
   * @private
   */
  setupDefaultStubs() {
    // Common Nuxt components
    this.defaultStubs.set('NuxtLink', {
      template: '<a href="#"><slot /></a>',
      props: ['to']
    })

    this.defaultStubs.set('NuxtPage', {
      template: '<div class="nuxt-page"><slot /></div>'
    })

    this.defaultStubs.set('NuxtLayout', {
      template: '<div class="nuxt-layout"><slot /></div>',
      props: ['name']
    })

    this.defaultStubs.set('ClientOnly', {
      template: '<div class="client-only"><slot /></div>'
    })
  }

  /**
   * Mount a Nuxt component with full context
   * @param {Object} component - Vue component
   * @param {Object} options - Mount options
   * @returns {Object} Mounted component wrapper
   */
  async mountComponent(component, options = {}) {
    const mountOptions = {
      ...this.options,
      ...options,
      mocks: {
        ...Object.fromEntries(this.defaultMocks),
        ...this.options.mocks,
        ...options.mocks
      },
      stubs: {
        ...Object.fromEntries(this.defaultStubs),
        ...this.options.stubs,
        ...options.stubs
      },
      global: {
        plugins: [createPinia()],
        ...options.global
      }
    }

    // Create component instance
    const wrapper = this.options.shallow 
      ? shallowMount(component, mountOptions)
      : mount(component, mountOptions)

    // Track mounted component
    this.mountedComponents.add(wrapper)

    // Add Nuxt-specific helpers
    this.enhanceWrapper(wrapper)

    return wrapper
  }

  /**
   * Enhance component wrapper with Nuxt utilities
   * @param {Object} wrapper - Component wrapper
   * @private
   */
  enhanceWrapper(wrapper) {
    // Navigation helpers
    wrapper.navigateTo = async (path) => {
      const router = wrapper.vm.$router || wrapper.vm.$nuxt?.$router
      if (router) {
        await router.push(path)
        await wrapper.vm.$nextTick()
      }
    }

    // State management helpers
    wrapper.setState = (key, value) => {
      if (wrapper.vm.$nuxt?.context) {
        wrapper.vm.$nuxt.context[key] = value
      }
      wrapper.vm.$data[key] = value
    }

    wrapper.getState = (key) => {
      return wrapper.vm.$data[key] || wrapper.vm.$nuxt?.context?.[key]
    }

    // Event simulation helpers
    wrapper.simulateUserInput = async (selector, value) => {
      const input = wrapper.find(selector)
      if (input.exists()) {
        await input.setValue(value)
        await input.trigger('input')
        await wrapper.vm.$nextTick()
      }
    }

    wrapper.simulateClick = async (selector) => {
      const element = wrapper.find(selector)
      if (element.exists()) {
        await element.trigger('click')
        await wrapper.vm.$nextTick()
      }
    }

    wrapper.simulateSubmit = async (selector = 'form') => {
      const form = wrapper.find(selector)
      if (form.exists()) {
        await form.trigger('submit')
        await wrapper.vm.$nextTick()
      }
    }

    // Async helpers
    wrapper.waitForCondition = async (condition, timeout = 5000) => {
      const start = Date.now()
      while (Date.now() - start < timeout) {
        if (await condition(wrapper)) {
          return true
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      throw new Error(`Condition not met within ${timeout}ms`)
    }

    wrapper.waitForElement = async (selector, timeout = 5000) => {
      return wrapper.waitForCondition(() => wrapper.find(selector).exists(), timeout)
    }

    wrapper.waitForText = async (text, timeout = 5000) => {
      return wrapper.waitForCondition(() => wrapper.text().includes(text), timeout)
    }

    // Composable testing helpers
    wrapper.testComposable = async (composableName, args = []) => {
      const composable = wrapper.vm[composableName]
      if (typeof composable === 'function') {
        return await composable(...args)
      }
      return composable
    }

    // Accessibility helpers
    wrapper.getAccessibilityTree = () => {
      const element = wrapper.element
      return {
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        ariaDescribedBy: element.getAttribute('aria-describedby'),
        tabIndex: element.getAttribute('tabindex'),
        focusable: element.tabIndex !== -1
      }
    }

    wrapper.checkAccessibility = () => {
      const issues = []
      const element = wrapper.element

      // Check for missing alt text on images
      const images = element.querySelectorAll('img')
      images.forEach(img => {
        if (!img.getAttribute('alt') && !img.getAttribute('aria-label')) {
          issues.push('Image missing alt text')
        }
      })

      // Check for missing labels on inputs
      const inputs = element.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
          const label = element.querySelector(`label[for="${input.id}"]`)
          if (!label) {
            issues.push(`Input missing label: ${input.type || 'unknown'}`)
          }
        }
      })

      return {
        isAccessible: issues.length === 0,
        issues
      }
    }
  }

  /**
   * Test component with different props combinations
   * @param {Object} component - Vue component
   * @param {Array} propsCombinations - Array of props objects
   * @returns {Array} Test results
   */
  async testPropsVariations(component, propsCombinations) {
    const results = []

    for (const props of propsCombinations) {
      try {
        const wrapper = await this.mountComponent(component, { propsData: props })
        const result = {
          props,
          success: true,
          rendered: wrapper.exists(),
          html: wrapper.html(),
          text: wrapper.text(),
          errors: []
        }
        results.push(result)
      } catch (error) {
        results.push({
          props,
          success: false,
          error: error.message,
          errors: [error.message]
        })
      }
    }

    return results
  }

  /**
   * Test component with different slot content
   * @param {Object} component - Vue component
   * @param {Object} slotsMap - Map of slot names to content
   * @returns {Object} Test result
   */
  async testSlotContent(component, slotsMap) {
    const wrapper = await this.mountComponent(component, {
      slots: slotsMap
    })

    const result = {
      rendered: wrapper.exists(),
      slotsRendered: {},
      html: wrapper.html()
    }

    // Check each slot was rendered
    Object.keys(slotsMap).forEach(slotName => {
      const slotContent = slotsMap[slotName]
      result.slotsRendered[slotName] = wrapper.html().includes(slotContent)
    })

    return result
  }

  /**
   * Test component lifecycle methods
   * @param {Object} component - Vue component
   * @param {Array} lifecycleHooks - Hooks to test
   * @returns {Object} Lifecycle test results
   */
  async testLifecycleMethods(component, lifecycleHooks = ['created', 'mounted', 'updated', 'destroyed']) {
    const hooksCalled = {}
    const originalHooks = {}

    // Mock lifecycle hooks
    lifecycleHooks.forEach(hook => {
      hooksCalled[hook] = false
      if (component[hook]) {
        originalHooks[hook] = component[hook]
        component[hook] = function(...args) {
          hooksCalled[hook] = true
          return originalHooks[hook].call(this, ...args)
        }
      }
    })

    const wrapper = await this.mountComponent(component)

    // Test update
    if (hooksCalled.hasOwnProperty('updated')) {
      wrapper.vm.$forceUpdate()
      await wrapper.vm.$nextTick()
    }

    // Test destroy
    if (hooksCalled.hasOwnProperty('destroyed')) {
      wrapper.destroy()
    }

    // Restore original hooks
    Object.keys(originalHooks).forEach(hook => {
      component[hook] = originalHooks[hook]
    })

    return {
      hooksCalled,
      wrapper: wrapper.isDestroyed ? null : wrapper
    }
  }

  /**
   * Test component responsive behavior
   * @param {Object} component - Vue component
   * @param {Array} viewports - Array of viewport sizes
   * @returns {Array} Responsive test results
   */
  async testResponsiveBehavior(component, viewports = [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1024, height: 768, name: 'desktop' }
  ]) {
    const results = []

    for (const viewport of viewports) {
      // Set viewport size (if in browser environment)
      if (typeof window !== 'undefined') {
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
      }

      const wrapper = await this.mountComponent(component, {
        attachTo: document.body
      })

      await wrapper.vm.$nextTick()

      results.push({
        viewport: viewport.name,
        size: { width: viewport.width, height: viewport.height },
        rendered: wrapper.exists(),
        html: wrapper.html(),
        computedStyles: window?.getComputedStyle ? 
          Array.from(wrapper.element.querySelectorAll('*')).map(el => 
            window.getComputedStyle(el)
          ) : null
      })

      wrapper.destroy()
    }

    return results
  }

  /**
   * Create component snapshot for regression testing
   * @param {Object} component - Vue component
   * @param {Object} options - Snapshot options
   * @returns {Object} Component snapshot
   */
  async createSnapshot(component, options = {}) {
    const wrapper = await this.mountComponent(component, options)

    const snapshot = {
      timestamp: new Date().toISOString(),
      component: component.name || 'Anonymous',
      props: options.propsData || {},
      html: wrapper.html(),
      text: wrapper.text(),
      tree: this.createElementTree(wrapper.element),
      accessibility: wrapper.checkAccessibility(),
      events: this.captureEvents(wrapper)
    }

    return snapshot
  }

  /**
   * Create element tree structure
   * @param {Element} element - DOM element
   * @returns {Object} Element tree
   * @private
   */
  createElementTree(element) {
    return {
      tagName: element.tagName,
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value
        return acc
      }, {}),
      children: Array.from(element.children).map(child => 
        this.createElementTree(child)
      ),
      textContent: element.textContent?.trim()
    }
  }

  /**
   * Capture component events
   * @param {Object} wrapper - Component wrapper
   * @returns {Array} Captured events
   * @private
   */
  captureEvents(wrapper) {
    const events = []
    const originalEmit = wrapper.vm.$emit

    wrapper.vm.$emit = function(event, ...args) {
      events.push({
        event,
        args,
        timestamp: Date.now()
      })
      return originalEmit.call(this, event, ...args)
    }

    return events
  }

  /**
   * Cleanup all mounted components
   */
  async cleanup() {
    for (const wrapper of this.mountedComponents) {
      if (!wrapper.isDestroyed) {
        wrapper.destroy()
      }
    }
    this.mountedComponents.clear()
  }
}

/**
 * Global component tester instance
 */
let globalComponentTester = null

/**
 * Get or create global component tester
 * @param {Object} options - Tester options
 * @returns {NuxtComponentTester} Tester instance
 */
export function getComponentTester(options = {}) {
  if (!globalComponentTester) {
    globalComponentTester = new NuxtComponentTester(options)
  }
  return globalComponentTester
}

/**
 * Initialize component testing environment
 * @param {Object} nuxtContext - Nuxt test context
 * @param {Object} options - Tester options
 * @returns {NuxtComponentTester} Initialized tester
 */
export function initializeComponentTesting(nuxtContext, options = {}) {
  const tester = getComponentTester(options)
  tester.initialize(nuxtContext)
  return tester
}

/**
 * Quick component mounting utility
 * @param {Object} component - Vue component
 * @param {Object} options - Mount options
 * @returns {Promise<Object>} Mounted component wrapper
 */
export async function mountNuxtComponent(component, options = {}) {
  const tester = getComponentTester()
  return await tester.mountComponent(component, options)
}