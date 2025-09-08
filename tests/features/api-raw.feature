Feature: Raw Markdown Serving API
  As a content consumer
  I want to retrieve raw markdown files through API endpoints
  So that I can access original markdown content for processing or display

  Background:
    Given the raw markdown API service is running
    And markdown documents exist in the content collection
    And I have proper API access to raw endpoints

  Scenario: Serve raw markdown file
    Given a markdown document exists at "/docs/getting-started.md"
    When I send a GET request to "/raw/docs/getting-started.md"
    Then the response status should be 200
    And the response time should be less than 300ms
    And the response content-type should be "text/markdown; charset=utf-8"
    And the response should contain raw markdown content
    And the content should include proper markdown syntax

  Scenario: Markdown file with front matter
    Given a markdown document with YAML front matter exists
    When I send a GET request to "/raw/docs/example.md"
    Then the response status should be 200
    And the response content-type should be "text/markdown; charset=utf-8"
    And the response should include a generated title header
    And the response should include a description blockquote
    And the original content should follow the metadata

  Scenario: Non-existent markdown file
    When I send a GET request to "/raw/docs/nonexistent.md"
    Then the response status should be 404
    And the response time should be less than 200ms
    And the response should contain "Page not found" message
    And the error should be properly formatted

  Scenario: Invalid file extension request
    When I send a GET request to "/raw/docs/example.txt"
    Then the response status should be 404
    And the response time should be less than 150ms
    And the response should indicate the file was not found
    And the error should specify invalid extension handling

  Scenario: Deeply nested markdown file
    Given a markdown document exists at "/docs/advanced/features/complex.md"
    When I send a GET request to "/raw/docs/advanced/features/complex.md"
    Then the response status should be 200
    And the response content-type should be "text/markdown; charset=utf-8"
    And the path resolution should work correctly for nested structures
    And the content should be properly served

  Scenario: Large markdown file handling
    Given a large markdown document exists (>1MB)
    When I send a GET request to "/raw/docs/large-document.md"
    Then the response status should be 200
    And the response time should be less than 2000ms
    And the entire content should be served correctly
    And memory usage should remain within acceptable limits

  Scenario: Markdown file with special characters
    Given a markdown document with Unicode and special characters exists
    When I send a GET request to "/raw/docs/unicode-content.md"
    Then the response status should be 200
    And the response content-type should include "charset=utf-8"
    And special characters should be properly encoded
    And Unicode content should display correctly

  Scenario: Concurrent raw markdown requests
    Given multiple markdown documents exist
    When I send 10 concurrent requests to different "/raw/" endpoints
    Then all responses should have status 200
    And all response times should be less than 500ms
    And each response should contain correct markdown content
    And no content should be corrupted or mixed

  Scenario: Raw markdown caching behavior
    Given a markdown document exists and caching is enabled
    When I send a GET request to "/raw/docs/cached-example.md"
    And I immediately send the same request again
    Then both responses should have status 200
    And the second response should be served from cache
    And cache headers should be properly set
    And content should remain consistent

  Scenario: Markdown file modification detection
    Given a markdown document exists and is cached
    When the document is modified on the server
    And I send a GET request to "/raw/" for that document
    Then the response should reflect the updated content
    And cache should be invalidated if present
    And the new content should be served correctly

  Scenario: Path traversal security
    When I send a GET request to "/raw/../../../etc/passwd.md"
    Then the response status should be 404
    And the system should prevent path traversal attacks
    And no sensitive files should be accessible
    And security logs should record the attempt

  Scenario: Missing required extension
    When I send a GET request to "/raw/docs/example"
    Then the response status should be 404
    And the response should indicate missing .md extension requirement
    And the error message should be user-friendly
    And no content should be served without proper extension