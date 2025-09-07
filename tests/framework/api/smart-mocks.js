/**
 * @fileoverview Intelligent API mocking system with OpenAPI schema integration
 * Provides automatic mock generation, validation, and smart responses
 */

import { faker } from '@faker-js/faker';
import { createMockFactories } from './mock-factories.js';
import { validateRequest, validateResponse } from './validation-helpers.js';

/**
 * Smart mock configuration
 * @typedef {Object} SmartMockConfig
 * @property {Object} schema - OpenAPI schema definition
 * @property {string} baseUrl - Base URL for API endpoints
 * @property {number} defaultDelay - Default response delay in ms
 * @property {boolean} strictValidation - Enable strict request/response validation
 * @property {Object} globalHeaders - Headers to include in all responses
 */

/**
 * Mock response definition
 * @typedef {Object} MockResponse
 * @property {number} status - HTTP status code
 * @property {Object} headers - Response headers
 * @property {*} data - Response body data
 * @property {number} delay - Response delay in ms
 * @property {Function} transformer - Data transformation function
 */

export class SmartMockSystem {
  /**
   * Initialize smart mock system
   * @param {SmartMockConfig} config - Configuration options
   */
  constructor(config = {}) {
    this.schema = config.schema || {};
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.defaultDelay = config.defaultDelay || 100;
    this.strictValidation = config.strictValidation || false;
    this.globalHeaders = config.globalHeaders || {};
    
    this.mocks = new Map();
    this.interceptors = [];
    this.factories = createMockFactories();
    this.requestHistory = [];
    this.activeScenario = 'default';
    
    this._setupGlobalInterceptors();
  }

  /**
   * Register mock for specific endpoint
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string|RegExp} path - URL path or pattern
   * @param {MockResponse|Function} response - Mock response or response function
   * @param {Object} options - Additional options
   */
  mock(method, path, response, options = {}) {
    const key = this._createMockKey(method, path);
    const mockDefinition = {
      method: method.toLowerCase(),
      path,
      response: typeof response === 'function' ? response : () => response,
      options: {
        scenario: options.scenario || 'default',
        priority: options.priority || 0,
        conditions: options.conditions || [],
        ...options
      }
    };

    if (!this.mocks.has(key)) {
      this.mocks.set(key, []);
    }
    
    const mocks = this.mocks.get(key);
    mocks.push(mockDefinition);
    mocks.sort((a, b) => b.options.priority - a.options.priority);
    
    return this;
  }

  /**
   * Auto-generate mocks from OpenAPI schema
   * @param {Object} paths - OpenAPI paths object
   * @param {Object} options - Generation options
   */
  generateFromSchema(paths, options = {}) {
    const { autoMock = true, scenarios = ['success', 'error'] } = options;
    
    Object.entries(paths).forEach(([pathTemplate, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          this._generateMockFromOperation(method, pathTemplate, operation, scenarios);
        }
      });
    });
    
    return this;
  }

  /**
   * Generate mock from single OpenAPI operation
   * @private
   */
  _generateMockFromOperation(method, pathTemplate, operation, scenarios) {
    const { responses, parameters, requestBody } = operation;
    
    scenarios.forEach(scenario => {
      if (scenario === 'success') {
        // Generate success response mocks
        Object.entries(responses)
          .filter(([status]) => status.startsWith('2'))
          .forEach(([status, responseSpec]) => {
            const mockResponse = this._createMockFromResponseSpec(
              parseInt(status), 
              responseSpec, 
              operation
            );
            
            this.mock(method, pathTemplate, mockResponse, { scenario });
          });
      } else if (scenario === 'error') {
        // Generate error response mocks
        Object.entries(responses)
          .filter(([status]) => !status.startsWith('2'))
          .forEach(([status, responseSpec]) => {
            const mockResponse = this._createMockFromResponseSpec(
              parseInt(status), 
              responseSpec, 
              operation
            );
            
            this.mock(method, pathTemplate, mockResponse, { scenario });
          });
      }
    });
  }

  /**
   * Create mock response from OpenAPI response specification
   * @private
   */
  _createMockFromResponseSpec(status, responseSpec, operation) {
    const { content, headers: headerSpec } = responseSpec;
    
    return (req) => {
      const headers = { ...this.globalHeaders };
      
      // Add headers from spec
      if (headerSpec) {
        Object.entries(headerSpec).forEach(([name, spec]) => {
          headers[name] = this._generateFromSchema(spec.schema);
        });
      }
      
      let data = null;
      
      // Generate response body from content spec
      if (content) {
        const contentType = Object.keys(content)[0] || 'application/json';
        const mediaType = content[contentType];
        
        if (mediaType?.schema) {
          data = this._generateFromSchema(mediaType.schema);
        }
        
        headers['Content-Type'] = contentType;
      }
      
      return {
        status,
        headers,
        data,
        delay: this.defaultDelay
      };
    };
  }

  /**
   * Generate mock data from JSON schema
   * @private
   */
  _generateFromSchema(schema) {
    if (!schema) return null;
    
    const { type, format, properties, items, example, examples } = schema;
    
    // Use explicit examples first
    if (example !== undefined) return example;
    if (examples && examples.length > 0) {
      return examples[Math.floor(Math.random() * examples.length)];
    }
    
    switch (type) {
      case 'string':
        return this._generateString(format);
      case 'number':
      case 'integer':
        return this._generateNumber(schema);
      case 'boolean':
        return faker.datatype.boolean();
      case 'array':
        return this._generateArray(items);
      case 'object':
        return this._generateObject(properties);
      default:
        return this.factories.mixed();
    }
  }

  /**
   * Generate string based on format
   * @private
   */
  _generateString(format) {
    switch (format) {
      case 'email': return faker.internet.email();
      case 'uri': return faker.internet.url();
      case 'date': return faker.date.past().toISOString().split('T')[0];
      case 'date-time': return faker.date.past().toISOString();
      case 'uuid': return faker.datatype.uuid();
      case 'password': return faker.internet.password();
      default: return faker.lorem.words(3);
    }
  }

  /**
   * Generate number with constraints
   * @private
   */
  _generateNumber(schema) {
    const { minimum = 0, maximum = 1000, multipleOf } = schema;
    let number = faker.datatype.number({ min: minimum, max: maximum });
    
    if (multipleOf) {
      number = Math.floor(number / multipleOf) * multipleOf;
    }
    
    return schema.type === 'integer' ? Math.floor(number) : number;
  }

  /**
   * Generate array from items schema
   * @private
   */
  _generateArray(items) {
    const length = faker.datatype.number({ min: 1, max: 5 });
    return Array.from({ length }, () => this._generateFromSchema(items));
  }

  /**
   * Generate object from properties schema
   * @private
   */
  _generateObject(properties) {
    if (!properties) return {};
    
    const obj = {};
    Object.entries(properties).forEach(([key, schema]) => {
      obj[key] = this._generateFromSchema(schema);
    });
    return obj;
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addInterceptor(interceptor) {
    this.interceptors.push(interceptor);
    return this;
  }

  /**
   * Set active scenario for mock selection
   * @param {string} scenario - Scenario name
   */
  setScenario(scenario) {
    this.activeScenario = scenario;
    return this;
  }

  /**
   * Handle incoming request
   * @param {Object} req - Request object
   * @returns {Promise<MockResponse>}
   */
  async handleRequest(req) {
    // Record request
    this.requestHistory.push({
      ...req,
      timestamp: Date.now(),
      scenario: this.activeScenario
    });

    // Run interceptors
    for (const interceptor of this.interceptors) {
      const result = await interceptor(req);
      if (result) return result;
    }

    // Find matching mock
    const mock = this._findMatchingMock(req);
    if (!mock) {
      return this._createNotFoundResponse(req);
    }

    // Validate request if strict validation enabled
    if (this.strictValidation && mock.options.validate !== false) {
      const validationResult = validateRequest(req, this.schema);
      if (!validationResult.valid) {
        return this._createValidationErrorResponse(validationResult);
      }
    }

    // Generate response
    const response = await mock.response(req);
    
    // Validate response if strict validation enabled
    if (this.strictValidation) {
      const validationResult = validateResponse(response, this.schema);
      if (!validationResult.valid) {
        console.warn('Mock response validation failed:', validationResult.errors);
      }
    }

    // Apply delay
    if (response.delay > 0) {
      await this._delay(response.delay);
    }

    return response;
  }

  /**
   * Find matching mock for request
   * @private
   */
  _findMatchingMock(req) {
    const { method, url } = req;
    const path = new URL(url, this.baseUrl).pathname;
    
    // Try exact match first
    const exactKey = this._createMockKey(method, path);
    const exactMocks = this.mocks.get(exactKey) || [];
    
    // Try pattern matching
    const patternMocks = [];
    for (const [key, mocks] of this.mocks.entries()) {
      if (key.includes('*') || key.includes(':')) {
        const matchingMocks = mocks.filter(mock => 
          this._matchesPattern(path, mock.path) &&
          method.toLowerCase() === mock.method
        );
        patternMocks.push(...matchingMocks);
      }
    }
    
    const allMocks = [...exactMocks, ...patternMocks];
    
    // Filter by scenario and conditions
    const candidateMocks = allMocks.filter(mock => {
      const scenarioMatch = mock.options.scenario === this.activeScenario;
      const conditionsMatch = mock.options.conditions.every(condition => 
        condition(req)
      );
      return scenarioMatch && conditionsMatch;
    });
    
    // Return highest priority mock
    return candidateMocks[0] || null;
  }

  /**
   * Check if path matches pattern
   * @private
   */
  _matchesPattern(path, pattern) {
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    
    // Convert Express-style pattern to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')  // :param -> capture group
      .replace(/\*/g, '.*')           // * -> any characters
      .replace(/\//g, '\\/');         // escape slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Create mock key for storage
   * @private
   */
  _createMockKey(method, path) {
    return `${method.toLowerCase()}:${path}`;
  }

  /**
   * Create 404 response
   * @private
   */
  _createNotFoundResponse(req) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      data: {
        error: 'Not Found',
        message: `Mock not found for ${req.method} ${req.url}`,
        path: req.url
      },
      delay: 0
    };
  }

  /**
   * Create validation error response
   * @private
   */
  _createValidationErrorResponse(validationResult) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      data: {
        error: 'Validation Error',
        message: 'Request validation failed',
        details: validationResult.errors
      },
      delay: 0
    };
  }

  /**
   * Setup global interceptors
   * @private
   */
  _setupGlobalInterceptors() {
    // CORS interceptor
    this.addInterceptor((req) => {
      if (req.method.toLowerCase() === 'options') {
        return {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Max-Age': '86400'
          },
          data: null,
          delay: 0
        };
      }
    });
    
    // Rate limiting interceptor (for testing rate limit handling)
    this.addInterceptor((req) => {
      if (req.headers['x-test-rate-limit']) {
        return {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          },
          data: {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded'
          },
          delay: 0
        };
      }
    });
  }

  /**
   * Create delay promise
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get request history
   * @param {Object} filters - Optional filters
   * @returns {Array} Request history
   */
  getRequestHistory(filters = {}) {
    let history = [...this.requestHistory];
    
    if (filters.method) {
      history = history.filter(req => 
        req.method.toLowerCase() === filters.method.toLowerCase()
      );
    }
    
    if (filters.path) {
      history = history.filter(req => 
        req.url.includes(filters.path)
      );
    }
    
    if (filters.scenario) {
      history = history.filter(req => 
        req.scenario === filters.scenario
      );
    }
    
    return history;
  }

  /**
   * Clear request history
   */
  clearHistory() {
    this.requestHistory = [];
    return this;
  }

  /**
   * Clear all mocks
   */
  clearMocks() {
    this.mocks.clear();
    return this;
  }

  /**
   * Reset mock system to initial state
   */
  reset() {
    this.clearMocks();
    this.clearHistory();
    this.activeScenario = 'default';
    this.interceptors = [];
    this._setupGlobalInterceptors();
    return this;
  }
}

/**
 * Create smart mock system instance
 * @param {SmartMockConfig} config - Configuration options
 * @returns {SmartMockSystem}
 */
export function createSmartMocks(config) {
  return new SmartMockSystem(config);
}

/**
 * Default export for convenience
 */
export default SmartMockSystem;