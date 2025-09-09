Feature: Real Estate Interview Challenges
  As a real estate application
  I need to provide advanced property search capabilities
  So that users can find comparable properties and search efficiently

  Background:
    Given the real estate API is running
    And there are properties with addresses and zip codes in the database

  Scenario: Find nearest price comparables in same zip code
    Given I want to find properties similar to a "450000" dollar property in zip "10001"
    When I request the 3 nearest price comparables
    Then I should receive properties sorted by price proximity
    And all returned properties should be in zip "10001"
    And the results should not include the target property itself
    And the properties should be ordered from closest to furthest price

  Scenario: Extract unique zip codes from property dataset
    Given there are properties across multiple zip codes
    When I request the unique zip codes
    Then I should receive a deduplicated list of zip codes
    And the zip codes should be sorted alphabetically
    And no zip code should appear more than once

  Scenario: Search addresses by prefix
    Given there are properties with various addresses
    When I search for addresses starting with "123"
    Then I should receive matching addresses
    And each result should include address, zip, price, and title
    And results should be limited to prevent performance issues

  Scenario: Handle prefix search edge cases
    Given there are properties with various addresses
    When I search for addresses with a prefix shorter than 2 characters
    Then I should receive an empty result set
    When I search for addresses starting with "999"
    Then I should receive only properties matching that prefix

  Scenario: Validate comparables algorithm efficiency
    Given I want to find properties similar to a "520000" dollar property in zip "10001"
    When I request the 5 nearest price comparables
    Then the algorithm should use sorted search for efficiency
    And results should expand outward from the target price
    And closer price differences should be returned first

  Scenario: Handle empty results gracefully
    Given I want to find properties similar to a "999999" dollar property in zip "99999"
    When I request price comparables for a non-existent zip
    Then I should receive an empty result set
    And the response should be properly formatted JSON