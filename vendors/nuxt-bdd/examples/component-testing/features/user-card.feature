@component @ui
Feature: User Card Component
  As a developer
  I want to test the UserCard component behavior
  So that I can ensure it displays user information correctly

  Background:
    Given I have a UserCard component
    And I have sample user data:
      | name       | email              | role  | avatar         | status |
      | John Doe   | john@example.com   | admin | /avatars/1.jpg | active |

  @component @display
  Scenario: Display user information correctly
    Given the UserCard component is rendered with user data
    Then I should see the user's name "John Doe"
    And I should see the user's email "john@example.com"
    And I should see the user's role "admin"
    And I should see the user's avatar image
    And the status indicator should show "active"

  @component @props
  Scenario: Handle missing avatar gracefully
    Given the UserCard component is rendered with user data
    But the avatar field is empty
    Then I should see a default avatar placeholder
    And the placeholder should show the user's initials "JD"

  @component @interactions
  Scenario: Click interactions on user card
    Given the UserCard component is rendered with user data
    When I click on the user card
    Then a "user-clicked" event should be emitted
    And the event payload should contain the user ID

  @component @states
  Scenario Outline: Different user status displays
    Given the UserCard component is rendered with user data
    But the user status is "<status>"
    Then the status indicator should be "<color>"
    And the status text should display "<display_text>"

    Examples:
      | status   | color  | display_text |
      | active   | green  | Active       |
      | inactive | gray   | Inactive     |
      | pending  | yellow | Pending      |
      | banned   | red    | Banned       |

  @component @accessibility
  Scenario: Keyboard navigation support
    Given the UserCard component is rendered with user data
    When I focus on the user card using Tab key
    Then the card should receive focus
    And pressing Enter should trigger click event
    And pressing Space should trigger click event

  @component @responsive
  Scenario: Responsive layout behavior
    Given the UserCard component is rendered with user data
    When the screen size is reduced to mobile viewport
    Then the layout should stack vertically
    And the avatar should be centered
    And text should remain readable

  @integration @list
  Scenario: User card in a list context
    Given I have a UserList component
    And the list contains 5 user cards
    When I render the UserList component
    Then I should see 5 UserCard components
    And each card should display unique user data
    And the list should be keyboard navigable

  @component @loading
  Scenario: Loading state handling
    Given the UserCard component is in loading state
    Then I should see skeleton placeholders
    And loading indicators should be visible
    And the component should not be interactive

  @component @error
  Scenario: Error state handling  
    Given the UserCard component receives invalid user data
    Then I should see an error message
    And the component should display fallback content
    And no JavaScript errors should be thrown