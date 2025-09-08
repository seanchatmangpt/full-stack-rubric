Feature: Responsive Design
  As a user on different devices
  I want the application to adapt to my screen size
  So that I have an optimal viewing experience

  Background:
    Given the application is loaded

  @responsive @desktop
  Scenario: Desktop layout with large screens
    Given I am using a desktop browser with viewport "1920x1080"
    Then the main content should use a multi-column layout
    And the sidebar should be visible and fixed
    And images should be displayed at full resolution
    And the typing area should have maximum width of "800px"

  @responsive @laptop
  Scenario: Laptop layout adaptation
    Given I am using a laptop browser with viewport "1366x768"
    Then the main content should adapt to narrower width
    And the sidebar should remain visible but narrower
    And images should scale appropriately
    And font sizes should remain readable

  @responsive @tablet-landscape
  Scenario: Tablet landscape layout
    Given I am using a tablet browser with viewport "1024x768"
    Then the layout should switch to tablet-optimized view
    And navigation should show condensed menu
    And the typing area should adjust to touch interface
    And buttons should be touch-friendly with minimum "44px" height

  @responsive @tablet-portrait
  Scenario: Tablet portrait layout
    Given I am using a tablet browser with viewport "768x1024"
    Then the layout should stack vertically
    And the sidebar should be collapsible
    And images should stack in single column
    And text should remain readable without zooming

  @responsive @mobile-large
  Scenario: Large mobile phone layout
    Given I am using a mobile browser with viewport "414x896"
    Then the navigation should switch to hamburger menu
    And content should stack in single column
    And the typing interface should be optimized for thumbs
    And form fields should be full width with proper spacing

  @responsive @mobile-standard
  Scenario: Standard mobile phone layout
    Given I am using a mobile browser with viewport "375x667"
    Then all content should fit without horizontal scrolling
    And touch targets should be minimum "44px" in size
    And text should be minimum "16px" to prevent zoom
    And the typing area should adapt to available space

  @responsive @mobile-small
  Scenario: Small mobile phone layout
    Given I am using a mobile browser with viewport "320x568"
    Then the interface should remain functional
    And critical content should be prioritized
    And secondary elements should be hidden or minimized
    And the typing interface should still be usable

  @responsive @orientation-change
  Scenario Outline: Device orientation changes
    Given I am using a mobile browser with viewport "<initial_viewport>"
    When I rotate the device to "<orientation>" orientation
    Then the layout should adapt within 0.3 seconds
    And the typing area should reflow appropriately
    And no content should be cut off or inaccessible

    Examples:
      | initial_viewport | orientation |
      | 375x667         | landscape   |
      | 667x375         | portrait    |
      | 768x1024        | landscape   |
      | 1024x768        | portrait    |

  @responsive @zoom
  Scenario: Browser zoom levels
    Given I am using a desktop browser with viewport "1920x1080"
    When I zoom to "150%" level
    Then the layout should remain functional
    And text should remain readable
    And interactive elements should remain clickable
    When I zoom to "200%" level
    Then horizontal scrolling may appear but content should be accessible

  @responsive @typography
  Scenario Outline: Typography scaling across devices
    Given I am using a browser with viewport "<viewport>"
    Then the base font size should be "<font_size>"
    And line height should be appropriate for readability
    And headings should scale proportionally
    And the typing interface text should be clearly visible

    Examples:
      | viewport    | font_size |
      | 1920x1080  | 16px      |
      | 1366x768   | 16px      |
      | 768x1024   | 16px      |
      | 375x667    | 16px      |
      | 320x568    | 16px      |

  @responsive @images
  Scenario: Responsive image handling
    Given I am on a page with images
    When I view the page on different screen sizes
    Then images should scale appropriately
    And high-resolution images should be served to high-DPI screens
    And images should not cause horizontal scrolling
    And lazy loading should work on mobile devices

  @responsive @grid-layout
  Scenario: CSS Grid and Flexbox responsiveness
    Given I am viewing a page with grid layouts
    When I resize the browser window
    Then grid items should reflow appropriately
    And flexbox containers should adapt
    And no layout breaks should occur
    And the typing practice grid should remain functional

  @responsive @touch-interactions
  Scenario: Touch-specific interactions on mobile
    Given I am using a touch device with viewport "375x667"
    Then tap targets should be minimum "44px" square
    And hover states should be replaced with active states
    And scroll areas should have momentum scrolling
    And pinch-to-zoom should work where appropriate

  @responsive @performance
  Scenario Outline: Performance across device types
    Given I am using a "<device_type>" browser with viewport "<viewport>"
    When I load the typing tutor page
    Then the page should load within "<load_time>" seconds
    And animations should run smoothly at 60fps
    And memory usage should remain reasonable

    Examples:
      | device_type | viewport   | load_time |
      | desktop     | 1920x1080 | 2         |
      | laptop      | 1366x768  | 2.5       |
      | tablet      | 768x1024  | 3         |
      | mobile      | 375x667   | 4         |

  @responsive @accessibility
  Scenario: Responsive design accessibility
    Given I am using assistive technology
    When I access the site on different devices
    Then screen readers should work consistently
    And keyboard navigation should adapt to layout changes
    And focus indicators should remain visible
    And color contrast should meet WCAG standards on all devices

  @responsive @content-priority
  Scenario: Content prioritization on small screens
    Given I am using a mobile browser with viewport "320x568"
    Then the most important content should be visible first
    And secondary content should be accessible via interaction
    And the typing practice should remain the primary focus
    And navigation should be easily accessible but not intrusive