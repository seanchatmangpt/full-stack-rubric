@api @integration
Feature: API Integration
  As a developer
  I want to test API endpoints
  So that I can ensure data flows correctly between frontend and backend

  Background:
    Given the API server is running
    And I have a test database with sample data

  @smoke @api
  Scenario: Fetch user list from API
    Given there are 5 users in the database
    When I make a GET request to "/api/users"
    Then the response status should be 200
    And the response should contain 5 users
    And each user should have required fields:
      | id       |
      | name     |
      | email    |
      | created_at |

  @api @crud
  Scenario: Create new user via API
    Given I have user data:
      | name          | email              | role  |
      | Alice Johnson | alice@example.com  | user  |
    When I make a POST request to "/api/users" with the user data
    Then the response status should be 201
    And the response should contain the created user
    And the user should be saved in the database
    And the user should have a generated ID

  @api @validation
  Scenario: API validation for invalid user data
    Given I have invalid user data:
      | name | email        | role |
      |      | invalid-email| admin|
    When I make a POST request to "/api/users" with the invalid data
    Then the response status should be 400
    And the response should contain validation errors:
      | field | message                    |
      | name  | Name is required          |
      | email | Email format is invalid   |
      | role  | Invalid role specified    |

  @api @performance
  Scenario: API response time performance
    Given there are 1000 users in the database
    When I make a GET request to "/api/users?limit=10&offset=0"
    Then the response should return within 500ms
    And the response should contain exactly 10 users
    And the response should include pagination metadata

  @api @error-handling
  Scenario: Handle database connection errors gracefully
    Given the database is unavailable
    When I make a GET request to "/api/users"
    Then the response status should be 503
    And the response should contain error message "Service temporarily unavailable"
    And the error should be logged appropriately