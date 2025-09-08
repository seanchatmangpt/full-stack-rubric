# @nuxt/bdd

> BDD (Behavior-Driven Development) testing utilities and framework for Nuxt.js applications

## Features

- 🚀 **Easy Setup** - Simple integration with Nuxt.js projects  
- 🧪 **Vitest Integration** - Seamless integration with Vitest testing framework
- 🥒 **Cucumber Support** - Full BDD with Gherkin syntax support
- 🎯 **Page Testing** - Utilities for testing Nuxt pages and routes
- 🧩 **Component Testing** - Enhanced Vue component testing utilities
- 📝 **Common Steps** - Pre-built step definitions for common scenarios
- 🏷️ **TypeScript** - Full TypeScript support with type definitions
- ⚡ **ESM/CJS** - Supports both ES modules and CommonJS

## Installation

```bash
# pnpm (recommended)
pnpm add -D @nuxt/bdd

# npm
npm install -D @nuxt/bdd

# yarn  
yarn add -D @nuxt/bdd
```

## Quick Start

### 1. Configure Vitest

Create or update your `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'
import { defineBDDConfig } from '@nuxt/bdd'

const bddConfig = defineBDDConfig({
  testDir: 'tests',
  stepDir: 'tests/steps',
  featureDir: 'tests/features'
})

export default defineConfig({
  test: {
    environment: 'jsdom',
    ...bddConfig.vitest
  }
})
```

### 2. Write Your First Feature

Create `tests/features/welcome.feature`:

```gherkin
Feature: Welcome Page
  As a user
  I want to see the welcome message
  So that I know the application is working

  Scenario: User visits homepage
    Given I am on the "/" page
    When I wait for the page to load
    Then I should see "Welcome to Nuxt!"
    And I should see an element "h1"
```

### 3. Create Step Definitions

Create `tests/steps/welcome.steps.js`:

```javascript
import { Given, When, Then } from '@nuxt/bdd/cucumber'
import { expect } from 'vitest'

// Custom steps specific to your application
When('I wait for the page to load', async () => {
  // Custom logic for waiting
  await new Promise(resolve => setTimeout(resolve, 100))
})
```

### 4. Run Tests

```bash
pnpm test
```

## Usage

### Component Testing

```javascript
import { mountBDD } from '@nuxt/bdd/vitest'
import MyComponent from '~/components/MyComponent.vue'

test('component behavior', async () => {
  const wrapper = mountBDD(MyComponent, {
    props: { title: 'Test Title' }
  })
  
  // BDD-style assertions
  wrapper.findByTestId('title').shouldHaveText('Test Title')
  
  // Trigger events
  await wrapper.findByTestId('button').trigger('click')
  
  // Assert emissions
  wrapper.shouldHaveEmitted('click', { title: 'Test Title' })
})
```

### Page Testing

```javascript
import { createBDDPage, setupNuxtBDD } from '@nuxt/bdd/vitest'

describe('Page Tests', () => {
  beforeAll(async () => {
    await setupNuxtBDD()
  })
  
  test('homepage loads correctly', async () => {
    const page = await createBDDPage('/')
    
    await page.shouldHaveText('h1', 'Welcome to Nuxt!')
    await page.fillField('#email', 'test@example.com')
    await page.click('button[type="submit"]')
    
    await page.close()
  })
})
```

### Custom Step Definitions

```javascript
import { Given, When, Then, getCurrentPage } from '@nuxt/bdd/cucumber'

Given('I am logged in as {string}', async (userType) => {
  const page = getCurrentPage()
  // Implement login logic
  await page.fillField('#username', userType)
  await page.fillField('#password', 'password')
  await page.click('#login-button')
})

When('I perform a search for {string}', async (searchTerm) => {
  const page = getCurrentPage()
  await page.fillField('#search-input', searchTerm)
  await page.click('#search-button')
})

Then('I should see {int} results', async (expectedCount) => {
  const page = getCurrentPage()
  const results = await page.$$('.search-result')
  expect(results).toHaveLength(expectedCount)
})
```

## Configuration

### BDD Configuration

```javascript
import { defineBDDConfig } from '@nuxt/bdd'

const config = defineBDDConfig({
  // Test directories
  testDir: 'tests',
  stepDir: 'tests/steps', 
  featureDir: 'tests/features',
  
  // Auto-import utilities
  autoImport: true,
  
  // Vitest configuration
  vitest: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js']
  },
  
  // Cucumber configuration
  cucumber: {
    features: ['tests/features/**/*.feature'],
    steps: ['tests/steps/**/*.js'],
    formatOptions: {
      snippetInterface: 'synchronous'
    }
  }
})
```

## Built-in Step Definitions

The package provides common step definitions out of the box:

### Navigation Steps
- `Given I am on the {string} page`
- `When I navigate to {string}`

### Interaction Steps
- `When I click on {string}`
- `When I fill {string} with {string}`
- `When I submit the form`

### Assertion Steps
- `Then I should see {string}`
- `Then I should see an element {string}`
- `Then the element {string} should contain {string}`
- `Then I should be redirected to {string}`

## API Reference

### Core Functions

#### `defineBDDConfig(config)`
Define BDD configuration for your project.

#### `setupNuxtBDD(options)`
Setup Nuxt testing environment with BDD configuration.

#### `createBDDPage(path, options)`
Create a test page for BDD scenarios.

#### `mountBDD(component, options)`
Mount Vue component with BDD testing utilities.

### Cucumber Utilities

#### Step Definition Functions
- `Given(pattern, implementation)`
- `When(pattern, implementation)`
- `Then(pattern, implementation)`
- `Before(hook)`
- `After(hook)`

#### Page Utilities
- `getCurrentPage()` - Get current page instance
- `setCurrentPage(page)` - Set current page instance

## Contributing

Contributions are welcome! Please read our contributing guide for details.

## License

MIT License - see LICENSE file for details.