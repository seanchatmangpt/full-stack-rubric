Feature: UI Component Behaviors
  As a user
  I want UI components to behave consistently and predictably
  So that I can interact with the application effectively

  Background:
    Given I am on the application homepage

  @components @buttons
  Scenario Outline: Button component interactions
    Given I see a "<button_type>" button with text "<button_text>"
    When I "<interaction>" the button
    Then the button should provide appropriate visual feedback
    And the button should execute its intended action
    And the button should return to normal state after interaction

    Examples:
      | button_type | button_text    | interaction |
      | primary     | Start Practice | click       |
      | secondary   | View Results   | click       |
      | danger      | Reset Progress | click       |
      | primary     | Start Practice | hover       |
      | secondary   | View Results   | focus       |

  @components @loading-states
  Scenario: Loading states for async operations
    Given I click on a button that triggers an async operation
    When the operation is in progress
    Then the button should show a loading indicator
    And the button should be disabled to prevent duplicate clicks
    And I should see appropriate loading text or spinner
    When the operation completes successfully
    Then the loading state should clear
    And the button should return to normal state

  @components @modals
  Scenario: Modal dialog behavior
    Given I click on a button that opens a modal
    When the modal opens
    Then the modal should appear with smooth animation
    And the background should be dimmed with an overlay
    And focus should be trapped within the modal
    When I press the "Escape" key
    Then the modal should close
    When I click outside the modal content
    Then the modal should close
    When I click the close button
    Then the modal should close

  @components @tooltips
  Scenario: Tooltip interactions
    Given I hover over an element with a tooltip
    Then the tooltip should appear after a brief delay
    And the tooltip should be positioned appropriately
    And the tooltip text should be readable
    When I move my cursor away
    Then the tooltip should disappear
    When I focus the element with keyboard
    Then the tooltip should also appear

  @components @dropdown-menus
  Scenario: Dropdown menu functionality
    Given I see a dropdown menu trigger
    When I click on the dropdown trigger
    Then the dropdown menu should open
    And menu items should be visible and clickable
    When I click on a menu item
    Then the dropdown should close
    And the selected action should execute
    When I click outside the dropdown
    Then the dropdown should close without selecting

  @components @tabs
  Scenario: Tab navigation component
    Given I see a tab component with multiple tabs
    When I click on a non-active tab
    Then the tab should become active
    And the corresponding content should be displayed
    And the previous tab should become inactive
    When I use arrow keys to navigate tabs
    Then focus should move between tab headers
    When I press "Enter" or "Space" on a focused tab
    Then that tab should become active

  @components @accordion
  Scenario: Accordion expand and collapse
    Given I see an accordion component
    When I click on an accordion header
    Then the accordion panel should expand with animation
    And the accordion icon should indicate expanded state
    When I click on the same header again
    Then the accordion panel should collapse
    And the accordion icon should indicate collapsed state

  @components @progress-indicators
  Scenario: Progress indicator updates
    Given I start a typing practice session
    When I begin typing
    Then the progress bar should update in real-time
    And the percentage should be accurate
    And the visual indicator should be smooth
    When I complete the practice
    Then the progress should show 100%
    And completion state should be clearly indicated

  @components @notifications
  Scenario Outline: Notification system
    Given a "<notification_type>" notification appears
    Then it should have appropriate styling for the type
    And it should be positioned in the notification area
    And it should auto-dismiss after "<duration>" seconds if not persistent
    When I click the notification close button
    Then the notification should dismiss immediately

    Examples:
      | notification_type | duration |
      | success          | 3        |
      | error            | 5        |
      | warning          | 4        |
      | info             | 3        |

  @components @search-autocomplete
  Scenario: Search with autocomplete
    Given I focus on the search input field
    When I type "typ" in the search box
    Then autocomplete suggestions should appear
    And suggestions should be relevant to my input
    When I press the "Down" arrow key
    Then the first suggestion should be highlighted
    When I press "Enter"
    Then the highlighted suggestion should be selected

  @components @data-tables
  Scenario: Data table interactions
    Given I see a data table with typing statistics
    When I click on a column header
    Then the table should sort by that column
    And the sort indicator should show the direction
    When I click the same header again
    Then the sort order should reverse
    When I use the pagination controls
    Then the table should load the next set of data

  @components @mobile-components
  Scenario: Component behavior on mobile devices
    Given I am using a mobile browser with viewport "375x667"
    When I interact with touch-enabled components
    Then touch targets should be appropriately sized
    And touch feedback should be immediate
    And swipe gestures should work where applicable
    And components should adapt to touch interactions

  @components @keyboard-navigation
  Scenario: Keyboard navigation through components
    Given I am using keyboard navigation
    When I press "Tab" repeatedly
    Then focus should move logically through components
    And focus indicators should be clearly visible
    And all interactive elements should be reachable
    When I use arrow keys within component groups
    Then navigation should work appropriately for the component type

  @components @error-states
  Scenario: Component error states
    Given a component encounters an error condition
    When the error occurs
    Then the component should display appropriate error styling
    And error messages should be clear and helpful
    And the component should provide recovery options where possible
    And error states should be accessible to screen readers

  @components @disabled-states
  Scenario: Disabled component states
    Given a component is in a disabled state
    Then it should have appropriate visual styling
    And it should not respond to user interactions
    And it should be properly labeled for accessibility
    And disabled state should be indicated to screen readers

  @components @responsive-behavior
  Scenario Outline: Component responsive behavior
    Given I am viewing components on a "<device_type>" with viewport "<viewport>"
    When I interact with various UI components
    Then components should adapt their size and layout appropriately
    And functionality should remain intact across all screen sizes
    And touch interactions should work properly on touch devices

    Examples:
      | device_type | viewport   |
      | desktop     | 1920x1080 |
      | tablet      | 768x1024  |
      | mobile      | 375x667   |

  @components @animation-states
  Scenario: Component animations and transitions
    Given I interact with animated components
    When state changes occur
    Then animations should be smooth and purposeful
    And animations should complete within reasonable time
    And animations should respect user motion preferences
    And components should remain functional during animations