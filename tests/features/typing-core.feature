Feature: Typing Core Mechanics
  As a user learning to type
  I want to practice typing exercises
  So that I can improve my typing skills

  Background:
    Given I am on the typing tutor page
    And a coding exercise is loaded

  Scenario: Starting a typing exercise
    When I click in the typing area
    And I start typing the first character
    Then the timer should start
    And my typing progress should be tracked
    And the cursor position should be highlighted in the target text

  Scenario: Typing correct characters
    Given I have started typing
    When I type a character that matches the target text
    Then the character should be highlighted in green
    And my accuracy should remain high
    And the cursor should advance to the next character

  Scenario: Typing incorrect characters
    Given I have started typing
    When I type a character that doesn't match the target text
    Then the character should be highlighted in red
    And my error count should increase
    And my accuracy should decrease
    And the cursor should still advance

  Scenario: Using backspace to correct mistakes
    Given I have typed some incorrect characters
    When I press backspace
    Then the last character should be removed from my input
    And the cursor should move back in the target text
    And I can retype the character correctly

  Scenario: Handling special characters
    Given the target text contains special characters like brackets and quotes
    When I type those special characters correctly
    Then they should be highlighted in green
    And my accuracy should be maintained

  Scenario: Handling tab characters
    Given the target text contains indentation
    When I press the Tab key
    Then two spaces should be inserted
    And the tab should not change focus away from the typing area
    And the spaces should match the target indentation

  Scenario: Completing an exercise
    Given I have typed most of the exercise
    When I type the final character correctly
    And my input exactly matches the target text
    Then the exercise should be marked as complete
    And a completion modal should appear
    And the typing area should be disabled

  Scenario: Preventing typing beyond the target text
    Given I have completed the exercise
    When I try to type additional characters
    Then no additional characters should be accepted
    And the typing area should remain disabled

  Scenario: Resetting an exercise
    Given I have started typing an exercise
    When I click the "Reset" button
    Then my input should be cleared
    And the timer should be reset
    And the error count should be reset to zero
    And I can start typing again

  Scenario: Exercise text formatting preservation
    Given the target text contains newlines and indentation
    When the exercise is displayed
    Then the formatting should be preserved
    And the monospace font should be used
    And the text should be readable with proper syntax highlighting