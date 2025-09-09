Feature: Property Listing
  As a user
  I want to view property listings
  So that I can find properties to buy or rent

  Scenario: Display property listings
    Given I am on the property listing page
    When the page loads
    Then I should see property listings
    And I should see filter options

  Scenario: Filter properties by type
    Given I am on the property listing page
    And there are properties available
    When I select "apartment" from the type filter
    Then I should only see apartment listings

  Scenario: Filter properties by price range
    Given I am on the property listing page 
    And there are properties available
    When I set minimum price to "300000"
    And I set maximum price to "600000"
    Then I should only see properties within that price range