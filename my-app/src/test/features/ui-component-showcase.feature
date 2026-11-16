Feature: UI Component Showcase
  As a developer
  I want to explore and test UI components
  So that I can understand their functionality and usage

  Background:
    Given I am on the home page
    And the UI component library is loaded

  Scenario: View component library overview
    When I visit the home page
    Then I should see the main heading "Welcome to Vue UI Pattern Library"
    And I should see component demonstration sections
    And I should see search functionality
    And I should see filtering options

  Scenario: Search for components
    Given I am on the home page
    When I type "DataTable" in the search bar
    And I wait for the search to complete
    Then I should see search results containing "DataTable"
    And the results should be filtered to match my search

  Scenario: Filter components by category
    Given I am on the home page
    When I select "Data Display" from the category filter
    Then I should see only components in the "Data Display" category
    And the component count should update accordingly

  Scenario: Interact with data table
    Given I am on the home page
    And there is a component data table visible
    When I click on a table header to sort
    Then the table should be sorted by that column
    And a sort indicator should appear
    When I click on a table row
    Then I should see a success notification
    And the row should be highlighted

  Scenario: Test form components
    Given I am on the home page
    And there are form components visible
    When I type "Hello World" in the demo input field
    Then the input should display "Hello World"
    When I check the demo checkbox
    Then the checkbox should be checked
    When I uncheck the demo checkbox  
    Then the checkbox should be unchecked

  Scenario: Test loading states
    Given I am on the home page
    When I click the "Toggle Loading" button
    Then I should see a loading spinner
    When I click the "Toggle Loading" button again
    Then the loading spinner should disappear

  Scenario: Test notification system
    Given I am on the home page
    When I click the "Show Success" button
    Then I should see a success notification
    And the notification should contain "Operation completed successfully"
    When I click the "Show Error" button
    Then I should see an error notification
    And the notification should contain "Something went wrong"

  Scenario: Test responsive behavior
    Given I am on the home page
    When I resize the browser to mobile width
    Then all components should remain visible and functional
    And the layout should adapt to the smaller screen
    When I resize the browser to desktop width
    Then the layout should return to desktop format

  Scenario: Combined search and filter workflow
    Given I am on the home page
    When I type "Form" in the search bar
    And I wait for the search to complete
    And I select "Forms" from the category filter
    Then I should see only form-related components
    And the results should match both the search and filter criteria
    When I click on the first result
    Then I should see a success notification with the component name