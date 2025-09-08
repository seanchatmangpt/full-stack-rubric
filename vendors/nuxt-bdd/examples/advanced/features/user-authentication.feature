@smoke @authentication
Feature: User Authentication
  As a user
  I want to authenticate with the application
  So that I can access protected features

  Background:
    Given the authentication API is available
    And I have a clean browser session

  @smoke
  Scenario: Successful login with valid credentials
    Given I am on the login page
    And I have valid user credentials
    When I enter my username "john.doe@example.com"
    And I enter my password "SecurePass123!"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message with my name
    And my session should be authenticated

  @smoke  
  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I enter my username "invalid@example.com"
    And I enter my password "wrongpassword"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page
    And my session should not be authenticated

  @regression
  Scenario Outline: Password validation requirements
    Given I am on the login page
    When I enter my username "user@example.com"
    And I enter my password "<password>"
    And I click the login button
    Then I should see a validation message "<message>"

    Examples:
      | password | message |
      | 123      | Password must be at least 8 characters |
      | password | Password must contain at least one number |
      | 12345678 | Password must contain at least one letter |
      
  @security
  Scenario: Session timeout after inactivity
    Given I am logged in as "john.doe@example.com"
    And I have been inactive for 30 minutes
    When I try to access a protected page
    Then I should be redirected to the login page
    And I should see a message "Your session has expired"

  @security
  Scenario: Logout functionality
    Given I am logged in as "john.doe@example.com"
    And I am on the dashboard page
    When I click the logout button
    Then I should be redirected to the homepage
    And my session should be terminated
    And attempting to access protected pages should redirect to login