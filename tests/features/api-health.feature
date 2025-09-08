Feature: API Health Check Endpoints
  As a system administrator
  I want to monitor API health and status
  So that I can ensure service availability and detect issues early

  Background:
    Given the health monitoring system is active
    And health check endpoints are configured
    And monitoring metrics are being collected

  Scenario: Basic health check endpoint
    When I send a GET request to "/api/health"
    Then the response status should be 200
    And the response time should be less than 100ms
    And the response content-type should be "application/json"
    And the response should contain status "healthy"
    And the response should include a timestamp

  Scenario: Detailed health status
    When I send a GET request to "/api/health/status"
    Then the response status should be 200
    And the response time should be less than 200ms
    And the response should include system uptime
    And the response should include memory usage statistics
    And the response should include database connection status
    And the response should include service dependencies status

  Scenario: Health check with service dependencies
    Given external services are configured
    When I send a GET request to "/api/health/dependencies"
    Then the response status should be 200 or 503
    And the response should list all configured dependencies
    And each dependency should have a status indicator
    And response times for each dependency should be included
    And overall health should reflect dependency status

  Scenario: Database health verification
    When I send a GET request to "/api/health/database"
    Then the response status should be 200 or 503
    And the response time should be less than 500ms
    And the response should include database connectivity status
    And connection pool statistics should be provided
    And query performance metrics should be included

  Scenario: Memory and performance metrics
    When I send a GET request to "/api/health/metrics"
    Then the response status should be 200
    And the response should include current memory usage
    And CPU usage statistics should be provided
    And request processing times should be included
    And cache hit rates should be reported if applicable

  Scenario: Health check during high load
    Given the system is under high load with 100+ concurrent requests
    When I send a GET request to "/api/health"
    Then the response status should still be 200
    And the response time should be less than 500ms
    And the health status should indicate load conditions
    And system should continue serving health checks

  Scenario: Health check failure scenarios
    Given a critical system component is unavailable
    When I send a GET request to "/api/health"
    Then the response status should be 503
    And the response should indicate service unavailable
    And specific failing components should be identified
    And error details should be provided for troubleshooting

  Scenario: Health check security
    When I send a GET request to "/api/health" without authentication
    Then the response status should be 200
    And basic health information should be provided
    But sensitive system details should be omitted
    And no internal configuration should be exposed

  Scenario: Health check rate limiting
    When I send 50 rapid requests to "/api/health"
    Then all or most responses should have status 200
    And health checks should not be heavily rate limited
    And essential monitoring should remain accessible
    And system should prioritize health check availability

  Scenario: Custom health check probes
    When I send a GET request to "/api/health/readiness"
    Then the response should indicate if the service is ready to serve traffic
    And readiness checks should verify all required components
    And the response time should be less than 200ms

  Scenario: Liveness probe endpoint
    When I send a GET request to "/api/health/liveness"
    Then the response should indicate if the service is running
    And liveness checks should be minimal and fast
    And the response time should be less than 100ms
    And this should work even during startup or high load

  Scenario: Health check historical data
    Given health metrics have been collected over time
    When I send a GET request to "/api/health/history" with query parameters:
      | parameter | value |
      | period    | 1h    |
      | metrics   | all   |
    Then the response status should be 200
    And historical health data should be provided
    And trends and patterns should be identifiable
    And data should cover the requested time period

  Scenario: Health check alerts and thresholds
    Given health monitoring thresholds are configured
    When system metrics exceed warning thresholds
    And I send a GET request to "/api/health/alerts"
    Then the response should include current alerts
    And alert severity levels should be indicated
    And recommendations for resolution should be provided