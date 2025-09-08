Feature: Performance Metrics and Core Web Vitals
  As a user
  I want the application to load quickly and respond smoothly
  So that I have an excellent user experience

  Background:
    Given the application is deployed in a production-like environment
    And performance monitoring tools are available
    And network conditions are simulated

  @performance @core-web-vitals @critical
  Scenario: Core Web Vitals Compliance
    Given I am measuring Core Web Vitals on the main pages
    When I load the page and interact with it
    Then Largest Contentful Paint (LCP) should be <= 2.5 seconds
    And First Input Delay (FID) should be <= 100 milliseconds
    And Cumulative Layout Shift (CLS) should be <= 0.1
    And First Contentful Paint (FCP) should be <= 1.8 seconds
    And Time to Interactive (TTI) should be <= 3.8 seconds

  @performance @loading @critical
  Scenario: Page Load Performance
    Given I am testing page load times
    When I navigate to different pages
    Then initial page load should complete within 3 seconds on 3G connection
    And subsequent page navigations should complete within 1 second
    And total blocking time should be <= 300 milliseconds
    And Speed Index should be <= 3.0 seconds
    And the page should be visually complete within 4 seconds

  @performance @bundle-size @high
  Scenario: Bundle Size Optimization
    Given I am analyzing the application bundle
    When I check the built application assets
    Then the main JavaScript bundle should be <= 250KB gzipped
    And the main CSS bundle should be <= 50KB gzipped
    And total initial download size should be <= 500KB gzipped
    And code splitting should defer non-critical resources
    And unused code should be tree-shaken

  @performance @runtime @critical
  Scenario: Runtime Performance in Typing Tutor
    Given I am using the typing tutor feature
    When I type at various speeds (20-120 WPM)
    Then keystroke response time should be <= 16ms (60fps)
    And real-time metrics updates should not cause frame drops
    And memory usage should remain stable during extended sessions
    And CPU usage should stay below 30% on mid-range devices
    And no memory leaks should occur after 30 minutes of use

  @performance @mobile @high
  Scenario: Mobile Performance
    Given I am testing on mobile devices and slow networks
    When I use the application on mobile
    Then pages should load within 5 seconds on slow 3G (1.6Mbps)
    And touch response should be immediate (<100ms)
    And scrolling should maintain 60fps
    And battery drain should be minimal during normal usage
    And the app should work offline with cached content

  @performance @memory @high
  Scenario: Memory Management
    Given I am monitoring memory usage
    When I use the application for extended periods
    Then memory usage should not exceed 100MB for main thread
    And memory leaks should not occur after page navigation
    And DOM nodes should be properly cleaned up
    And event listeners should be removed when components unmount
    And large objects should be garbage collected appropriately

  @performance @network @medium
  Scenario: Network Efficiency
    Given I am analyzing network requests
    When the application loads and operates
    Then critical resources should be prioritized
    And HTTP/2 should be used for multiplexing
    And compression (Brotli/Gzip) should be enabled
    And images should be optimized and served in modern formats (WebP/AVIF)
    And lazy loading should be implemented for below-the-fold content

  @performance @caching @high
  Scenario: Caching Strategy
    Given I am testing cache behavior
    When I revisit pages and reload content
    Then static assets should be cached for at least 1 year
    And API responses should have appropriate cache headers
    And service worker should cache critical resources
    And cache hit ratio should be >= 80% for returning visitors
    And stale-while-revalidate strategy should be used for dynamic content

  @performance @rendering @high
  Scenario: Rendering Performance
    Given I am measuring rendering metrics
    When pages load and update
    Then above-the-fold content should render within 1.5 seconds
    And layout thrashing should be minimized (< 5 reflows per interaction)
    And paint operations should be optimized
    And animations should run at 60fps
    And critical CSS should be inlined for first paint

  @performance @lighthouse @critical
  Scenario: Lighthouse Performance Score
    Given I am running Lighthouse audits
    When I test key application pages
    Then Performance score should be >= 90
    And Best Practices score should be >= 95
    And SEO score should be >= 95
    And Progressive Web App score should be >= 90 (if PWA features implemented)
    And all performance opportunities should be addressed