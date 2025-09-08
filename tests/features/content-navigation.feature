Feature: Content Navigation
  As a user
  I want to navigate through content efficiently
  So that I can find and access information quickly

  Background:
    Given the content management system is initialized
    And content navigation is enabled
    And I have a content structure with multiple pages and categories

  Scenario: Hierarchical content navigation
    Given I have content organized in categories
      | Category | Subcategory | Page Title |
      | Tech     | Frontend    | Vue Guide  |
      | Tech     | Backend     | API Design |
      | Business | Marketing   | SEO Tips   |
      | Business | Sales       | CRM Setup  |
    When I navigate to the content structure
    Then I should see the hierarchical menu
    And categories should be expandable
    And subcategories should be nested correctly

  Scenario: Breadcrumb navigation
    Given I am viewing a nested content page
    And the page path is "Tech > Frontend > Vue Guide"
    When I view the page
    Then breadcrumbs should show the full path
    And each breadcrumb level should be clickable
    And clicking a breadcrumb should navigate to that level

  Scenario: Previous/Next navigation
    Given I have a series of related content pages
    And I am viewing page 3 of 5 in the series
    When I view the navigation controls
    Then I should see "Previous" and "Next" buttons
    And "Previous" should link to page 2
    And "Next" should link to page 4
    And buttons should be disabled at the start/end of series

  Scenario: Table of contents generation
    Given I have a long content page with multiple headers
      """
      # Introduction
      ## Getting Started
      ### Prerequisites
      ### Installation
      ## Advanced Topics
      ### Configuration
      ### Deployment
      # Conclusion
      """
    When I view the page
    Then a table of contents should be generated
    And TOC should include all header levels
    And clicking TOC links should scroll to sections
    And current section should be highlighted

  Scenario: Content categorization and tagging
    Given I have content with tags and categories
      | Title | Category | Tags |
      | Vue Tips | Frontend | vue, tips, javascript |
      | API Best Practices | Backend | api, rest, nodejs |
    When I filter by category "Frontend"
    Then only frontend content should be displayed
    When I filter by tag "vue"
    Then only vue-tagged content should be displayed
    And multiple filters should work together

  Scenario: Content search and filtering
    Given I have multiple content pages
    When I search for "vue components"
    Then relevant pages should be displayed
    And search terms should be highlighted
    And results should be ranked by relevance
    And no results message should appear if no matches

  Scenario: Content pagination
    Given I have 50 content items
    And pagination is set to 10 items per page
    When I view the content list
    Then I should see 10 items
    And pagination controls should show 5 pages
    And page numbers should be clickable
    And current page should be highlighted

  Scenario: Content sorting
    Given I have content with different dates and titles
    When I choose to sort by "Date (newest first)"
    Then content should be ordered by creation date descending
    When I choose to sort by "Title (A-Z)"
    Then content should be ordered alphabetically
    And sorting should persist across page refreshes

  Scenario: Responsive navigation menu
    Given I am using a mobile device
    When I view the content navigation
    Then the menu should be collapsed by default
    And a hamburger menu button should be visible
    When I tap the hamburger menu
    Then the navigation should expand
    And menu items should be touch-friendly

  Scenario: Keyboard navigation
    Given I am using keyboard navigation
    When I press Tab
    Then focus should move through navigation items
    When I press Enter on a navigation item
    Then I should navigate to that content
    When I press Escape
    Then any open menus should close

  Scenario: Navigation state persistence
    Given I have expanded certain navigation sections
    And I have applied filters
    When I navigate to another page and return
    Then my navigation state should be preserved
    And expanded sections should remain open
    And applied filters should still be active

  Scenario: Content relationships and suggestions
    Given I am viewing a content page about "Vue Components"
    When I reach the end of the page
    Then related content suggestions should appear
    And suggestions should be based on tags and category
    And I should see "Next recommended" content

  Scenario: Navigation analytics
    Given content navigation tracking is enabled
    When users navigate through content
    Then popular content paths should be tracked
    And navigation patterns should be recorded
    And this data should inform content organization

  Scenario: Content favorites and bookmarks
    Given I am logged in as a user
    When I bookmark a content page
    Then it should be added to my favorites
    And I should be able to access favorites from navigation
    And favorites should persist across sessions

  Scenario: Content history and recent views
    Given I have viewed several content pages
    When I access my reading history
    Then recently viewed pages should be listed
    And history should be chronologically ordered
    And I should be able to clear history

  Scenario: Navigation accessibility
    Given I am using a screen reader
    When I navigate the content structure
    Then navigation should have proper ARIA labels
    And keyboard shortcuts should be announced
    And content hierarchy should be clearly indicated
    And skip links should be available