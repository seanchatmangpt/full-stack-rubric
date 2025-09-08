# NEW STYLE: BDD Feature equivalent to old calculator tests
Feature: Calculator Operations
  As a user
  I want to perform mathematical calculations
  So that I can compute numerical results accurately

  Background:
    Given I have a calculator with an initial value of 0

  Scenario: Display initial value
    Given the calculator is initialized
    Then the display should show "0"

  Scenario Outline: Basic arithmetic operations
    Given the calculator is initialized
    When I enter the first number <first_number>
    And I select the operation "<operation>"
    And I enter the second number <second_number>
    And I press equals
    Then the display should show "<expected_result>"

    Examples:
      | first_number | operation | second_number | expected_result |
      | 5            | plus      | 3             | 8               |
      | 9            | minus     | 4             | 5               |
      | 6            | multiply  | 7             | 42              |
      | 15           | divide    | 3             | 5               |

  Scenario: Division by zero error handling
    Given the calculator is initialized
    When I enter the first number 8
    And I select the operation "divide"
    And I enter the second number 0
    And I press equals
    Then the display should show "Error"
    And the calculator should be in error state

  Scenario: Clear functionality
    Given I have entered some numbers and operations
    When I press the clear button
    Then the display should show "0"
    And the calculator should be reset to initial state

  Scenario: Decimal number calculations
    Given the calculator is initialized
    When I enter the decimal number "3.5"
    And I select the operation "plus"
    And I enter the decimal number "2.1"
    And I press equals
    Then the display should show "5.6"

  Scenario: Multiple operations in sequence
    Given the calculator is initialized
    When I perform the following operations:
      | number | operation |
      | 10     | plus      |
      | 5      | multiply  |
      | 2      | equals    |
    Then the display should show "30"

  Scenario: Memory functions
    Given the calculator has memory capability
    When I enter the number 42
    And I press memory store
    And I clear the display
    And I press memory recall
    Then the display should show "42"