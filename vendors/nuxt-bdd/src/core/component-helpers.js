/**
 * Component Testing Helpers - Enhanced mounting and interaction utilities
 * @fileoverview Framework-agnostic component testing utilities
 */

import { mount, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vi, expect } from 'vitest'

/**
 * Enhanced mount function with automatic cleanup and BDD helpers
 * @param {Object} component - Vue component to mount
 * @param {Object} options - Mount options
 * @returns {Promise<Object>} Enhanced wrapper with BDD helpers
 */
export async function mountWithExpectations(component, options = {}) {
  // Use regular mount since mountSuspended is Nuxt-specific
  const wrapper = mount(component, {
    global: {
      stubs: {
        NuxtLink: true,
        NuxtPage: true,
        NuxtLayout: true,
        ClientOnly: true,
        Teleport: true,
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
        $fetch: vi.fn(),
        ...options.mocks
      },
      ...options.global
    },
    ...options
  })

  // Add BDD-style expectations
  wrapper.should = {
    render: () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.html()).toBeTruthy()
      return wrapper.should
    },

    contain: (text) => {
      expect(wrapper.text()).toContain(text)
      return wrapper.should
    },

    haveClass: (className) => {
      expect(wrapper.classes()).toContain(className)
      return wrapper.should
    },

    emit: (event, payload = undefined) => {
      const emitted = wrapper.emitted(event)
      expect(emitted).toBeTruthy()
      if (payload !== undefined) {
        expect(emitted[emitted.length - 1]).toEqual(payload)
      }
      return wrapper.should
    },

    haveAttribute: (attr, value) => {
      if (value !== undefined) {
        expect(wrapper.attributes(attr)).toBe(value)
      } else {
        expect(wrapper.attributes()).toHaveProperty(attr)
      }
      return wrapper.should
    },

    beVisible: () => {
      expect(wrapper.isVisible()).toBe(true)
      return wrapper.should
    },

    beDisabled: () => {
      expect(wrapper.element.disabled).toBe(true)
      return wrapper.should
    }
  }

  // Add enhanced interaction methods
  wrapper.interact = {
    click: async (selector) => {
      const element = selector ? wrapper.find(selector) : wrapper
      await element.trigger('click')
      await nextTick()
      return wrapper.interact
    },

    type: async (selector, text) => {
      const input = wrapper.find(selector)
      await input.setValue(text)
      await input.trigger('input')
      await nextTick()
      return wrapper.interact
    },

    submit: async (selector = 'form') => {
      const form = wrapper.find(selector)
      await form.trigger('submit')
      await nextTick()
      return wrapper.interact
    },

    hover: async (selector) => {
      const element = selector ? wrapper.find(selector) : wrapper
      await element.trigger('mouseenter')
      await nextTick()
      return wrapper.interact
    },

    focus: async (selector) => {
      const element = selector ? wrapper.find(selector) : wrapper
      await element.trigger('focus')
      await nextTick()
      return wrapper.interact
    },

    blur: async (selector) => {
      const element = selector ? wrapper.find(selector) : wrapper
      await element.trigger('blur')
      await nextTick()
      return wrapper.interact
    },

    keypress: async (selector, key) => {
      const element = selector ? wrapper.find(selector) : wrapper
      await element.trigger('keydown', { key })
      await nextTick()
      return wrapper.interact
    },

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

  // Add element finding utilities
  wrapper.findByTestId = (testId) => wrapper.find(`[data-testid="${testId}"]`)
  wrapper.findAllByTestId = (testId) => wrapper.findAll(`[data-testid="${testId}"]`)
  wrapper.findByText = (text) => wrapper.findAll('*').filter(node => 
    node.text().includes(text)
  )[0]
  wrapper.findByRole = (role) => wrapper.find(`[role="${role}"]`)

  return wrapper
}

/**
 * Quick component test with minimal setup
 * @param {Object} component - Vue component
 * @param {Function} testFn - Test function receiving wrapper
 * @param {Object} options - Mount options
 */
export async function quickMount(component, testFn, options = {}) {
  const wrapper = await mountWithExpectations(component, options)
  try {
    await testFn(wrapper)
  } finally {
    wrapper.unmount()
  }
}

/**
 * Test component with different props combinations
 * @param {Object} component - Vue component
 * @param {Array} propSets - Array of prop objects to test
 * @param {Function} testFn - Test function for each prop set
 */
export async function testWithProps(component, propSets, testFn) {
  for (const props of propSets) {
    const wrapper = await mountWithExpectations(component, { props })
    try {
      await testFn(wrapper, props)
    } finally {
      wrapper.unmount()
    }
  }
}

/**
 * Test component responsiveness across different viewport sizes
 * @param {Object} component - Vue component
 * @param {Array} viewports - Array of viewport size objects
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
    try {
      await testFn(wrapper, viewport)
    } finally {
      wrapper.unmount()
    }
  }
}

/**
 * Create a component test factory with common options
 * @param {Object} defaultOptions - Default mount options
 * @returns {Function} Factory function for mounting components
 */
export function createMountFactory(defaultOptions = {}) {
  return async (component, options = {}) => {
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      global: {
        ...defaultOptions.global,
        ...options.global
      }
    }
    return mountWithExpectations(component, mergedOptions)
  }
}

/**
 * Mock Nuxt composables for testing
 * @param {Object} composables - Object with composable names and mock implementations
 * @returns {Object} Mock object for global mocks
 */
export function mockNuxtComposables(composables = {}) {
  const defaultMocks = {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    }),
    useRoute: () => ({
      params: {},
      query: {},
      path: '/',
      name: 'index'
    }),
    useFetch: () => ({
      data: vi.fn(),
      pending: vi.fn(() => false),
      error: vi.fn(() => null),
      refresh: vi.fn()
    }),
    useState: (key, init) => {
      const state = init ? (typeof init === 'function' ? init() : init) : null
      return vi.fn(() => state)
    },
    useHead: vi.fn(),
    useMeta: vi.fn(),
    useAsyncData: () => ({
      data: vi.fn(),
      pending: vi.fn(() => false),
      error: vi.fn(() => null),
      refresh: vi.fn()
    })
  }

  return {
    ...defaultMocks,
    ...composables
  }
}