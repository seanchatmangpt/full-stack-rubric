Feature: Dashboard Functionality
  As a developer
  I want to use the component dashboard
  So that I can manage and explore the UI component library

  Background:
    Given I am on the dashboard page
    And the dashboard has finished loading

  Scenario: View dashboard statistics
    When I visit the dashboard
    Then I should see statistics cards
    And I should see "38" total components
    And I should see "6" categories
    And I should see test coverage percentage
    And I should see "100%" Vue 3 readiness

  Scenario: Search components in dashboard
    Given I am on the dashboard
    When I type "Search" in the search input
    And I wait for the search to process
    Then I should see components matching "Search" in the results
    And the results table should update accordingly

  Scenario: Filter by category
    Given I am on the dashboard
    When I select "Search & Filter" from the category dropdown
    Then I should see only search-related components
    And each result should have category "search"

  Scenario: Filter by status  
    Given I am on the dashboard
    When I select "Stable" from the status dropdown
    Then I should see only components with stable status
    And each result should show "stable" status

  Scenario: Combined filtering
    Given I am on the dashboard
    When I type "Form" in the search input
    And I select "Forms & Modals" from category filter
    And I select "Stable" from status filter
    Then I should see components that match all criteria
    And the results count should be updated

  Scenario: Sort component table
    Given I am on the dashboard
    And the component table is visible
    When I click on the "Name" column header
    Then the table should be sorted by name alphabetically
    And a sort indicator should appear
    When I click on the "Name" column header again
    Then the table should be sorted in reverse order

  Scenario: View component details
    Given I am on the dashboard
    When I click on the first component row in the table
    Then a component details modal should open
    And I should see the component name in the modal header
    And I should see component description
    And I should see component features list
    And I should see component props table

  Scenario: Test modal interactions
    Given I am on the dashboard
    And I have opened a component details modal
    When I press the Escape key
    Then the modal should close
    When I open the modal again
    And I click on the backdrop
    Then the modal should close
    When I open the modal again
    And I click the close button
    Then the modal should close

  Scenario: Test pagination
    Given I am on the dashboard
    And there are more than 10 components
    When I click the "Next Page" button
    Then I should see page 2 components
    And the URL should contain "page=2"
    When I click the "Previous Page" button
    Then I should see page 1 components
    And the URL should contain "page=1"

  Scenario: Change page size
    Given I am on the dashboard
    When I select "20" from the page size dropdown
    Then I should see 20 components per page
    And the URL should contain "limit=20"

  Scenario: Refresh dashboard data
    Given I am on the dashboard
    When I click the "Refresh" button
    Then a loading indicator should appear
    And the data should be refreshed
    And the loading indicator should disappear

  Scenario: Export component data
    Given I am on the dashboard
    When I click the "Export" button
    Then a file download should be triggered
    And the file should contain component data

  Scenario: Test responsive dashboard
    Given I am on the dashboard
    When I resize to mobile viewport
    Then the statistics cards should stack vertically
    And the filters should adapt for mobile
    And the table should remain functional
    When I resize to desktop viewport
    Then the layout should return to desktop format

  Scenario: Test accessibility compliance
    Given I am on the dashboard
    When I navigate using only the keyboard
    Then I should be able to access all interactive elements
    And focus indicators should be clearly visible
    And screen reader announcements should be appropriate

  Scenario: Handle error states
    Given I am on the dashboard
    And there is a network error
    When I try to refresh the data
    Then I should see an error message
    And I should be able to retry the operation

  Scenario: Maintain filter state
    Given I am on the dashboard
    When I set search to "Data" and category to "Data Display"
    And I open a component details modal
    And I close the modal
    Then the search and filter values should be maintained
    And the filtered results should still be displayed