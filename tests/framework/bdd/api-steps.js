/**
 * BDD Step Generators for API Request/Response Testing
 * Handles HTTP requests, response validation, and API interactions
 * @module api-steps
 */

import { registerStepGenerator } from './step-generators.js'

/**
 * API step generator class
 */
class ApiStepGenerator {
  constructor() {
    this.patterns = new Map()
    this.lastResponse = null
    this.requestOptions = {}
  }

  /**
   * Register all API-related step generators
   */
  registerSteps() {
    // Request setup
    registerStepGenerator('set-api-base-url', {
      pattern: 'I set (?:the )?API base URL to "([^"]*)"',
      type: 'Given',
      generator: this.generateSetApiBaseUrl.bind(this),
      tags: ['api', 'setup', 'configuration'],
      metadata: { description: 'Set base URL for API requests' }
    })

    registerStepGenerator('set-request-header', {
      pattern: 'I set (?:the )?(?:request )?header "([^"]*)" to "([^"]*)"',
      type: 'Given',
      generator: this.generateSetRequestHeader.bind(this),
      tags: ['api', 'headers', 'setup'],
      metadata: { description: 'Set HTTP request header' }
    })

    registerStepGenerator('set-auth-token', {
      pattern: 'I set (?:the )?(?:auth|authorization) token to "([^"]*)"',
      type: 'Given',
      generator: this.generateSetAuthToken.bind(this),
      tags: ['api', 'authentication', 'setup'],
      metadata: { description: 'Set authorization token' }
    })

    registerStepGenerator('set-request-body', {
      pattern: 'I set (?:the )?request body to:?\\s*([\\s\\S]*)',
      type: 'Given',
      generator: this.generateSetRequestBody.bind(this),
      tags: ['api', 'body', 'setup'],
      metadata: { description: 'Set request body data' }
    })

    // HTTP methods
    registerStepGenerator('make-get-request', {
      pattern: 'I (?:make|send) a GET request to "([^"]*)"',
      type: 'When',
      generator: this.generateMakeGetRequest.bind(this),
      tags: ['api', 'request', 'get'],
      metadata: { description: 'Send GET request to endpoint' }
    })

    registerStepGenerator('make-post-request', {
      pattern: 'I (?:make|send) a POST request to "([^"]*)"',
      type: 'When',
      generator: this.generateMakePostRequest.bind(this),
      tags: ['api', 'request', 'post'],
      metadata: { description: 'Send POST request to endpoint' }
    })

    registerStepGenerator('make-put-request', {
      pattern: 'I (?:make|send) a PUT request to "([^"]*)"',
      type: 'When',
      generator: this.generateMakePutRequest.bind(this),
      tags: ['api', 'request', 'put'],
      metadata: { description: 'Send PUT request to endpoint' }
    })

    registerStepGenerator('make-patch-request', {
      pattern: 'I (?:make|send) a PATCH request to "([^"]*)"',
      type: 'When',
      generator: this.generateMakePatchRequest.bind(this),
      tags: ['api', 'request', 'patch'],
      metadata: { description: 'Send PATCH request to endpoint' }
    })

    registerStepGenerator('make-delete-request', {
      pattern: 'I (?:make|send) a DELETE request to "([^"]*)"',
      type: 'When',
      generator: this.generateMakeDeleteRequest.bind(this),
      tags: ['api', 'request', 'delete'],
      metadata: { description: 'Send DELETE request to endpoint' }
    })

    // Request with parameters
    registerStepGenerator('make-request-with-params', {
      pattern: 'I (?:make|send) a (GET|POST|PUT|PATCH|DELETE) request to "([^"]*)" with parameters:?\\s*([\\s\\S]*)',
      type: 'When',
      generator: this.generateMakeRequestWithParams.bind(this),
      tags: ['api', 'request', 'parameters'],
      metadata: { description: 'Send request with query parameters' }
    })

    registerStepGenerator('make-request-with-body', {
      pattern: 'I (?:make|send) a (POST|PUT|PATCH) request to "([^"]*)" with body:?\\s*([\\s\\S]*)',
      type: 'When',
      generator: this.generateMakeRequestWithBody.bind(this),
      tags: ['api', 'request', 'body'],
      metadata: { description: 'Send request with request body' }
    })

    // Response validation
    registerStepGenerator('response-status-should-be', {
      pattern: '(?:the )?response status should be (\\d+)',
      type: 'Then',
      generator: this.generateResponseStatusShouldBe.bind(this),
      tags: ['api', 'response', 'status'],
      metadata: { description: 'Verify response status code' }
    })

    registerStepGenerator('response-should-contain', {
      pattern: '(?:the )?response should contain "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseShouldContain.bind(this),
      tags: ['api', 'response', 'content'],
      metadata: { description: 'Verify response contains text' }
    })

    registerStepGenerator('response-should-not-contain', {
      pattern: '(?:the )?response should not contain "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseShouldNotContain.bind(this),
      tags: ['api', 'response', 'content'],
      metadata: { description: 'Verify response does not contain text' }
    })

    registerStepGenerator('response-should-be-json', {
      pattern: '(?:the )?response should be (?:valid )?JSON',
      type: 'Then',
      generator: this.generateResponseShouldBeJson.bind(this),
      tags: ['api', 'response', 'json'],
      metadata: { description: 'Verify response is valid JSON' }
    })

    // JSON response validation
    registerStepGenerator('response-json-should-have-property', {
      pattern: '(?:the )?response JSON should have property "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseJsonShouldHaveProperty.bind(this),
      tags: ['api', 'response', 'json', 'property'],
      metadata: { description: 'Verify JSON response has property' }
    })

    registerStepGenerator('response-json-property-should-be', {
      pattern: '(?:the )?response JSON property "([^"]*)" should be "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseJsonPropertyShouldBe.bind(this),
      tags: ['api', 'response', 'json', 'value'],
      metadata: { description: 'Verify JSON property value' }
    })

    registerStepGenerator('response-json-property-should-be-number', {
      pattern: '(?:the )?response JSON property "([^"]*)" should be (\\d+)',
      type: 'Then',
      generator: this.generateResponseJsonPropertyShouldBeNumber.bind(this),
      tags: ['api', 'response', 'json', 'number'],
      metadata: { description: 'Verify JSON property is number' }
    })

    registerStepGenerator('response-json-property-should-be-boolean', {
      pattern: '(?:the )?response JSON property "([^"]*)" should be (true|false)',
      type: 'Then',
      generator: this.generateResponseJsonPropertyShouldBeBoolean.bind(this),
      tags: ['api', 'response', 'json', 'boolean'],
      metadata: { description: 'Verify JSON property is boolean' }
    })

    registerStepGenerator('response-json-should-match-schema', {
      pattern: '(?:the )?response JSON should match schema:?\\s*([\\s\\S]*)',
      type: 'Then',
      generator: this.generateResponseJsonShouldMatchSchema.bind(this),
      tags: ['api', 'response', 'json', 'schema'],
      metadata: { description: 'Verify JSON response matches schema' }
    })

    // Array validation
    registerStepGenerator('response-json-array-should-have-length', {
      pattern: '(?:the )?response JSON array should have (\\d+) items?',
      type: 'Then',
      generator: this.generateResponseJsonArrayShouldHaveLength.bind(this),
      tags: ['api', 'response', 'json', 'array'],
      metadata: { description: 'Verify JSON array length' }
    })

    registerStepGenerator('response-json-array-should-contain', {
      pattern: '(?:the )?response JSON array should contain item with "([^"]*)" = "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseJsonArrayShouldContain.bind(this),
      tags: ['api', 'response', 'json', 'array'],
      metadata: { description: 'Verify JSON array contains item' }
    })

    // Headers validation
    registerStepGenerator('response-should-have-header', {
      pattern: '(?:the )?response should have header "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseShouldHaveHeader.bind(this),
      tags: ['api', 'response', 'headers'],
      metadata: { description: 'Verify response has header' }
    })

    registerStepGenerator('response-header-should-be', {
      pattern: '(?:the )?response header "([^"]*)" should be "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseHeaderShouldBe.bind(this),
      tags: ['api', 'response', 'headers', 'value'],
      metadata: { description: 'Verify response header value' }
    })

    // Error handling
    registerStepGenerator('response-should-be-error', {
      pattern: '(?:the )?response should be an error',
      type: 'Then',
      generator: this.generateResponseShouldBeError.bind(this),
      tags: ['api', 'response', 'error'],
      metadata: { description: 'Verify response is an error' }
    })

    registerStepGenerator('response-error-message-should-be', {
      pattern: '(?:the )?response error message should be "([^"]*)"',
      type: 'Then',
      generator: this.generateResponseErrorMessageShouldBe.bind(this),
      tags: ['api', 'response', 'error', 'message'],
      metadata: { description: 'Verify error message content' }
    })

    // Timing validation
    registerStepGenerator('response-should-be-received-within', {
      pattern: '(?:the )?response should be received within (\\d+) (?:ms|milliseconds|seconds?)',
      type: 'Then',
      generator: this.generateResponseShouldBeReceivedWithin.bind(this),
      tags: ['api', 'response', 'timing', 'performance'],
      metadata: { description: 'Verify response time' }
    })

    // Mock API responses
    registerStepGenerator('mock-api-response', {
      pattern: 'I mock (?:the )?API response for "([^"]*)" with:?\\s*([\\s\\S]*)',
      type: 'Given',
      generator: this.generateMockApiResponse.bind(this),
      tags: ['api', 'mock', 'setup'],
      metadata: { description: 'Mock API endpoint response' }
    })

    registerStepGenerator('mock-api-error', {
      pattern: 'I mock (?:the )?API error for "([^"]*)" with status (\\d+)',
      type: 'Given',
      generator: this.generateMockApiError.bind(this),
      tags: ['api', 'mock', 'error'],
      metadata: { description: 'Mock API endpoint error' }
    })
  }

  /**
   * Generate set API base URL step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSetApiBaseUrl(match, options) {
    const [, baseUrl] = match
    
    return `// Set API base URL for tests
this.apiBaseUrl = '${baseUrl}'
global.fetch = vi.fn() // Mock fetch for testing`
  }

  /**
   * Generate set request header step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSetRequestHeader(match, options) {
    const [, headerName, headerValue] = match
    
    return `// Set request header
this.requestHeaders = this.requestHeaders || {}
this.requestHeaders['${headerName}'] = '${headerValue}'`
  }

  /**
   * Generate set auth token step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSetAuthToken(match, options) {
    const [, token] = match
    
    return `// Set authorization token
this.requestHeaders = this.requestHeaders || {}
this.requestHeaders['Authorization'] = 'Bearer ${token}'`
  }

  /**
   * Generate set request body step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateSetRequestBody(match, options) {
    const [, body] = match
    
    return `// Set request body
this.requestBody = ${this.parseJsonOrString(body)}`
  }

  /**
   * Generate make GET request step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMakeGetRequest(match, options) {
    const [, endpoint] = match
    
    return `// Make GET request
const url = this.apiBaseUrl ? \`\${this.apiBaseUrl}${endpoint}\` : '${endpoint}'
this.response = await fetch(url, {
  method: 'GET',
  headers: this.requestHeaders || {}
})
this.responseBody = await this.response.text()
try {
  this.responseJson = JSON.parse(this.responseBody)
} catch (e) {
  this.responseJson = null
}`
  }

  /**
   * Generate make POST request step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMakePostRequest(match, options) {
    const [, endpoint] = match
    
    return `// Make POST request
const url = this.apiBaseUrl ? \`\${this.apiBaseUrl}${endpoint}\` : '${endpoint}'
const headers = { ...this.requestHeaders || {}, 'Content-Type': 'application/json' }
this.response = await fetch(url, {
  method: 'POST',
  headers,
  body: this.requestBody ? JSON.stringify(this.requestBody) : undefined
})
this.responseBody = await this.response.text()
try {
  this.responseJson = JSON.parse(this.responseBody)
} catch (e) {
  this.responseJson = null
}`
  }

  /**
   * Generate make PUT request step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMakePutRequest(match, options) {
    const [, endpoint] = match
    
    return `// Make PUT request
const url = this.apiBaseUrl ? \`\${this.apiBaseUrl}${endpoint}\` : '${endpoint}'
const headers = { ...this.requestHeaders || {}, 'Content-Type': 'application/json' }
this.response = await fetch(url, {
  method: 'PUT',
  headers,
  body: this.requestBody ? JSON.stringify(this.requestBody) : undefined
})
this.responseBody = await this.response.text()
try {
  this.responseJson = JSON.parse(this.responseBody)
} catch (e) {
  this.responseJson = null
}`
  }

  /**
   * Generate make PATCH request step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMakePatchRequest(match, options) {
    const [, endpoint] = match
    
    return `// Make PATCH request
const url = this.apiBaseUrl ? \`\${this.apiBaseUrl}${endpoint}\` : '${endpoint}'
const headers = { ...this.requestHeaders || {}, 'Content-Type': 'application/json' }
this.response = await fetch(url, {
  method: 'PATCH',
  headers,
  body: this.requestBody ? JSON.stringify(this.requestBody) : undefined
})
this.responseBody = await this.response.text()
try {
  this.responseJson = JSON.parse(this.responseBody)
} catch (e) {
  this.responseJson = null
}`
  }

  /**
   * Generate make DELETE request step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMakeDeleteRequest(match, options) {
    const [, endpoint] = match
    
    return `// Make DELETE request
const url = this.apiBaseUrl ? \`\${this.apiBaseUrl}${endpoint}\` : '${endpoint}'
this.response = await fetch(url, {
  method: 'DELETE',
  headers: this.requestHeaders || {}
})
this.responseBody = await this.response.text()
try {
  this.responseJson = JSON.parse(this.responseBody)
} catch (e) {
  this.responseJson = null
}`
  }

  /**
   * Generate make request with parameters step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMakeRequestWithParams(match, options) {
    const [, method, endpoint, params] = match
    
    return `// Make ${method} request with parameters
const params = new URLSearchParams(${this.parseJsonOrString(params)})
const url = this.apiBaseUrl ? 
  \`\${this.apiBaseUrl}${endpoint}?\${params}\` : 
  \`${endpoint}?\${params}\`
this.response = await fetch(url, {
  method: '${method}',
  headers: this.requestHeaders || {}
})
this.responseBody = await this.response.text()
try {
  this.responseJson = JSON.parse(this.responseBody)
} catch (e) {
  this.responseJson = null
}`
  }

  /**
   * Generate make request with body step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMakeRequestWithBody(match, options) {
    const [, method, endpoint, body] = match
    
    return `// Make ${method} request with body
const url = this.apiBaseUrl ? \`\${this.apiBaseUrl}${endpoint}\` : '${endpoint}'
const headers = { ...this.requestHeaders || {}, 'Content-Type': 'application/json' }
const requestBody = ${this.parseJsonOrString(body)}
this.response = await fetch(url, {
  method: '${method}',
  headers,
  body: JSON.stringify(requestBody)
})
this.responseBody = await this.response.text()
try {
  this.responseJson = JSON.parse(this.responseBody)
} catch (e) {
  this.responseJson = null
}`
  }

  /**
   * Generate response status should be step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseStatusShouldBe(match, options) {
    const [, status] = match
    
    return `// Verify response status
expect(this.response.status).toBe(${status})`
  }

  /**
   * Generate response should contain step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseShouldContain(match, options) {
    const [, text] = match
    
    return `// Verify response contains text
expect(this.responseBody).toContain('${text}')`
  }

  /**
   * Generate response should not contain step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseShouldNotContain(match, options) {
    const [, text] = match
    
    return `// Verify response does not contain text
expect(this.responseBody).not.toContain('${text}')`
  }

  /**
   * Generate response should be JSON step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseShouldBeJson(match, options) {
    return `// Verify response is valid JSON
expect(this.responseJson).not.toBeNull()
expect(typeof this.responseJson).toBe('object')`
  }

  /**
   * Generate response JSON should have property step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseJsonShouldHaveProperty(match, options) {
    const [, property] = match
    
    return `// Verify JSON has property
expect(this.responseJson).toHaveProperty('${property}')`
  }

  /**
   * Generate response JSON property should be step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseJsonPropertyShouldBe(match, options) {
    const [, property, value] = match
    
    return `// Verify JSON property value
expect(this.responseJson.${property}).toBe('${value}')`
  }

  /**
   * Generate response JSON property should be number step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseJsonPropertyShouldBeNumber(match, options) {
    const [, property, value] = match
    
    return `// Verify JSON property is number
expect(this.responseJson.${property}).toBe(${value})
expect(typeof this.responseJson.${property}).toBe('number')`
  }

  /**
   * Generate response JSON property should be boolean step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseJsonPropertyShouldBeBoolean(match, options) {
    const [, property, value] = match
    
    return `// Verify JSON property is boolean
expect(this.responseJson.${property}).toBe(${value})
expect(typeof this.responseJson.${property}).toBe('boolean')`
  }

  /**
   * Generate response JSON should match schema step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseJsonShouldMatchSchema(match, options) {
    const [, schema] = match
    
    return `// Verify JSON matches schema
const expectedSchema = ${this.parseJsonOrString(schema)}
const validateSchema = (obj, schema) => {
  for (const key in schema) {
    if (!obj.hasOwnProperty(key)) return false
    if (typeof schema[key] === 'object' && schema[key] !== null) {
      if (!validateSchema(obj[key], schema[key])) return false
    } else if (typeof obj[key] !== schema[key]) {
      return false
    }
  }
  return true
}
expect(validateSchema(this.responseJson, expectedSchema)).toBe(true)`
  }

  /**
   * Generate response JSON array should have length step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseJsonArrayShouldHaveLength(match, options) {
    const [, length] = match
    
    return `// Verify JSON array length
expect(Array.isArray(this.responseJson)).toBe(true)
expect(this.responseJson.length).toBe(${length})`
  }

  /**
   * Generate response JSON array should contain step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseJsonArrayShouldContain(match, options) {
    const [, property, value] = match
    
    return `// Verify JSON array contains item
expect(Array.isArray(this.responseJson)).toBe(true)
const matchingItem = this.responseJson.find(item => item.${property} === '${value}')
expect(matchingItem).toBeDefined()`
  }

  /**
   * Generate response should have header step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseShouldHaveHeader(match, options) {
    const [, headerName] = match
    
    return `// Verify response has header
expect(this.response.headers.has('${headerName}')).toBe(true)`
  }

  /**
   * Generate response header should be step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseHeaderShouldBe(match, options) {
    const [, headerName, headerValue] = match
    
    return `// Verify response header value
expect(this.response.headers.get('${headerName}')).toBe('${headerValue}')`
  }

  /**
   * Generate response should be error step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseShouldBeError(match, options) {
    return `// Verify response is an error
expect(this.response.status).toBeGreaterThanOrEqual(400)`
  }

  /**
   * Generate response error message should be step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseErrorMessageShouldBe(match, options) {
    const [, message] = match
    
    return `// Verify error message
expect(this.responseJson.message || this.responseJson.error).toBe('${message}')`
  }

  /**
   * Generate response should be received within step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateResponseShouldBeReceivedWithin(match, options) {
    const [, time, unit] = match
    const timeInMs = unit.startsWith('second') ? parseInt(time) * 1000 : parseInt(time)
    
    return `// Verify response time
const endTime = Date.now()
const responseTime = endTime - this.requestStartTime
expect(responseTime).toBeLessThanOrEqual(${timeInMs})`
  }

  /**
   * Generate mock API response step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMockApiResponse(match, options) {
    const [, endpoint, response] = match
    
    return `// Mock API response
const mockResponse = ${this.parseJsonOrString(response)}
fetch.mockImplementation((url) => {
  if (url.includes('${endpoint}')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
      headers: new Map()
    })
  }
  return fetch.mockRestore()
})`
  }

  /**
   * Generate mock API error step implementation
   * @param {Array} match - Regex match results
   * @param {Object} options - Generation options
   * @returns {string} Step implementation code
   */
  generateMockApiError(match, options) {
    const [, endpoint, status] = match
    
    return `// Mock API error
fetch.mockImplementation((url) => {
  if (url.includes('${endpoint}')) {
    return Promise.resolve({
      ok: false,
      status: ${status},
      json: async () => ({ error: 'Mocked error' }),
      text: async () => JSON.stringify({ error: 'Mocked error' }),
      headers: new Map()
    })
  }
  return fetch.mockRestore()
})`
  }

  /**
   * Parse JSON string or return as string
   * @param {string} input - Input string to parse
   * @returns {string} Parsed result
   */
  parseJsonOrString(input) {
    const trimmed = input.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return trimmed
    }
    return `"${trimmed}"`
  }
}

export const apiStepGenerator = new ApiStepGenerator()