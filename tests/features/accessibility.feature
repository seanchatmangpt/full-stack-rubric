Feature: Accessibility Compliance
  As a user with disabilities
  I want the application to be fully accessible
  So that I can use all features regardless of my abilities

  Background:
    Given the application is running
    And accessibility testing tools are available

  @accessibility @wcag @critical
  Scenario: WCAG 2.1 AA Level Compliance
    Given I am on any page of the application
    When I run automated accessibility checks
    Then the page should have zero WCAG 2.1 AA violations
    And the accessibility score should be 100%
    And all interactive elements should be keyboard accessible

  @accessibility @keyboard @critical
  Scenario: Full Keyboard Navigation
    Given I am on the typing tutor page
    When I navigate using only the keyboard
    Then I should be able to access all interactive elements
    And the tab order should be logical and predictable
    And focus indicators should be clearly visible with contrast ratio >= 3:1
    And I should be able to complete the typing exercise using only keyboard

  @accessibility @screen-reader @critical
  Scenario: Screen Reader Compatibility
    Given I am using a screen reader simulation
    When I navigate through the application
    Then all content should be announced correctly
    And all images should have appropriate alt text
    And form inputs should have proper labels
    And headings should follow logical hierarchy (h1 > h2 > h3)
    And the typing progress should be announced to assistive technology

  @accessibility @color-contrast @critical
  Scenario: Color Contrast Requirements
    Given I am on any page with text content
    When I measure color contrast ratios
    Then normal text should have contrast ratio >= 4.5:1
    And large text should have contrast ratio >= 3:1
    And interactive elements should maintain contrast in all states
    And color should not be the only means of conveying information

  @accessibility @responsive @high
  Scenario: Responsive Design Accessibility
    Given I am testing across different viewport sizes
    When I resize the browser from 320px to 1920px width
    Then all content should remain accessible at every breakpoint
    And touch targets should be at least 44x44 pixels
    And horizontal scrolling should not be required
    And zoom up to 200% should not break functionality

  @accessibility @aria @high
  Scenario: ARIA Implementation
    Given I am on the typing tutor interface
    When I inspect ARIA attributes
    Then dynamic content changes should be announced via aria-live
    And complex widgets should have proper ARIA roles
    And aria-describedby should connect help text to form controls
    And aria-expanded should indicate collapsible section states
    And the typing exercise should have appropriate ARIA labels

  @accessibility @focus-management @high
  Scenario: Focus Management
    Given I am using the application with keyboard only
    When I interact with modal dialogs or route changes
    Then focus should move appropriately to new content
    And focus should not be trapped unintentionally
    And focus should return to logical position when modals close
    And skip links should be provided for main content

  @accessibility @timing @medium
  Scenario: Content Timing Control
    Given I am on pages with time-sensitive content
    When content auto-updates or has time limits
    Then users should be able to extend or disable time limits
    And auto-refreshing content should be pauseable
    And typing exercise time limits should be configurable
    And no content should flash more than 3 times per second

  @accessibility @multimedia @medium
  Scenario: Multimedia Accessibility
    Given the application contains audio or video content
    When multimedia is played
    Then captions should be available for audio content
    And audio descriptions should be provided where needed
    And media should not auto-play with sound
    And volume controls should be keyboard accessible

  @accessibility @error-prevention @high
  Scenario: Accessible Error Handling
    Given I am filling out forms or using interactive features
    When validation errors occur
    Then errors should be clearly announced to screen readers
    And error messages should be associated with form fields
    And suggestions for correction should be provided
    And users should be able to review and confirm before submission