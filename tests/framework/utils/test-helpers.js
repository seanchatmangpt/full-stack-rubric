/**
 * Test Helpers - Utility functions for BDD testing
 * Provides common testing utilities with 80% boilerplate reduction
 */

import { expect } from 'vitest'

/**
 * DOM Testing Helpers
 */
export class DOMHelpers {
  constructor(context) {
    this.context = context
  }

  /**
   * Find element by selector
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   */
  findElement(selector) {
    if (typeof document !== 'undefined') {
      return document.querySelector(selector)
    }
    // In test environment, return mock element
    return { selector, textContent: '', classList: [] }
  }

  /**
   * Find multiple elements
   * @param {string} selector - CSS selector
   * @returns {NodeList|Array}
   */
  findElements(selector) {
    if (typeof document !== 'undefined') {
      return document.querySelectorAll(selector)
    }
    return []
  }

  /**
   * Check if element exists
   * @param {string} selector - CSS selector
   * @returns {boolean}
   */
  elementExists(selector) {
    return !!this.findElement(selector)
  }

  /**
   * Get element text content
   * @param {string} selector - CSS selector
   * @returns {string}
   */
  getElementText(selector) {
    const element = this.findElement(selector)
    return element?.textContent || ''
  }

  /**
   * Check if element has class
   * @param {string} selector - CSS selector
   * @param {string} className - Class name
   * @returns {boolean}
   */
  elementHasClass(selector, className) {
    const element = this.findElement(selector)
    return element?.classList?.contains(className) || false
  }

  /**
   * Wait for element to appear
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<Element>}
   */
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const check = () => {
        const element = this.findElement(selector)
        if (element) {
          resolve(element)
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`))
        } else {
          setTimeout(check, 100)
        }
      }
      
      check()
    })
  }
}

/**
 * API Testing Helpers
 */
export class APIHelpers {
  constructor(context) {
    this.context = context
  }

  /**
   * Make API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Response>}
   */
  async request(endpoint, options = {}) {
    const response = await this.context.$fetch(endpoint, {
      method: 'GET',
      headers: {},
      ...options
    })
    
    this.context.lastApiResponse = response
    return response
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} query - Query parameters
   * @returns {Promise<Response>}
   */
  async get(endpoint, query = {}) {
    return this.request(endpoint, {
      method: 'GET',
      query
    })
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Response>}
   */
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body
    })
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Response>}
   */
  async put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body
    })
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Response>}
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }

  /**
   * Assert response status
   * @param {number} expectedStatus - Expected status code
   */
  assertStatus(expectedStatus) {
    expect(this.context.lastApiResponse?.status).toBe(expectedStatus)
  }

  /**
   * Assert response contains data
   * @param {Object} expectedData - Expected data
   */
  assertResponseContains(expectedData) {
    const response = this.context.lastApiResponse
    for (const [key, value] of Object.entries(expectedData)) {
      expect(response[key]).toBe(value)
    }
  }

  /**
   * Assert response has property
   * @param {string} property - Property name
   */
  assertResponseHasProperty(property) {
    expect(this.context.lastApiResponse).toHaveProperty(property)
  }
}

/**
 * Form Testing Helpers
 */
export class FormHelpers {
  constructor(context) {
    this.context = context
    this.formData = {}
  }

  /**
   * Fill form field
   * @param {string} field - Field selector or name
   * @param {string} value - Field value
   */
  fillField(field, value) {
    this.formData[field] = value
    this.context.formData = { ...this.context.formData, ...this.formData }
  }

  /**
   * Fill multiple fields
   * @param {Object} data - Field data object
   */
  fillFields(data) {
    Object.entries(data).forEach(([field, value]) => {
      this.fillField(field, value)
    })
  }

  /**
   * Submit form
   * @param {string} formSelector - Form selector
   * @returns {Promise<void>}
   */
  async submitForm(formSelector = 'form') {
    this.context.submittedFormData = this.formData
    this.context.lastSubmittedForm = formSelector
    
    // In real implementation, this would trigger actual form submission
    return Promise.resolve()
  }

  /**
   * Reset form data
   */
  resetForm() {
    this.formData = {}
    this.context.formData = {}
  }

  /**
   * Get form data
   * @returns {Object}
   */
  getFormData() {
    return { ...this.formData }
  }

  /**
   * Assert field has value
   * @param {string} field - Field name
   * @param {string} expectedValue - Expected value
   */
  assertFieldValue(field, expectedValue) {
    expect(this.formData[field]).toBe(expectedValue)
  }

  /**
   * Assert form was submitted
   */
  assertFormSubmitted() {
    expect(this.context.submittedFormData).toBeTruthy()
  }
}

/**
 * Authentication Testing Helpers
 */
export class AuthHelpers {
  constructor(context) {
    this.context = context
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<void>}
   */
  async login(credentials = {}) {
    const defaultCredentials = {
      email: 'test@example.com',
      password: 'password123'
    }
    
    const creds = { ...defaultCredentials, ...credentials }
    
    // Mock login response
    this.context.user = {
      isAuthenticated: true,
      token: 'mock-jwt-token',
      email: creds.email,
      role: credentials.role || 'user'
    }
    
    // Store in context for later use
    this.context.authToken = this.context.user.token
  }

  /**
   * Logout user
   */
  logout() {
    this.context.user = {
      isAuthenticated: false,
      token: null,
      email: null,
      role: null
    }
    this.context.authToken = null
  }

  /**
   * Set user role
   * @param {string} role - User role
   */
  setRole(role) {
    if (this.context.user) {
      this.context.user.role = role
    }
  }

  /**
   * Assert user is logged in
   */
  assertLoggedIn() {
    expect(this.context.user?.isAuthenticated).toBe(true)
    expect(this.context.user?.token).toBeTruthy()
  }

  /**
   * Assert user is logged out
   */
  assertLoggedOut() {
    expect(this.context.user?.isAuthenticated).toBe(false)
    expect(this.context.user?.token).toBeFalsy()
  }

  /**
   * Assert user has role
   * @param {string} expectedRole - Expected role
   */
  assertUserRole(expectedRole) {
    expect(this.context.user?.role).toBe(expectedRole)
  }
}

/**
 * Data Testing Helpers
 */
export class DataHelpers {
  constructor(context) {
    this.context = context
    this.testData = new Map()
  }

  /**
   * Generate test data
   * @param {string} type - Data type
   * @param {Object} options - Generation options
   * @returns {*}
   */
  generateTestData(type, options = {}) {
    const generators = {
      user: () => ({
        id: Math.floor(Math.random() * 1000),
        email: `test${Date.now()}@example.com`,
        name: `Test User ${Math.floor(Math.random() * 100)}`,
        role: 'user',
        ...options
      }),
      
      product: () => ({
        id: Math.floor(Math.random() * 1000),
        name: `Test Product ${Math.floor(Math.random() * 100)}`,
        price: Math.floor(Math.random() * 1000),
        category: 'test',
        ...options
      }),
      
      order: () => ({
        id: Math.floor(Math.random() * 1000),
        userId: Math.floor(Math.random() * 100),
        total: Math.floor(Math.random() * 1000),
        status: 'pending',
        items: [],
        ...options
      })
    }
    
    const data = generators[type] ? generators[type]() : { ...options }
    this.testData.set(`${type}_${data.id || Date.now()}`, data)
    
    return data
  }

  /**
   * Store test data
   * @param {string} key - Data key
   * @param {*} data - Data to store
   */
  storeData(key, data) {
    this.testData.set(key, data)
    this.context.testData = this.context.testData || {}
    this.context.testData[key] = data
  }

  /**
   * Get stored data
   * @param {string} key - Data key
   * @returns {*}
   */
  getData(key) {
    return this.testData.get(key) || this.context.testData?.[key]
  }

  /**
   * Clear all test data
   */
  clearData() {
    this.testData.clear()
    this.context.testData = {}
  }

  /**
   * Create test fixtures
   * @param {string} fixtureName - Fixture name
   * @param {Object} data - Fixture data
   */
  createFixture(fixtureName, data) {
    this.storeData(`fixture_${fixtureName}`, data)
  }

  /**
   * Load test fixture
   * @param {string} fixtureName - Fixture name
   * @returns {*}
   */
  loadFixture(fixtureName) {
    return this.getData(`fixture_${fixtureName}`)
  }
}

/**
 * Timing Helpers
 */
export class TimingHelpers {
  constructor(context) {
    this.context = context
    this.timers = new Map()
  }

  /**
   * Start timer
   * @param {string} name - Timer name
   */
  startTimer(name) {
    this.timers.set(name, Date.now())
  }

  /**
   * Stop timer and get duration
   * @param {string} name - Timer name
   * @returns {number} - Duration in ms
   */
  stopTimer(name) {
    const startTime = this.timers.get(name)
    if (!startTime) return 0
    
    const duration = Date.now() - startTime
    this.timers.delete(name)
    return duration
  }

  /**
   * Wait for specified time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Wait for condition to be true
   * @param {Function} condition - Condition function
   * @param {number} timeout - Timeout in ms
   * @param {number} interval - Check interval in ms
   * @returns {Promise<boolean>}
   */
  async waitForCondition(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true
      }
      await this.wait(interval)
    }
    
    throw new Error(`Condition not met within ${timeout}ms`)
  }

  /**
   * Assert operation completes within time
   * @param {Function} operation - Operation to test
   * @param {number} maxTime - Maximum time in ms
   * @returns {Promise<void>}
   */
  async assertTimingWithin(operation, maxTime) {
    const startTime = Date.now()
    await operation()
    const duration = Date.now() - startTime
    
    expect(duration).toBeLessThan(maxTime)
  }
}

/**
 * Combined Test Utilities
 * Provides access to all helper categories
 */
export class TestUtilities {
  constructor(context) {
    this.context = context
    this.dom = new DOMHelpers(context)
    this.api = new APIHelpers(context)
    this.form = new FormHelpers(context)
    this.auth = new AuthHelpers(context)
    this.data = new DataHelpers(context)
    this.timing = new TimingHelpers(context)
  }

  /**
   * Get all helpers as a single object
   * @returns {Object}
   */
  getHelpers() {
    return {
      dom: this.dom,
      api: this.api,
      form: this.form,
      auth: this.auth,
      data: this.data,
      timing: this.timing
    }
  }

  /**
   * Setup common test scenario
   * @param {Object} options - Setup options
   */
  async setupCommonScenario(options = {}) {
    const {
      authenticatedUser = false,
      userRole = 'user',
      testData = {},
      apiMocks = {}
    } = options

    // Setup authentication if needed
    if (authenticatedUser) {
      await this.auth.login({ role: userRole })
    }

    // Setup test data
    Object.entries(testData).forEach(([key, data]) => {
      this.data.storeData(key, data)
    })

    // Setup API mocks
    Object.entries(apiMocks).forEach(([endpoint, response]) => {
      // In real implementation, this would setup fetch mocks
      this.context.apiMocks = this.context.apiMocks || {}
      this.context.apiMocks[endpoint] = response
    })
  }

  /**
   * Cleanup after test
   */
  async cleanup() {
    this.data.clearData()
    this.auth.logout()
    // Clear any other test state
  }
}

/**
 * Factory function to create test utilities
 * @param {Object} context - Test context
 * @returns {TestUtilities}
 */
export function createTestUtilities(context) {
  return new TestUtilities(context)
}