Feature: Typing Tutor Performance
  As a developer maintaining the typing tutor
  I want to ensure the application performs well under various conditions
  So that users have a smooth and responsive experience

  Scenario: Fast typing response time
    Given I am on the typing tutor page
    When I type at 10ms intervals between keystrokes
    Then each keystroke should be processed within 16ms
    And the UI should remain responsive throughout

  Scenario: Memory usage during long sessions
    Given I am on the typing tutor page
    When I complete 10 consecutive exercises
    Then the memory usage should not increase significantly
    And there should be no memory leaks detected

  Scenario: Large text handling
    Given the practice text contains 1000 characters
    When I start typing the text
    Then the character highlighting should work efficiently
    And the performance should remain consistent

  Scenario: Rapid corrections
    Given I am typing practice text
    When I make rapid corrections using backspace
    Then each correction should be processed smoothly
    And the accuracy calculation should remain accurate