Feature: Monaco Editor Integration
  As a user practicing typing code
  I want to use Monaco editor features for a better coding experience
  So that I can practice typing with professional code editor functionality

  Background:
    Given I am on the typing tutor page
    And the Monaco editor component is available
    And a JavaScript exercise is loaded

  Scenario: Monaco editor initialization
    Given the typing tutor page has loaded
    When the Monaco editor component is initialized
    Then it should display in a dark theme
    And it should use JavaScript language mode
    And it should have syntax highlighting enabled
    And it should use a monospace font

  Scenario: Syntax highlighting in target text
    Given a JavaScript exercise is loaded in Monaco
    When the target text contains keywords, strings, and functions
    Then JavaScript keywords should be highlighted in blue
    And string literals should be highlighted in green
    And comments should be highlighted in gray
    And functions should be highlighted appropriately
    And the syntax highlighting should match professional editors

  Scenario: Code formatting preservation
    Given the target text contains proper JavaScript indentation
    When displayed in Monaco editor
    Then indentation should be preserved exactly
    And code blocks should maintain their structure
    And bracket matching should be visually indicated
    And line numbers should be displayed if enabled

  Scenario: Monaco editor typing integration
    Given the Monaco editor is ready for input
    When I start typing in the Monaco editor
    Then the typing should feel natural and responsive
    And cursor movement should be smooth
    And character insertion should work correctly
    And the editor should handle special characters properly

  Scenario: Language-specific features
    Given Monaco is configured for JavaScript
    When displaying code content
    Then it should recognize JavaScript syntax patterns
    And it should provide appropriate syntax highlighting
    And it should handle JavaScript-specific characters like backticks
    And it should properly format template literals

  Scenario: Editor theming and appearance
    Given Monaco editor is initialized
    When viewing the editor interface
    Then it should use the VS Code dark theme
    And the background should be dark (gray-900 equivalent)
    And text should be light colored for contrast
    And the theme should match the overall application design

  Scenario: Read-only mode for target text
    Given the target text is displayed in Monaco
    When the editor shows the text to be typed
    Then the target text editor should be read-only
    And users should not be able to edit the target text
    And the target text should be clearly distinguishable from input area
    And selection should be disabled in the target text

  Scenario: Input area Monaco configuration
    Given there is a Monaco editor for user input
    When I interact with the input editor
    Then it should be fully editable
    And it should support all standard text editing operations
    And it should provide real-time feedback on typing
    And it should integrate with the typing metrics system

  Scenario: Monaco performance with typing metrics
    Given Monaco editor is handling typing input
    When I type at normal speed (40+ WPM)
    Then the editor should remain responsive
    And syntax highlighting should not cause lag
    And typing metrics should update in real-time
    And there should be no noticeable performance degradation

  Scenario: Multi-line code handling
    Given the exercise contains multi-line JavaScript code
    When displayed in Monaco editor
    Then line breaks should be preserved correctly
    And indentation should be maintained across lines
    And the editor should handle Enter key presses properly
    And code structure should remain intact

  Scenario: Special character handling in Monaco
    Given the code contains JavaScript special characters
    When typing characters like {}[]();"'
    Then Monaco should handle these characters correctly
    And bracket matching should work if enabled
    And string delimiters should be handled properly
    And escape sequences should display correctly

  Scenario: Monaco editor accessibility
    Given Monaco editor is being used
    When accessed by users with different needs
    Then the editor should support keyboard navigation
    And text should have sufficient contrast
    And screen readers should be able to access the content
    And font size should be appropriate for readability

  Scenario: Integration with typing feedback system
    Given Monaco editor is integrated with typing feedback
    When I type correct and incorrect characters
    Then Monaco should support the color highlighting system
    And correct characters should appear in green
    And incorrect characters should appear in red
    And the cursor position should be clearly indicated

  Scenario: Monaco editor error handling
    Given Monaco editor encounters an initialization error
    When the editor fails to load
    Then the system should gracefully fall back to a textarea
    And typing functionality should still work
    And users should be informed of the degraded experience
    And all core typing features should remain functional

  Scenario: Editor configuration flexibility
    Given Monaco editor can be configured
    When setting up for different code types
    Then the language mode should be configurable
    And the theme should be adjustable
    And editor options should be customizable
    And the configuration should persist during the session