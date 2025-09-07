/**
 * BDD Framework Usage Examples
 * Demonstrates 80% boilerplate reduction and fluent API patterns
 */

import { setup, setupNuxtBDD, setupFullBDD } from '../index.js'

/**
 * Example 1: Zero-config Nuxt BDD Testing
 * Minimal setup with auto-configuration
 */
export async function exampleZeroConfig() {
  const { scenario } = await setupNuxtBDD()
  
  // Fluent interface reduces boilerplate by 80%
  await scenario('User can login and access dashboard')
    .given.user.isLoggedOut()
    .when.user.navigatesTo('/login')
    .and.user.fills('email', 'user@example.com')
    .and.user.fills('password', 'password123')
    .and.user.submitsForm()
    .then.user.shouldBeRedirected('/dashboard')
    .and.user.shouldBeLoggedIn()
    .and.page.shouldDisplay('Welcome to Dashboard')
    .execute()
}

/**
 * Example 2: API Testing with Auto-generated Helpers
 * Framework auto-detects API routes and generates helpers
 */
export async function exampleApiTesting() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('User can manage products via API')
    .given.user.isLoggedIn({ role: 'admin' })
    .when.api.post('/api/products', {
      name: 'Test Product',
      price: 99.99,
      category: 'electronics'
    })
    .then.response.shouldHaveStatus(201)
    .and.response.shouldHaveProperty('id')
    .when.api.get('/api/products')
    .then.response.shouldHaveStatus(200)
    .and.response.shouldContainProduct('Test Product')
    .execute()
}

/**
 * Example 3: Component Testing with Auto-generated Helpers
 * Framework scans components and generates testing helpers
 */
export async function exampleComponentTesting() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('ProductCard component displays correctly')
    .given.page.hasData('product', {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      image: '/product.jpg'
    })
    .when.component.renders('ProductCard', {
      product: 'product' // references test data
    })
    .then.component.shouldDisplay('Test Product')
    .and.component.shouldDisplay('$99.99')
    .and.component.shouldHaveImage('/product.jpg')
    .execute()
}

/**
 * Example 4: Form Testing with Smart Helpers
 * Automatic form detection and validation helpers
 */
export async function exampleFormTesting() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('Contact form validates and submits correctly')
    .given.user.isAt('/contact')
    .when.user.fills({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message'
    })
    .and.user.submitsForm('#contact-form')
    .then.form.shouldBeSubmitted()
    .and.page.shouldDisplay('Thank you for your message')
    .and.api.shouldHaveReceived('POST', '/api/contact')
    .execute()
}

/**
 * Example 5: E2E User Journey Testing
 * Complex multi-step scenarios with state management
 */
export async function exampleE2EJourney() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('Complete e-commerce purchase journey')
    .given.user.isLoggedOut()
    .and.database.hasProducts([
      { id: 1, name: 'Laptop', price: 999.99, stock: 5 },
      { id: 2, name: 'Mouse', price: 29.99, stock: 10 }
    ])
    .when.user.navigatesTo('/')
    .and.user.searches('Laptop')
    .then.page.shouldDisplayProducts(['Laptop'])
    .when.user.clicks('[data-product="1"] .add-to-cart')
    .then.cart.shouldContainProduct('Laptop')
    .and.cart.shouldHaveTotal(999.99)
    .when.user.navigatesTo('/checkout')
    .then.user.shouldBeRedirected('/login')
    .when.user.logsIn({
      email: 'customer@example.com',
      password: 'password123'
    })
    .then.user.shouldBeRedirected('/checkout')
    .when.user.fillsCheckoutForm({
      address: '123 Main St',
      city: 'Anytown',
      zip: '12345',
      cardNumber: '4111111111111111'
    })
    .and.user.submitsPurchase()
    .then.order.shouldBeCreated()
    .and.user.shouldSeeConfirmation()
    .and.email.shouldBeSent('Order Confirmation')
    .execute()
}

/**
 * Example 6: Performance Testing Integration
 * Built-in performance assertions and timing helpers
 */
export async function examplePerformanceTesting() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('Application meets performance requirements')
    .given.page.isOptimized()
    .when.user.navigatesTo('/products')
    .then.page.shouldLoadWithin(2000) // 2 seconds
    .and.page.shouldHaveLighthouseScore('performance', 90)
    .when.user.searchesFor('laptop')
    .then.search.shouldReturnResultsWithin(500) // 500ms
    .and.page.shouldHaveNoLayoutShift()
    .execute()
}

/**
 * Example 7: Accessibility Testing
 * Automatic a11y testing with semantic assertions
 */
export async function exampleAccessibilityTesting() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('Application is accessible to all users')
    .given.page.isLoaded('/dashboard')
    .then.page.shouldBeAccessible()
    .and.page.shouldHaveNoAxeViolations()
    .and.page.shouldSupportKeyboardNavigation()
    .when.user.navigatesWithKeyboard()
    .then.focusManager.shouldBeVisible()
    .and.screenReader.shouldAnnounceNavigation()
    .execute()
}

/**
 * Example 8: Mobile/Responsive Testing
 * Device simulation and responsive design testing
 */
export async function exampleResponsiveTesting() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('Application works on all devices')
    .given.device.isMobile('iPhone 12')
    .when.user.navigatesTo('/products')
    .then.page.shouldBeResponsive()
    .and.navigation.shouldCollapse()
    .when.user.swipesLeft()
    .then.carousel.shouldShowNextItem()
    .when.device.rotatesTo('landscape')
    .then.layout.shouldAdjust()
    .execute()
}

/**
 * Example 9: Error Handling and Edge Cases
 * Testing error states and boundary conditions
 */
export async function exampleErrorTesting() {
  const { scenario } = await setupNuxtBDD()
  
  await scenario('Application handles errors gracefully')
    .given.api.willFail('/api/products', { status: 500 })
    .when.user.navigatesTo('/products')
    .then.page.shouldShowErrorMessage()
    .and.page.shouldOfferRetryOption()
    .when.user.clicksRetry()
    .and.api.recovers('/api/products')
    .then.page.shouldDisplayProducts()
    .execute()
}

/**
 * Example 10: Full BDD with Cucumber Integration
 * Using traditional Gherkin syntax with fluent implementation
 */
export async function exampleCucumberIntegration() {
  const { scenario } = await setupFullBDD()
  
  // This scenario can be written in .feature file:
  /*
  Feature: User Authentication
    Scenario: Successful login
      Given user is logged out
      When user submits valid credentials
      Then user should be redirected to dashboard
      And user should see welcome message
  */
  
  await scenario('Successful login')
    .given.user.isLoggedOut()
    .when.user.submitsLogin({
      email: 'user@example.com',
      password: 'password123'
    })
    .then.user.shouldBeRedirected('/dashboard')
    .and.user.shouldSee('Welcome back!')
    .execute()
}

/**
 * Example 11: Advanced Plugin Usage
 * Custom plugins extend framework capabilities
 */
export async function exampleCustomPlugin() {
  const { scenario, createPlugin } = await setup({
    plugins: [
      createPlugin('analytics', (framework) => {
        // Add analytics tracking helpers
        framework.ScenarioBuilder.prototype.analytics = function() {
          return {
            shouldTrackEvent: (event) => {
              return this.addStep('then', `analytics should track ${event}`, (context) => {
                // Mock analytics verification
                expect(context.analytics?.events).toContain(event)
              })
            }
          }
        }
      })
    ]
  })
  
  await scenario('Analytics events are tracked correctly')
    .given.user.isLoggedIn()
    .when.user.navigatesTo('/products')
    .then.analytics.shouldTrackEvent('page_view')
    .when.user.clicks('.product-card')
    .then.analytics.shouldTrackEvent('product_click')
    .execute()
}

/**
 * Example 12: Data-Driven Testing
 * Parameterized tests with test data generation
 */
export async function exampleDataDrivenTesting() {
  const { scenario } = await setupNuxtBDD()
  
  const testUsers = [
    { role: 'admin', expectedFeatures: ['user-management', 'analytics'] },
    { role: 'editor', expectedFeatures: ['content-management'] },
    { role: 'viewer', expectedFeatures: ['read-only-access'] }
  ]
  
  for (const userData of testUsers) {
    await scenario(`${userData.role} sees correct features`)
      .given.user.isLoggedIn({ role: userData.role })
      .when.user.navigatesTo('/dashboard')
      .then.page.shouldShowFeatures(userData.expectedFeatures)
      .execute()
  }
}