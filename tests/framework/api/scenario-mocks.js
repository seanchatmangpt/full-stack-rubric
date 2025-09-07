/**
 * @fileoverview Scenario-based mock switching for different flow testing
 * Enables testing success/error flows, edge cases, and state transitions
 */

import { SmartMockSystem } from './smart-mocks.js';
import { createMockFactories } from './mock-factories.js';

/**
 * Scenario configuration
 * @typedef {Object} ScenarioConfig
 * @property {string} name - Scenario name
 * @property {string} description - Scenario description
 * @property {Object} responses - Response definitions by endpoint
 * @property {Function} setup - Setup function called when scenario is activated
 * @property {Function} teardown - Teardown function called when scenario is deactivated
 * @property {Object} state - Scenario state data
 */

/**
 * Flow step definition
 * @typedef {Object} FlowStep
 * @property {string} name - Step name
 * @property {string} method - HTTP method
 * @property {string} path - URL path
 * @property {Object} request - Request data
 * @property {Object} expectedResponse - Expected response
 * @property {Function} validate - Custom validation function
 */

export class ScenarioMockSystem extends SmartMockSystem {
  /**
   * Initialize scenario-based mock system
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super(config);
    
    this.scenarios = new Map();
    this.flows = new Map();
    this.currentFlow = null;
    this.flowState = {};
    this.scenarioHistory = [];
    
    this._registerDefaultScenarios();
  }

  /**
   * Register default scenarios
   * @private
   */
  _registerDefaultScenarios() {
    // Success scenarios
    this.registerScenario('success', {
      name: 'Success Flow',
      description: 'All requests succeed with expected responses',
      responses: {},
      setup: () => {
        this.setResponseDelay(50); // Fast responses
      }
    });

    this.registerScenario('slow_success', {
      name: 'Slow Success Flow',
      description: 'Successful responses with realistic delays',
      responses: {},
      setup: () => {
        this.setResponseDelay(500); // Slower responses
      }
    });

    // Error scenarios
    this.registerScenario('server_error', {
      name: 'Server Error Flow',
      description: 'Server returns 5xx errors',
      responses: {
        '*': {
          status: 500,
          data: { error: 'Internal Server Error', message: 'Something went wrong' }
        }
      }
    });

    this.registerScenario('network_error', {
      name: 'Network Error Flow',
      description: 'Network connectivity issues',
      responses: {
        '*': {
          status: 0,
          error: new Error('Network Error'),
          delay: 30000 // Timeout simulation
        }
      }
    });

    this.registerScenario('auth_error', {
      name: 'Authentication Error Flow',
      description: 'Authentication and authorization failures',
      responses: {
        '*': {
          status: 401,
          data: { error: 'Unauthorized', message: 'Authentication required' }
        }
      }
    });

    this.registerScenario('validation_error', {
      name: 'Validation Error Flow',
      description: 'Request validation failures',
      responses: {
        'POST *': {
          status: 400,
          data: {
            error: 'Validation Error',
            message: 'Invalid request data',
            details: [
              { field: 'email', message: 'Invalid email format' },
              { field: 'password', message: 'Password too short' }
            ]
          }
        },
        'PUT *': {
          status: 422,
          data: {
            error: 'Validation Error',
            message: 'Unprocessable entity'
          }
        }
      }
    });

    this.registerScenario('rate_limit', {
      name: 'Rate Limit Flow',
      description: 'Rate limiting responses',
      responses: {
        '*': {
          status: 429,
          headers: { 'Retry-After': '60' },
          data: { error: 'Rate Limit Exceeded', message: 'Too many requests' }
        }
      }
    });

    // Partial failure scenarios
    this.registerScenario('intermittent_failure', {
      name: 'Intermittent Failure Flow',
      description: 'Random failures to test retry logic',
      responses: {},
      setup: () => {
        this.addRandomFailures(0.3); // 30% failure rate
      }
    });

    // Edge case scenarios
    this.registerScenario('empty_responses', {
      name: 'Empty Response Flow',
      description: 'Empty or null responses',
      responses: {
        'GET *': { status: 200, data: null },
        'POST *': { status: 201, data: {} }
      }
    });

    this.registerScenario('large_payload', {
      name: 'Large Payload Flow',
      description: 'Large response payloads for performance testing',
      responses: {},
      setup: () => {
        this.enableLargePayloads(true);
      }
    });

    // State-dependent scenarios
    this.registerScenario('user_journey', {
      name: 'User Journey Flow',
      description: 'Complete user registration and login flow',
      state: {
        users: new Map(),
        sessions: new Map()
      },
      setup: () => {
        this.setupUserJourneyMocks();
      }
    });
  }

  /**
   * Register a new scenario
   * @param {string} name - Scenario name
   * @param {ScenarioConfig} config - Scenario configuration
   */
  registerScenario(name, config) {
    this.scenarios.set(name, {
      name: config.name || name,
      description: config.description || '',
      responses: config.responses || {},
      setup: config.setup || (() => {}),
      teardown: config.teardown || (() => {}),
      state: config.state || {},
      ...config
    });
    return this;
  }

  /**
   * Register a test flow with multiple steps
   * @param {string} name - Flow name
   * @param {Array<FlowStep>} steps - Flow steps
   * @param {Object} options - Flow options
   */
  registerFlow(name, steps, options = {}) {
    this.flows.set(name, {
      name,
      steps,
      options: {
        resetBetweenSteps: options.resetBetweenSteps || false,
        continueOnFailure: options.continueOnFailure || false,
        timeout: options.timeout || 30000,
        ...options
      }
    });
    return this;
  }

  /**
   * Activate a scenario
   * @param {string} name - Scenario name
   */
  async activateScenario(name) {
    const scenario = this.scenarios.get(name);
    if (!scenario) {
      throw new Error(`Scenario '${name}' not found`);
    }

    // Deactivate current scenario
    if (this.activeScenario && this.activeScenario !== 'default') {
      await this.deactivateScenario();
    }

    // Record scenario activation
    this.scenarioHistory.push({
      scenario: name,
      activatedAt: Date.now(),
      previousScenario: this.activeScenario
    });

    // Set active scenario
    this.activeScenario = name;

    // Run setup
    if (scenario.setup) {
      await scenario.setup.call(this);
    }

    // Apply scenario responses
    this._applyScenarioResponses(scenario);

    return this;
  }

  /**
   * Deactivate current scenario
   */
  async deactivateScenario() {
    const scenario = this.scenarios.get(this.activeScenario);
    if (scenario?.teardown) {
      await scenario.teardown.call(this);
    }

    this.activeScenario = 'default';
    this.clearMocks();
    return this;
  }

  /**
   * Apply scenario response definitions
   * @private
   */
  _applyScenarioResponses(scenario) {
    Object.entries(scenario.responses).forEach(([pattern, response]) => {
      if (pattern === '*') {
        // Apply to all methods and paths
        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(method => {
          this.mock(method, /.*/, response, { scenario: scenario.name });
        });
      } else if (pattern.includes(' ')) {
        // Parse "METHOD path" format
        const [method, path] = pattern.split(' ', 2);
        const pathPattern = path === '*' ? /.*/ : path;
        this.mock(method, pathPattern, response, { scenario: scenario.name });
      } else {
        // Assume it's a path pattern for GET requests
        this.mock('GET', pattern, response, { scenario: scenario.name });
      }
    });
  }

  /**
   * Execute a test flow
   * @param {string} name - Flow name
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution results
   */
  async executeFlow(name, context = {}) {
    const flow = this.flows.get(name);
    if (!flow) {
      throw new Error(`Flow '${name}' not found`);
    }

    this.currentFlow = name;
    this.flowState = { ...context };

    const results = {
      flow: name,
      steps: [],
      success: true,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      errors: []
    };

    try {
      for (let i = 0; i < flow.steps.length; i++) {
        const step = flow.steps[i];
        const stepResult = await this._executeFlowStep(step, i, context);
        
        results.steps.push(stepResult);

        if (!stepResult.success) {
          results.success = false;
          results.errors.push(stepResult.error);

          if (!flow.options.continueOnFailure) {
            break;
          }
        }

        // Reset mocks between steps if configured
        if (flow.options.resetBetweenSteps) {
          this.clearMocks();
        }
      }
    } catch (error) {
      results.success = false;
      results.errors.push(error);
    }

    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;

    this.currentFlow = null;
    return results;
  }

  /**
   * Execute a single flow step
   * @private
   */
  async _executeFlowStep(step, index, context) {
    const stepResult = {
      step: step.name,
      index,
      success: false,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      request: null,
      response: null,
      error: null,
      validationResults: []
    };

    try {
      // Prepare request
      const request = {
        method: step.method,
        url: this._interpolateTemplate(step.path, context),
        headers: step.request?.headers || {},
        data: step.request?.data ? this._interpolateTemplate(step.request.data, context) : null
      };

      stepResult.request = request;

      // Execute request against mock system
      const response = await this.handleRequest(request);
      stepResult.response = response;

      // Validate response
      if (step.expectedResponse) {
        const validationResult = this._validateStepResponse(response, step.expectedResponse);
        stepResult.validationResults.push(validationResult);
        
        if (!validationResult.valid) {
          throw new Error(`Response validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      // Run custom validation
      if (step.validate) {
        const customValidation = await step.validate(response, request, context);
        if (customValidation !== true) {
          throw new Error(`Custom validation failed: ${customValidation}`);
        }
      }

      // Update context with response data
      if (response.data) {
        context[`step${index}Response`] = response.data;
        if (step.name) {
          context[step.name] = response.data;
        }
      }

      stepResult.success = true;
    } catch (error) {
      stepResult.error = error.message || error;
    }

    stepResult.endTime = Date.now();
    stepResult.duration = stepResult.endTime - stepResult.startTime;

    return stepResult;
  }

  /**
   * Validate step response against expected response
   * @private
   */
  _validateStepResponse(actual, expected) {
    const errors = [];

    if (expected.status && actual.status !== expected.status) {
      errors.push(`Expected status ${expected.status}, got ${actual.status}`);
    }

    if (expected.headers) {
      Object.entries(expected.headers).forEach(([header, value]) => {
        if (actual.headers[header] !== value) {
          errors.push(`Expected header ${header}: ${value}, got ${actual.headers[header]}`);
        }
      });
    }

    if (expected.data) {
      const dataErrors = this._validateObjectStructure(actual.data, expected.data);
      errors.push(...dataErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate object structure recursively
   * @private
   */
  _validateObjectStructure(actual, expected, path = '') {
    const errors = [];

    if (typeof expected !== typeof actual) {
      errors.push(`${path}: Expected type ${typeof expected}, got ${typeof actual}`);
      return errors;
    }

    if (Array.isArray(expected) && Array.isArray(actual)) {
      if (expected.length > 0 && actual.length === 0) {
        errors.push(`${path}: Expected non-empty array, got empty array`);
      }
      return errors;
    }

    if (expected && typeof expected === 'object') {
      Object.keys(expected).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in actual)) {
          errors.push(`${newPath}: Missing property`);
        } else {
          errors.push(...this._validateObjectStructure(actual[key], expected[key], newPath));
        }
      });
    }

    return errors;
  }

  /**
   * Interpolate template strings with context values
   * @private
   */
  _interpolateTemplate(template, context) {
    if (typeof template === 'string') {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
      });
    }

    if (Array.isArray(template)) {
      return template.map(item => this._interpolateTemplate(item, context));
    }

    if (template && typeof template === 'object') {
      const result = {};
      Object.entries(template).forEach(([key, value]) => {
        result[key] = this._interpolateTemplate(value, context);
      });
      return result;
    }

    return template;
  }

  /**
   * Set response delay for all mocks
   * @param {number} delay - Delay in milliseconds
   */
  setResponseDelay(delay) {
    this.defaultDelay = delay;
    return this;
  }

  /**
   * Add random failures to responses
   * @param {number} failureRate - Failure rate (0-1)
   */
  addRandomFailures(failureRate) {
    this.addInterceptor((req) => {
      if (Math.random() < failureRate) {
        return {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          data: {
            error: 'Random Failure',
            message: 'Simulated random failure for testing'
          },
          delay: 0
        };
      }
    });
    return this;
  }

  /**
   * Enable large payload responses
   * @param {boolean} enabled - Enable large payloads
   */
  enableLargePayloads(enabled) {
    if (enabled) {
      this.addInterceptor((req) => {
        const factories = createMockFactories();
        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          data: {
            items: factories.buildList('product', 1000), // Large dataset
            metadata: {
              total: 1000,
              generated: new Date().toISOString()
            }
          },
          delay: this.defaultDelay
        };
      });
    }
    return this;
  }

  /**
   * Setup user journey mocks with state management
   * @private
   */
  setupUserJourneyMocks() {
    const scenario = this.scenarios.get('user_journey');
    const factories = createMockFactories();

    // User registration mock
    this.mock('POST', '/api/auth/register', (req) => {
      const userData = req.data;
      const user = factories.build('user', {
        email: userData.email,
        username: userData.username
      });
      
      scenario.state.users.set(user.email, user);
      
      return {
        status: 201,
        data: { user, token: faker.datatype.uuid() }
      };
    }, { scenario: 'user_journey' });

    // User login mock
    this.mock('POST', '/api/auth/login', (req) => {
      const { email, password } = req.data;
      const user = scenario.state.users.get(email);
      
      if (!user) {
        return {
          status: 401,
          data: { error: 'User not found' }
        };
      }
      
      const token = faker.datatype.uuid();
      scenario.state.sessions.set(token, user);
      
      return {
        status: 200,
        data: { user, token }
      };
    }, { scenario: 'user_journey' });

    // Protected endpoint mock
    this.mock('GET', '/api/profile', (req) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = scenario.state.sessions.get(token);
      
      if (!user) {
        return {
          status: 401,
          data: { error: 'Unauthorized' }
        };
      }
      
      return {
        status: 200,
        data: user
      };
    }, { scenario: 'user_journey' });
  }

  /**
   * Get scenario history
   * @returns {Array} Scenario activation history
   */
  getScenarioHistory() {
    return [...this.scenarioHistory];
  }

  /**
   * List available scenarios
   * @returns {Array} Available scenarios
   */
  listScenarios() {
    return Array.from(this.scenarios.entries()).map(([name, config]) => ({
      name,
      title: config.name,
      description: config.description
    }));
  }

  /**
   * List available flows
   * @returns {Array} Available flows
   */
  listFlows() {
    return Array.from(this.flows.entries()).map(([name, flow]) => ({
      name,
      stepCount: flow.steps.length,
      options: flow.options
    }));
  }

  /**
   * Reset scenario system
   */
  resetScenarios() {
    this.deactivateScenario();
    this.flowState = {};
    this.scenarioHistory = [];
    this.currentFlow = null;
    return this;
  }
}

/**
 * Create scenario mock system
 * @param {Object} config - Configuration options
 * @returns {ScenarioMockSystem}
 */
export function createScenarioMocks(config) {
  return new ScenarioMockSystem(config);
}

/**
 * Default export
 */
export default ScenarioMockSystem;