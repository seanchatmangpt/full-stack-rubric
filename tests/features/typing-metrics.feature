Feature: Typing Metrics and Statistics
  As a user practicing typing
  I want to see my typing performance metrics
  So that I can track my improvement over time

  Background:
    Given I am on the typing tutor page
    And a coding exercise is loaded

  Scenario: Initial metrics display
    Given I have not started typing yet
    Then the WPM should show "0"
    And the accuracy should show "100.0%"
    And the error count should show "0"
    And the progress should show "0% complete"

  Scenario: WPM calculation during typing
    Given I have started typing
    When I type "const message = " in 10 seconds
    Then the WPM should be calculated based on words per minute
    And the WPM should update in real-time as I type
    And the WPM should be rounded to the nearest whole number

  Scenario: Accuracy calculation with correct typing
    Given I have started typing
    When I type 20 characters correctly without errors
    Then the accuracy should remain at "100.0%"
    And the accuracy should be displayed with one decimal place

  Scenario: Accuracy calculation with errors
    Given I have started typing
    When I type 18 characters correctly and 2 characters incorrectly
    Then the accuracy should show "90.0%"
    And the accuracy should update immediately after each keystroke

  Scenario: Error counting
    Given I have started typing
    When I type 5 incorrect characters during the exercise
    Then the error count should show "5"
    And the error count should not decrease when I backspace
    And the error count should only count currently visible errors

  Scenario: Progress tracking
    Given the target text has 100 characters
    When I have typed 50 characters
    Then the progress should show "50% complete"
    And the progress bar should be 50% filled
    And the progress should not exceed 100% even if I type extra characters

  Scenario: Final metrics calculation
    Given I have completed an exercise
    And it took me 2 minutes to complete 240 characters
    When the completion modal appears
    Then the final WPM should be calculated based on the total time
    And the final accuracy should match the accuracy at completion
    And the metrics should be preserved until reset

  Scenario: Metrics during exercise reset
    Given I have been typing and accumulated some metrics
    When I click the "Reset" button
    Then the WPM should reset to "0"
    And the accuracy should reset to "100.0%"
    And the error count should reset to "0"
    And the progress should reset to "0% complete"
    And the timer should be reset

  Scenario: Real-time WPM updates
    Given I am typing continuously
    When I maintain a steady typing speed
    Then the WPM should update smoothly every few keystrokes
    And the WPM should reflect my current typing speed
    And sudden pauses should cause the WPM to decrease

  Scenario: Accuracy with backspace corrections
    Given I have typed "const mesage = " (with a typo)
    And my accuracy has dropped due to the typo
    When I backspace and correct it to "const message = "
    Then the accuracy should improve to reflect the correction
    And the error count should reflect only current errors in the text

  Scenario: Progress bar visual feedback
    Given I am typing an exercise
    When my progress increases from 25% to 75%
    Then the progress bar should animate smoothly
    And the progress bar should use a blue color
    And the transition should take 300ms

  Scenario: Metrics precision and formatting
    Given I am viewing the metrics during typing
    Then the WPM should be displayed as a whole number
    And the accuracy should be displayed with exactly one decimal place
    And the error count should be displayed as a whole number
    And the progress should be displayed as a whole number percentage