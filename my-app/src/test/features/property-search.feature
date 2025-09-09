Feature: Property Search and Filtering
  As a user looking for a property
  I want to search and filter properties
  So that I can find properties that match my criteria

  Scenario: Display property listing page
    Given I am on the property listing page
    When the page loads
    Then I should see the property listings heading
    And I should see property statistics

  Scenario: Filter properties by type
    Given I am on the property listing page
    When I select House from the type filter
    Then I should only see House properties
    And the API should be called with type parameter

  Scenario: Display loading state
    Given I am on the property listing page
    When the component is mounting
    Then I should see a loading indicator