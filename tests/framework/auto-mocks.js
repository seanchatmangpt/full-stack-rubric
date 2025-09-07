/**
 * Automatic mocking utilities for Nuxt composables and common dependencies
 * Provides intelligent mocking with sensible defaults and easy customization
 */

import { vi } from 'vitest'

/**
 * Auto-mock configuration store
 */
const mockStore = new Map()
const mockDefaults = new Map()

/**
 * Register default mock implementations
 */
function registerDefaultMocks() {
  // Nuxt composables
  mockDefaults.set('useRoute', () => ({
    path: '/',
    name: 'index',
    params: {},
    query: {},
    hash: '',
    fullPath: '/',
    matched: [],
    meta: {},
    redirectedFrom: undefined
  }))

  mockDefaults.set('useRouter', () => ({
    push: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    resolve: vi.fn().mockReturnValue({ href: '/' }),
    currentRoute: { value: mockDefaults.get('useRoute')() },
    options: { history: {}, routes: [] }
  }))

  mockDefaults.set('useNuxtApp', () => ({
    $router: mockDefaults.get('useRouter')(),
    $route: mockDefaults.get('useRoute')(),
    ssrContext: {},
    payload: {},
    runWithContext: vi.fn(),
    isHydrating: false,
    hooks: {
      hook: vi.fn(),
      callHook: vi.fn()
    }
  }))

  mockDefaults.set('useHead', () => vi.fn())
  mockDefaults.set('useSeoMeta', () => vi.fn())
  mockDefaults.set('useServerSeoMeta', () => vi.fn())

  mockDefaults.set('useFetch', () => ({
    data: ref(null),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    status: ref('idle')
  }))

  mockDefaults.set('useLazyFetch', () => mockDefaults.get('useFetch')())

  mockDefaults.set('useAsyncData', () => ({
    data: ref(null),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    status: ref('idle')
  }))

  mockDefaults.set('useLazyAsyncData', () => mockDefaults.get('useAsyncData')())

  mockDefaults.set('useState', (key, init) => {
    const state = ref(init ? init() : undefined)
    return state
  })

  mockDefaults.set('useSessionStorage', (key, defaultValue) => {
    const storage = ref(defaultValue)
    return storage
  })

  mockDefaults.set('useLocalStorage', (key, defaultValue) => {
    const storage = ref(defaultValue)
    return storage
  })

  mockDefaults.set('useCookie', (name, options = {}) => {
    const cookie = ref(options.default)
    return cookie
  })

  mockDefaults.set('useRequestHeaders', () => ({}))
  mockDefaults.set('useRequestURL', () => new URL('http://localhost:3000/'))
  mockDefaults.set('useRequestEvent', () => ({}))

  mockDefaults.set('navigateTo', () => vi.fn().mockResolvedValue(undefined))
  mockDefaults.set('abortNavigation', () => vi.fn())
  mockDefaults.set('refresh', () => vi.fn().mockResolvedValue(undefined))
  mockDefaults.set('reloadNuxtApp', () => vi.fn())

  mockDefaults.set('useError', () => vi.fn())
  mockDefaults.set('createError', () => vi.fn())
  mockDefaults.set('showError', () => vi.fn())
  mockDefaults.set('clearError', () => vi.fn())

  // Pinia store mocks
  mockDefaults.set('useStore', (storeId) => ({
    $id: storeId,
    $state: {},
    $patch: vi.fn(),
    $reset: vi.fn(),
    $subscribe: vi.fn(),
    $onAction: vi.fn(),
    $dispose: vi.fn()
  }))

  // Vue composables
  mockDefaults.set('ref', (value) => ({ value }))
  mockDefaults.set('reactive', (value) => value)
  mockDefaults.set('computed', (fn) => ({ value: fn() }))
  mockDefaults.set('watch', () => vi.fn())
  mockDefaults.set('watchEffect', () => vi.fn())
  mockDefaults.set('onMounted', () => vi.fn())
  mockDefaults.set('onUnmounted', () => vi.fn())
  mockDefaults.set('nextTick', () => Promise.resolve())
}

// Initialize default mocks
registerDefaultMocks()

/**
 * Auto-mock a composable with intelligent defaults
 * @param {string} name - Composable name
 * @param {Function|Object} customImplementation - Custom implementation
 * @returns {Function} Mock function
 */
export function autoMock(name, customImplementation) {
  if (mockStore.has(name)) {
    return mockStore.get(name)
  }

  let mockImplementation

  if (customImplementation) {
    mockImplementation = typeof customImplementation === 'function' 
      ? customImplementation 
      : () => customImplementation
  } else if (mockDefaults.has(name)) {
    mockImplementation = mockDefaults.get(name)
  } else {
    // Fallback mock
    mockImplementation = vi.fn().mockReturnValue({})
  }

  const mock = vi.fn(mockImplementation)
  mockStore.set(name, mock)

  return mock
}

/**
 * Mock multiple composables at once
 * @param {Object} mocks - Object mapping names to implementations
 * @returns {Object} Object mapping names to mock functions
 */
export function autoMockMultiple(mocks) {
  const result = {}
  
  for (const [name, implementation] of Object.entries(mocks)) {
    result[name] = autoMock(name, implementation)
  }

  return result
}

/**
 * Mock all Nuxt composables with sensible defaults
 * @param {Object} overrides - Override specific mocks
 * @returns {Object} All Nuxt mock functions
 */
export function mockNuxtComposables(overrides = {}) {
  const nuxtMocks = [
    'useRoute', 'useRouter', 'useNuxtApp', 'useHead', 'useSeoMeta',
    'useFetch', 'useLazyFetch', 'useAsyncData', 'useLazyAsyncData',
    'useState', 'useSessionStorage', 'useLocalStorage', 'useCookie',
    'useRequestHeaders', 'useRequestURL', 'useRequestEvent',
    'navigateTo', 'abortNavigation', 'refresh', 'reloadNuxtApp',
    'useError', 'createError', 'showError', 'clearError'
  ]

  return autoMockMultiple({
    ...Object.fromEntries(nuxtMocks.map(name => [name, undefined])),
    ...overrides
  })
}

/**
 * Mock Vue composables
 * @param {Object} overrides - Override specific mocks
 * @returns {Object} All Vue mock functions
 */
export function mockVueComposables(overrides = {}) {
  const vueMocks = [
    'ref', 'reactive', 'computed', 'watch', 'watchEffect',
    'onMounted', 'onUnmounted', 'nextTick'
  ]

  return autoMockMultiple({
    ...Object.fromEntries(vueMocks.map(name => [name, undefined])),
    ...overrides
  })
}

/**
 * Smart mock factory that creates contextual mocks
 * @param {string} type - Type of mock to create
 * @param {Object} config - Mock configuration
 * @returns {Object} Mock implementation
 */
export function createSmartMock(type, config = {}) {
  const factories = {
    'api-client': (config) => ({
      get: vi.fn().mockResolvedValue(config.responses?.get || { data: {} }),
      post: vi.fn().mockResolvedValue(config.responses?.post || { data: {} }),
      put: vi.fn().mockResolvedValue(config.responses?.put || { data: {} }),
      delete: vi.fn().mockResolvedValue(config.responses?.delete || { data: {} }),
      patch: vi.fn().mockResolvedValue(config.responses?.patch || { data: {} })
    }),

    'store': (config) => ({
      state: config.initialState || {},
      getters: Object.fromEntries(
        Object.keys(config.getters || {}).map(key => [key, vi.fn()])
      ),
      mutations: Object.fromEntries(
        Object.keys(config.mutations || {}).map(key => [key, vi.fn()])
      ),
      actions: Object.fromEntries(
        Object.keys(config.actions || {}).map(key => [key, vi.fn()])
      ),
      commit: vi.fn(),
      dispatch: vi.fn().mockResolvedValue(undefined)
    }),

    'database': (config) => ({
      select: vi.fn().mockResolvedValue(config.data?.select || []),
      insert: vi.fn().mockResolvedValue(config.data?.insert || { id: 1 }),
      update: vi.fn().mockResolvedValue(config.data?.update || 1),
      delete: vi.fn().mockResolvedValue(config.data?.delete || 1),
      transaction: vi.fn().mockImplementation(fn => fn()),
      raw: vi.fn().mockResolvedValue([])
    }),

    'auth-service': (config) => ({
      login: vi.fn().mockResolvedValue(config.responses?.login || { token: 'mock-token' }),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(config.responses?.refresh || { token: 'new-token' }),
      getUser: vi.fn().mockResolvedValue(config.responses?.getUser || { id: 1, name: 'Test User' }),
      isAuthenticated: vi.fn().mockReturnValue(config.authenticated || false)
    }),

    'validation': (config) => ({
      validate: vi.fn().mockResolvedValue(config.valid ? { valid: true } : { valid: false, errors: ['Invalid'] }),
      sanitize: vi.fn().mockImplementation(data => data),
      rules: config.rules || {}
    })
  }

  if (!factories[type]) {
    throw new Error(`Unknown mock type: ${type}`)
  }

  return factories[type](config)
}

/**
 * Mock with automatic cleanup
 * @param {string} modulePath - Path to module to mock
 * @param {*} mockImplementation - Mock implementation
 * @returns {Function} Cleanup function
 */
export function mockWithCleanup(modulePath, mockImplementation) {
  const spy = vi.mock(modulePath, mockImplementation)
  
  return () => {
    vi.unmock(modulePath)
    if (spy && spy.mockRestore) {
      spy.mockRestore()
    }
  }
}

/**
 * Temporary mock that automatically cleans up after a function
 * @param {string} modulePath - Module path to mock
 * @param {*} mockImplementation - Mock implementation
 * @param {Function} testFunction - Test function to run
 * @returns {Promise<*>} Test function result
 */
export async function withTemporaryMock(modulePath, mockImplementation, testFunction) {
  const cleanup = mockWithCleanup(modulePath, mockImplementation)
  
  try {
    return await testFunction()
  } finally {
    cleanup()
  }
}

/**
 * Mock manager for complex test scenarios
 */
export class MockManager {
  constructor() {
    this.mocks = new Map()
    this.cleanupFunctions = []
  }

  /**
   * Add a mock
   * @param {string} name - Mock name
   * @param {string} modulePath - Module path
   * @param {*} implementation - Mock implementation
   * @returns {MockManager} Manager instance
   */
  mock(name, modulePath, implementation) {
    const cleanup = mockWithCleanup(modulePath, implementation)
    this.mocks.set(name, { modulePath, implementation, cleanup })
    this.cleanupFunctions.push(cleanup)
    return this
  }

  /**
   * Add multiple mocks
   * @param {Object} mocks - Object mapping names to {modulePath, implementation}
   * @returns {MockManager} Manager instance
   */
  mockMultiple(mocks) {
    for (const [name, { modulePath, implementation }] of Object.entries(mocks)) {
      this.mock(name, modulePath, implementation)
    }
    return this
  }

  /**
   * Update a mock
   * @param {string} name - Mock name
   * @param {*} newImplementation - New implementation
   * @returns {MockManager} Manager instance
   */
  updateMock(name, newImplementation) {
    const mock = this.mocks.get(name)
    if (mock) {
      mock.cleanup()
      const cleanup = mockWithCleanup(mock.modulePath, newImplementation)
      mock.implementation = newImplementation
      mock.cleanup = cleanup
      
      // Update cleanup functions
      const index = this.cleanupFunctions.indexOf(mock.cleanup)
      if (index > -1) {
        this.cleanupFunctions[index] = cleanup
      }
    }
    return this
  }

  /**
   * Remove a specific mock
   * @param {string} name - Mock name
   * @returns {MockManager} Manager instance
   */
  removeMock(name) {
    const mock = this.mocks.get(name)
    if (mock) {
      mock.cleanup()
      this.mocks.delete(name)
      
      const index = this.cleanupFunctions.indexOf(mock.cleanup)
      if (index > -1) {
        this.cleanupFunctions.splice(index, 1)
      }
    }
    return this
  }

  /**
   * Clean up all mocks
   * @returns {void}
   */
  cleanup() {
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.mocks.clear()
    this.cleanupFunctions = []
  }

  /**
   * Execute function with mocks and auto-cleanup
   * @param {Function} testFunction - Test function
   * @returns {Promise<*>} Test result
   */
  async withMocks(testFunction) {
    try {
      return await testFunction()
    } finally {
      this.cleanup()
    }
  }
}

/**
 * Create a new mock manager
 * @returns {MockManager} New manager instance
 */
export function createMockManager() {
  return new MockManager()
}

/**
 * Reset all auto-mocks
 * @returns {void}
 */
export function resetAllMocks() {
  mockStore.clear()
  vi.resetAllMocks()
}

/**
 * Clear all mocks but keep implementations
 * @returns {void}
 */
export function clearAllMocks() {
  for (const mock of mockStore.values()) {
    if (mock.mockClear) {
      mock.mockClear()
    }
  }
}