/**
 * Comprehensive Vitest Test Setup
 * Global configuration for all tests including BDD and Cypress integration
 */

import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock global objects
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock fetch
global.fetch = vi.fn()

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  }
})

// Vue Test Utils global config
config.global.mocks = {
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  },
  $route: {
    path: '/',
    query: {},
    params: {},
    meta: {}
  }
}

// Global test utilities
global.createMockComponent = (name, template = '<div></div>') => {
  return {
    name,
    template,
    props: {},
    data() {
      return {}
    }
  }
}

global.mockAsync = (value, delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), delay)
  })
}

// Axe accessibility testing setup
if (typeof window !== 'undefined' && !window.axe) {
  window.axe = {
    run: vi.fn().mockResolvedValue({ violations: [] }),
    configure: vi.fn(),
    reset: vi.fn()
  }
}

// Setup cleanup after each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})