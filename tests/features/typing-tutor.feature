Feature: Typing Tutor Application
  As a user who wants to improve typing skills
  I want to practice typing with real-time feedback
  So that I can track my progress and improve my speed and accuracy

  Background:
    Given I am on the typing tutor page
    And I can see the practice text
    And I can see the typing statistics showing 0 WPM and 100% accuracy

  Scenario: Basic typing functionality
    When I start typing the displayed text
    Then the characters I type correctly should be highlighted in green
    And the characters I type incorrectly should be highlighted in red
    And the current character position should be highlighted

  Scenario: WPM calculation
    Given the practice text is "Hello World"
    When I type "Hello World" in exactly 60 seconds
    Then the WPM should be calculated as 2
    And the WPM display should update in real-time

  Scenario: Accuracy tracking
    Given the practice text is "Hello World"
    When I type "Helo World" (with one error)
    Then the accuracy should be approximately 90.9%
    And the errors count should show 1

  Scenario: Progress tracking
    Given the practice text is "Hello World"
    When I type "Hello"
    Then the progress bar should show approximately 45% completion
    And the progress percentage should be displayed

  Scenario: Exercise completion
    Given the practice text is "Hello World"
    When I complete typing the entire text correctly
    Then a completion modal should appear
    And it should display my final WPM and accuracy
    And I should see options to try another exercise or close

  Scenario: Rapid typing performance
    Given the practice text is "The quick brown fox"
    When I type very rapidly with 10ms between keystrokes
    Then the application should remain responsive
    And all statistics should update correctly
    And no performance degradation should occur

  Scenario: Error correction
    Given I have typed some text with errors
    When I use backspace to correct mistakes
    Then the highlighting should update correctly
    And the accuracy should recalculate properly
    And the progress should adjust accordingly

  Scenario: Exercise switching
    Given I have completed an exercise
    When I click "Next Exercise"
    Then a new practice text should be displayed
    And all statistics should reset to initial values
    And I should be able to start typing the new text

  Scenario: Reset functionality
    Given I am in the middle of typing an exercise
    When I click the "Reset" button
    Then all input should be cleared
    And statistics should reset to initial values
    And I should be able to start fresh with the same text