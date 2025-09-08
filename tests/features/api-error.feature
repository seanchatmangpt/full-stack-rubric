Feature: API Error Handling
  As an API consumer
  I want proper error responses and handling
  So that I can understand and recover from API failures gracefully

  Background:
    Given the API service is running with error handling middleware
    And error logging and monitoring are configured
    And I have access to make API requests

  Scenario: 404 Not Found responses
    When I send a GET request to "/api/nonexistent/endpoint"
    Then the response status should be 404
    And the response time should be less than 200ms
    And the response content-type should be "application/json"
    And the response should contain an error message
    And the error should indicate "endpoint not found"
    And a request ID should be included for tracking

  Scenario: 400 Bad Request for malformed data
    When I send a POST request to "/api/_content/query" with invalid JSON:
    """
    { invalid json structure
    """
    Then the response status should be 400
    And the response time should be less than 150ms
    And the response should describe the JSON parsing error
    And specific error details should be provided
    And no sensitive server information should be exposed

  Scenario: 422 Validation errors
    When I send a POST request to "/api/content/create" with data:
    """
    {
      "title": "",
      "content": null,
      "invalidField": "value"
    }
    """
    Then the response status should be 422
    And the response should contain validation error details
    And each field error should be specifically identified
    And error messages should be user-friendly
    And field-level error codes should be provided

  Scenario: 429 Rate limiting responses
    When I send 200 rapid requests to "/api/_content/query"
    Then some responses should have status 429
    And rate-limited responses should include "Retry-After" header
    And the error should explain rate limiting policies
    And rate limit reset time should be indicated
    And legitimate requests should resume after the limit resets

  Scenario: 500 Internal server errors
    Given a server component is configured to fail
    When I send a GET request to "/api/_content/query"
    Then the response status should be 500
    And the response time should be less than 5000ms
    And the response should contain a generic error message
    And internal error details should not be exposed to clients
    And an error tracking ID should be provided

  Scenario: 503 Service unavailable
    Given the database connection is unavailable
    When I send a GET request to "/api/_content/query"
    Then the response status should be 503
    And the response should indicate service temporarily unavailable
    And estimated recovery time should be provided if known
    And the service should continue accepting other requests if possible

  Scenario: CORS error handling
    When I send a cross-origin request from "http://unauthorized-domain.com"
    To "/api/_content/query"
    Then the request should be blocked by CORS policy
    And appropriate CORS headers should be returned
    And the error should indicate CORS restriction
    And allowed origins should be properly configured

  Scenario: Request timeout handling
    Given API responses are artificially delayed beyond timeout limits
    When I send a GET request to "/api/_content/query/slow-endpoint"
    Then the response status should be 504 or connection timeout
    And the timeout should occur within configured limits
    And partial responses should not be returned
    And the client should receive appropriate timeout indication

  Scenario: Large request body handling
    When I send a POST request with a 50MB body to "/api/upload"
    Then the response status should be 413 or 400
    And the response should indicate payload too large
    And maximum allowed size should be specified
    And the server should not process the oversized request
    And memory usage should remain controlled

  Scenario: Unsupported HTTP methods
    When I send a DELETE request to "/api/_content/query"
    Then the response status should be 405
    And the response should indicate method not allowed
    And the "Allow" header should list supported methods
    And the error message should be clear about method restriction

  Scenario: Authentication and authorization errors
    When I send a GET request to "/api/admin/protected" without credentials
    Then the response status should be 401
    And the response should indicate authentication required
    And authentication methods should be specified
    And no sensitive data should be returned

  Scenario: Insufficient permissions
    Given I am authenticated as a regular user
    When I send a DELETE request to "/api/admin/delete/content"
    Then the response status should be 403
    And the response should indicate insufficient permissions
    And required permission levels should be specified
    And audit logs should record the unauthorized attempt

  Scenario: Error response consistency
    When various error conditions occur across different endpoints
    Then all error responses should follow the same format structure
    And error codes should be consistent across the API
    And error messages should maintain similar tone and detail level
    And metadata like request IDs should always be included

  Scenario: Error logging and monitoring
    Given error tracking is configured
    When various API errors occur
    Then errors should be logged with appropriate severity levels
    And error patterns should be identifiable in logs
    And critical errors should trigger monitoring alerts
    And error rates should be tracked for system health