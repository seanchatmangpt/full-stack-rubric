Feature: API Performance Testing
  As a system administrator and developer
  I want to ensure APIs meet performance requirements
  So that the application provides optimal user experience under various load conditions

  Background:
    Given the API service is running in production mode
    And performance monitoring is enabled
    And baseline performance metrics are established

  Scenario: Single request response times
    When I send a GET request to "/api/_content/query"
    Then the response time should be less than 200ms for 95% of requests
    And the response time should be less than 500ms for 99% of requests
    And the response status should be 200
    And the response should contain expected data

  Scenario: Content API query performance
    Given the content collection contains 1000+ documents
    When I send a GET request to "/api/_content/query/docs/getting-started"
    Then the response time should be less than 150ms
    And memory usage should not increase significantly
    And the response should be served from cache if applicable
    And database query time should be optimized

  Scenario: Raw markdown serving performance
    When I send a GET request to "/raw/docs/large-document.md"
    Then the response time should be less than 300ms for files under 1MB
    And the response time should be less than 1000ms for files under 10MB
    And file streaming should be used for large files
    And memory usage should remain constant regardless of file size

  Scenario: Concurrent request handling
    When I send 50 concurrent requests to "/api/_content/query"
    Then all requests should complete within 2000ms
    And at least 95% of requests should have status 200
    And response times should not degrade significantly under load
    And the server should remain responsive to new requests

  Scenario: Database query optimization
    Given complex content queries with multiple filters
    When I send a GET request to "/api/_content/query" with query parameters:
      | parameter | value                    |
      | where     | tags:$in:tutorial,guide  |
      | sort      | date:desc                |
      | limit     | 20                       |
    Then the response time should be less than 400ms
    And database query execution should be optimized
    And appropriate indexes should be utilized
    And query plans should be efficient

  Scenario: Memory usage under load
    Given baseline memory usage is measured
    When I send 200 requests over 30 seconds to various API endpoints
    Then memory usage should not increase by more than 50MB
    And garbage collection should occur regularly
    And memory leaks should not be present
    And memory should return to baseline after load

  Scenario: Cache effectiveness
    Given API responses are cacheable
    When I send the same request to "/api/_content/query/docs/intro" multiple times
    Then the first request should establish cache
    And subsequent requests should be served from cache
    And cached responses should be faster than 50ms
    And cache hit ratio should be above 80% for repeated requests

  Scenario: API response compression
    When I send a GET request with "Accept-Encoding: gzip" header
    To "/api/_content/query" expecting large response
    Then the response should be compressed with gzip
    And compressed response should be significantly smaller
    And decompression should not impact client performance
    And compression ratio should be better than 3:1 for JSON

  Scenario: Static asset serving performance
    When I send requests for static assets through the API
    Then response times should be less than 100ms for assets under 1MB
    And appropriate cache headers should be set
    And ETag headers should be provided for cache validation
    And 304 Not Modified responses should be served when appropriate

  Scenario: Error response performance
    When I send requests that result in various error conditions
    Then error responses should be faster than 100ms
    And error handling should not consume excessive resources
    And error logging should not impact response times
    And error responses should be lightweight

  Scenario: Load testing sustainability
    When I maintain 100 requests per second for 5 minutes
    Then the system should sustain the load without degradation
    And response times should remain within acceptable limits
    And error rates should stay below 1%
    And system resources should remain stable

  Scenario: Scalability under increasing load
    When I gradually increase concurrent users from 10 to 500
    Then response times should scale predictably
    And throughput should increase proportionally with resources
    And system should not experience sudden performance cliffs
    And graceful degradation should occur before system limits

  Scenario: Database connection pool performance
    Given database connection pooling is configured
    When concurrent requests require database access
    Then connection acquisition should be faster than 10ms
    And connection pool should not become a bottleneck
    And connection reuse should be efficient
    And pool exhaustion should be handled gracefully

  Scenario: Content search performance
    Given a large content collection with search functionality
    When I send search queries to "/api/_content/query" with text search
    Then search response times should be less than 800ms
    And search results should be ranked by relevance
    And search indexing should be optimized
    And fuzzy search should perform within acceptable limits

  Scenario: Performance monitoring and alerting
    Given performance thresholds are configured
    When API response times exceed defined thresholds
    Then monitoring alerts should be triggered
    And performance metrics should be collected continuously
    And degradation patterns should be identifiable
    And automated remediation should be considered