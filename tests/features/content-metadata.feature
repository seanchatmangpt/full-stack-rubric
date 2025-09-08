Feature: Content Metadata Handling
  As a content manager
  I want to manage content metadata effectively
  So that content can be properly organized, searched, and displayed

  Background:
    Given the content management system is initialized
    And metadata processing is enabled

  Scenario: Frontmatter metadata extraction
    Given I have content with YAML frontmatter
      """
      ---
      title: "Getting Started with Vue"
      author: "Jane Doe"
      date: "2024-01-15"
      tags: ["vue", "javascript", "tutorial"]
      category: "Frontend"
      draft: false
      featured: true
      reading_time: 10
      description: "A comprehensive guide to Vue.js"
      ---
      
      # Content starts here
      """
    When I process the content
    Then all frontmatter fields should be extracted correctly
    And metadata should be available as structured data
    And content body should be separate from metadata

  Scenario: Metadata validation
    Given I have content with invalid metadata
      """
      ---
      title: 123  # Should be string
      date: "invalid-date"  # Should be valid date
      tags: "not-an-array"  # Should be array
      required_field: # Missing value
      ---
      """
    When I process the content
    Then validation errors should be reported
    And specific field errors should be detailed
    And valid fields should still be processed
    And defaults should be applied where appropriate

  Scenario: Dynamic metadata generation
    Given I have content without complete metadata
      """
      # My Article Title
      
      This article talks about Vue components and how to build them effectively.
      It covers best practices and common patterns.
      """
    When I process the content
    Then title should be extracted from first heading
    And reading time should be calculated automatically
    And word count should be generated
    And excerpt should be created from first paragraph

  Scenario: Metadata inheritance and defaults
    Given I have content in a category folder
    And the folder has default metadata
      """
      _defaults.yml:
      category: "Tutorials"
      author: "Content Team"
      template: "tutorial-layout"
      """
    When I process content in that folder
    Then folder defaults should be applied
    And content-specific metadata should override defaults
    And inherited values should be clearly identified

  Scenario: Tag normalization and management
    Given I have content with various tag formats
      | Content | Tags |
      | Post 1  | ["Vue", "vue", "VUE"] |
      | Post 2  | ["JavaScript", "js", "JS"] |
      | Post 3  | ["Front-End", "frontend", "front end"] |
    When I process the content
    Then tags should be normalized to consistent format
    And duplicate tags should be merged
    And tag aliases should be resolved
    And tag hierarchy should be maintained

  Scenario: Author metadata and profiles
    Given I have content with author information
      """
      ---
      author: "john.doe"
      co_authors: ["jane.smith", "bob.wilson"]
      ---
      """
    And I have author profile data
      | ID | Name | Bio | Avatar |
      | john.doe | John Doe | Senior Developer | john.jpg |
      | jane.smith | Jane Smith | UX Designer | jane.jpg |
    When I process the content
    Then author profiles should be linked correctly
    And author information should be enriched with profile data
    And co-author relationships should be established

  Scenario: Date and timestamp handling
    Given I have content with various date formats
      | Field | Value |
      | created | "2024-01-15T10:30:00Z" |
      | modified | "2024-02-20" |
      | published | "2024-01-20 15:45" |
    When I process the content metadata
    Then all dates should be parsed to consistent format
    And timezone information should be preserved
    And date relationships should be validated (modified >= created)
    And relative timestamps should be available

  Scenario: SEO metadata management
    Given I have content for SEO optimization
      """
      ---
      title: "Vue Components Guide"
      meta_title: "Complete Vue Components Guide 2024"
      meta_description: "Learn to build reusable Vue components with this comprehensive guide"
      keywords: ["vue components", "vue.js", "frontend development"]
      og_title: "Vue Components Guide"
      og_description: "Master Vue.js components"
      og_image: "vue-guide-cover.jpg"
      twitter_card: "summary_large_image"
      ---
      """
    When I process the content
    Then SEO metadata should be properly formatted
    And Open Graph tags should be generated
    And Twitter Card data should be prepared
    And missing SEO fields should use fallbacks

  Scenario: Custom metadata fields
    Given I have content with custom metadata schema
      """
      ---
      title: "Product Review"
      product_name: "Laptop XYZ"
      rating: 4.5
      price: 999.99
      availability: "in-stock"
      specs:
        cpu: "Intel i7"
        ram: "16GB"
        storage: "512GB SSD"
      ---
      """
    When I process the content
    Then custom fields should be preserved
    And nested metadata should be accessible
    And data types should be maintained
    And custom validation rules should apply

  Scenario: Metadata versioning and history
    Given I have content metadata that changes over time
    When I update metadata fields
    Then previous versions should be tracked
    And change history should be maintained
    And I should be able to revert to previous versions
    And metadata diff should be available

  Scenario: Bulk metadata operations
    Given I have multiple content files
    When I perform bulk metadata updates
      """
      Update all files in "tutorials" category:
      - Set template: "new-tutorial-layout"
      - Add tag: "updated-2024"
      - Update author: "content-team"
      """
    Then all matching files should be updated
    And changes should be applied atomically
    And update summary should be provided
    And rollback should be possible

  Scenario: Metadata search and filtering
    Given I have content with rich metadata
    When I search by metadata criteria
      """
      Filter criteria:
      - author: "john.doe"
      - category: "Frontend"
      - tags: contains "vue"
      - date: after "2024-01-01"
      - featured: true
      """
    Then matching content should be returned
    And metadata fields should be searchable
    And complex queries should be supported
    And results should include metadata preview

  Scenario: Metadata export and import
    Given I have content with complete metadata
    When I export metadata to CSV/JSON format
    Then all metadata fields should be included
    And export should maintain data types
    And relationships should be preserved
    When I import updated metadata
    Then content should be updated accordingly
    And import conflicts should be handled gracefully

  Scenario: Metadata API access
    Given content metadata is processed
    When I access metadata via API
    Then structured metadata should be available
    And API should support filtering and sorting
    And metadata updates should be real-time
    And API responses should include metadata schema

  Scenario: Content relationships through metadata
    Given I have content with relationship metadata
      """
      ---
      title: "Advanced Vue"
      prerequisites: ["basic-vue", "javascript-fundamentals"]
      related_posts: ["vue-components", "vue-routing"]
      series: "vue-mastery"
      series_order: 3
      ---
      """
    When I process the content relationships
    Then content connections should be established
    And bidirectional links should be created
    And series ordering should be maintained
    And related content should be easily accessible