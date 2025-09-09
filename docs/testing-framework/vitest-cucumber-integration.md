# Vitest-Cucumber Integration Guide

## Overview

The testing framework provides seamless integration between Vitest and Cucumber-style BDD testing, allowing you to write natural language tests that execute in the high-performance Vitest environment.

## Setup and Configuration

### Framework Integration

The integration is automatically configured when you use the framework:

```javascript
import { setupFullBDD } from '@/tests/framework'

const { scenario, given, when, then } = await setupFullBDD({
  cucumberIntegration: true,
  nuxtIntegration: true
})
```

### Vitest Configuration

Your `vitest.config.js` is already optimized for BDD testing:

```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      'tests/setup/dom-setup.js',
      'tests/setup/global-setup.js'
    ],
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js',
      'tests/**/*.steps.js'  // BDD step files
    ]
  }
})
```

## Writing BDD Tests

### Method 1: Fluent API (Recommended)

```javascript
import { scenario } from '@/tests/framework'

describe('User Authentication', () => {
  it('should handle successful login', async () => {
    await scenario('Successful user login')
      .given.user.isOnLoginPage()
      .when.user.entersCredentials('user@example.com', 'password123')
      .then.user.shouldBeRedirectedTo('/dashboard')
      .and.page.shouldDisplay('Welcome')
      .execute()
  })
  
  it('should handle login failure', async () => {
    await scenario('Failed login attempt')
      .given.user.isOnLoginPage()
      .when.user.entersCredentials('user@example.com', 'wrongpassword')
      .then.user.shouldSeeError('Invalid credentials')
      .and.user.shouldRemainOnPage('/login')
      .execute()
  })
})
```

### Method 2: Traditional Step Definitions

```javascript
import { Given, When, Then, createTestContext } from '@/tests/framework'

const context = createTestContext()

Given('I am on the login page', async function() {
  await context.setupComponent()
  expect(context.wrapper().exists()).toBe(true)
})

When('I enter credentials {string} and {string}', async function(email, password) {
  const wrapper = context.wrapper()
  
  const emailInput = wrapper.find('[data-testid="email"]')
  const passwordInput = wrapper.find('[data-testid="password"]')
  
  await emailInput.setValue(email)
  await passwordInput.setValue(password)
  
  const submitButton = wrapper.find('[data-testid="submit"]')
  await submitButton.trigger('click')
})

Then('I should be redirected to {string}', function(path) {
  // Assertion logic here
  expect(mockRouter.push).toHaveBeenCalledWith(path)
})

describe('Login Feature', () => {
  it('executes login scenario', async () => {
    await context.executeStep('I am on the login page')
    await context.executeStep('I enter credentials "user@example.com" and "password123"')
    await context.executeStep('I should be redirected to "/dashboard"')
  })
})
```

## Step Definition Patterns

### Parameter Handling

```javascript
// String parameters
Given('I enter {string} in the search box', async function(searchTerm) {
  await this.fillField('search', searchTerm)
})

// Integer parameters  
When('I click the button {int} times', async function(count) {
  for (let i = 0; i < count; i++) {
    await this.clickButton('increment')
  }
})

// Float parameters
Then('the price should be ${float}', function(expectedPrice) {
  const price = this.getDisplayedPrice()
  expect(price).toBeCloseTo(expectedPrice, 2)
})

// Word parameters
Given('I am logged in as {word}', async function(userRole) {
  await this.loginAsRole(userRole)
})
```

### Data Tables

```javascript
When('I fill out the form with:', async function(dataTable) {
  const data = dataTable.hashes()[0]
  
  for (const [field, value] of Object.entries(data)) {
    await this.fillField(field, value)
  }
})

// Usage in test
/*
When I fill out the form with:
  | name  | email           | phone      |
  | John  | john@email.com  | 555-1234   |
*/
```

### Background Steps

```javascript
import { Background } from '@/tests/framework'

Background('Common setup', async function() {
  // This runs before each scenario
  await this.setupTestData()
  await this.authenticateUser()
})

describe('Dashboard Features', () => {
  // All tests will run the background steps first
  it('displays user profile', async () => {
    // Test implementation
  })
})
```

## Advanced Integration Features

### Scenario Context Sharing

```javascript
import { createTestContext } from '@/tests/framework'

describe('Shopping Cart Flow', () => {
  let sharedContext
  
  beforeEach(async () => {
    sharedContext = createTestContext()
    await sharedContext.setupComponent()
  })
  
  it('should add items to cart', async () => {
    const scenario = sharedContext.scenario('Add to cart')
    
    await scenario
      .given.user.isOnProductPage()
      .when.user.clicksAddToCart()
      .then.cart.shouldContainItem('Product Name')
      .execute()
      
    // Context persists for next test
    expect(sharedContext.state.cartItems).toHaveLength(1)
  })
  
  it('should proceed to checkout', async () => {
    // Continues from previous test context
    const scenario = sharedContext.scenario('Proceed to checkout')
    
    await scenario
      .given.cart.hasItems()
      .when.user.proceedsToCheckout()
      .then.user.shouldBeOnCheckoutPage()
      .execute()
  })
})
```

### Custom Step Generators

```javascript
import { registerStepGenerator } from '@/tests/framework'

// Register custom step patterns
registerStepGenerator('navigation', {
  pattern: 'I navigate to the (.*) page',
  type: 'When',
  generator: (match) => `
    await this.visit('/${match[1].toLowerCase()}')
    await this.waitForPageLoad()
  `,
  tags: ['navigation', 'page']
})

// Auto-generates step definition for:
// "When I navigate to the dashboard page"
```

### Parallel Test Execution

```javascript
import { describe, test } from 'vitest'
import { scenario } from '@/tests/framework'

describe.concurrent('Parallel BDD Tests', () => {
  test('User scenario 1', async () => {
    await scenario('First user flow')
      .given.user.hasRole('admin')
      .when.user.accessesAdminPanel()
      .then.adminPanel.shouldBeVisible()
      .execute()
  })
  
  test('User scenario 2', async () => {
    await scenario('Second user flow')
      .given.user.hasRole('member')
      .when.user.accessesMemberArea()
      .then.memberArea.shouldBeVisible()
      .execute()
  })
})
```

## Integration with Nuxt

### Testing Pages

```javascript
import { scenario } from '@/tests/framework'

describe('Nuxt Page Integration', () => {
  it('should test typing page functionality', async () => {
    await scenario('Typing tutor interaction')
      .given.user.isOnTypingPage()
      .when.user.startsTyping('const hello = "world"')
      .then.stats.shouldUpdate()
      .and.progress.shouldIncrease()
      .execute()
  })
})
```

### Testing Composables

```javascript
import { Given, When, Then } from '@/tests/framework'
import { useTypingMetrics } from '@/composables/useTypingMetrics'

Given('I have a typing metrics composable', function() {
  this.metrics = useTypingMetrics()
})

When('I update typing progress with {string}', function(userInput) {
  this.metrics.updateProgress(userInput, 'const target = "test"')
})

Then('the WPM should be calculated', function() {
  expect(this.metrics.wpm.value).toBeGreaterThan(0)
})
```

### Testing API Routes

```javascript
import { scenario } from '@/tests/framework'

describe('API Integration', () => {
  it('should handle API requests', async () => {
    await scenario('API interaction')
      .given.api.isAvailable()
      .when.user.submitsData({ name: 'test' })
      .then.api.shouldReceiveRequest('/api/users')
      .and.response.shouldBeSuccessful()
      .execute()
  })
})
```

## Debugging BDD Tests

### Debug Mode

```javascript
import { scenario } from '@/tests/framework'

await scenario('Debug scenario')
  .given.user.isOnPage('/')
  .when.user.clicks('.debug-button')
  .then.page.shouldUpdate()
  .debug() // Enables step-by-step debugging
```

### Step Logging

```javascript
import { Given } from '@/tests/framework'

Given('I am debugging', function() {
  console.log('Current wrapper state:', this.wrapper())
  console.log('Component props:', this.wrapper().props())
  console.log('Component state:', this.wrapper().vm)
})
```

### Visual Testing Integration

```javascript
import { scenario } from '@/tests/framework'

await scenario('Visual regression')
  .given.user.isOnPage('/dashboard')
  .when.page.isFullyLoaded()
  .then.page.shouldMatchSnapshot()
  .execute()
```

## Performance Optimization

### Lazy Step Loading

```javascript
// Only load step definitions when needed
const loadSteps = () => import('./heavy-steps.js')

Given('I need heavy computation', async function() {
  const { heavyStep } = await loadSteps()
  return heavyStep.call(this)
})
```

### Step Caching

```javascript
import { memoize } from 'lodash'

// Cache expensive step operations
const expensiveSetup = memoize(async function() {
  return await setupComplexTestData()
})

Given('I have complex test data', async function() {
  this.testData = await expensiveSetup()
})
```

### Selective Test Running

```javascript
// Run only BDD tests
npm run test -- --grep "scenario"

// Run specific feature
npm run test -- tests/features/login.test.js

// Run with coverage
npm run test:coverage -- --grep "BDD"
```

## Migration from Pure Cucumber

### Convert .feature Files

```gherkin
# Old: login.feature
Feature: User Login
  Scenario: Successful login
    Given I am on the login page
    When I enter valid credentials
    Then I should see the dashboard
```

```javascript
// New: login.test.js
import { scenario } from '@/tests/framework'

describe('User Login Feature', () => {
  it('should handle successful login', async () => {
    await scenario('Successful login')
      .given.user.isOnLoginPage()
      .when.user.entersValidCredentials()
      .then.user.shouldSeeDashboard()
      .execute()
  })
})
```

### Step Definition Migration

```javascript
// Old: Cucumber step definitions
import { Given, When, Then } from '@cucumber/cucumber'

// New: Framework step definitions  
import { Given, When, Then } from '@/tests/framework'
// API remains the same, but with enhanced features
```

## Best Practices

1. **Use Fluent API**: Prefer fluent scenarios for readability
2. **Keep Steps Atomic**: Each step should do one thing
3. **Share Context Wisely**: Use context for data, not complex objects
4. **Test Business Logic**: Focus on user workflows
5. **Parallel Execution**: Use concurrent tests for independent scenarios
6. **Smart Assertions**: Leverage framework's built-in assertions

## Troubleshooting

### Common Issues

1. **Step Not Found**: Ensure step definitions are imported
2. **Context Issues**: Use proper context setup and cleanup
3. **Timing Issues**: Add proper waits for async operations
4. **Memory Leaks**: Clean up context in afterEach hooks

### Debug Commands

```bash
# Run with debug output
npm run test -- --reporter=verbose

# Run specific BDD test
npm run test -- --grep "scenario.*login"

# Run with browser debugging (if using @vitest/ui)
npm run test:ui
```

This integration provides the best of both worlds: Cucumber's natural language expressiveness with Vitest's performance and DX!