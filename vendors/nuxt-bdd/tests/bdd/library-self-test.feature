Feature: nuxt-bdd Library Self-Testing
  As a developer using nuxt-bdd
  I want to verify that the BDD library itself works correctly
  So that I can trust it for testing my applications

  Background:
    Given I have the nuxt-bdd library installed
    And the VitestCucumberBridge is initialized

  Scenario: Basic step registration
    Given I have a BDD bridge instance
    When I register a "Given" step with pattern "I have a test user"
    Then the step should be registered in the step registry
    And the step should be callable with vitest-cucumber

  Scenario: Component mounting with BDD context
    Given I have a Vue component for testing
    When I mount the component using the BDD bridge
    Then the component should be mounted successfully
    And the wrapper should be stored in BDD context
    And I should be able to interact with the component

  Scenario: Feature validation
    Given I have a feature file with step definitions
    """
    Feature: Test Feature
      Scenario: Basic Test
        Given I am a user
        When I perform an action
        Then I should see a result
    """
    When I validate the feature against registered steps
    Then the validation should identify missing step definitions
    And I should get a list of steps that need implementation

  Scenario: Step definition generation
    Given I have a feature file with parameterized steps
    """
    Feature: Parameterized Test
      Scenario: User Management
        Given I have a user named "John" with ID 123
        When I update the user's score to 85.5
        Then I should see "User updated successfully"
    """
    When I generate step definitions from the feature
    Then I should get properly formatted step definitions
    And the parameters should be correctly extracted
    And the function names should be generated properly

  Scenario: Performance tracking
    Given I have performance tracking enabled
    When I mount a component and perform operations
    Then memory usage should be tracked
    And render times should be recorded
    And I should be able to retrieve performance metrics

  Scenario: BDD context state management
    Given I have the BDD context initialized
    When I set state values in the context
    And I retrieve the state values
    Then the values should be correctly stored and retrieved
    And the state should persist across step executions

  Scenario: Error handling
    Given I have an invalid step definition
    When I try to register the step
    Then an appropriate error should be thrown
    And the error message should be descriptive

  Scenario: Cleanup functionality
    Given I have components mounted in the BDD context
    And I have state stored in the context
    When I call the cleanup function
    Then all components should be unmounted
    And the context state should be cleared
    And no memory leaks should occur

  Scenario: Integration with vitest-cucumber
    Given I have vitest-cucumber available
    When I register steps using the BDD bridge
    Then the steps should be properly registered with vitest-cucumber
    And the steps should be executable in BDD scenarios

  Scenario Outline: Parameter extraction for different types
    Given I have a step text with parameter: "<step_text>"
    When I parameterize the step
    Then I should get the parameterized version: "<parameterized>"
    And I should extract parameters: "<parameters>"

    Examples:
      | step_text                              | parameterized                          | parameters     |
      | I have 5 users                        | I have {int} users                     | int            |
      | I see price of 19.99                  | I see price of {float}                 | float          |
      | I have user "John"                     | I have user {string}                   | string         |
      | I have 3 users named "Admin"          | I have {int} users named {string}      | int,string     |
      | Score is 85.5 for user "Jane"         | Score is {float} for user {string}     | float,string   |

  Scenario: Complex multi-step validation
    Given I have a complex feature with multiple scenarios
    """
    Feature: E-commerce Application
      Background:
        Given I am logged in as "customer@example.com"
        And I have an empty shopping cart

      Scenario: Add items to cart
        When I add 3 items of "Laptop" to my cart
        And I add 1 item of "Mouse" to my cart
        Then my cart should contain 4 items
        And the total should be 1299.99

      Scenario: Apply discount
        Given I have items worth 100.00 in my cart
        When I apply coupon "SAVE10" with 10 percent discount
        Then the total should be 90.00
        And I should save 10.00
    """
    When I validate the entire feature
    Then I should get validation results for all scenarios
    And missing steps should be identified across all scenarios
    And background steps should be validated properly

  Scenario: Performance regression detection
    Given I have baseline performance metrics
    When I run the same operations multiple times
    Then the performance should remain within acceptable limits
    And memory usage should not increase significantly
    And render times should be consistent

  Scenario: Cross-environment compatibility
    Given I am running in different JavaScript environments
    When I use the BDD bridge functionality
    Then it should work regardless of environment differences
    And fallbacks should be used when APIs are unavailable