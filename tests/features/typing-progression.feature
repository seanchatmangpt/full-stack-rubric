Feature: Difficulty Progression and Exercise Management
  As a user learning to type code
  I want to progress through exercises of increasing difficulty
  So that I can gradually improve my coding typing skills

  Background:
    Given I am on the typing tutor page
    And multiple exercises are available with different difficulty levels

  Scenario: Initial exercise selection
    Given I am starting the typing tutor for the first time
    When the page loads
    Then the first exercise should be loaded automatically
    And it should be a "Basic JavaScript" exercise
    And it should be marked as "easy" difficulty
    And the exercise code should be displayed in the target area

  Scenario: Exercise difficulty levels
    Given there are multiple exercises available
    When I review the available exercises
    Then there should be "easy" exercises with basic syntax
    And there should be "medium" exercises with more complex code
    And there should be "hard" exercises with advanced patterns
    And each exercise should have a clear difficulty indicator

  Scenario: Progressing to next exercise
    Given I have completed the current exercise successfully
    When I click the "Next Exercise" button
    Then the next exercise in the sequence should load
    And the target text should update to the new exercise
    And all metrics should reset for the new exercise
    And the exercise title and description should update

  Scenario: Next button availability
    Given I am working on an exercise
    When the exercise is not yet complete
    Then the "Next Exercise" button should be disabled
    And when I complete the exercise
    Then the "Next Exercise" button should become enabled

  Scenario: Exercise cycling
    Given I have completed all available exercises
    When I click "Next Exercise" on the last exercise
    Then the system should cycle back to the first exercise
    And I should be able to practice exercises repeatedly
    And the cycling should be seamless

  Scenario: Exercise categories
    Given exercises are organized by programming concepts
    When I view the available exercises
    Then there should be exercises for "javascript" category
    And exercises should cover "variables and functions"
    And exercises should cover "array methods"
    And exercises should cover "async operations"

  Scenario: Exercise content variety
    Given I am practicing different exercises
    When I progress through the exercises
    Then "Basic JavaScript" should include simple variable declarations
    And "Array Methods" should include map, filter, and reduce operations
    And "Async Operations" should include promises and async/await
    And each exercise should represent realistic code patterns

  Scenario: Difficulty progression validation
    Given I start with an easy exercise
    When I progress to the next exercises
    Then the character count should generally increase
    And the code complexity should increase
    And special characters usage should increase
    And indentation complexity should increase

  Scenario: Exercise reset within progression
    Given I am working on any exercise in the progression
    When I click the "Reset" button
    Then only the current exercise should reset
    And my progress through the exercise sequence should be maintained
    And I should remain on the same exercise

  Scenario: Exercise metadata display
    Given an exercise is loaded
    When I view the exercise information
    Then the exercise title should be displayed
    And the difficulty level should be visible
    And the category should be shown
    And a brief description should be available

  Scenario: Completion modal with progression info
    Given I complete an exercise
    When the completion modal appears
    Then it should show my performance metrics
    And it should offer to advance to the next exercise
    And the "Next Exercise" button should be prominently displayed
    And I should be able to close the modal to review my work

  Scenario: Exercise sequence persistence
    Given I have progressed through several exercises
    When I refresh the page or return later
    Then I should start from the beginning of the sequence
    And the exercise order should remain consistent
    And all exercises should still be available

  Scenario: Code language consistency
    Given all exercises in the current set
    When I progress through them
    Then all exercises should use JavaScript syntax
    And the syntax highlighting should be consistent
    And the coding patterns should be language-appropriate

  Scenario: Exercise length variation
    Given exercises of different difficulties
    When I compare their lengths
    Then easy exercises should be 2-3 lines of code
    And medium exercises should be 4-6 lines of code
    And hard exercises should be 7+ lines of code
    And all exercises should be completable in a reasonable time