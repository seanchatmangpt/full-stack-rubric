Feature: Content API Endpoints
  As an API consumer
  I want to retrieve content through API endpoints
  So that I can access structured content data for applications

  Background:
    Given the content API service is running
    And the content collection contains sample documents
    And I have proper API access

  Scenario: Retrieve content collection listing
    When I send a GET request to "/api/_content/query"
    Then the response status should be 200
    And the response time should be less than 500ms
    And the response content-type should be "application/json"
    And the response should contain a valid JSON array
    And each item should have "_path", "title", and "_id" fields

  Scenario: Get specific content by path
    Given a document exists at path "/docs/getting-started"
    When I send a GET request to "/api/_content/query/docs/getting-started"
    Then the response status should be 200
    And the response time should be less than 300ms
    And the response content-type should be "application/json"
    And the response should contain the document data
    And the document should have "title", "description", and "body" fields

  Scenario: Content query with filters
    When I send a GET request to "/api/_content/query" with query parameters:
      | parameter | value              |
      | where     | path:/docs         |
      | limit     | 5                  |
      | sort      | _path              |
    Then the response status should be 200
    And the response time should be less than 400ms
    And the response should contain maximum 5 items
    And all items should have paths starting with "/docs"
    And items should be sorted by "_path" field

  Scenario: Content not found error
    When I send a GET request to "/api/_content/query/nonexistent/path"
    Then the response status should be 404
    And the response time should be less than 200ms
    And the response content-type should be "application/json"
    And the response should contain an error message
    And the error message should indicate "not found"

  Scenario: Content search functionality
    Given documents contain searchable text content
    When I send a GET request to "/api/_content/query" with query parameters:
      | parameter | value         |
      | where     | $search:typing|
    Then the response status should be 200
    And the response time should be less than 600ms
    And all returned documents should contain "typing" in content or metadata
    And search results should be relevance-ordered

  Scenario: Content with metadata extraction
    Given a document exists with front matter metadata
    When I send a GET request to "/api/_content/query" for that document
    Then the response status should be 200
    And the response should include front matter data
    And metadata should include "date", "tags", and "category" if present
    And content body should be properly parsed

  Scenario: API response caching
    Given content API responses are cached
    When I send a GET request to "/api/_content/query/docs/introduction"
    And I immediately send the same request again
    Then both responses should have status 200
    And the second response should be faster than 100ms
    And both responses should contain identical data
    And cache headers should be properly set

  Scenario: Content API pagination
    Given there are more than 10 documents in the collection
    When I send a GET request to "/api/_content/query" with query parameters:
      | parameter | value |
      | limit     | 3     |
      | skip      | 6     |
    Then the response status should be 200
    And the response should contain exactly 3 items
    And the response should skip the first 6 items
    And pagination metadata should be included

  Scenario: Malformed query handling
    When I send a GET request to "/api/_content/query" with invalid query parameters:
      | parameter | value           |
      | where     | invalid:syntax  |
      | limit     | not-a-number    |
    Then the response status should be 400
    And the response time should be less than 200ms
    And the response should contain validation error details
    And the error should specify which parameters are invalid

  Scenario: Content API rate limiting
    When I send 100 rapid requests to "/api/_content/query"
    Then most responses should have status 200
    And some responses may have status 429 if rate limited
    And rate-limited responses should include retry-after header
    And the API should recover within acceptable time limits