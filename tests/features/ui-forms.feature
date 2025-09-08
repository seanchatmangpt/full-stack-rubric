Feature: Form Validation and Interactions
  As a user
  I want forms to provide clear feedback and validation
  So that I can successfully submit accurate information

  Background:
    Given I am on a page with form elements

  @forms @text-input
  Scenario: Text input field validation
    Given I see a required text input field labeled "Username"
    When I focus on the field and then leave it empty
    Then I should see a validation error message "Username is required"
    When I enter "ab" which is below minimum length
    Then I should see "Username must be at least 3 characters long"
    When I enter a valid username "john_doe"
    Then the error message should disappear
    And the field should show valid state styling

  @forms @email-validation
  Scenario Outline: Email field validation
    Given I see an email input field
    When I enter "<email_input>" in the email field
    Then I should see "<validation_result>"
    And the field should have "<visual_state>" styling

    Examples:
      | email_input           | validation_result              | visual_state |
      |                       | Email is required              | error        |
      | invalid-email         | Please enter a valid email     | error        |
      | test@                 | Please enter a valid email     | error        |
      | test@example.com      | (no error message)             | valid        |
      | user+tag@domain.co.uk | (no error message)             | valid        |

  @forms @password-strength
  Scenario: Password strength validation
    Given I see a password input field with strength indicator
    When I enter "123" as password
    Then the strength indicator should show "Weak"
    And I should see "Password must be at least 8 characters"
    When I enter "password123"
    Then the strength indicator should show "Medium"
    When I enter "StrongP@ssw0rd!"
    Then the strength indicator should show "Strong"
    And all validation requirements should be met

  @forms @real-time-validation
  Scenario: Real-time validation feedback
    Given I have a form with multiple validation rules
    When I start typing in a field
    Then validation should occur as I type (debounced)
    And I should see immediate feedback for format errors
    But I should not see "required" errors until I leave the field
    When I correct the input
    Then error messages should disappear immediately

  @forms @form-submission
  Scenario: Form submission with validation
    Given I have a form with required fields
    When I click the submit button without filling required fields
    Then the form should not submit
    And all validation errors should be displayed
    And focus should move to the first invalid field
    When I correct all validation errors
    And click submit again
    Then the form should submit successfully

  @forms @mobile-forms
  Scenario: Form behavior on mobile devices
    Given I am using a mobile browser with viewport "375x667"
    When I interact with form fields
    Then the appropriate mobile keyboard should appear
    And the viewport should not zoom when focusing inputs
    And form fields should be appropriately sized for touch
    And validation messages should be clearly visible

  @forms @accessibility
  Scenario: Form accessibility features
    Given I am using screen reader technology
    When I navigate through form fields
    Then each field should have proper labels
    And error messages should be announced
    And required fields should be indicated
    And field relationships should be clear
    When validation errors occur
    Then they should be associated with the correct fields

  @forms @multi-step-forms
  Scenario: Multi-step form navigation
    Given I have a multi-step form with 3 steps
    When I complete step 1 and click "Next"
    Then I should advance to step 2
    And my step 1 data should be preserved
    When I click "Back" from step 2
    Then I should return to step 1
    And my entered data should still be there
    When I try to skip to step 3 without completing step 2
    Then I should not be allowed to advance

  @forms @file-upload
  Scenario: File upload functionality
    Given I see a file upload field
    When I drag and drop a valid file onto the upload area
    Then the file should be accepted
    And I should see upload progress indicator
    When the upload completes
    Then I should see confirmation and file preview
    When I try to upload an invalid file type
    Then I should see an appropriate error message

  @forms @auto-save
  Scenario: Form auto-save functionality
    Given I am filling out a long form
    When I enter data in multiple fields
    Then my progress should be automatically saved periodically
    When I accidentally refresh the page
    Then my entered data should be restored
    And I should see a notification about restored data

  @forms @conditional-fields
  Scenario: Conditional field display
    Given I have a form with conditional logic
    When I select "Yes" for "Do you have experience?"
    Then additional experience-related fields should appear
    And those fields should become required
    When I change my selection to "No"
    Then the additional fields should be hidden
    And their validation requirements should be removed

  @forms @character-limits
  Scenario: Character limit enforcement and display
    Given I have a textarea with a 100 character limit
    When I start typing
    Then I should see a character counter "0/100"
    When I reach 90 characters
    Then the counter should show warning styling "90/100"
    When I try to type beyond 100 characters
    Then additional characters should not be accepted
    And the counter should show error styling "100/100"

  @forms @form-reset
  Scenario: Form reset functionality
    Given I have filled out several form fields
    When I click the "Reset" button
    Then I should see a confirmation dialog
    When I confirm the reset
    Then all fields should return to their default state
    And all validation errors should be cleared

  @forms @keyboard-navigation
  Scenario: Form keyboard navigation
    Given I am using keyboard navigation on a form
    When I press "Tab" repeatedly
    Then focus should move through fields in logical order
    And I should skip disabled or hidden fields
    When I reach a checkbox group
    Then arrow keys should navigate between options
    When I reach the submit button and press "Enter"
    Then the form should submit

  @forms @error-summary
  Scenario: Form error summary for accessibility
    Given I have a complex form with multiple validation errors
    When I submit the form with errors
    Then I should see an error summary at the top
    And the error summary should list all validation errors
    And each error should link to the relevant field
    When I click on an error in the summary
    Then focus should move to that field

  @forms @inline-editing
  Scenario: Inline form editing
    Given I see a data table with editable fields
    When I double-click on a cell
    Then it should become editable
    And I should see appropriate input controls
    When I press "Enter" or click outside
    Then changes should be saved
    When I press "Escape"
    Then changes should be cancelled

  @forms @dynamic-forms
  Scenario: Dynamic form field addition and removal
    Given I have a form section for "Skills"
    When I click "Add Skill"
    Then a new skill input field should appear
    And it should have proper validation
    When I click the remove button next to a skill
    Then that skill field should be removed
    And form validation should update accordingly

  @forms @cross-device-persistence
  Scenario: Form data persistence across devices
    Given I start filling a form on my desktop
    When I save as draft
    And later access the same form on my mobile device
    Then my draft data should be available
    And I should be able to continue where I left off
    And the mobile form should work properly with the restored data