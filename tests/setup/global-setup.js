/**
 * @fileoverview Global test setup for typing tutor test suite
 * Configures global mocks, utilities, and test environment
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'

// Global test configuration
beforeAll(() => {
  // Set up global test environment
  setupGlobalMocks()
  setupVueTestUtils()
  setupConsoleOverrides()
})

afterAll(() => {
  // Cleanup global resources
  cleanupGlobalMocks()
})

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  vi.clearAllTimers()
  
  // Reset any global state
  resetGlobalState()
})

afterEach(() => {
  // Cleanup after each test
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/**
 * Set up global mocks for browser APIs
 */
function setupGlobalMocks() {
  // Mock localStorage
  const localStorageMock = {
    store: new Map(),
    getItem: vi.fn((key) => localStorageMock.store.get(key) || null),
    setItem: vi.fn((key, value) => {
      localStorageMock.store.set(key, value)
    }),
    removeItem: vi.fn((key) => {
      localStorageMock.store.delete(key)
    }),
    clear: vi.fn(() => {
      localStorageMock.store.clear()
    }),
    key: vi.fn((index) => {
      const keys = Array.from(localStorageMock.store.keys())
      return keys[index] || null
    }),
    get length() {
      return localStorageMock.store.size
    }
  }

  // Mock sessionStorage
  const sessionStorageMock = {
    store: new Map(),
    getItem: vi.fn((key) => sessionStorageMock.store.get(key) || null),
    setItem: vi.fn((key, value) => {
      sessionStorageMock.store.set(key, value)
    }),
    removeItem: vi.fn((key) => {
      sessionStorageMock.store.delete(key)
    }),
    clear: vi.fn(() => {
      sessionStorageMock.store.clear()
    }),
    key: vi.fn((index) => {
      const keys = Array.from(sessionStorageMock.store.keys())
      return keys[index] || null
    }),
    get length() {
      return sessionStorageMock.store.size
    }
  }

  // Mock File and Blob APIs
  global.File = class MockFile {
    constructor(parts, name, options = {}) {
      this.name = name
      this.type = options.type || ''
      this.lastModified = options.lastModified || Date.now()
      this.size = parts?.reduce((size, part) => size + part.length, 0) || 0
    }
  }

  global.Blob = class MockBlob {
    constructor(bits, options = {}) {
      this.type = options.type || ''
      this.size = bits?.reduce((size, bit) => size + bit.length, 0) || 0
    }
  }

  // Mock Performance API
  const performanceMock = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn((name) => {}),
    measure: vi.fn((name, startMark, endMark) => {}),
    getEntriesByName: vi.fn((name) => []),
    getEntriesByType: vi.fn((type) => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    timeOrigin: Date.now()
  }

  // Mock URL API
  global.URL = {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock MutationObserver
  global.MutationObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  }))

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16)
  })

  global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id)
  })

  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn((callback) => {
    return setTimeout(callback, 0)
  })

  global.cancelIdleCallback = vi.fn((id) => {
    clearTimeout(id)
  })

  // Assign mocks to global objects
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })
  Object.defineProperty(window, 'performance', { value: performanceMock })
  
  Object.defineProperty(global, 'localStorage', { value: localStorageMock })
  Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock })
  Object.defineProperty(global, 'performance', { value: performanceMock })

  // Mock console methods to reduce test noise
  const consoleMethods = ['log', 'warn', 'error', 'info', 'debug']
  consoleMethods.forEach(method => {
    global.console[method] = vi.fn()
  })

  // Mock fetch API
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      headers: new Map(),
      url: '',
      redirected: false,
      type: 'basic',
      statusText: 'OK'
    })
  )
}

/**
 * Set up Vue Test Utils global configuration
 */
function setupVueTestUtils() {
  // Configure global stubs for common components
  config.global.stubs = {
    // Nuxt components
    NuxtLink: {
      template: '<a><slot /></a>',
      props: ['to']
    },
    NuxtPage: {
      template: '<div><slot /></div>'
    },
    NuxtLayout: {
      template: '<div><slot /></div>',
      props: ['name']
    },
    
    // Nuxt UI components
    UButton: {
      template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>',
      emits: ['click']
    },
    UInput: {
      template: '<input v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
      props: ['modelValue'],
      emits: ['update:modelValue']
    },
    UBadge: {
      template: '<span class="badge" v-bind="$attrs"><slot /></span>'
    },
    UCard: {
      template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>'
    },
    UModal: {
      template: '<div v-if="modelValue" class="modal"><slot /></div>',
      props: ['modelValue'],
      emits: ['update:modelValue']
    }
  }

  // Global plugins
  config.global.plugins = []

  // Global mocks
  config.global.mocks = {
    $t: (key) => key, // Mock i18n
    $route: {
      path: '/',
      params: {},
      query: {},
      hash: '',
      fullPath: '/',
      matched: [],
      meta: {},
      name: null,
      redirectedFrom: undefined
    },
    $router: {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      resolve: vi.fn(),
      addRoute: vi.fn(),
      removeRoute: vi.fn(),
      hasRoute: vi.fn(() => true),
      getRoutes: vi.fn(() => [])
    }
  }
}

/**
 * Set up console overrides for better test output
 */
function setupConsoleOverrides() {
  // Store original methods
  global._originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  }

  // Override console methods for tests
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
  console.info = vi.fn()
  console.debug = vi.fn()
}

/**
 * Clean up global mocks
 */
function cleanupGlobalMocks() {
  // Restore original console methods
  if (global._originalConsole) {
    Object.assign(console, global._originalConsole)
    delete global._originalConsole
  }

  // Clear all timers
  vi.clearAllTimers()
  vi.useRealTimers()
}

/**
 * Reset global state between tests
 */
function resetGlobalState() {
  // Clear localStorage and sessionStorage
  if (global.localStorage) {
    global.localStorage.store.clear()
  }
  if (global.sessionStorage) {
    global.sessionStorage.store.clear()
  }

  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
}

// Export test utilities
export const testUtils = {
  // Time manipulation utilities
  time: {
    advance: (ms) => {
      vi.advanceTimersByTime(ms)
    },
    set: (time) => {
      vi.setSystemTime(time)
    },
    reset: () => {
      vi.useRealTimers()
    }
  },

  // Storage utilities
  storage: {
    clear: () => {
      global.localStorage.store.clear()
      global.sessionStorage.store.clear()
    },
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    store: new Map()
  },

  // Mock utilities
  mocks: {
    resetAll: () => {
      vi.clearAllMocks()
      vi.restoreAllMocks()
    },
    
    console: {
      suppress: () => {
        console.log = vi.fn()
        console.warn = vi.fn()
        console.error = vi.fn()
      },
      restore: () => {
        if (global._originalConsole) {
          Object.assign(console, global._originalConsole)
        }
      }
    }
  },

  // Event utilities
  events: {
    createEvent: (type, eventInit = {}) => {
      return new Event(type, {
        bubbles: true,
        cancelable: true,
        ...eventInit
      })
    },
    
    createKeyboardEvent: (type, key, options = {}) => {
      return new KeyboardEvent(type, {
        key,
        bubbles: true,
        cancelable: true,
        ...options
      })
    },
    
    createInputEvent: (type, data, options = {}) => {
      return new InputEvent(type, {
        data,
        bubbles: true,
        cancelable: true,
        ...options
      })
    }
  }
}

// Define time manipulation utilities
/**
 * @param {number} ms
 */
export const advanceTime = (ms) => {
  vi.advanceTimersByTime(ms)
}

/**
 * @param {number} [time]
 */
export const resetTime = (time) => {
  if (time !== undefined) {
    vi.setSystemTime(time)
  } else {
    vi.useRealTimers()
  }
}