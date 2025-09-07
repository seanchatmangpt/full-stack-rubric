/**
 * @fileoverview API testing framework index - exports all mocking utilities
 * Provides a unified interface for intelligent API endpoint mocking
 */

export { SmartMockSystem, createSmartMocks } from './smart-mocks.js';
export { MockFactories, createMockFactories, defaultFactories } from './mock-factories.js';
export { ScenarioMockSystem, createScenarioMocks } from './scenario-mocks.js';
export { 
  ValidationHelper, 
  createValidationHelper, 
  validateRequest, 
  validateResponse,
  defaultValidator 
} from './validation-helpers.js';
export { 
  RecordPlaybackSystem, 
  createRecordPlayback, 
  withRecording 
} from './record-playback.js';

/**
 * Create a complete API testing suite with all utilities
 * @param {Object} config - Configuration options
 * @returns {Object} Complete API testing suite
 */
export function createApiTestingSuite(config = {}) {
  const mocks = createScenarioMocks(config.mocks);
  const factories = createMockFactories(config.factories);
  const validator = createValidationHelper(config.validation);
  const recorder = createRecordPlayback(config.recording);

  return {
    mocks,
    factories,
    validator,
    recorder,
    
    /**
     * Setup test environment with common configurations
     */
    async setup() {
      // Load default scenarios
      await mocks.activateScenario('success');
      
      // Setup common mock flows
      mocks.registerFlow('user_registration', [
        {
          name: 'register',
          method: 'POST',
          path: '/api/auth/register',
          request: {
            data: {
              email: '{{email}}',
              username: '{{username}}',
              password: '{{password}}'
            }
          },
          expectedResponse: {
            status: 201,
            data: {
              user: {},
              token: ''
            }
          }
        },
        {
          name: 'profile',
          method: 'GET',
          path: '/api/profile',
          request: {
            headers: {
              authorization: 'Bearer {{registerResponse.token}}'
            }
          },
          expectedResponse: {
            status: 200,
            data: {
              id: '',
              email: '',
              username: ''
            }
          }
        }
      ]);

      return this;
    },

    /**
     * Teardown test environment
     */
    async teardown() {
      mocks.reset();
      recorder.clear();
      return this;
    },

    /**
     * Quick access to common assertions
     */
    assert: validator.assertions,

    /**
     * Utilities for common test patterns
     */
    utils: {
      /**
       * Test API endpoint with different scenarios
       */
      async testEndpoint(method, path, scenarios = ['success', 'error']) {
        const results = [];
        
        for (const scenario of scenarios) {
          await mocks.activateScenario(scenario);
          
          const request = {
            method,
            url: `http://localhost:3000${path}`,
            headers: { 'Content-Type': 'application/json' }
          };
          
          const response = await mocks.handleRequest(request);
          results.push({ scenario, response });
        }
        
        return results;
      },

      /**
       * Generate test data with realistic values
       */
      generateTestData(type, overrides = {}) {
        return factories.build(type, overrides);
      },

      /**
       * Validate API response against schema
       */
      validateApiResponse(response, schema, request) {
        return validator.validateResponse(response, schema, { request });
      }
    }
  };
}

/**
 * Default API testing suite instance
 */
export const apiTesting = createApiTestingSuite();

/**
 * Export types for JSDoc
 * @typedef {import('./smart-mocks.js').SmartMockConfig} SmartMockConfig
 * @typedef {import('./smart-mocks.js').MockResponse} MockResponse
 * @typedef {import('./mock-factories.js').FactoryConfig} FactoryConfig
 * @typedef {import('./scenario-mocks.js').ScenarioConfig} ScenarioConfig
 * @typedef {import('./scenario-mocks.js').FlowStep} FlowStep
 * @typedef {import('./validation-helpers.js').ValidationConfig} ValidationConfig
 * @typedef {import('./validation-helpers.js').ValidationResult} ValidationResult
 * @typedef {import('./record-playback.js').RecordConfig} RecordConfig
 * @typedef {import('./record-playback.js').Recording} Recording
 */