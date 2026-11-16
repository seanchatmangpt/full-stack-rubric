Feature: UI Component Showcase
  As a developer using the UI pattern library
  I want to view and interact with all available components
  So that I can understand how to implement them in my applications

  Background:
    Given I am on the component showcase page
    And the page has loaded completely

  Scenario: View component categories
    When I look at the component navigation
    Then I should see the following categories:
      | category      |
      | Buttons       |
      | Forms         |
      | Cards         |
      | Modals        |
      | Navigation    |
      | Feedback      |
      | Data Display  |
      | Layout        |
    And each category should be clickable
    And each category should have a description

  Scenario: Explore button variants
    Given I click on the "Buttons" category
    When I view the button examples
    Then I should see buttons with different variants:
      | variant   | size   | state    |
      | primary   | small  | normal   |
      | primary   | medium | normal   |
      | primary   | large  | normal   |
      | secondary | medium | normal   |
      | danger    | medium | normal   |
      | primary   | medium | disabled |
      | primary   | medium | loading  |
    And each button should display its properties
    And each button should be interactive when not disabled

  Scenario: Test component responsiveness
    Given I am viewing the component showcase
    When I resize the browser to mobile width
    Then the layout should adapt for mobile devices
    And the navigation should collapse into a mobile menu
    And all components should remain visible and functional
    
    When I resize the browser to tablet width
    Then the layout should adapt for tablet devices
    And the navigation should show appropriate tablet layout
    
    When I resize the browser to desktop width
    Then the layout should show the full desktop experience
    And all navigation items should be visible

  Scenario: Search for specific components
    Given I am on the component showcase page
    When I enter "button" in the search field
    Then I should only see button-related components
    And the results should be highlighted
    
    When I clear the search field
    Then I should see all components again
    
    When I search for "nonexistent component"
    Then I should see a "No components found" message
    And I should see suggestions for similar components

  Scenario: View component documentation
    Given I click on the "Cards" category
    When I click on a card component example
    Then I should see the component documentation panel
    And the documentation should include:
      | section    |
      | Overview   |
      | Props      |
      | Events     |
      | Slots      |
      | Examples   |
      | Code       |
    And I should be able to copy the code example
    And I should be able to toggle between different code languages

  Scenario: Test accessibility compliance
    Given I am on the component showcase page
    When I navigate using only the keyboard
    Then I should be able to reach all interactive elements
    And the focus should be clearly visible
    And screen reader announcements should be appropriate
    
    When I check for accessibility violations
    Then there should be no WCAG 2.1 AA violations
    And all images should have alt text
    And all form elements should have labels

  Scenario: Customize theme settings
    Given I am viewing components
    When I click the theme toggle button
    Then the interface should switch to dark mode
    And all components should adapt to the dark theme
    And the theme preference should be saved
    
    When I refresh the page
    Then the dark theme should persist
    
    When I toggle back to light mode
    Then all components should return to light theme styling