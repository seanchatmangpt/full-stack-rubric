Feature: Theme Switching
  As a user
  I want to switch between different visual themes
  So that I can customize my experience and work comfortably in different environments

  Background:
    Given I am on the application homepage

  @theme @light-mode
  Scenario: Default light theme appearance
    Given the application loads with default settings
    Then I should see the light theme active
    And the background should be light colored
    And text should be dark for good contrast
    And the theme toggle should show "Dark Mode" option

  @theme @dark-mode
  Scenario: Switch to dark theme
    Given I am using the light theme
    When I click on the theme toggle button
    Then the theme should switch to dark mode
    And the background should be dark colored
    And text should be light for good contrast
    And the theme toggle should show "Light Mode" option
    And the transition should be smooth without flickering

  @theme @system-preference
  Scenario: Respect system theme preference
    Given my system is set to dark mode
    When I visit the application for the first time
    Then the dark theme should be automatically applied
    And the theme preference should be saved
    When my system switches to light mode
    And I refresh the page
    Then the theme should switch to light mode if no user preference is set

  @theme @persistence
  Scenario: Theme preference persistence
    Given I have switched to dark theme
    When I refresh the page
    Then the dark theme should remain active
    When I close and reopen the browser
    Then the dark theme should still be active
    When I visit the site on a different tab
    Then the dark theme should be consistent

  @theme @mobile-theme
  Scenario: Theme switching on mobile devices
    Given I am using a mobile browser with viewport "375x667"
    When I access the theme toggle in the mobile menu
    Then I should be able to switch themes
    And the mobile interface should adapt to the new theme
    And all mobile-specific elements should respect the theme

  @theme @accessibility-contrast
  Scenario Outline: Color contrast accessibility in themes
    Given I am using the "<theme>" theme
    Then all text should meet WCAG AA contrast requirements
    And interactive elements should have sufficient contrast
    And focus indicators should be clearly visible
    And error states should be distinguishable

    Examples:
      | theme |
      | light |
      | dark  |

  @theme @typing-interface
  Scenario: Theme application to typing interface
    Given I am on the typing practice page
    When I switch between light and dark themes
    Then the typing area background should adapt appropriately
    And the text being typed should have good contrast
    And syntax highlighting should work in both themes
    And the cursor should be clearly visible in both themes

  @theme @component-theming
  Scenario Outline: Individual component theme adaptation
    Given I am viewing the "<component>" component
    When I switch to "<theme>" theme
    Then the component should adapt its colors appropriately
    And borders and shadows should match the theme
    And hover states should work correctly
    And any icons should be theme-appropriate

    Examples:
      | component      | theme |
      | navigation     | dark  |
      | navigation     | light |
      | typing-editor  | dark  |
      | typing-editor  | light |
      | settings-panel | dark  |
      | settings-panel | light |
      | progress-chart | dark  |
      | progress-chart | light |

  @theme @high-contrast
  Scenario: High contrast theme for accessibility
    Given I have vision accessibility needs
    When I enable high contrast mode in my system
    Then the application should detect this preference
    And apply a high contrast theme variant
    And all elements should have maximum contrast
    And decorative elements should be minimized

  @theme @custom-themes
  Scenario: Custom theme creation
    Given I am in the settings page
    When I access the theme customization options
    Then I should be able to select custom colors
    And preview the changes in real-time
    When I save my custom theme
    Then it should be applied immediately
    And saved for future visits

  @theme @animation-transitions
  Scenario: Smooth theme transitions
    Given I am on any page
    When I toggle the theme
    Then the transition should take no more than 0.3 seconds
    And all elements should transition smoothly
    And no elements should flicker or jump
    And animations should respect user motion preferences

  @theme @print-mode
  Scenario: Print-friendly theme
    Given I am viewing content in any theme
    When I trigger print mode
    Then the content should switch to a print-optimized theme
    And backgrounds should be removed or lightened
    And text should be black on white for clarity
    And unnecessary UI elements should be hidden

  @theme @reduced-motion
  Scenario: Respect reduced motion preferences
    Given I have "prefers-reduced-motion" enabled
    When I switch themes
    Then transitions should be minimal or instant
    And animations should be reduced or disabled
    But functionality should remain intact

  @theme @color-blind-support
  Scenario Outline: Color blind accessibility
    Given I have "<color_blindness_type>" color vision
    When I use the application with different themes
    Then information should not rely solely on color
    And alternative visual cues should be present
    And the typing interface should remain functional

    Examples:
      | color_blindness_type |
      | protanopia          |
      | deuteranopia        |
      | tritanopia          |

  @theme @performance
  Scenario: Theme switching performance
    Given I am on a page with many UI elements
    When I switch themes multiple times quickly
    Then each switch should complete within 300ms
    And memory usage should not increase significantly
    And the application should remain responsive

  @theme @multi-tab-sync
  Scenario: Theme synchronization across tabs
    Given I have multiple tabs open
    When I change the theme in one tab
    Then all other tabs should update to match
    And the change should propagate within 1 second
    And no tab should show inconsistent theming

  @theme @keyboard-control
  Scenario: Keyboard control for theme switching
    Given I am using keyboard navigation
    When I press the theme toggle keyboard shortcut "Ctrl+Shift+T"
    Then the theme should toggle
    And focus should remain on the current element
    When I tab to the theme toggle button
    And press "Enter" or "Space"
    Then the theme should also toggle