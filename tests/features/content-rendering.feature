Feature: Content Rendering
  As a user
  I want content to be rendered properly across different contexts
  So that information is displayed consistently and beautifully

  Background:
    Given the content management system is initialized
    And content rendering engine is enabled

  Scenario: HTML content rendering
    Given I have processed markdown content
      """
      # Main Title
      
      This paragraph has **bold** and *italic* text.
      
      ```javascript
      console.log('Hello World');
      ```
      
      - List item 1
      - List item 2
      """
    When I render the content as HTML
    Then headings should have proper HTML tags
    And text formatting should use appropriate HTML elements
    And code blocks should have syntax highlighting
    And lists should render as proper HTML lists

  Scenario: Responsive content layout
    Given I have content with various elements
    When I render content on different screen sizes
      | Device | Width | Expected Behavior |
      | Mobile | 375px | Single column, larger text |
      | Tablet | 768px | Optimized for touch, medium text |
      | Desktop | 1200px | Multi-column where appropriate |
    Then layout should adapt to screen size
    And text should remain readable at all sizes
    And images should scale appropriately

  Scenario: Theme-based content rendering
    Given I have content to render
    When I apply different themes
      | Theme | Background | Text Color | Accent Color |
      | Light | #ffffff | #333333 | #007acc |
      | Dark | #1a1a1a | #e0e0e0 | #4fc3f7 |
      | High Contrast | #000000 | #ffffff | #ffff00 |
    Then content should render with theme-appropriate colors
    And contrast ratios should meet accessibility standards
    And theme switching should be seamless

  Scenario: Custom component rendering
    Given I have content with custom components
      """
      # Article Title
      
      <CalloutBox type="warning">
        This is important information!
      </CalloutBox>
      
      <CodeExample language="vue">
        <template>
          <div>Hello Vue!</div>
        </template>
      </CodeExample>
      
      <ImageGallery images="gallery1" />
      """
    When I render the content
    Then custom components should be rendered correctly
    And component props should be processed
    And components should have proper styling

  Scenario: Content with embedded media
    Given I have content with various media types
      """
      # Media Examples
      
      ![Local Image](./images/example.jpg)
      ![Remote Image](https://example.com/image.png)
      
      <video src="./videos/demo.mp4" controls></video>
      
      <iframe src="https://www.youtube.com/embed/xyz" frameborder="0"></iframe>
      """
    When I render the content
    Then images should load with proper alt text
    And videos should have playback controls
    And embedded content should be responsive
    And lazy loading should be applied where appropriate

  Scenario: Mathematics and formula rendering
    Given I have content with mathematical expressions
      """
      # Mathematical Concepts
      
      Inline math: $E = mc^2$
      
      Block math:
      $$
      \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
      $$
      
      Chemical formula: H₂O
      """
    When I render the content
    Then inline math should render properly formatted
    And block math should be displayed prominently
    And special characters should render correctly
    And formulas should be accessible to screen readers

  Scenario: Content internationalization
    Given I have content in multiple languages
      | Language | Content |
      | English | "Hello World" |
      | Spanish | "Hola Mundo" |
      | French | "Bonjour Monde" |
      | Arabic | "مرحبا بالعالم" |
      | Chinese | "你好世界" |
    When I render content for different locales
    Then text direction should be correct (LTR/RTL)
    And fonts should support the character set
    And date/time formats should be localized
    And number formats should follow locale conventions

  Scenario: Print-friendly rendering
    Given I have web content to print
    When I render content for print media
    Then print-specific CSS should be applied
    And page breaks should be optimized
    And Colors should be print-appropriate
    And URLs should be expanded for reference
    And unnecessary navigation should be hidden

  Scenario: Content performance optimization
    Given I have content with multiple assets
    When I render the content
    Then images should be optimized for web delivery
    And critical CSS should be inlined
    And non-critical resources should be lazy-loaded
    And content should render within 2 seconds
    And Core Web Vitals should meet good thresholds

  Scenario: Accessibility in content rendering
    Given I have content with various elements
    When I render content with accessibility in mind
    Then all images should have alt text
    And headings should follow proper hierarchy
    And links should have descriptive text
    And Color contrast should meet WCAG standards
    And Content should be screen reader friendly

  Scenario: Content caching and updates
    Given I have rendered content cached in browser
    When content is updated on the server
    Then cached content should be invalidated appropriately
    And new content should be fetched
    And Users should see updated content without hard refresh
    And Cache headers should be set correctly

  Scenario: Error handling in rendering
    Given I have content with rendering errors
      """
      # Valid Content
      
      <InvalidComponent prop="test">
        Content here
      </InvalidComponent>
      
      ![Broken Image](./non-existent.jpg)
      
      <script>alert('potentially harmful')</script>
      """
    When I attempt to render the content
    Then invalid components should show fallback content
    And broken images should show placeholder
    And potentially harmful scripts should be sanitized
    And Error messages should be logged for debugging

  Scenario: Real-time content rendering
    Given I have content that updates in real-time
    When content changes are pushed from server
    Then rendered content should update automatically
    And Changes should be visually highlighted
    And Smooth transitions should be applied
    And User's reading position should be preserved

  Scenario: Content rendering with user preferences
    Given I have user-customizable rendering options
    When user sets preferences
      | Preference | Value |
      | Font Size | Large |
      | Line Height | 1.6 |
      | Reading Width | 650px |
      | Animation | Reduced |
    Then content should render according to preferences
    And Preferences should persist across sessions
    And Changes should apply immediately
    And Accessibility preferences should be respected

  Scenario: Content table rendering
    Given I have complex table content
      """
      | Name | Age | Department | Salary | Start Date |
      |------|-----|------------|--------|------------|
      | John Doe | 30 | Engineering | $75,000 | 2020-01-15 |
      | Jane Smith | 28 | Design | $70,000 | 2019-06-01 |
      | Bob Johnson | 35 | Marketing | $65,000 | 2018-03-20 |
      """
    When I render the table
    Then tables should be responsive on mobile
    And Column headers should be sticky when scrolling
    And Data should be properly aligned
    And Tables should be accessible to screen readers
    And Sorting functionality should be available if enabled

  Scenario: Content with interactive elements
    Given I have content with interactive components
      """
      # Interactive Content
      
      <Poll question="What's your favorite framework?">
        <Option>Vue</Option>
        <Option>React</Option>
        <Option>Angular</Option>
      </Poll>
      
      <Accordion title="FAQ Section">
        <AccordionItem title="Question 1">
          Answer to question 1
        </AccordionItem>
      </Accordion>
      """
    When I render the content
    Then interactive elements should be fully functional
    And User interactions should be tracked if enabled
    And Components should maintain state appropriately
    And Keyboard navigation should work correctly