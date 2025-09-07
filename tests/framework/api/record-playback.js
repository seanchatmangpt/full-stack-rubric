/**
 * @fileoverview Mock recording and playback system for real API interactions
 * Enables recording live API calls and replaying them in tests
 */

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Recording configuration
 * @typedef {Object} RecordConfig
 * @property {string} recordingsDir - Directory to store recordings
 * @property {boolean} overwriteExisting - Overwrite existing recordings
 * @property {Array<string>} sensitiveHeaders - Headers to redact in recordings
 * @property {Array<string>} sensitiveFields - Response fields to redact
 * @property {Function} requestMatcher - Custom request matching function
 * @property {Function} responseTransformer - Transform responses before recording
 */

/**
 * Recording entry
 * @typedef {Object} Recording
 * @property {string} id - Unique recording ID
 * @property {Object} request - Recorded request
 * @property {Object} response - Recorded response
 * @property {number} timestamp - Recording timestamp
 * @property {Object} metadata - Additional metadata
 */

/**
 * Playback options
 * @typedef {Object} PlaybackOptions
 * @property {string} mode - Playback mode ('strict', 'loose', 'update')
 * @property {boolean} allowMissing - Allow missing recordings
 * @property {Function} fallback - Fallback function for missing recordings
 */

export class RecordPlaybackSystem {
  /**
   * Initialize record/playback system
   * @param {RecordConfig} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      recordingsDir: config.recordingsDir || join(__dirname, '../recordings'),
      overwriteExisting: config.overwriteExisting || false,
      sensitiveHeaders: config.sensitiveHeaders || ['authorization', 'cookie', 'x-api-key'],
      sensitiveFields: config.sensitiveFields || ['password', 'token', 'secret', 'key'],
      requestMatcher: config.requestMatcher || this._defaultRequestMatcher.bind(this),
      responseTransformer: config.responseTransformer || this._defaultResponseTransformer.bind(this),
      ...config
    };

    this.mode = 'playback'; // 'record', 'playback', 'update'
    this.recordings = new Map();
    this.cassettes = new Map();
    this.currentCassette = null;
    this.recordingHistory = [];
    this.stats = {
      recorded: 0,
      played: 0,
      missed: 0,
      errors: 0
    };

    this._ensureRecordingsDir();
  }

  /**
   * Ensure recordings directory exists
   * @private
   */
  async _ensureRecordingsDir() {
    try {
      await fs.mkdir(this.config.recordingsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create recordings directory:', error.message);
    }
  }

  /**
   * Set recording mode
   * @param {'record'|'playback'|'update'} mode - Recording mode
   */
  setMode(mode) {
    if (!['record', 'playback', 'update'].includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    this.mode = mode;
    return this;
  }

  /**
   * Load cassette for recording/playback
   * @param {string} name - Cassette name
   * @param {PlaybackOptions} options - Playback options
   */
  async loadCassette(name, options = {}) {
    const cassettePath = join(this.config.recordingsDir, `${name}.json`);
    
    try {
      const data = await fs.readFile(cassettePath, 'utf-8');
      const cassette = JSON.parse(data);
      
      this.cassettes.set(name, cassette);
      this.currentCassette = name;
      
      // Load recordings into memory for quick access
      cassette.recordings.forEach(recording => {
        const key = this._generateRecordingKey(recording.request);
        this.recordings.set(key, recording);
      });
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create new empty cassette
        const cassette = {
          name,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          recordings: [],
          metadata: {
            totalRequests: 0,
            uniqueEndpoints: new Set()
          }
        };
        
        this.cassettes.set(name, cassette);
        this.currentCassette = name;
        
        if (this.mode === 'record') {
          await this.saveCassette(name);
        }
      } else {
        throw new Error(`Failed to load cassette ${name}: ${error.message}`);
      }
    }
    
    return this;
  }

  /**
   * Save cassette to disk
   * @param {string} name - Cassette name
   */
  async saveCassette(name = this.currentCassette) {
    if (!name || !this.cassettes.has(name)) {
      throw new Error(`Cassette ${name} not found`);
    }

    const cassette = this.cassettes.get(name);
    const cassettePath = join(this.config.recordingsDir, `${name}.json`);

    // Update metadata
    cassette.updatedAt = new Date().toISOString();
    cassette.metadata.totalRequests = cassette.recordings.length;
    cassette.metadata.uniqueEndpoints = new Set(
      cassette.recordings.map(r => `${r.request.method} ${new URL(r.request.url).pathname}`)
    ).size;

    try {
      const data = JSON.stringify(cassette, null, 2);
      await fs.writeFile(cassettePath, data, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save cassette ${name}: ${error.message}`);
    }

    return this;
  }

  /**
   * Record a request/response interaction
   * @param {Object} request - Request object
   * @param {Object} response - Response object
   * @param {Object} metadata - Additional metadata
   */
  async record(request, response, metadata = {}) {
    if (this.mode !== 'record' && this.mode !== 'update') {
      return this;
    }

    if (!this.currentCassette) {
      throw new Error('No cassette loaded for recording');
    }

    const cassette = this.cassettes.get(this.currentCassette);
    const recording = {
      id: this._generateRecordingId(),
      request: this._sanitizeRequest(request),
      response: await this._sanitizeResponse(response),
      timestamp: Date.now(),
      duration: response.duration || 0,
      metadata: {
        userAgent: request.headers?.['user-agent'],
        ip: request.headers?.['x-forwarded-for'] || 'unknown',
        ...metadata
      }
    };

    // Transform response if configured
    if (this.config.responseTransformer) {
      recording.response = await this.config.responseTransformer(recording.response, recording.request);
    }

    // Check for existing recording
    const key = this._generateRecordingKey(request);
    if (this.mode === 'update' || !this.recordings.has(key) || this.config.overwriteExisting) {
      cassette.recordings = cassette.recordings.filter(r => 
        this._generateRecordingKey(r.request) !== key
      );
      cassette.recordings.push(recording);
      this.recordings.set(key, recording);
      
      this.stats.recorded++;
      this.recordingHistory.push({
        action: 'recorded',
        key,
        timestamp: Date.now()
      });
    }

    return recording;
  }

  /**
   * Play back a recorded response for a request
   * @param {Object} request - Request object
   * @param {PlaybackOptions} options - Playback options
   * @returns {Object|null} Recorded response or null if not found
   */
  async playback(request, options = {}) {
    if (this.mode === 'record') {
      return null; // Don't playback in record mode
    }

    const key = this._generateRecordingKey(request);
    const recording = this.recordings.get(key);

    if (recording) {
      this.stats.played++;
      this.recordingHistory.push({
        action: 'played',
        key,
        timestamp: Date.now()
      });

      // Clone response to avoid mutation
      const response = JSON.parse(JSON.stringify(recording.response));
      
      // Add recording metadata to response
      response._recorded = true;
      response._recordingId = recording.id;
      response._recordedAt = new Date(recording.timestamp).toISOString();

      return response;
    }

    this.stats.missed++;
    this.recordingHistory.push({
      action: 'missed',
      key,
      timestamp: Date.now()
    });

    // Handle missing recording
    if (options.allowMissing) {
      return null;
    }

    if (options.fallback && typeof options.fallback === 'function') {
      return await options.fallback(request);
    }

    throw new Error(`No recording found for request: ${key}`);
  }

  /**
   * Handle request in record/playback mode
   * @param {Object} request - Request object
   * @param {Function} makeRequest - Function to make actual request
   * @param {Object} options - Options
   * @returns {Object} Response object
   */
  async handleRequest(request, makeRequest, options = {}) {
    try {
      if (this.mode === 'playback') {
        const recorded = await this.playback(request, options);
        if (recorded) {
          return recorded;
        }
        
        if (!options.allowMissing) {
          throw new Error(`No recording found for ${request.method} ${request.url}`);
        }
      }

      // Make actual request
      const startTime = Date.now();
      const response = await makeRequest(request);
      const duration = Date.now() - startTime;
      
      response.duration = duration;

      // Record if in record/update mode
      if (this.mode === 'record' || this.mode === 'update') {
        await this.record(request, response);
      }

      return response;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Generate recording key for request matching
   * @private
   */
  _generateRecordingKey(request) {
    if (this.config.requestMatcher) {
      return this.config.requestMatcher(request);
    }
    return this._defaultRequestMatcher(request);
  }

  /**
   * Default request matching strategy
   * @private
   */
  _defaultRequestMatcher(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const query = [...url.searchParams.entries()].sort().toString();
    const method = request.method.toUpperCase();
    
    // Include body hash for POST/PUT/PATCH requests
    let bodyHash = '';
    if (request.data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      bodyHash = crypto
        .createHash('md5')
        .update(JSON.stringify(request.data))
        .digest('hex')
        .substring(0, 8);
    }

    return `${method}:${path}:${query}:${bodyHash}`;
  }

  /**
   * Generate unique recording ID
   * @private
   */
  _generateRecordingId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Sanitize request data for recording
   * @private
   */
  _sanitizeRequest(request) {
    const sanitized = {
      method: request.method,
      url: request.url,
      headers: { ...request.headers },
      data: request.data ? JSON.parse(JSON.stringify(request.data)) : null
    };

    // Remove sensitive headers
    this.config.sensitiveHeaders.forEach(header => {
      const key = Object.keys(sanitized.headers).find(k => 
        k.toLowerCase() === header.toLowerCase()
      );
      if (key) {
        sanitized.headers[key] = '[REDACTED]';
      }
    });

    // Remove sensitive fields from data
    if (sanitized.data) {
      sanitized.data = this._redactSensitiveFields(sanitized.data);
    }

    return sanitized;
  }

  /**
   * Sanitize response data for recording
   * @private
   */
  async _sanitizeResponse(response) {
    const sanitized = {
      status: response.status,
      statusText: response.statusText,
      headers: { ...response.headers },
      data: response.data ? JSON.parse(JSON.stringify(response.data)) : null,
      duration: response.duration || 0
    };

    // Remove sensitive fields from response data
    if (sanitized.data) {
      sanitized.data = this._redactSensitiveFields(sanitized.data);
    }

    return sanitized;
  }

  /**
   * Redact sensitive fields from object
   * @private
   */
  _redactSensitiveFields(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this._redactSensitiveFields(item));
    }

    const redacted = { ...obj };
    
    this.config.sensitiveFields.forEach(field => {
      const key = Object.keys(redacted).find(k => 
        k.toLowerCase().includes(field.toLowerCase())
      );
      if (key && redacted[key]) {
        redacted[key] = '[REDACTED]';
      }
    });

    // Recursively redact nested objects
    Object.keys(redacted).forEach(key => {
      if (redacted[key] && typeof redacted[key] === 'object') {
        redacted[key] = this._redactSensitiveFields(redacted[key]);
      }
    });

    return redacted;
  }

  /**
   * Default response transformer
   * @private
   */
  _defaultResponseTransformer(response, request) {
    // Add timestamp normalization, remove dynamic fields, etc.
    if (response.data && typeof response.data === 'object') {
      const transformed = { ...response.data };
      
      // Normalize timestamps to make recordings deterministic
      if (transformed.timestamp) {
        transformed.timestamp = '[NORMALIZED_TIMESTAMP]';
      }
      if (transformed.createdAt) {
        transformed.createdAt = '[NORMALIZED_TIMESTAMP]';
      }
      if (transformed.updatedAt) {
        transformed.updatedAt = '[NORMALIZED_TIMESTAMP]';
      }
      
      return { ...response, data: transformed };
    }
    
    return response;
  }

  /**
   * List available cassettes
   * @returns {Promise<Array<string>>} Cassette names
   */
  async listCassettes() {
    try {
      const files = await fs.readdir(this.config.recordingsDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete cassette
   * @param {string} name - Cassette name
   */
  async deleteCassette(name) {
    const cassettePath = join(this.config.recordingsDir, `${name}.json`);
    
    try {
      await fs.unlink(cassettePath);
      this.cassettes.delete(name);
      
      if (this.currentCassette === name) {
        this.currentCassette = null;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    return this;
  }

  /**
   * Get cassette information
   * @param {string} name - Cassette name
   * @returns {Object} Cassette info
   */
  getCassetteInfo(name = this.currentCassette) {
    if (!name || !this.cassettes.has(name)) {
      return null;
    }

    const cassette = this.cassettes.get(name);
    return {
      name: cassette.name,
      version: cassette.version,
      createdAt: cassette.createdAt,
      updatedAt: cassette.updatedAt,
      recordingCount: cassette.recordings.length,
      metadata: cassette.metadata
    };
  }

  /**
   * Get recording statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      mode: this.mode,
      currentCassette: this.currentCassette,
      loadedCassettes: this.cassettes.size,
      totalRecordings: this.recordings.size
    };
  }

  /**
   * Get recording history
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Recording history
   */
  getHistory(limit = 100) {
    return this.recordingHistory.slice(-limit);
  }

  /**
   * Clear recording history
   */
  clearHistory() {
    this.recordingHistory = [];
    return this;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      recorded: 0,
      played: 0,
      missed: 0,
      errors: 0
    };
    return this;
  }

  /**
   * Clear all in-memory recordings and cassettes
   */
  clear() {
    this.recordings.clear();
    this.cassettes.clear();
    this.currentCassette = null;
    this.clearHistory();
    this.resetStats();
    return this;
  }
}

/**
 * Create record/playback system
 * @param {RecordConfig} config - Configuration options
 * @returns {RecordPlaybackSystem}
 */
export function createRecordPlayback(config) {
  return new RecordPlaybackSystem(config);
}

/**
 * Utility function to create HTTP client with recording capabilities
 * @param {Function} httpClient - Base HTTP client (axios, fetch, etc.)
 * @param {RecordPlaybackSystem} recorder - Record/playback system
 * @returns {Function} Wrapped HTTP client
 */
export function withRecording(httpClient, recorder) {
  return async function recordingClient(config) {
    return await recorder.handleRequest(
      {
        method: config.method || 'GET',
        url: config.url,
        headers: config.headers || {},
        data: config.data
      },
      async (request) => {
        return await httpClient(config);
      }
    );
  };
}

/**
 * Default export
 */
export default RecordPlaybackSystem;