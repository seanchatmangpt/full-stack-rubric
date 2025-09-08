Feature: Content Search
  As a user
  I want to search through content effectively
  So that I can quickly find relevant information

  Background:
    Given the content management system is initialized
    And search functionality is enabled
    And I have content indexed for search

  Scenario: Basic text search
    Given I have content with various topics
      | Title | Content |
      | Vue Components | Learn how to build reusable Vue components |
      | React Hooks | Understanding React hooks and state management |
      | Node.js APIs | Building REST APIs with Node.js and Express |
    When I search for "Vue"
    Then I should see results containing "Vue Components"
    And results should highlight the search term
    And results should be ranked by relevance

  Scenario: Multi-word search
    Given I have content about web development
    When I search for "Vue components reusable"
    Then results should match content containing any of these terms
    And exact phrase matches should rank higher
    And partial matches should also be included
    And search should be case-insensitive

  Scenario: Search with filters
    Given I have content in different categories
      | Title | Category | Tags |
      | Vue Guide | Frontend | vue, javascript, framework |
      | API Design | Backend | api, nodejs, database |
      | SEO Tips | Marketing | seo, content, optimization |
    When I search for "javascript" 
    And I filter by category "Frontend"
    Then only frontend content matching "javascript" should appear
    And filter options should be visible
    And active filters should be clearly indicated

  Scenario: Search autocomplete and suggestions
    Given I have a search index built
    When I start typing "vue comp"
    Then autocomplete suggestions should appear
    And suggestions should include "vue components"
    And I should be able to select suggestions with keyboard or mouse
    And recent searches should be included in suggestions

  Scenario: Search result pagination
    Given I have 50 pieces of content matching my search
    And search results show 10 items per page
    When I search for a common term
    Then I should see 10 results on page 1
    And pagination controls should show 5 pages
    And I should be able to navigate between pages
    And search term should persist across pages

  Scenario: Advanced search operators
    Given I want to perform complex searches
    When I search with quotes: "vue components"
    Then only exact phrase matches should appear
    When I search with exclusion: "vue -react"
    Then results should contain "vue" but not "react"
    When I search with wildcards: "compon*"
    Then results should match "component", "components", etc.

  Scenario: Search by content type
    Given I have different types of content
      | Title | Type | Content |
      | Vue Tutorial | Article | Step-by-step Vue guide |
      | API Video | Video | Video about REST APIs |
      | Code Snippet | Code | Vue component example |
    When I filter search by type "Article"
    Then only article content should appear in results
    And type filters should be mutually exclusive
    And content type should be clearly indicated in results

  Scenario: Search within specific sections
    Given I have content with multiple sections
    When I search for "components" within "Frontend" section
    Then only frontend content should be searched
    And results should be scoped to that section
    And section context should be shown in results

  Scenario: Search result previews
    Given I have search results displayed
    When I view the results list
    Then each result should show a content preview
    And preview should include the search term in context
    And preview should be limited to 2-3 lines
    And full content should be accessible via click

  Scenario: Search performance and indexing
    Given I have a large content database with 1000+ items
    When I perform a search query
    Then results should appear within 500ms
    And the search index should be up to date
    And recently added content should be immediately searchable

  Scenario: Search analytics and insights
    Given search tracking is enabled
    When users perform searches
    Then popular search terms should be tracked
    And "no results" queries should be logged
    And search patterns should inform content creation

  Scenario: Voice search support
    Given voice search is enabled
    When I use voice input to search
    Then speech should be converted to text
    And search should be performed on the converted text
    And voice search should work across different browsers

  Scenario: Search export and sharing
    Given I have search results I want to share
    When I perform a search with specific filters
    Then I should be able to copy a shareable URL
    And the URL should preserve search terms and filters
    And others should see the same results when visiting the URL

  Scenario: Typo tolerance and fuzzy search
    Given I have content about "components"
    When I search for "componants" (with typo)
    Then the system should suggest "components"
    And results for "components" should be shown
    And the correction should be clearly indicated

  Scenario: Search within results
    Given I have search results displayed
    When I want to further narrow down results
    Then I should be able to search within current results
    And the refined search should maintain original context
    And I should be able to clear the refinement

  Scenario: Saved searches and alerts
    Given I frequently search for certain terms
    When I save a search query
    Then it should be accessible from my profile
    And I should be able to set up alerts for new matching content
    And alerts should be delivered via notification or email

  Scenario: Search accessibility
    Given I am using assistive technology
    When I use the search functionality
    Then search inputs should have proper labels
    And results should be announced to screen readers
    And keyboard navigation should work throughout search interface
    And high contrast mode should be supported