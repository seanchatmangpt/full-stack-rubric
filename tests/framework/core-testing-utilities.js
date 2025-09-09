/**
 * Core Testing Utilities - Clean, Framework-Agnostic BDD Helpers
 * Focused on vitest-cucumber step definitions with 80/20 rule application
 * Extracted and refactored from project-specific testing framework
 */

import { expect } from 'vitest'

/**
 * Step Context Manager - Handles test context and state
 */
export class StepContext {
  constructor() {
    this.data = {}
    this.user = {}
    this.api = {}
    this.form = {}
    this.timers = new Map()
    this.mocks = new Map()
  }

  /**
   * Initialize context for a scenario
   * @param {Object} initialData - Initial context data
   */
  initialize(initialData = {}) {
    Object.assign(this.data, initialData)
    this.user = { isAuthenticated: false, token: null, role: null }
    this.api = { lastResponse: null, mocks: {} }
    this.form = { data: {}, submitted: false }
  }

  /**
   * Clean up context after scenario
   */
  cleanup() {
    this.data = {}
    this.user = {}
    this.api = {}
    this.form = {}
    this.timers.clear()
    this.mocks.clear()
  }

  /**
   * Store data with key
   * @param {string} key - Data key
   * @param {*} value - Data value
   */
  set(key, value) {
    this.data[key] = value
  }

  /**
   * Retrieve data by key
   * @param {string} key - Data key
   * @returns {*} Data value
   */
  get(key) {
    return this.data[key]
  }
}

/**
 * Step Definition Registry - Manages step patterns and implementations
 */
export class StepRegistry {
  constructor() {
    this.steps = new Map()
    this.patterns = new Map()
  }

  /**
   * Register a step definition
   * @param {string} type - Step type (given|when|then)
   * @param {string|RegExp} pattern - Step pattern
   * @param {Function} implementation - Step implementation
   */
  register(type, pattern, implementation) {
    const key = `${type}:${pattern.toString()}`
    this.steps.set(key, {
      type,
      pattern: typeof pattern === 'string' ? new RegExp(`^${pattern}$`) : pattern,
      implementation
    })
  }

  /**
   * Find matching step definition
   * @param {string} type - Step type
   * @param {string} text - Step text
   * @returns {Object|null} Step definition with extracted parameters
   */
  findStep(type, text) {
    for (const [key, step] of this.steps.entries()) {
      if (step.type === type) {
        const match = text.match(step.pattern)
        if (match) {
          return {
            step,
            parameters: match.slice(1)
          }
        }
      }
    }
    return null
  }

  /**
   * Get all registered steps
   * @returns {Array} Array of step definitions
   */
  getAllSteps() {
    return Array.from(this.steps.values())
  }
}

/**
 * Parameter Extractors - Handle common parameter patterns
 */
export const ParameterPatterns = {
  /**
   * Integer parameter: {int}
   */
  INT: '(\\d+)',

  /**
   * Float parameter: {float}
   */
  FLOAT: '(\\d+\\.\\d+)',

  /**
   * String parameter: {string}
   */
  STRING: '"([^"]*)"',

  /**
   * Word parameter: {word}
   */
  WORD: '([^\\s]+)',

  /**
   * Convert pattern with placeholders to regex
   * @param {string} pattern - Pattern with {type} placeholders
   * @returns {RegExp} Compiled regex pattern
   */
  compile(pattern) {
    let regexPattern = pattern
      .replace(/\{int\}/g, this.INT)
      .replace(/\{float\}/g, this.FLOAT)
      .replace(/\{string\}/g, this.STRING)
      .replace(/\{word\}/g, this.WORD)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars

    return new RegExp(`^${regexPattern}$`)
  },

  /**
   * Extract and convert parameters to proper types
   * @param {Array} matches - Regex match results
   * @returns {Array} Typed parameters
   */
  convert(matches) {
    return matches.map(param => {
      if (/^\d+$/.test(param)) return parseInt(param, 10)
      if (/^\d+\.\d+$/.test(param)) return parseFloat(param)
      return param.replace(/^"|"$/g, '') // Remove quotes
    })
  }
}

/**
 * Common Step Helpers - Reusable implementations for common scenarios
 */
export class StepHelpers {
  constructor(context) {
    this.context = context
  }

  /**
   * Authentication helpers
   */
  auth = {
    /**
     * Login user with credentials
     * @param {Object} credentials - Login credentials
     */
    login: (credentials = {}) => {
      this.context.user = {
        isAuthenticated: true,
        token: 'mock-token',
        role: credentials.role || 'user',
        email: credentials.email || 'test@example.com'
      }
    },

    /**
     * Logout current user
     */
    logout: () => {
      this.context.user = {
        isAuthenticated: false,
        token: null,
        role: null,
        email: null
      }
    },

    /**
     * Set user role
     * @param {string} role - User role
     */
    setRole: (role) => {
      if (this.context.user.isAuthenticated) {
        this.context.user.role = role
      }
    },

    /**
     * Assert user is logged in
     */
    assertLoggedIn: () => {
      expect(this.context.user.isAuthenticated).toBe(true)
      expect(this.context.user.token).toBeTruthy()
    },

    /**
     * Assert user is logged out
     */
    assertLoggedOut: () => {
      expect(this.context.user.isAuthenticated).toBe(false)
      expect(this.context.user.token).toBeFalsy()
    }
  }

  /**
   * API helpers
   */
  api = {
    /**
     * Mock API response
     * @param {string} endpoint - API endpoint
     * @param {Object} response - Mock response
     */
    mockResponse: (endpoint, response) => {
      this.context.api.mocks[endpoint] = response
    },

    /**
     * Make API request (mocked)
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response
     */
    request: async (endpoint, options = {}) => {
      const response = this.context.api.mocks[endpoint] || { status: 200, data: {} }
      this.context.api.lastResponse = response
      return response
    },

    /**
     * Assert response status
     * @param {number} expectedStatus - Expected status code
     */
    assertStatus: (expectedStatus) => {
      expect(this.context.api.lastResponse?.status).toBe(expectedStatus)
    },

    /**
     * Assert response contains data
     * @param {Object} expectedData - Expected data
     */
    assertResponseContains: (expectedData) => {
      const response = this.context.api.lastResponse
      Object.entries(expectedData).forEach(([key, value]) => {
        expect(response.data[key]).toBe(value)
      })
    }
  }

  /**
   * Form helpers
   */
  form = {
    /**
     * Fill form field
     * @param {string} field - Field name
     * @param {string} value - Field value
     */
    fill: (field, value) => {
      this.context.form.data[field] = value
    },

    /**
     * Fill multiple fields
     * @param {Object} data - Field data
     */
    fillFields: (data) => {
      Object.assign(this.context.form.data, data)
    },

    /**
     * Submit form
     */
    submit: () => {
      this.context.form.submitted = true
      this.context.form.submittedData = { ...this.context.form.data }
    },

    /**
     * Assert field has value
     * @param {string} field - Field name
     * @param {string} expectedValue - Expected value
     */
    assertFieldValue: (field, expectedValue) => {
      expect(this.context.form.data[field]).toBe(expectedValue)
    },

    /**
     * Assert form was submitted
     */
    assertSubmitted: () => {
      expect(this.context.form.submitted).toBe(true)
    }
  }

  /**
   * Timing helpers
   */
  timing = {
    /**
     * Wait for specified time
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Start timer
     * @param {string} name - Timer name
     */
    startTimer: (name) => {
      this.context.timers.set(name, Date.now())
    },

    /**
     * Stop timer and get duration
     * @param {string} name - Timer name
     * @returns {number} Duration in milliseconds
     */
    stopTimer: (name) => {
      const start = this.context.timers.get(name)
      if (!start) return 0
      this.context.timers.delete(name)
      return Date.now() - start
    }
  }

  /**
   * Data helpers
   */
  data = {
    /**
     * Generate test user
     * @param {Object} overrides - Property overrides
     * @returns {Object} Test user data
     */
    generateUser: (overrides = {}) => ({
      id: Math.floor(Math.random() * 1000),
      email: `test${Date.now()}@example.com`,
      name: `Test User ${Math.floor(Math.random() * 100)}`,
      role: 'user',
      ...overrides
    }),

    /**
     * Store test data
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    store: (key, value) => {
      this.context.set(key, value)
    },

    /**
     * Retrieve test data
     * @param {string} key - Data key
     * @returns {*} Data value
     */
    retrieve: (key) => {
      return this.context.get(key)
    }
  }
}

/**
 * Step Definition Factory - Create step definitions with helpers
 */
export class StepDefinitionFactory {
  constructor() {
    this.registry = new StepRegistry()
    this.context = new StepContext()
    this.helpers = new StepHelpers(this.context)
  }

  /**
   * Create Given step definition
   * @param {string} pattern - Step pattern
   * @param {Function} implementation - Step implementation
   */
  Given(pattern, implementation) {
    const compiledPattern = ParameterPatterns.compile(pattern)
    this.registry.register('given', compiledPattern, implementation)
  }

  /**
   * Create When step definition
   * @param {string} pattern - Step pattern
   * @param {Function} implementation - Step implementation
   */
  When(pattern, implementation) {
    const compiledPattern = ParameterPatterns.compile(pattern)
    this.registry.register('when', compiledPattern, implementation)
  }

  /**
   * Create Then step definition
   * @param {string} pattern - Step pattern
   * @param {Function} implementation - Step implementation
   */
  Then(pattern, implementation) {
    const compiledPattern = ParameterPatterns.compile(pattern)
    this.registry.register('then', compiledPattern, implementation)
  }

  /**
   * Execute step by text
   * @param {string} type - Step type
   * @param {string} text - Step text
   * @returns {Promise<*>} Step result
   */
  async executeStep(type, text) {
    const match = this.registry.findStep(type, text)
    if (!match) {
      throw new Error(`No step definition found for: ${type} ${text}`)
    }

    const parameters = ParameterPatterns.convert(match.parameters)
    return await match.step.implementation(this.context, this.helpers, ...parameters)
  }

  /**
   * Initialize context for scenario
   * @param {Object} data - Initial data
   */
  beforeScenario(data = {}) {
    this.context.initialize(data)
  }

  /**
   * Cleanup after scenario
   */
  afterScenario() {
    this.context.cleanup()
  }

  /**
   * Get registry for inspection
   * @returns {StepRegistry} Step registry
   */
  getRegistry() {
    return this.registry
  }

  /**
   * Get current context
   * @returns {StepContext} Current context
   */
  getContext() {
    return this.context
  }

  /**
   * Get helpers
   * @returns {StepHelpers} Helper functions
   */
  getHelpers() {
    return this.helpers
  }
}

/**
 * Common Step Pattern Generators
 */
export const CommonStepPatterns = {
  /**
   * Generate authentication steps
   * @param {StepDefinitionFactory} factory - Step factory
   */
  authentication(factory) {
    factory.Given('user is logged out', async (context, helpers) => {
      helpers.auth.logout()
    })

    factory.Given('user is logged in', async (context, helpers) => {
      helpers.auth.login()
    })

    factory.Given('user is logged in as {string}', async (context, helpers, role) => {
      helpers.auth.login({ role })
    })

    factory.Then('user should be logged in', async (context, helpers) => {
      helpers.auth.assertLoggedIn()
    })

    factory.Then('user should be logged out', async (context, helpers) => {
      helpers.auth.assertLoggedOut()
    })
  },

  /**
   * Generate API steps
   * @param {StepDefinitionFactory} factory - Step factory
   */
  api(factory) {
    factory.When('I call API {string}', async (context, helpers, endpoint) => {
      await helpers.api.request(endpoint)
    })

    factory.When('API {string} returns status {int}', async (context, helpers, endpoint, status) => {
      helpers.api.mockResponse(endpoint, { status, data: {} })
    })

    factory.Then('response status should be {int}', async (context, helpers, expectedStatus) => {
      helpers.api.assertStatus(expectedStatus)
    })
  },

  /**
   * Generate form steps
   * @param {StepDefinitionFactory} factory - Step factory
   */
  forms(factory) {
    factory.When('I fill {string} with {string}', async (context, helpers, field, value) => {
      helpers.form.fill(field, value)
    })

    factory.When('I submit the form', async (context, helpers) => {
      helpers.form.submit()
    })

    factory.Then('form should be submitted', async (context, helpers) => {
      helpers.form.assertSubmitted()
    })

    factory.Then('{string} field should have value {string}', async (context, helpers, field, value) => {
      helpers.form.assertFieldValue(field, value)
    })
  },

  /**
   * Generate timing steps
   * @param {StepDefinitionFactory} factory - Step factory
   */
  timing(factory) {
    factory.When('I wait {int} seconds', async (context, helpers, seconds) => {
      await helpers.timing.wait(seconds * 1000)
    })

    factory.Given('timer {string} is started', async (context, helpers, name) => {
      helpers.timing.startTimer(name)
    })

    factory.Then('timer {string} should be less than {int} ms', async (context, helpers, name, maxTime) => {
      const duration = helpers.timing.stopTimer(name)
      expect(duration).toBeLessThan(maxTime)
    })
  },

  /**
   * Generate all common patterns
   * @param {StepDefinitionFactory} factory - Step factory
   */
  all(factory) {
    this.authentication(factory)
    this.api(factory)
    this.forms(factory)
    this.timing(factory)
  }
}

/**
 * Simple factory function for creating step definitions
 * @returns {StepDefinitionFactory} Configured factory
 */
export function createStepFactory() {
  const factory = new StepDefinitionFactory()
  
  // Auto-register common patterns
  CommonStepPatterns.all(factory)
  
  return factory
}

/**
 * Export utilities for direct use
 */
export {
  StepContext,
  StepRegistry,
  StepHelpers,
  ParameterPatterns
}