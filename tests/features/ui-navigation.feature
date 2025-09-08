Feature: UI Navigation and Routing
  As a user
  I want to navigate through the application seamlessly
  So that I can access different sections and features

  Background:
    Given I am on the application homepage

  @navigation @desktop
  Scenario: Navigate to main sections using desktop navigation menu
    Given I am using a desktop browser with viewport "1920x1080"
    When I click on the "About" navigation link
    Then I should be redirected to "/about" page
    And the page title should contain "About"
    And the "About" navigation link should be highlighted as active

  @navigation @mobile
  Scenario: Mobile hamburger menu navigation
    Given I am using a mobile browser with viewport "375x667"
    When I click on the hamburger menu button
    Then the mobile navigation menu should slide open
    And I should see navigation links for "Home", "About", "Services", "Contact"
    When I click on the "Services" link
    Then the mobile menu should close
    And I should be redirected to "/services" page

  @navigation @tablet
  Scenario: Tablet navigation behavior
    Given I am using a tablet browser with viewport "768x1024"
    When I rotate the device to landscape orientation
    Then the navigation should adapt to horizontal layout
    And all navigation links should remain visible
    When I rotate back to portrait orientation
    Then the navigation should adapt to vertical layout

  @navigation @breadcrumbs
  Scenario Outline: Breadcrumb navigation on nested pages
    Given I am on the "<current_page>" page
    Then I should see breadcrumb navigation
    And the breadcrumb should show "<breadcrumb_path>"
    When I click on the "<breadcrumb_link>" breadcrumb
    Then I should be redirected to "<expected_page>" page

    Examples:
      | current_page        | breadcrumb_path           | breadcrumb_link | expected_page |
      | /services/web-dev   | Home > Services > Web Dev | Services        | /services     |
      | /about/team         | Home > About > Team       | About           | /about        |
      | /blog/2024/article  | Home > Blog > 2024 > Article | Blog         | /blog         |

  @navigation @keyboard
  Scenario: Keyboard navigation accessibility
    Given I am using keyboard navigation
    When I press the "Tab" key repeatedly
    Then I should be able to focus on each navigation link in sequence
    And focused links should have visible focus indicators
    When I press "Enter" on a focused link
    Then I should navigate to the corresponding page

  @navigation @search
  Scenario: Navigation search functionality
    Given there is a search box in the navigation
    When I type "typing tutor" in the search box
    Then I should see search suggestions appear
    And suggestions should include relevant pages
    When I click on a search suggestion
    Then I should be redirected to the selected page

  @navigation @mobile @performance
  Scenario: Fast mobile navigation with service worker
    Given I am using a mobile browser with viewport "375x667"
    And the service worker is active
    When I navigate to "/typing" page
    Then the page should load within 2 seconds
    And navigation should work offline after first visit
    When I go offline
    And I click on a previously visited navigation link
    Then the cached page should load successfully

  @navigation @error-handling
  Scenario: Navigation error handling
    Given I am on any page
    When I navigate to a non-existent route "/invalid-page"
    Then I should see a 404 error page
    And the navigation menu should still be functional
    And I should see a link to return to homepage

  @navigation @deep-linking
  Scenario: Direct URL access and deep linking
    Given I directly access the URL "/typing?mode=practice&level=advanced"
    Then the typing page should load with the correct mode and level
    And the URL parameters should be preserved
    When I refresh the page
    Then the same configuration should be maintained

  @navigation @multi-device
  Scenario: Cross-device navigation state
    Given I am logged in on my desktop browser
    When I bookmark a page and share the link
    And I open the shared link on my mobile device
    Then I should see the same content
    And the mobile navigation should work correctly
    But I should be prompted to log in if needed