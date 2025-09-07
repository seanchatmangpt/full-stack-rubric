/**
 * @fileoverview Request/response validation helpers for API testing
 * Provides OpenAPI schema validation, custom validators, and assertion helpers
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {Array<string>} errors - Validation error messages
 * @property {Array<Object>} details - Detailed error information
 */

/**
 * Validation configuration
 * @typedef {Object} ValidationConfig
 * @property {boolean} strict - Enable strict validation
 * @property {boolean} allowUnknownFormats - Allow unknown string formats
 * @property {Object} customFormats - Custom format validators
 * @property {Object} customKeywords - Custom validation keywords
 */

export class ValidationHelper {
  /**
   * Initialize validation helper
   * @param {ValidationConfig} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      strict: config.strict || false,
      allowUnknownFormats: config.allowUnknownFormats || true,
      customFormats: config.customFormats || {},
      customKeywords: config.customKeywords || {},
      ...config
    };

    this.ajv = new Ajv({
      allErrors: true,
      strict: this.config.strict,
      validateFormats: !this.config.allowUnknownFormats
    });

    addFormats(this.ajv);
    this._setupCustomValidators();
    this._setupCustomKeywords();

    this.schemaCache = new Map();
    this.validationCache = new Map();
  }

  /**
   * Setup custom format validators
   * @private
   */
  _setupCustomValidators() {
    // Custom formats
    this.ajv.addFormat('slug', /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    this.ajv.addFormat('username', /^[a-zA-Z0-9_-]{3,20}$/);
    this.ajv.addFormat('phone', /^\+?[1-9]\d{1,14}$/);
    this.ajv.addFormat('hex-color', /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
    this.ajv.addFormat('semantic-version', /^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/);
    this.ajv.addFormat('jwt', /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/);
    
    // Add custom formats from config
    Object.entries(this.config.customFormats).forEach(([name, validator]) => {
      this.ajv.addFormat(name, validator);
    });
  }

  /**
   * Setup custom validation keywords
   * @private
   */
  _setupCustomKeywords() {
    // Custom keyword: strongPassword
    this.ajv.addKeyword({
      keyword: 'strongPassword',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schemaVal, data) {
        if (!schemaVal) return true;
        
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(data);
        const hasLowerCase = /[a-z]/.test(data);
        const hasNumbers = /\d/.test(data);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(data);
        
        validate.errors = [];
        
        if (data.length < minLength) {
          validate.errors.push({
            instancePath: '',
            schemaPath: '#/strongPassword',
            keyword: 'strongPassword',
            message: `must be at least ${minLength} characters long`
          });
        }
        
        if (!hasUpperCase) {
          validate.errors.push({
            instancePath: '',
            schemaPath: '#/strongPassword',
            keyword: 'strongPassword',
            message: 'must contain at least one uppercase letter'
          });
        }
        
        if (!hasLowerCase) {
          validate.errors.push({
            instancePath: '',
            schemaPath: '#/strongPassword',
            keyword: 'strongPassword',
            message: 'must contain at least one lowercase letter'
          });
        }
        
        if (!hasNumbers) {
          validate.errors.push({
            instancePath: '',
            schemaPath: '#/strongPassword',
            keyword: 'strongPassword',
            message: 'must contain at least one number'
          });
        }
        
        if (!hasSpecial) {
          validate.errors.push({
            instancePath: '',
            schemaPath: '#/strongPassword',
            keyword: 'strongPassword',
            message: 'must contain at least one special character'
          });
        }
        
        return validate.errors.length === 0;
      },
      errors: false
    });

    // Custom keyword: uniqueItems (more flexible than built-in)
    this.ajv.addKeyword({
      keyword: 'uniqueBy',
      type: 'array',
      schemaType: 'string',
      validate: function validate(propertyName, data) {
        if (!Array.isArray(data)) return true;
        
        const values = data.map(item => 
          propertyName.split('.').reduce((obj, prop) => obj?.[prop], item)
        );
        
        const uniqueValues = new Set(values.filter(v => v !== undefined));
        return uniqueValues.size === values.filter(v => v !== undefined).length;
      }
    });

    // Custom keyword: futureDate
    this.ajv.addKeyword({
      keyword: 'futureDate',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schemaVal, data) {
        if (!schemaVal) return true;
        const date = new Date(data);
        return date > new Date();
      }
    });

    // Custom keyword: pastDate
    this.ajv.addKeyword({
      keyword: 'pastDate',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schemaVal, data) {
        if (!schemaVal) return true;
        const date = new Date(data);
        return date < new Date();
      }
    });

    // Add custom keywords from config
    Object.entries(this.config.customKeywords).forEach(([name, definition]) => {
      this.ajv.addKeyword(name, definition);
    });
  }

  /**
   * Validate request against OpenAPI schema
   * @param {Object} request - Request object
   * @param {Object} schema - OpenAPI schema
   * @param {Object} options - Validation options
   * @returns {ValidationResult}
   */
  validateRequest(request, schema, options = {}) {
    const { method, url, headers, data, query } = request;
    const operation = this._findOperation(schema, method, url);
    
    if (!operation && options.strict !== false) {
      return {
        valid: false,
        errors: [`No operation found for ${method} ${url}`],
        details: []
      };
    }

    if (!operation) {
      return { valid: true, errors: [], details: [] };
    }

    const errors = [];
    const details = [];

    // Validate path parameters
    const pathParams = this._extractPathParameters(url, operation.pathTemplate);
    if (operation.parameters) {
      const pathParamSchemas = operation.parameters.filter(p => p.in === 'path');
      for (const paramSchema of pathParamSchemas) {
        const value = pathParams[paramSchema.name];
        const result = this._validateParameter(value, paramSchema);
        if (!result.valid) {
          errors.push(...result.errors);
          details.push(...result.details);
        }
      }
    }

    // Validate query parameters
    if (query && operation.parameters) {
      const queryParamSchemas = operation.parameters.filter(p => p.in === 'query');
      for (const paramSchema of queryParamSchemas) {
        const value = query[paramSchema.name];
        if (value !== undefined) {
          const result = this._validateParameter(value, paramSchema);
          if (!result.valid) {
            errors.push(...result.errors);
            details.push(...result.details);
          }
        } else if (paramSchema.required) {
          errors.push(`Missing required query parameter: ${paramSchema.name}`);
          details.push({
            type: 'missing_parameter',
            parameter: paramSchema.name,
            location: 'query'
          });
        }
      }
    }

    // Validate headers
    if (operation.parameters) {
      const headerParamSchemas = operation.parameters.filter(p => p.in === 'header');
      for (const paramSchema of headerParamSchemas) {
        const value = headers[paramSchema.name.toLowerCase()];
        if (value !== undefined) {
          const result = this._validateParameter(value, paramSchema);
          if (!result.valid) {
            errors.push(...result.errors);
            details.push(...result.details);
          }
        } else if (paramSchema.required) {
          errors.push(`Missing required header: ${paramSchema.name}`);
          details.push({
            type: 'missing_parameter',
            parameter: paramSchema.name,
            location: 'header'
          });
        }
      }
    }

    // Validate request body
    if (data && operation.requestBody) {
      const contentType = headers['content-type'] || 'application/json';
      const mediaType = operation.requestBody.content[contentType];
      
      if (mediaType?.schema) {
        const result = this._validateSchema(data, mediaType.schema);
        if (!result.valid) {
          errors.push(...result.errors);
          details.push(...result.details);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      details
    };
  }

  /**
   * Validate response against OpenAPI schema
   * @param {Object} response - Response object
   * @param {Object} schema - OpenAPI schema
   * @param {Object} options - Validation options
   * @returns {ValidationResult}
   */
  validateResponse(response, schema, options = {}) {
    const { status, headers, data } = response;
    const { request } = options;
    
    if (!request) {
      return { valid: true, errors: [], details: [] };
    }

    const operation = this._findOperation(schema, request.method, request.url);
    if (!operation) {
      return { valid: true, errors: [], details: [] };
    }

    const responseSchema = operation.responses[status] || operation.responses.default;
    if (!responseSchema) {
      return {
        valid: false,
        errors: [`No response schema found for status ${status}`],
        details: [{ type: 'missing_response_schema', status }]
      };
    }

    const errors = [];
    const details = [];

    // Validate response headers
    if (responseSchema.headers && headers) {
      for (const [headerName, headerSchema] of Object.entries(responseSchema.headers)) {
        const value = headers[headerName.toLowerCase()];
        if (value !== undefined) {
          const result = this._validateSchema(value, headerSchema.schema);
          if (!result.valid) {
            errors.push(...result.errors.map(e => `Header ${headerName}: ${e}`));
            details.push(...result.details);
          }
        } else if (headerSchema.required) {
          errors.push(`Missing required response header: ${headerName}`);
          details.push({
            type: 'missing_header',
            header: headerName
          });
        }
      }
    }

    // Validate response body
    if (responseSchema.content && data !== undefined) {
      const contentType = headers['content-type'] || 'application/json';
      const mediaType = responseSchema.content[contentType];
      
      if (mediaType?.schema) {
        const result = this._validateSchema(data, mediaType.schema);
        if (!result.valid) {
          errors.push(...result.errors);
          details.push(...result.details);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      details
    };
  }

  /**
   * Validate data against JSON schema
   * @param {*} data - Data to validate
   * @param {Object} schema - JSON schema
   * @returns {ValidationResult}
   */
  validateSchema(data, schema) {
    return this._validateSchema(data, schema);
  }

  /**
   * Internal schema validation
   * @private
   */
  _validateSchema(data, schema) {
    const cacheKey = JSON.stringify(schema);
    
    if (!this.schemaCache.has(cacheKey)) {
      this.schemaCache.set(cacheKey, this.ajv.compile(schema));
    }

    const validate = this.schemaCache.get(cacheKey);
    const valid = validate(data);

    const errors = [];
    const details = [];

    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        const message = `${error.instancePath || 'root'} ${error.message}`;
        errors.push(message);
        details.push({
          type: 'schema_validation',
          path: error.instancePath,
          keyword: error.keyword,
          message: error.message,
          params: error.params,
          data: error.data
        });
      }
    }

    return { valid, errors, details };
  }

  /**
   * Validate parameter against parameter schema
   * @private
   */
  _validateParameter(value, paramSchema) {
    const schema = paramSchema.schema || { type: 'string' };
    
    // Convert string values based on schema type
    let convertedValue = value;
    if (typeof value === 'string' && schema.type !== 'string') {
      convertedValue = this._convertParameterValue(value, schema.type);
    }

    return this._validateSchema(convertedValue, schema);
  }

  /**
   * Convert parameter value to appropriate type
   * @private
   */
  _convertParameterValue(value, type) {
    switch (type) {
      case 'integer':
        return parseInt(value, 10);
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'array':
        return value.split(',');
      default:
        return value;
    }
  }

  /**
   * Find operation in OpenAPI schema
   * @private
   */
  _findOperation(schema, method, url) {
    if (!schema.paths) return null;

    const path = new URL(url, 'http://localhost').pathname;
    
    // Try exact match first
    const pathItem = schema.paths[path];
    if (pathItem && pathItem[method.toLowerCase()]) {
      return {
        ...pathItem[method.toLowerCase()],
        pathTemplate: path
      };
    }

    // Try pattern matching
    for (const [pathTemplate, pathItem] of Object.entries(schema.paths)) {
      if (this._matchesPathTemplate(path, pathTemplate)) {
        const operation = pathItem[method.toLowerCase()];
        if (operation) {
          return {
            ...operation,
            pathTemplate
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if path matches OpenAPI path template
   * @private
   */
  _matchesPathTemplate(path, template) {
    const templateRegex = template
      .replace(/\{[^}]+\}/g, '([^/]+)')  // Replace {param} with capture group
      .replace(/\//g, '\\/');           // Escape slashes
    
    const regex = new RegExp(`^${templateRegex}$`);
    return regex.test(path);
  }

  /**
   * Extract path parameters from URL
   * @private
   */
  _extractPathParameters(url, template) {
    const path = new URL(url, 'http://localhost').pathname;
    const params = {};
    
    const templateParts = template.split('/');
    const pathParts = path.split('/');
    
    templateParts.forEach((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const paramName = part.slice(1, -1);
        params[paramName] = pathParts[index];
      }
    });
    
    return params;
  }

  /**
   * Create assertion helpers for common validations
   */
  assertions = {
    /**
     * Assert response has expected status
     */
    hasStatus: (response, expectedStatus) => {
      if (response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
      }
      return true;
    },

    /**
     * Assert response contains expected headers
     */
    hasHeaders: (response, expectedHeaders) => {
      for (const [name, value] of Object.entries(expectedHeaders)) {
        const actualValue = response.headers[name.toLowerCase()];
        if (actualValue !== value) {
          throw new Error(`Expected header ${name}: ${value}, got ${actualValue}`);
        }
      }
      return true;
    },

    /**
     * Assert response body matches structure
     */
    hasBodyStructure: (response, expectedStructure) => {
      const result = this._validateObjectStructure(response.data, expectedStructure);
      if (result.length > 0) {
        throw new Error(`Body structure validation failed: ${result.join(', ')}`);
      }
      return true;
    },

    /**
     * Assert response body contains fields
     */
    hasFields: (response, fields) => {
      const missing = [];
      fields.forEach(field => {
        if (!(field in response.data)) {
          missing.push(field);
        }
      });
      
      if (missing.length > 0) {
        throw new Error(`Missing fields: ${missing.join(', ')}`);
      }
      return true;
    },

    /**
     * Assert response time is within limit
     */
    respondsWithin: (response, maxTime) => {
      if (response.responseTime > maxTime) {
        throw new Error(`Response time ${response.responseTime}ms exceeds limit ${maxTime}ms`);
      }
      return true;
    },

    /**
     * Assert response contains pagination metadata
     */
    hasPagination: (response) => {
      const data = response.data;
      const required = ['page', 'limit', 'total', 'totalPages'];
      const missing = required.filter(field => !(field in data));
      
      if (missing.length > 0) {
        throw new Error(`Missing pagination fields: ${missing.join(', ')}`);
      }
      return true;
    }
  };

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

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        errors.push(`${path}: Expected array, got ${typeof actual}`);
        return errors;
      }
      
      if (expected.length > 0 && actual.length > 0) {
        // Validate array item structure
        errors.push(...this._validateObjectStructure(actual[0], expected[0], `${path}[0]`));
      }
      return errors;
    }

    if (expected && typeof expected === 'object') {
      if (!actual || typeof actual !== 'object') {
        errors.push(`${path}: Expected object, got ${typeof actual}`);
        return errors;
      }
      
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
   * Clear validation cache
   */
  clearCache() {
    this.schemaCache.clear();
    this.validationCache.clear();
    return this;
  }
}

/**
 * Create validation helper instance
 * @param {ValidationConfig} config - Configuration options
 * @returns {ValidationHelper}
 */
export function createValidationHelper(config) {
  return new ValidationHelper(config);
}

/**
 * Validate request against OpenAPI schema
 * @param {Object} request - Request object
 * @param {Object} schema - OpenAPI schema
 * @param {Object} options - Validation options
 * @returns {ValidationResult}
 */
export function validateRequest(request, schema, options = {}) {
  const helper = new ValidationHelper(options);
  return helper.validateRequest(request, schema, options);
}

/**
 * Validate response against OpenAPI schema
 * @param {Object} response - Response object
 * @param {Object} schema - OpenAPI schema
 * @param {Object} options - Validation options
 * @returns {ValidationResult}
 */
export function validateResponse(response, schema, options = {}) {
  const helper = new ValidationHelper(options);
  return helper.validateResponse(response, schema, options);
}

/**
 * Default validation helper instance
 */
export const defaultValidator = new ValidationHelper();

/**
 * Default export
 */
export default ValidationHelper;