Feature: Welcome Page
  As a user
  I want to see a welcome message
  So that I know the application is working

  Background:
    Given I am on the homepage

  Scenario: Display welcome message
    When I visit the homepage
    Then I should see the Nuxt welcome page
    And the page should have a title

  Scenario: Page loads successfully
    When I visit the homepage
    Then the page should load without errors
    And the response status should be 200