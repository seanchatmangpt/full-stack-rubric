/**
 * Test Context Management - Centralized test state and utilities
 * @fileoverview Framework-agnostic test context management system
 */

import { vi } from 'vitest'

/**
 * Test context manager for sharing state across test utilities
 */
export class TestContext {
  constructor() {
    this.reset()
  }

  /**
   * Reset all context data
   */
  reset() {
    this.data = {}
    this.mocks = new Map()
    this.timers = new Map()
    this.fixtures = new Map()
    this.apiResponses = []
    this.formData = {}
    this.user = null
    this.authToken = null
    this.lastApiResponse = null
    this.submittedFormData = null
    this.lastSubmittedForm = null
  }

  /**
   * Store arbitrary data
   * @param {string} key - Data key
   * @param {*} value - Data value
   */
  set(key, value) {
    this.data[key] = value
  }

  /**
   * Retrieve stored data
   * @param {string} key - Data key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    return this.data[key] ?? defaultValue
  }

  /**
   * Check if data exists
   * @param {string} key - Data key
   * @returns {boolean} Whether key exists
   */
  has(key) {
    return key in this.data
  }

  /**
   * Remove data
   * @param {string} key - Data key
   */
  delete(key) {
    delete this.data[key]
  }

  /**
   * Store mock function
   * @param {string} name - Mock name
   * @param {Function} mockFn - Mock function
   */
  setMock(name, mockFn = vi.fn()) {
    this.mocks.set(name, mockFn)
    return mockFn
  }

  /**
   * Get mock function
   * @param {string} name - Mock name
   * @returns {Function} Mock function
   */
  getMock(name) {
    return this.mocks.get(name)
  }

  /**
   * Clear all mocks
   */
  clearMocks() {
    this.mocks.forEach(mock => {
      if (mock.mockClear) {
        mock.mockClear()
      }
    })
  }

  /**
   * Start a timer
   * @param {string} name - Timer name
   */
  startTimer(name) {
    this.timers.set(name, Date.now())
  }

  /**
   * Stop timer and get duration
   * @param {string} name - Timer name
   * @returns {number} Duration in ms
   */
  stopTimer(name) {
    const startTime = this.timers.get(name)
    if (!startTime) return 0

    const duration = Date.now() - startTime
    this.timers.delete(name)
    return duration
  }

  /**
   * Store fixture data
   * @param {string} name - Fixture name
   * @param {*} data - Fixture data
   */
  setFixture(name, data) {
    this.fixtures.set(name, data)
  }

  /**
   * Get fixture data
   * @param {string} name - Fixture name
   * @returns {*} Fixture data
   */
  getFixture(name) {
    return this.fixtures.get(name)
  }

  /**
   * Set authenticated user
   * @param {Object} user - User object
   * @param {string} token - Auth token
   */
  setUser(user, token = null) {
    this.user = user
    this.authToken = token
  }

  /**
   * Clear user authentication
   */
  clearUser() {
    this.user = null
    this.authToken = null
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.user && !!this.authToken
  }

  /**
   * Record API response
   * @param {string} endpoint - API endpoint
   * @param {*} response - API response
   */
  recordApiResponse(endpoint, response) {
    this.lastApiResponse = response
    this.apiResponses.push({
      endpoint,
      response,
      timestamp: Date.now()
    })
  }

  /**
   * Get last API response
   * @returns {*} Last API response
   */
  getLastApiResponse() {
    return this.lastApiResponse
  }

  /**
   * Get all API responses
   * @returns {Array} Array of API responses
   */
  getApiResponses() {
    return [...this.apiResponses]
  }

  /**
   * Store form data
   * @param {Object} data - Form data
   * @param {string} formSelector - Form selector
   */
  setFormData(data, formSelector = 'form') {
    this.formData = { ...this.formData, ...data }
    this.submittedFormData = data
    this.lastSubmittedForm = formSelector
  }

  /**
   * Get form data
   * @returns {Object} Current form data
   */
  getFormData() {
    return { ...this.formData }
  }

  /**
   * Clear form data
   */
  clearFormData() {
    this.formData = {}
    this.submittedFormData = null
    this.lastSubmittedForm = null
  }

  /**
   * Create a scoped context for a test suite
   * @param {string} scope - Scope name
   * @returns {Object} Scoped context methods
   */
  createScope(scope) {
    const scopedKey = (key) => `${scope}:${key}`

    return {
      set: (key, value) => this.set(scopedKey(key), value),
      get: (key, defaultValue) => this.get(scopedKey(key), defaultValue),
      has: (key) => this.has(scopedKey(key)),
      delete: (key) => this.delete(scopedKey(key)),
      setMock: (name, mockFn) => this.setMock(scopedKey(name), mockFn),
      getMock: (name) => this.getMock(scopedKey(name)),
      setFixture: (name, data) => this.setFixture(scopedKey(name), data),
      getFixture: (name) => this.getFixture(scopedKey(name))
    }
  }

  /**
   * Export context data as JSON
   * @returns {Object} Serializable context data
   */
  export() {
    return {
      data: this.data,
      formData: this.formData,
      user: this.user,
      authToken: this.authToken,
      apiResponses: this.apiResponses,
      timestamp: Date.now()
    }
  }

  /**
   * Import context data from JSON
   * @param {Object} contextData - Context data to import
   */
  import(contextData) {
    if (contextData.data) this.data = { ...contextData.data }
    if (contextData.formData) this.formData = { ...contextData.formData }
    if (contextData.user) this.user = contextData.user
    if (contextData.authToken) this.authToken = contextData.authToken
    if (contextData.apiResponses) this.apiResponses = [...contextData.apiResponses]
  }
}

/**
 * Global test context instance
 */
export const globalContext = new TestContext()

/**
 * Create a new isolated test context
 * @returns {TestContext} New test context instance
 */
export function createTestContext() {
  return new TestContext()
}

/**
 * Context-aware test helpers
 */
export class ContextHelpers {
  constructor(context = globalContext) {
    this.context = context
  }

  /**
   * Setup common test scenario
   * @param {Object} options - Setup options
   */
  async setupScenario(options = {}) {
    const {
      authenticatedUser = false,
      userRole = 'user',
      testData = {},
      fixtures = {},
      mocks = {}
    } = options

    // Setup authentication
    if (authenticatedUser) {
      const user = { id: '1', role: userRole, isAuthenticated: true }
      const token = 'mock-token'
      this.context.setUser(user, token)
    }

    // Store test data
    Object.entries(testData).forEach(([key, data]) => {
      this.context.set(key, data)
    })

    // Setup fixtures
    Object.entries(fixtures).forEach(([name, data]) => {
      this.context.setFixture(name, data)
    })

    // Setup mocks
    Object.entries(mocks).forEach(([name, mockFn]) => {
      this.context.setMock(name, mockFn || vi.fn())
    })
  }

  /**
   * Cleanup context after test
   */
  cleanup() {
    this.context.clearMocks()
    this.context.clearUser()
    this.context.clearFormData()
  }

  /**
   * Reset context completely
   */
  reset() {
    this.context.reset()
  }

  /**
   * Assert context state
   * @param {string} key - Data key to assert
   * @param {*} expectedValue - Expected value
   */
  assertState(key, expectedValue) {
    const actualValue = this.context.get(key)
    if (actualValue !== expectedValue) {
      throw new Error(`Context assertion failed: expected ${key} to be ${expectedValue}, got ${actualValue}`)
    }
  }

  /**
   * Wait for context condition
   * @param {Function} condition - Condition function
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<boolean>} Whether condition was met
   */
  async waitForCondition(condition, timeout = 5000) {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      if (condition(this.context)) {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    return false
  }
}

/**
 * Create context-aware helpers
 * @param {TestContext} context - Test context instance
 * @returns {ContextHelpers} Context helpers
 */
export function createContextHelpers(context = globalContext) {
  return new ContextHelpers(context)
}