Feature: Content Markdown Processing
  As a content manager
  I want to process and transform markdown content
  So that rich content can be displayed correctly

  Background:
    Given the content management system is initialized
    And markdown processing is enabled

  Scenario: Basic markdown parsing
    Given I have markdown content with headers
      """
      # Main Title
      ## Subtitle
      ### Sub-subtitle
      
      This is a paragraph with **bold** and *italic* text.
      """
    When I process the markdown content
    Then the content should be parsed into HTML
    And headers should have proper hierarchy
    And text formatting should be preserved

  Scenario: Code block processing
    Given I have markdown content with code blocks
      """
      Here's some JavaScript code:
      
      ```javascript
      function hello(name) {
        console.log(`Hello, ${name}!`);
      }
      ```
      
      And some inline `code` here.
      """
    When I process the markdown content
    Then code blocks should be syntax highlighted
    And inline code should be formatted correctly
    And language tags should be preserved

  Scenario: List processing
    Given I have markdown content with lists
      """
      Ordered list:
      1. First item
      2. Second item
         - Nested unordered
         - Another nested
      3. Third item
      
      Unordered list:
      - Item one
      - Item two
        1. Nested ordered
        2. Another nested
      - Item three
      """
    When I process the markdown content
    Then ordered lists should be numbered correctly
    And unordered lists should have bullet points
    And nested lists should maintain proper indentation

  Scenario: Link and image processing
    Given I have markdown content with links and images
      """
      [External link](https://example.com)
      [Internal link](/about)
      [Reference link][ref1]
      
      ![Alt text](image.jpg "Title")
      ![Remote image](https://example.com/image.png)
      
      [ref1]: https://reference.com
      """
    When I process the markdown content
    Then external links should open in new tab
    And internal links should use router navigation
    And images should have proper alt text and titles
    And reference links should be resolved

  Scenario: Table processing
    Given I have markdown content with tables
      """
      | Name | Age | City |
      |------|-----|------|
      | John | 30  | NYC  |
      | Jane | 25  | LA   |
      | Bob  | 35  | CHI  |
      """
    When I process the markdown content
    Then tables should have proper structure
    And table headers should be styled correctly
    And table rows should be formatted properly

  Scenario: Custom markdown extensions
    Given I have markdown content with custom syntax
      """
      ::: warning
      This is a warning callout
      :::
      
      ::: info
      This is an info callout
      :::
      
      [[toc]]
      """
    When I process the markdown content
    Then custom callouts should be rendered with proper styling
    And table of contents should be generated automatically
    And custom syntax should be transformed correctly

  Scenario: Frontmatter processing
    Given I have markdown content with frontmatter
      """
      ---
      title: "Sample Article"
      author: "John Doe"
      date: "2024-01-15"
      tags: ["vue", "nuxt", "markdown"]
      draft: false
      ---
      
      # Article Content
      
      This is the article body.
      """
    When I process the markdown content
    Then frontmatter should be extracted correctly
    And metadata should be available separately from content
    And content body should not include frontmatter

  Scenario: Markdown validation
    Given I have invalid markdown content
      """
      # Unclosed code block
      ```javascript
      function test() {
        console.log("missing closing backticks");
      
      [Broken link](
      """
    When I process the markdown content
    Then validation errors should be reported
    And partial content should still be rendered
    And error details should be logged

  Scenario: Performance with large markdown files
    Given I have a large markdown file with 1000+ lines
    And the file contains mixed content types
    When I process the markdown content
    Then processing should complete within 2 seconds
    And memory usage should remain under 50MB
    And the output should be correctly formatted

  Scenario: Markdown caching
    Given I have processed markdown content before
    And the content hasn't changed
    When I request the same markdown content again
    Then the cached version should be returned
    And processing time should be under 100ms
    And the content should be identical to the original

  Scenario: Real-time markdown preview
    Given I am editing markdown content
    When I make changes to the markdown
    Then the preview should update automatically
    And changes should be reflected within 500ms
    And scroll position should be maintained

  Scenario: Markdown content with special characters
    Given I have markdown content with special characters
      """
      # Título con acentos
      
      Content with émojis: 🚀 ✨ 💻
      
      Math expressions: E = mc²
      
      Unicode symbols: ← → ↑ ↓
      """
    When I process the markdown content
    Then special characters should be preserved
    And Unicode content should render correctly
    And HTML entities should be properly escaped