Feature: Real-time Typing Feedback
  As a user practicing typing
  I want to receive immediate visual feedback on my typing
  So that I can correct mistakes and improve my accuracy in real-time

  Background:
    Given I am on the typing tutor page
    And a coding exercise with the text "const greeting = 'Hello World';" is loaded

  Scenario: Visual feedback for correct characters
    Given I have started typing
    When I type "c" correctly
    Then the "c" in the target text should be highlighted in green
    And the next character "o" should be highlighted with a cursor indicator
    And the visual feedback should appear instantly

  Scenario: Visual feedback for incorrect characters
    Given I have started typing
    When I type "x" instead of "c"
    Then the "c" in the target text should be highlighted in red
    And the next character "o" should still be highlighted with a cursor indicator
    And the incorrect character should be visually distinct

  Scenario: Cursor position indicator
    Given I have typed "const" correctly
    When I am about to type the next character
    Then the space character should be highlighted with a blue background
    And only one character should have the cursor indicator at a time
    And the cursor should advance as I type

  Scenario: Mixed correct and incorrect feedback
    Given I have started typing
    When I type "xonst" (first letter wrong, rest correct)
    Then the first "c" should be highlighted in red
    And the "o", "n", "s", "t" should be highlighted in green
    And the cursor should be on the space character

  Scenario: Real-time error highlighting
    Given I am typing the word "greeting"
    When I type "greating" (with an extra "a")
    Then each character should be colored as I type it
    And incorrect characters should immediately show in red
    And correct characters should immediately show in green
    And the highlighting should not lag behind my typing

  Scenario: Feedback during backspace corrections
    Given I have typed "xonst" with the first character wrong
    When I backspace to remove the "x"
    Then the red highlighting should be removed from that position
    And the cursor indicator should move back to the first character
    And I should be able to see where to type the correct character

  Scenario: Whitespace and special character feedback
    Given the target text contains spaces, equals signs, and quotes
    When I type these special characters correctly
    Then spaces should be highlighted (though less visibly)
    And quotes and equals signs should be highlighted in green
    And special characters should receive the same feedback treatment

  Scenario: Newline and indentation feedback
    Given the target text contains newlines and indentation
    When I press Enter to create a new line
    Then the newline should be highlighted as correct
    And the cursor should move to the beginning of the next line
    And indentation spaces should be highlighted as I type them

  Scenario: Error count visual update
    Given I have made some typing errors
    When my error count increases
    Then the error count display should update immediately
    And the error count should be visually prominent (red color)
    And each new error should increment the count in real-time

  Scenario: Accuracy percentage visual feedback
    Given I am typing and making some mistakes
    When my accuracy drops below 95%
    Then the accuracy percentage should update in real-time
    And accuracy should be color-coded (green for good accuracy)
    And the percentage should be calculated and displayed immediately

  Scenario: Progress bar visual feedback
    Given I am typing through the exercise
    When I reach 50% completion
    Then the progress bar should fill to 50%
    And the progress bar should animate smoothly
    And the animation should have a 300ms transition duration

  Scenario: Completion visual feedback
    Given I am nearing the end of the exercise
    When I type the final character correctly
    Then all characters should be highlighted in green
    And the completion modal should appear immediately
    And the typing area should be visually disabled

  Scenario: Color accessibility
    Given I am using the typing tutor
    When viewing the color-coded feedback
    Then green should be used for correct characters
    And red should be used for incorrect characters
    And blue should be used for the cursor position
    And the colors should have sufficient contrast for accessibility

  Scenario: Font and typography feedback
    Given the typing exercise is displayed
    When viewing the target text
    Then a monospace font should be used for alignment
    And the font size should be large enough to read easily (18px or larger)
    And the text should have proper line spacing
    And code formatting should be preserved