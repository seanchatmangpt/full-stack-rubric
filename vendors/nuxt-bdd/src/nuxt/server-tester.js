/**
 * Nuxt 4 Server-Side Testing Utilities
 * Comprehensive testing for Nuxt API routes and server functionality
 */

import { createServer } from 'http'
import { performance } from 'perf_hooks'

/**
 * Nuxt Server Tester
 * Advanced server-side route and API testing
 */
export class NuxtServerTester {
  /**
   * @param {Object} options - Tester configuration
   */
  constructor(options = {}) {
    this.options = {
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      retries: 1,
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    }
    
    this.nuxtContext = null
    this.testServer = null
    this.interceptors = new Map()
    this.requestHistory = []
    this.mockResponses = new Map()
  }

  /**
   * Initialize server tester with Nuxt context
   * @param {Object} nuxtContext - Nuxt test context
   */
  initialize(nuxtContext) {
    this.nuxtContext = nuxtContext
    this.setupRequestInterception()
  }

  /**
   * Setup request interception for testing
   * @private
   */
  setupRequestInterception() {
    if (this.nuxtContext?.$fetch) {
      const originalFetch = this.nuxtContext.$fetch
      
      this.nuxtContext.$fetch = async (url, options = {}) => {
        const startTime = performance.now()
        
        // Record request
        const request = {
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body,
          timestamp: Date.now(),
          startTime
        }
        
        // Check for mock response
        const mockKey = `${request.method}:${url}`
        if (this.mockResponses.has(mockKey)) {
          const mock = this.mockResponses.get(mockKey)
          const endTime = performance.now()
          
          this.requestHistory.push({
            ...request,
            response: mock.response,
            status: mock.status || 200,
            duration: endTime - startTime,
            mocked: true
          })
          
          if (mock.status >= 400) {
            const error = new Error(`HTTP ${mock.status}`)
            error.statusCode = mock.status
            throw error
          }
          
          return mock.response
        }
        
        try {
          const response = await originalFetch(url, options)
          const endTime = performance.now()
          
          this.requestHistory.push({
            ...request,
            response,
            status: 200,
            duration: endTime - startTime,
            mocked: false
          })
          
          return response
        } catch (error) {
          const endTime = performance.now()
          
          this.requestHistory.push({
            ...request,
            error: error.message,
            status: error.statusCode || 500,
            duration: endTime - startTime,
            mocked: false
          })
          
          throw error
        }
      }
    }
  }

  /**
   * Test API route with comprehensive validation
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Test result
   */
  async testApiRoute(endpoint, options = {}) {
    const testOptions = {
      method: 'GET',
      body: null,
      headers: {},
      expectedStatus: 200,
      expectedSchema: null,
      timeout: this.options.timeout,
      ...options
    }

    const startTime = performance.now()
    
    try {
      // Prepare request
      const requestConfig = {
        method: testOptions.method,
        headers: {
          ...this.options.headers,
          ...testOptions.headers
        }
      }

      if (testOptions.body && testOptions.method !== 'GET') {
        requestConfig.body = typeof testOptions.body === 'string' 
          ? testOptions.body 
          : JSON.stringify(testOptions.body)
      }

      // Make request
      const response = await this.makeRequest(endpoint, requestConfig, testOptions.timeout)
      const endTime = performance.now()
      
      // Validate response
      const validation = await this.validateResponse(response, testOptions)
      
      return {
        success: validation.isValid,
        endpoint,
        method: testOptions.method,
        status: response.status || 200,
        response: response.data || response,
        duration: endTime - startTime,
        headers: response.headers || {},
        validation,
        errors: validation.errors
      }
    } catch (error) {
      const endTime = performance.now()
      
      return {
        success: false,
        endpoint,
        method: testOptions.method,
        status: error.statusCode || 500,
        error: error.message,
        duration: endTime - startTime,
        validation: { isValid: false, errors: [error.message] }
      }
    }
  }

  /**
   * Make HTTP request with timeout and retries
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Request configuration
   * @param {number} timeout - Request timeout
   * @returns {Promise<Object>} Response object
   * @private
   */
  async makeRequest(endpoint, config, timeout) {
    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        if (this.nuxtContext?.$fetch) {
          const response = await Promise.race([
            this.nuxtContext.$fetch(endpoint, config),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
          ])
          return { data: response, status: 200 }
        } else {
          // Fallback for testing without Nuxt context
          const response = await this.fetchFallback(endpoint, config)
          return response
        }
      } catch (error) {
        if (attempt === this.options.retries) {
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  /**
   * Fallback fetch implementation for testing
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} Response object
   * @private
   */
  async fetchFallback(endpoint, config) {
    // Mock response for testing
    return {
      data: { message: 'Mock response', endpoint, config },
      status: 200,
      headers: { 'content-type': 'application/json' }
    }
  }

  /**
   * Validate API response against expected criteria
   * @param {Object} response - API response
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   * @private
   */
  async validateResponse(response, options) {
    const errors = []
    const warnings = []

    // Status code validation
    if (options.expectedStatus && response.status !== options.expectedStatus) {
      errors.push(`Expected status ${options.expectedStatus}, got ${response.status}`)
    }

    // Schema validation
    if (options.expectedSchema && response.data) {
      const schemaValidation = this.validateSchema(response.data, options.expectedSchema)
      if (!schemaValidation.isValid) {
        errors.push(...schemaValidation.errors.map(err => `Schema error: ${err}`))
      }
    }

    // Response time validation
    if (options.maxResponseTime && response.duration > options.maxResponseTime) {
      warnings.push(`Response time ${response.duration}ms exceeds limit ${options.maxResponseTime}ms`)
    }

    // Content type validation
    if (options.expectedContentType) {
      const contentType = response.headers?.['content-type'] || ''
      if (!contentType.includes(options.expectedContentType)) {
        errors.push(`Expected content type ${options.expectedContentType}, got ${contentType}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate response data against JSON schema
   * @param {*} data - Response data
   * @param {Object} schema - JSON schema
   * @returns {Object} Schema validation result
   * @private
   */
  validateSchema(data, schema) {
    const errors = []

    try {
      // Basic schema validation (can be enhanced with ajv or similar)
      if (schema.type) {
        const actualType = Array.isArray(data) ? 'array' : typeof data
        if (actualType !== schema.type) {
          errors.push(`Expected type ${schema.type}, got ${actualType}`)
        }
      }

      if (schema.required && schema.type === 'object') {
        for (const field of schema.required) {
          if (!(field in data)) {
            errors.push(`Required field missing: ${field}`)
          }
        }
      }

      if (schema.properties && schema.type === 'object') {
        for (const [field, fieldSchema] of Object.entries(schema.properties)) {
          if (data[field] !== undefined) {
            const fieldValidation = this.validateSchema(data[field], fieldSchema)
            errors.push(...fieldValidation.errors.map(err => `${field}: ${err}`))
          }
        }
      }
    } catch (error) {
      errors.push(`Schema validation error: ${error.message}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Test multiple API endpoints in sequence
   * @param {Array} endpoints - Array of endpoint test configurations
   * @returns {Promise<Array>} Test results
   */
  async testApiEndpoints(endpoints) {
    const results = []
    
    for (const endpointConfig of endpoints) {
      const result = await this.testApiRoute(endpointConfig.endpoint, endpointConfig.options)
      results.push({
        ...result,
        name: endpointConfig.name || endpointConfig.endpoint
      })
    }
    
    return results
  }

  /**
   * Test API endpoints in parallel
   * @param {Array} endpoints - Array of endpoint test configurations
   * @param {number} concurrency - Maximum concurrent requests
   * @returns {Promise<Array>} Test results
   */
  async testApiEndpointsParallel(endpoints, concurrency = 5) {
    const results = []
    const batches = []
    
    // Create batches
    for (let i = 0; i < endpoints.length; i += concurrency) {
      batches.push(endpoints.slice(i, i + concurrency))
    }
    
    // Execute batches
    for (const batch of batches) {
      const batchPromises = batch.map(config => 
        this.testApiRoute(config.endpoint, config.options)
          .then(result => ({
            ...result,
            name: config.name || config.endpoint
          }))
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : {
        success: false,
        error: r.reason.message
      }))
    }
    
    return results
  }

  /**
   * Load test an API endpoint
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Load test options
   * @returns {Promise<Object>} Load test results
   */
  async loadTestEndpoint(endpoint, options = {}) {
    const config = {
      requests: 100,
      concurrency: 10,
      duration: null, // infinite until requests complete
      rampUp: 0, // seconds to ramp up to full concurrency
      method: 'GET',
      ...options
    }

    const startTime = Date.now()
    const results = {
      totalRequests: config.requests,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      requestsPerSecond: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0
    }

    const promises = []
    const batchSize = Math.ceil(config.requests / config.concurrency)

    for (let batch = 0; batch < config.concurrency; batch++) {
      const batchPromise = this.runLoadTestBatch(
        endpoint, 
        batchSize, 
        config,
        results
      )
      promises.push(batchPromise)

      // Ramp up delay
      if (config.rampUp > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, (config.rampUp * 1000) / config.concurrency)
        )
      }
    }

    await Promise.all(promises)

    const endTime = Date.now()
    const totalDuration = (endTime - startTime) / 1000

    // Calculate final metrics
    results.requestsPerSecond = results.totalRequests / totalDuration
    results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length || 0
    results.duration = totalDuration

    return results
  }

  /**
   * Run a batch of requests for load testing
   * @param {string} endpoint - API endpoint
   * @param {number} batchSize - Number of requests in batch
   * @param {Object} config - Load test configuration
   * @param {Object} results - Results object to update
   * @returns {Promise<void>}
   * @private
   */
  async runLoadTestBatch(endpoint, batchSize, config, results) {
    for (let i = 0; i < batchSize; i++) {
      try {
        const startTime = performance.now()
        await this.makeRequest(endpoint, { method: config.method }, config.timeout || 10000)
        const duration = performance.now() - startTime

        results.successfulRequests++
        results.responseTimes.push(duration)
        results.minResponseTime = Math.min(results.minResponseTime, duration)
        results.maxResponseTime = Math.max(results.maxResponseTime, duration)
      } catch (error) {
        results.failedRequests++
        results.errors.push({
          error: error.message,
          timestamp: Date.now()
        })
      }
    }
  }

  /**
   * Mock API response for testing
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {*} response - Mock response data
   * @param {number} status - HTTP status code
   */
  mockApiResponse(method, endpoint, response, status = 200) {
    const key = `${method.toUpperCase()}:${endpoint}`
    this.mockResponses.set(key, { response, status })
  }

  /**
   * Clear all API mocks
   */
  clearApiMocks() {
    this.mockResponses.clear()
  }

  /**
   * Get request history
   * @returns {Array} Request history
   */
  getRequestHistory() {
    return [...this.requestHistory]
  }

  /**
   * Clear request history
   */
  clearRequestHistory() {
    this.requestHistory = []
  }

  /**
   * Generate API test report
   * @param {Array} testResults - Array of test results
   * @returns {Object} Test report
   */
  generateTestReport(testResults) {
    const report = {
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.success).length,
        failed: testResults.filter(r => !r.success).length,
        averageDuration: testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length || 0
      },
      results: testResults,
      requestHistory: this.getRequestHistory(),
      timestamp: new Date().toISOString()
    }

    report.summary.passRate = (report.summary.passed / report.summary.total) * 100

    return report
  }

  /**
   * Cleanup server tester resources
   */
  async cleanup() {
    this.clearApiMocks()
    this.clearRequestHistory()
    
    if (this.testServer) {
      this.testServer.close()
      this.testServer = null
    }
  }
}

/**
 * Global server tester instance
 */
let globalServerTester = null

/**
 * Get or create global server tester
 * @param {Object} options - Tester options
 * @returns {NuxtServerTester} Tester instance
 */
export function getServerTester(options = {}) {
  if (!globalServerTester) {
    globalServerTester = new NuxtServerTester(options)
  }
  return globalServerTester
}

/**
 * Initialize server testing environment
 * @param {Object} nuxtContext - Nuxt test context
 * @param {Object} options - Tester options
 * @returns {NuxtServerTester} Initialized tester
 */
export function initializeServerTesting(nuxtContext, options = {}) {
  const tester = getServerTester(options)
  tester.initialize(nuxtContext)
  return tester
}

/**
 * Quick API route testing utility
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
export async function testNuxtApiRoute(endpoint, options = {}) {
  const tester = getServerTester()
  return await tester.testApiRoute(endpoint, options)
}