Feature: SEO Optimization
  As a website owner
  I want the application to be search engine optimized
  So that users can discover and access the content easily

  Background:
    Given the application is running
    And SEO analysis tools are available
    And search engine crawlers can access the site

  @seo @meta-tags @critical
  Scenario: Essential Meta Tags
    Given I am on any page of the application
    When I inspect the HTML head section
    Then every page should have a unique title tag <= 60 characters
    And every page should have a unique meta description <= 160 characters
    And meta charset should be set to UTF-8
    And viewport meta tag should be present for responsive design
    And canonical URL should be specified to prevent duplicate content

  @seo @structured-data @high
  Scenario: Structured Data Implementation
    Given I am analyzing the page markup
    When I check for structured data
    Then JSON-LD schema markup should be present
    And WebSite schema should be implemented for site-wide info
    And BreadcrumbList schema should be used for navigation
    And Article/WebPage schema should be used for content pages
    And Organization/Person schema should define site ownership

  @seo @headings @critical
  Scenario: Heading Structure
    Given I am on any content page
    When I analyze the heading hierarchy
    Then each page should have exactly one H1 tag
    And heading levels should follow logical order (H1 > H2 > H3)
    And headings should contain relevant keywords
    And heading text should accurately describe the content below
    And no heading levels should be skipped

  @seo @urls @high
  Scenario: URL Structure and Clean URLs
    Given I am navigating through the application
    When I examine the URL structure
    Then URLs should be descriptive and human-readable
    And URLs should use hyphens to separate words
    And URLs should be lowercase
    And URLs should not exceed 255 characters
    And trailing slashes should be handled consistently

  @seo @internal-linking @high
  Scenario: Internal Link Structure
    Given I am analyzing the site's link structure
    When I crawl internal links
    Then all internal links should be functional (no 404s)
    And important pages should be reachable within 3 clicks from homepage
    And anchor text should be descriptive, not generic
    And rel="noopener" should be used for external links
    And orphaned pages should not exist

  @seo @images @medium
  Scenario: Image Optimization for SEO
    Given the application contains images
    When I analyze image SEO attributes
    Then all images should have descriptive alt attributes
    And file names should be descriptive with hyphens
    And images should be compressed and optimized
    And lazy loading should be implemented for non-critical images
    And next-gen formats (WebP/AVIF) should be used where supported

  @seo @page-speed @critical
  Scenario: Page Speed for SEO
    Given I am measuring page speed metrics
    When I test pages with speed testing tools
    Then Core Web Vitals should meet Google's thresholds
    And PageSpeed Insights score should be >= 90
    And Time to First Byte (TTFB) should be <= 600ms
    And pages should load completely within 3 seconds
    And mobile page speed should not significantly differ from desktop

  @seo @content @high
  Scenario: Content Quality and Relevance
    Given I am analyzing page content
    When I review content for SEO factors
    Then each page should have at least 300 words of unique content
    And keyword density should be natural (1-3%)
    And content should be original and not duplicated
    And content should be regularly updated with fresh information
    And headings and content should align with search intent

  @seo @mobile-seo @critical
  Scenario: Mobile SEO Compliance
    Given I am testing mobile SEO factors
    When I analyze mobile-specific SEO elements
    Then the site should be mobile-friendly according to Google's test
    And text should be readable without zooming
    And tap targets should be appropriately sized (>= 48px)
    And horizontal scrolling should not be required
    And mobile page speed should be optimized

  @seo @technical @high
  Scenario: Technical SEO Implementation
    Given I am performing technical SEO analysis
    When I check technical SEO factors
    Then robots.txt file should be present and properly configured
    And XML sitemap should be generated and submitted
    And SSL certificate should be properly implemented (HTTPS)
    And 301 redirects should be used for moved content
    And 404 pages should provide helpful navigation options

  @seo @social-media @medium
  Scenario: Social Media Optimization
    Given I am checking social media integration
    When I analyze social sharing capabilities
    Then Open Graph tags should be implemented for Facebook sharing
    And Twitter Cards should be configured for Twitter sharing
    And social sharing buttons should be present on content pages
    And social meta tags should have appropriate images and descriptions
    And social media profiles should be linked in structured data

  @seo @local-seo @medium
  Scenario: Local SEO (if applicable)
    Given the application has location-based content
    When I check local SEO implementation
    Then NAP (Name, Address, Phone) should be consistent across pages
    And LocalBusiness schema should be implemented
    And location pages should have unique content
    And local keywords should be naturally integrated
    And contact information should be easily accessible

  @seo @analytics @high
  Scenario: SEO Analytics and Monitoring
    Given SEO monitoring tools are in place
    When I check analytics implementation
    Then Google Analytics should be properly configured
    And Google Search Console should be set up and verified
    And organic traffic should be tracked and monitored
    And keyword rankings should be monitored
    And Core Web Vitals should be tracked in real-world usage