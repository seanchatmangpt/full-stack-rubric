Feature: User Authentication
  As a user of the application
  I want to authenticate securely
  So that I can access protected features and maintain my session

  Background:
    Given the authentication service is available
    And I am not currently logged in

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter valid email "user@example.com"
    And I enter valid password "securePassword123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see my user profile in the navigation
    And my session should be established
    And I should see a welcome message

  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I enter invalid email "wrong@example.com"
    And I enter invalid password "wrongPassword"
    And I click the login button
    Then I should remain on the login page
    And I should see an error message "Invalid credentials"
    And the password field should be cleared
    And the email field should retain its value
    And no session should be established

  Scenario Outline: Form validation for login fields
    Given I am on the login page
    When I enter "<email>" in the email field
    And I enter "<password>" in the password field
    And I attempt to submit the form
    Then I should see "<error_message>"
    And the form should not be submitted

    Examples:
      | email              | password    | error_message                    |
      |                    | password123 | Email is required                |
      | invalid-email      | password123 | Please enter a valid email       |
      | user@example.com   |            | Password is required             |
      | user@example.com   | 123        | Password must be at least 6 chars|

  Scenario: Remember me functionality
    Given I am on the login page
    When I enter valid credentials
    And I check the "Remember me" checkbox
    And I submit the login form
    Then I should be logged in
    And my session should persist after browser restart
    
    When I close and reopen the browser
    And I visit the application
    Then I should still be logged in
    And I should not need to enter credentials again

  Scenario: Logout functionality
    Given I am logged in as "user@example.com"
    When I click the user menu
    And I click the logout button
    Then I should be redirected to the home page
    And my session should be cleared
    And I should no longer see my user profile
    And accessing protected routes should redirect to login

  Scenario: Session timeout handling
    Given I am logged in
    And my session is about to expire
    When I make a request to the server
    Then I should see a session timeout warning
    And I should have options to extend or end the session
    
    When I choose to extend the session
    Then my session should be renewed
    And I should remain logged in
    
    When I choose to end the session
    Then I should be logged out
    And redirected to the login page

  Scenario: Password reset workflow
    Given I am on the login page
    When I click "Forgot Password"
    Then I should be taken to the password reset page
    
    When I enter my email "user@example.com"
    And I submit the password reset form
    Then I should see a confirmation message
    And a password reset email should be sent
    
    When I click the reset link in the email
    Then I should be taken to the new password page
    And I should be able to set a new password
    
    When I set a new password
    And confirm the password
    Then my password should be updated
    And I should be able to login with the new password

  Scenario: Account lockout after failed attempts
    Given I am on the login page
    When I enter invalid credentials 5 times
    Then my account should be temporarily locked
    And I should see a lockout message
    And I should not be able to login even with valid credentials
    
    When I wait for the lockout period to expire
    Then I should be able to attempt login again
    And valid credentials should work normally

  Scenario: Social authentication integration
    Given I am on the login page
    When I click "Login with Google"
    Then I should be redirected to Google's authentication
    
    When I complete Google authentication successfully
    Then I should be redirected back to the application
    And I should be logged in
    And my profile should be populated from Google
    
    When I logout and return
    Then I should see "Login with Google" as an option
    And I should be able to use regular credentials if I have them