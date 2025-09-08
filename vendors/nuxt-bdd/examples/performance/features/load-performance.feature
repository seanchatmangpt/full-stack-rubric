@performance @load
Feature: Load Performance Testing
  As a developer
  I want to ensure the application performs well under load
  So that users have a smooth experience during peak usage

  Background:
    Given the application is deployed and running
    And performance monitoring is enabled

  @load @critical
  Scenario: Homepage load performance under normal traffic
    Given the homepage is accessible
    When 100 concurrent users visit the homepage
    Then the average response time should be less than 500ms
    And the 95th percentile response time should be less than 1000ms
    And no errors should occur
    And memory usage should remain stable

  @load @api
  Scenario: API endpoint performance under load
    Given the API endpoints are available
    When I send 500 requests per second to "/api/users" for 30 seconds
    Then the average response time should be less than 200ms
    And the error rate should be less than 1%
    And the throughput should be at least 450 requests per second
    And CPU usage should remain below 80%

  @stress @critical
  Scenario: Application behavior under stress conditions
    Given the application is running normally
    When I gradually increase load from 1 to 1000 concurrent users over 10 minutes
    Then the application should continue responding
    And response times should degrade gracefully
    And no memory leaks should be detected
    And the application should recover when load decreases

  @benchmark @comparison
  Scenario: Performance comparison with baseline
    Given I have baseline performance metrics
    When I run the current application under standard load
    Then the performance should not regress more than 10% from baseline
    And core web vitals should meet performance budgets:
      | metric | threshold |
      | LCP    | < 2.5s    |
      | FID    | < 100ms   |
      | CLS    | < 0.1     |

  @performance @database
  Scenario: Database query performance under concurrent access
    Given there are 10000 records in the users table
    When 50 concurrent users perform complex queries simultaneously
    Then each query should complete within 1000ms
    And database connection pool should remain healthy
    And no deadlocks should occur
    And query execution plans should remain optimal