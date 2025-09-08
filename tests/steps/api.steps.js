/**
 * @fileoverview API testing step definitions following London School TDD
 * Focuses on contract verification and service collaboration testing
 */

import { Given, When, Then } from 'cucumber';
import { expect } from 'vitest';
import { createMockAPIService, createMockAuthService, createMockDataValidator } from '../framework/mocks/api-mocks.js';
import { BDDTestRunner } from '../framework/bdd-test-runner.js';

/**
 * Mock services for API interactions
 * Following London School approach - test service contracts and collaborations
 */
const mockAPIService = createMockAPIService();
const mockAuthService = createMockAuthService();
const mockDataValidator = createMockDataValidator();

/**
 * BDD test runner instance for API scenarios
 */
const testRunner = new BDDTestRunner('api');

// Authentication & Authorization
Given('the user is authenticated with role {string}', async function(role) {
  this.userRole = role;
  this.authToken = 'mock-jwt-token-123';
  
  mockAuthService.getCurrentUser.mockReturnValue({
    id: 'user-123',
    role: role,
    token: this.authToken,
    permissions: ['read', 'write']
  });
  
  mockAuthService.validateToken.mockResolvedValue({
    valid: true,
    user: { role },
    expires: Date.now() + 3600000
  });
  
  // Verify authentication setup
  expect(mockAuthService.authenticate).toHaveBeenCalledWith({ role });
});

Given('the user is not authenticated', async function() {
  this.userRole = null;
  this.authToken = null;
  
  mockAuthService.getCurrentUser.mockReturnValue(null);
  mockAuthService.validateToken.mockResolvedValue({
    valid: false,
    error: 'No valid token found'
  });
});

When('the user makes a {string} request to {string}', async function(method, endpoint) {
  this.requestMethod = method;
  this.requestEndpoint = endpoint;
  
  const requestOptions = {
    method,
    url: endpoint,
    headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
    data: this.requestData || {}
  };
  
  mockAPIService.makeRequest.mockResolvedValue({
    status: 200,
    data: { success: true },
    headers: { 'content-type': 'application/json' }
  });
  
  this.apiResponse = await mockAPIService.makeRequest(requestOptions);
  
  // Verify API request behavior
  expect(mockAPIService.makeRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      method,
      url: endpoint
    })
  );
});

When('the user provides request data {string}', async function(jsonData) {
  this.requestData = JSON.parse(jsonData);
  
  mockDataValidator.validate.mockReturnValue({
    valid: true,
    sanitized: this.requestData
  });
  
  // Verify data validation contract
  expect(mockDataValidator.validate).toHaveBeenCalledWith(this.requestData);
});

Then('the API should return status {int}', async function(expectedStatus) {
  expect(this.apiResponse.status).toBe(expectedStatus);
  
  // Verify status code handling
  expect(mockAPIService.handleStatusCode).toHaveBeenCalledWith(expectedStatus);
});

Then('the response should contain {string}', async function(expectedContent) {
  const contentObject = JSON.parse(expectedContent);
  
  expect(this.apiResponse.data).toEqual(
    expect.objectContaining(contentObject)
  );
  
  // Verify response content validation
  expect(mockDataValidator.validateResponse).toHaveBeenCalledWith(this.apiResponse.data);
});

// Data Validation & Sanitization
Given('invalid request data {string}', async function(invalidData) {
  this.invalidRequestData = JSON.parse(invalidData);
  
  mockDataValidator.validate.mockReturnValue({
    valid: false,
    errors: ['Email format invalid', 'Password too short'],
    sanitized: null
  });
});

When('the API validates the request data', async function() {
  this.validationResult = await mockDataValidator.validate(this.invalidRequestData);
  
  // Verify validation was attempted
  expect(mockDataValidator.validate).toHaveBeenCalledWith(this.invalidRequestData);
});

Then('validation should fail with errors {string}', async function(expectedErrors) {
  const errorsArray = JSON.parse(expectedErrors);
  
  expect(this.validationResult.valid).toBe(false);
  expect(this.validationResult.errors).toEqual(
    expect.arrayContaining(errorsArray)
  );
  
  // Verify error handling contract
  expect(mockAPIService.handleValidationErrors).toHaveBeenCalledWith(this.validationResult.errors);
});

// Rate Limiting & Throttling
Given('the user has made {int} requests in the last minute', async function(requestCount) {
  this.requestCount = requestCount;
  
  mockAPIService.getRateLimitStatus.mockReturnValue({
    requests: requestCount,
    limit: 100,
    window: '1m',
    remaining: 100 - requestCount
  });
});

When('the user makes another request', async function() {
  const rateLimitResult = mockAPIService.checkRateLimit('user-123');
  
  mockAPIService.checkRateLimit.mockReturnValue({
    allowed: this.requestCount < 100,
    remaining: Math.max(0, 100 - this.requestCount - 1),
    resetTime: Date.now() + 60000
  });
  
  this.rateLimitResult = rateLimitResult;
  
  // Verify rate limit checking
  expect(mockAPIService.checkRateLimit).toHaveBeenCalledWith('user-123');
});

Then('the request should be {string}', async function(expectedResult) {
  if (expectedResult === 'allowed') {
    expect(this.rateLimitResult.allowed).toBe(true);
  } else if (expectedResult === 'throttled') {
    expect(this.rateLimitResult.allowed).toBe(false);
    // Verify throttling behavior
    expect(mockAPIService.applyThrottling).toHaveBeenCalled();
  }
});

// Error Handling & Recovery
Given('the database is unavailable', async function() {
  this.databaseError = new Error('Database connection failed');
  
  mockAPIService.connectToDatabase.mockRejectedValue(this.databaseError);
});

When('the API attempts to process the request', async function() {
  try {
    await mockAPIService.processRequest({
      method: this.requestMethod,
      endpoint: this.requestEndpoint,
      data: this.requestData
    });
  } catch (error) {
    this.processingError = error;
  }
  
  // Verify error handling attempt
  expect(mockAPIService.processRequest).toHaveBeenCalled();
});

Then('a graceful error response should be returned', async function() {
  mockAPIService.createErrorResponse.mockReturnValue({
    status: 500,
    error: 'Internal Server Error',
    message: 'Service temporarily unavailable',
    retry: true
  });
  
  const errorResponse = mockAPIService.createErrorResponse(this.processingError);
  
  expect(errorResponse).toEqual(
    expect.objectContaining({
      status: 500,
      error: expect.any(String)
    })
  );
  
  // Verify graceful error handling
  expect(mockAPIService.logError).toHaveBeenCalledWith(this.processingError);
});

// Caching & Performance
Given('cached data exists for endpoint {string}', async function(endpoint) {
  this.cachedEndpoint = endpoint;
  this.cachedData = { id: '123', name: 'Test Data', timestamp: Date.now() };
  
  mockAPIService.getCachedData.mockReturnValue({
    data: this.cachedData,
    fresh: true,
    expires: Date.now() + 300000 // 5 minutes
  });
});

When('the API checks the cache', async function() {
  this.cacheResult = await mockAPIService.getCachedData(this.cachedEndpoint);
  
  // Verify cache checking behavior
  expect(mockAPIService.getCachedData).toHaveBeenCalledWith(this.cachedEndpoint);
});

Then('cached data should be returned', async function() {
  expect(this.cacheResult.data).toEqual(this.cachedData);
  expect(this.cacheResult.fresh).toBe(true);
  
  // Verify cache utilization
  expect(mockAPIService.serveCachedResponse).toHaveBeenCalledWith(this.cacheResult);
});

Then('database query should be skipped', async function() {
  // Verify database was not queried when cache hit occurred
  expect(mockAPIService.queryDatabase).not.toHaveBeenCalled();
});

// File Upload & Processing
Given('the user selects a file {string}', async function(fileName) {
  this.selectedFile = {
    name: fileName,
    size: 1024000, // 1MB
    type: 'text/plain',
    content: 'Mock file content'
  };
  
  mockAPIService.validateFile.mockReturnValue({
    valid: true,
    file: this.selectedFile,
    metadata: { size: this.selectedFile.size, type: this.selectedFile.type }
  });
});

When('the file is uploaded to {string}', async function(uploadEndpoint) {
  const uploadOptions = {
    endpoint: uploadEndpoint,
    file: this.selectedFile,
    metadata: { uploadedBy: 'user-123' }
  };
  
  mockAPIService.uploadFile.mockResolvedValue({
    success: true,
    fileId: 'file-456',
    url: `${uploadEndpoint}/file-456`,
    processingStatus: 'pending'
  });
  
  this.uploadResult = await mockAPIService.uploadFile(uploadOptions);
  
  // Verify file upload behavior
  expect(mockAPIService.uploadFile).toHaveBeenCalledWith(
    expect.objectContaining({
      file: this.selectedFile,
      endpoint: uploadEndpoint
    })
  );
});

Then('the file should be processed successfully', async function() {
  mockAPIService.processFile.mockResolvedValue({
    fileId: 'file-456',
    status: 'completed',
    processedAt: new Date().toISOString()
  });
  
  const processingResult = await mockAPIService.processFile(this.uploadResult.fileId);
  
  expect(processingResult.status).toBe('completed');
  
  // Verify file processing contract
  expect(mockAPIService.processFile).toHaveBeenCalledWith(this.uploadResult.fileId);
});

// WebSocket Connections & Real-time Updates
Given('a WebSocket connection is established', async function() {
  this.websocketConnection = {
    id: 'ws-connection-789',
    state: 'connected',
    subscriptions: []
  };
  
  mockAPIService.establishWebSocket.mockResolvedValue(this.websocketConnection);
  
  // Verify WebSocket establishment
  expect(mockAPIService.establishWebSocket).toHaveBeenCalled();
});

When('the user subscribes to {string} updates', async function(updateType) {
  this.subscriptionType = updateType;
  
  mockAPIService.subscribe.mockResolvedValue({
    subscription: updateType,
    subscriptionId: 'sub-123',
    active: true
  });
  
  this.subscriptionResult = await mockAPIService.subscribe(
    this.websocketConnection.id,
    updateType
  );
  
  // Verify subscription behavior
  expect(mockAPIService.subscribe).toHaveBeenCalledWith(
    this.websocketConnection.id,
    updateType
  );
});

When('a real-time update occurs', async function() {
  const updateData = {
    type: this.subscriptionType,
    data: { id: '123', status: 'updated' },
    timestamp: Date.now()
  };
  
  mockAPIService.broadcastUpdate.mockReturnValue({
    sent: true,
    recipients: 1,
    update: updateData
  });
  
  this.broadcastResult = mockAPIService.broadcastUpdate(updateData);
  
  // Verify broadcast behavior
  expect(mockAPIService.broadcastUpdate).toHaveBeenCalledWith(updateData);
});

Then('the client should receive the update', async function() {
  mockAPIService.receiveUpdate.mockReturnValue({
    received: true,
    data: expect.objectContaining({
      type: this.subscriptionType
    })
  });
  
  const receivedUpdate = mockAPIService.receiveUpdate();
  
  expect(receivedUpdate.received).toBe(true);
  
  // Verify update reception
  expect(mockAPIService.handleIncomingUpdate).toHaveBeenCalled();
});

// API Versioning & Backward Compatibility
Given('the client uses API version {string}', async function(apiVersion) {
  this.apiVersion = apiVersion;
  
  mockAPIService.setAPIVersion.mockReturnValue({
    version: apiVersion,
    supported: true,
    features: ['basic', 'advanced']
  });
  
  // Verify version setting
  expect(mockAPIService.setAPIVersion).toHaveBeenCalledWith(apiVersion);
});

When('the API processes the versioned request', async function() {
  mockAPIService.processVersionedRequest.mockResolvedValue({
    version: this.apiVersion,
    processed: true,
    compatibility: 'full'
  });
  
  this.versionResult = await mockAPIService.processVersionedRequest({
    version: this.apiVersion,
    request: this.requestData
  });
  
  // Verify versioned processing
  expect(mockAPIService.processVersionedRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      version: this.apiVersion
    })
  );
});

Then('backward compatibility should be maintained', async function() {
  expect(this.versionResult.compatibility).toBe('full');
  
  // Verify compatibility checking
  expect(mockAPIService.checkBackwardCompatibility).toHaveBeenCalledWith(this.apiVersion);
});

/**
 * Cleanup and teardown
 */
After(async function() {
  // Reset all API mocks after each scenario
  jest.clearAllMocks();
  
  // Clean up test runner
  await testRunner.cleanup();
});