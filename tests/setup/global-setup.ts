/**
 * @fileoverview Global test setup for typing tutor test suite
 * Configures global mocks, utilities, and test environment
 */

import { vi } from 'vitest'
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
    store: new Map<string, string>(),
    getItem: vi.fn((key: string) => localStorageMock.store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock.store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      localStorageMock.store.delete(key)
    }),
    clear: vi.fn(() => {
      localStorageMock.store.clear()
    }),
    key: vi.fn((index: number) => {
      const keys = Array.from(localStorageMock.store.keys())
      return keys[index] || null
    }),
    get length() {
      return localStorageMock.store.size
    }
  }
  Object.defineProperty(global, 'localStorage', { value: localStorageMock })
  
  // Mock sessionStorage
  const sessionStorageMock = {
    store: new Map<string, string>(),
    getItem: vi.fn((key: string) => sessionStorageMock.store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      sessionStorageMock.store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      sessionStorageMock.store.delete(key)
    }),
    clear: vi.fn(() => {
      sessionStorageMock.store.clear()
    }),
    key: vi.fn((index: number) => {
      const keys = Array.from(sessionStorageMock.store.keys())
      return keys[index] || null
    }),
    get length() {
      return sessionStorageMock.store.size
    }
  }
  Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock })
  
  // Mock IndexedDB
  const indexedDBMock = {
    open: vi.fn(() => Promise.resolve({
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(() => Promise.resolve()),
          get: vi.fn(() => Promise.resolve({ value: null })),
          put: vi.fn(() => Promise.resolve()),
          delete: vi.fn(() => Promise.resolve()),
          getAll: vi.fn(() => Promise.resolve([])),
          clear: vi.fn(() => Promise.resolve())
        }))
      })),
      close: vi.fn()
    })),
    deleteDatabase: vi.fn(() => Promise.resolve())
  }
  Object.defineProperty(global, 'indexedDB', { value: indexedDBMock })
  
  // Mock URL API
  global.URL = {
    createObjectURL: vi.fn(() => 'blob:test-url'),
    revokeObjectURL: vi.fn()
  } as any
  
  // Mock Blob
  global.Blob = vi.fn((parts, options) => ({
    size: parts?.reduce((size: number, part: any) => size + part.length, 0) || 0,
    type: options?.type || '',
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
    text: vi.fn(() => Promise.resolve(''))
  })) as any
  
  // Mock File API
  global.File = vi.fn((bits, name, options) => ({
    name,
    size: bits?.reduce((size: number, bit: any) => size + bit.length, 0) || 0,
    type: options?.type || '',
    lastModified: Date.now(),
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
    text: vi.fn(() => Promise.resolve(''))
  })) as any
  
  // Mock Crypto API
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
      getRandomValues: vi.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
        return array
      })
    }
  })
  
  // Mock Clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('')),
      write: vi.fn(() => Promise.resolve()),
      read: vi.fn(() => Promise.resolve([]))
    },
    writable: true
  })
  
  // Mock Notification API
  global.Notification = {
    permission: 'granted',
    requestPermission: vi.fn(() => Promise.resolve('granted'))
  } as any
  
  // Mock Web Share API
  Object.defineProperty(navigator, 'share', {
    value: vi.fn(() => Promise.resolve()),
    writable: true
  })
  
  // Mock getUserMedia
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn(() => Promise.resolve({
        getTracks: vi.fn(() => []),
        getVideoTracks: vi.fn(() => []),
        getAudioTracks: vi.fn(() => [])
      }))
    },
    writable: true
  })
  
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
  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
  global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))
  
  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn((cb) => setTimeout(cb, 1))
  global.cancelIdleCallback = vi.fn((id) => clearTimeout(id))
  
  // Mock Performance API
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      timeOrigin: Date.now()
    },
    writable: true
  })
  
  // Mock Window methods
  global.alert = vi.fn()
  global.confirm = vi.fn(() => true)
  global.prompt = vi.fn(() => 'test')
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
  
  // Mock Canvas API
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn()
  }))
  
  // Mock Audio API
  global.Audio = vi.fn(() => ({
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    canPlayType: vi.fn(() => 'probably'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
}

/**
 * Configure Vue Test Utils
 */
function setupVueTestUtils() {
  // Global component stubs
  config.global.stubs = {
    // Add any global component stubs here
    Teleport: true,
    Transition: false,
    TransitionGroup: false
  }
  
  // Global mocks
  config.global.mocks = {
    // Add any global mocks here
    $t: (key: string) => key, // Mock i18n
    $route: {
      path: '/',
      params: {},
      query: {},
      hash: ''
    },
    $router: {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    }
  }
  
  // Global plugins
  config.global.plugins = []
  
  // Global provide
  config.global.provide = {}
}

/**
 * Set up console overrides for testing
 */
function setupConsoleOverrides() {
  // Suppress console warnings in tests unless explicitly needed
  const originalWarn = console.warn
  const originalError = console.error
  
  console.warn = vi.fn((...args) => {
    // Only show warnings that are not test-related
    if (!args[0]?.includes?.('[Vue warn]')) {
      originalWarn(...args)
    }
  })
  
  console.error = vi.fn((...args) => {
    // Only show errors that are not test-related
    if (!args[0]?.includes?.('[Vue warn]')) {
      originalError(...args)
    }
  })
}

/**
 * Clean up global mocks
 */
function cleanupGlobalMocks() {
  // Restore original console methods
  vi.restoreAllMocks()
}

/**
 * Reset global state between tests
 */
function resetGlobalState() {
  // Clear localStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset any global variables
  if (typeof window !== 'undefined') {
    // Reset window properties that might be modified by tests
    window.location.hash = ''
  }
  
  // Clear any timers
  vi.clearAllTimers()
}

// Export utilities for use in tests
export const testUtils = {
  /**
   * Create a mock function with type safety
   */
  createMockFunction: <T extends (...args: any[]) => any>(implementation?: T) => {
    return vi.fn(implementation) as vi.MockedFunction<T>
  },
  
  /**
   * Wait for next tick with timeout
   */
  waitForNextTick: (timeout = 100) => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout)
    })
  },
  
  /**
   * Mock performance.now with controlled time
   */
  mockTime: (startTime = 0) => {
    let currentTime = startTime
    const mockNow = vi.fn(() => currentTime)
    Object.defineProperty(global.performance, 'now', { value: mockNow })
    
    return {
      advance: (ms: number) => {
        currentTime += ms
      },
      set: (time: number) => {
        currentTime = time
      },
      get: () => currentTime,
      restore: () => {
        vi.restoreAllMocks()
      }
    }
  },
  
  /**
   * Create a mock storage implementation
   */
  createMockStorage: () => {
    const store = new Map<string, string>()
    return {
      getItem: vi.fn((key: string) => store.get(key) || null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
      get size() { return store.size },
      store
    }
  },
  
  /**
   * Mock DOM methods for elements
   */
  mockDOMMethods: (element: Element) => {
    element.scrollIntoView = vi.fn()
    element.focus = vi.fn()
    element.blur = vi.fn()
    element.click = vi.fn()
    
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      Object.defineProperty(element, 'selectionStart', { value: 0, writable: true })
      Object.defineProperty(element, 'selectionEnd', { value: 0, writable: true })
    }
  },
  
  /**
   * Create synthetic event
   */
  createEvent: (type: string, eventInit: any = {}) => {
    const event = new Event(type, eventInit)
    Object.assign(event, eventInit)
    return event
  },
  
  /**
   * Flush all promises
   */
  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0))
}