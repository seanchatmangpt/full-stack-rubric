# Nuxt BDD - Behavior-Driven Development for Nuxt.js

A powerful BDD testing library that seamlessly integrates Cucumber.js with Nuxt.js applications, providing enhanced testing capabilities with performance tracking, smart component mocking, and declarative step definitions.

## ⚡ Quick Start

### Installation

```bash
# Install via pnpm (recommended)
pnpm add -D nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils vitest

# Or via npm
npm install --save-dev nuxt-bdd @amiceli/vitest-cucumber @vue/test-utils vitest
```

### Basic Setup

1. **Configure your `vitest.config.js`:**

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup/global-setup.js'
  }
})
```

2. **Create your first feature file `tests/features/welcome.feature`:**

```gherkin
Feature: Welcome Page
  As a user
  I want to see a welcome message
  So that I know the application is working

  Scenario: Display welcome message
    Given I am on the welcome page
    When the page loads
    Then I should see "Welcome to Nuxt BDD"
```

3. **Create step definitions `tests/steps/welcome.steps.js`:**

```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, getBDDContext } from 'nuxt-bdd'
import WelcomePage from '~/pages/index.vue'

Given('I am on the welcome page', async () => {
  await mountWithBDD(WelcomePage)
})

When('the page loads', async () => {
  // Page is already loaded from Given step
  await new Promise(resolve => setTimeout(resolve, 100))
})

Then('I should see {string}', (expectedText) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.text()).toContain(expectedText)
})
```

4. **Add test script to your `package.json`:**

```json
{
  "scripts": {
    "test:bdd": "vitest tests/**/*.steps.js"
  }
}
```

5. **Run your tests:**

```bash
pnpm run test:bdd
```

## 🌟 Key Features

### 📚 Enhanced BDD Bridge
- **Smart Component Mounting**: Automatic mock generation for Nuxt UI components
- **State Management**: Shared context across step definitions
- **Performance Tracking**: Built-in performance metrics collection
- **Auto Cleanup**: Automatic test environment cleanup

### 🎯 Step Definition Management  
- **Pattern Validation**: Validate feature files against step definitions
- **Auto-Generation**: Generate step definition templates from feature files
- **Registry System**: Centralized step definition registry with conflict detection

### 🚀 Performance Monitoring
- **Render Time Tracking**: Monitor component mounting and rendering performance
- **Memory Usage**: Track memory consumption during tests
- **Input Latency**: Measure user interaction response times

### 🛠️ Smart Mocking
- **Nuxt UI Components**: Pre-configured mocks for common Nuxt UI components
- **Monaco Editor**: Enhanced Monaco editor mock with full functionality
- **Custom Stubs**: Easy custom component stubbing system

## 📖 Core Concepts

### BDD Context
All test state is managed through a shared context object:

```javascript
import { getBDDContext, setBDDState, getBDDState } from 'nuxt-bdd'

// Access the mounted component
const { wrapper } = getBDDContext()

// Store shared state
setBDDState('userInput', 'hello world')

// Retrieve shared state
const input = getBDDState('userInput')
```

### Component Mounting
Mount Vue components with enhanced BDD capabilities:

```javascript
import { mountWithBDD } from 'nuxt-bdd'
import MyComponent from '~/components/MyComponent.vue'

// Basic mounting
await mountWithBDD(MyComponent)

// With props and configuration
await mountWithBDD(MyComponent, {
  props: { title: 'Test Title' },
  stubs: { CustomComponent: true },
  global: {
    provide: { store: mockStore }
  }
})
```

### Step Registration
Register step definitions with enhanced metadata:

```javascript
import { registerGiven, registerWhen, registerThen } from 'nuxt-bdd'

registerGiven('I am on the {string} page', async (pageName) => {
  // Implementation
}, { 
  description: 'Navigate to a specific page',
  category: 'navigation' 
})
```

## 🎨 Advanced Usage

### Performance Tracking
Enable performance monitoring in your tests:

```javascript
import { VitestCucumberBridge } from 'nuxt-bdd'

const bridge = new VitestCucumberBridge({
  performanceTracking: true,
  autoCleanup: true
})

// Get performance metrics
const metrics = bridge.getPerformanceMetrics()
console.log('Render times:', metrics.renderTimes)
console.log('Memory usage:', metrics.memoryUsage)
```

### Step Definition Generation
Generate step definitions from feature files:

```javascript
import { bddBridge } from 'nuxt-bdd'
import { readFileSync } from 'fs'

const featureContent = readFileSync('tests/features/my-feature.feature', 'utf8')
const stepDefinitions = bddBridge.generateStepDefinitions(featureContent)

console.log(stepDefinitions)
// Outputs ready-to-use step definition templates
```

### Custom Component Stubs
Create custom component mocks:

```javascript
await mountWithBDD(MyComponent, {
  stubs: {
    ComplexComponent: {
      template: '<div class="mock-complex"><slot /></div>',
      props: ['data', 'config'],
      methods: {
        complexMethod: vi.fn(() => 'mocked result')
      }
    }
  }
})
```

## 🔧 Configuration

### Bridge Configuration
Customize the BDD bridge behavior:

```javascript
import { VitestCucumberBridge } from 'nuxt-bdd'

const bridge = new VitestCucumberBridge({
  // Automatic cleanup after each test
  autoCleanup: true,
  
  // Enable performance tracking
  performanceTracking: false,
  
  // Default component mocks
  mockDefaults: {
    UButton: { template: '<button><slot /></button>' },
    UInput: { 
      template: '<input v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue'],
      emits: ['update:modelValue']
    }
  }
})
```

### Test Environment Setup
Configure your test environment in `tests/setup/global-setup.js`:

```javascript
import { beforeEach, afterEach } from 'vitest'
import { bddBridge } from 'nuxt-bdd'

// Global setup for all tests
beforeEach(() => {
  // Initialize performance tracking
  bddBridge.initializePerformanceTracking()
  
  // Set up global mocks
  global.fetch = vi.fn()
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
})

afterEach(() => {
  // Cleanup is handled automatically by the bridge
  vi.clearAllMocks()
})
```

## 📚 Examples

### Basic Component Test
```gherkin
Feature: User Profile
  Scenario: Display user information
    Given I have a user with name "John Doe"
    When I view the user profile
    Then I should see the name "John Doe"
    And I should see a profile avatar
```

```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, setBDDState, getBDDContext } from 'nuxt-bdd'
import UserProfile from '~/components/UserProfile.vue'

Given('I have a user with name {string}', (userName) => {
  setBDDState('user', { name: userName, avatar: '/avatar.jpg' })
})

When('I view the user profile', async () => {
  const user = getBDDState('user')
  await mountWithBDD(UserProfile, {
    props: { user }
  })
})

Then('I should see the name {string}', (expectedName) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.find('[data-testid="user-name"]').text()).toBe(expectedName)
})

Then('I should see a profile avatar', () => {
  const { wrapper } = getBDDContext()
  expect(wrapper.find('[data-testid="user-avatar"]').exists()).toBe(true)
})
```

### Form Interaction Test
```gherkin
Feature: Contact Form
  Scenario: Submit contact form successfully
    Given I am on the contact form
    When I fill in "name" with "Jane Smith"
    And I fill in "email" with "jane@example.com"
    And I fill in "message" with "Hello there!"
    And I submit the form
    Then I should see "Thank you for your message"
```

```javascript
Given('I am on the contact form', async () => {
  await mountWithBDD(ContactForm)
})

When('I fill in {string} with {string}', async (fieldName, value) => {
  const { wrapper } = getBDDContext()
  const input = wrapper.find(`[data-testid="${fieldName}"]`)
  await input.setValue(value)
})

When('I submit the form', async () => {
  const { wrapper } = getBDDContext()
  await wrapper.find('[data-testid="submit-button"]').trigger('click')
})

Then('I should see {string}', (expectedMessage) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.find('[data-testid="success-message"]').text()).toBe(expectedMessage)
})
```

## 🚀 Migration Guide

### From Manual Testing
If you're currently writing manual Vitest tests, here's how to migrate:

**Before (Manual Vitest):**
```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  it('should display title', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test Title' }
    })
    expect(wrapper.text()).toContain('Test Title')
  })
})
```

**After (Nuxt BDD):**
```gherkin
Feature: MyComponent
  Scenario: Display title
    Given I have a component with title "Test Title"
    When the component renders
    Then I should see "Test Title"
```

```javascript
import { Given, When, Then } from '@amiceli/vitest-cucumber'
import { mountWithBDD, getBDDContext } from 'nuxt-bdd'
import MyComponent from '~/components/MyComponent.vue'

Given('I have a component with title {string}', async (title) => {
  await mountWithBDD(MyComponent, { props: { title } })
})

When('the component renders', () => {
  // Component is already rendered
})

Then('I should see {string}', (expectedText) => {
  const { wrapper } = getBDDContext()
  expect(wrapper.text()).toContain(expectedText)
})
```

### Benefits of Migration
- **Readable Tests**: Feature files serve as living documentation
- **Reusable Steps**: Step definitions can be shared across multiple features
- **Better Collaboration**: Non-technical stakeholders can understand and contribute to tests
- **Performance Insights**: Built-in performance tracking
- **Enhanced Debugging**: Better error messages and context

## 🔧 Troubleshooting

### Common Issues

**Issue: "Cannot find module 'nuxt-bdd'"**
```bash
# Ensure the library is properly installed
pnpm add -D nuxt-bdd

# Check that your test files import correctly
import { mountWithBDD } from 'nuxt-bdd'
```

**Issue: "Component stubs not working"**
```javascript
// Make sure to use proper stub configuration
await mountWithBDD(MyComponent, {
  stubs: {
    // Use template for simple stubs
    UButton: { template: '<button><slot /></button>' },
    
    // Use full component definition for complex stubs
    ComplexComponent: {
      template: '<div><slot /></div>',
      props: ['data'],
      methods: { mockMethod: vi.fn() }
    }
  }
})
```

**Issue: "Tests running slowly"**
```javascript
// Enable performance tracking to identify bottlenecks
const bridge = new VitestCucumberBridge({
  performanceTracking: true
})

// Check metrics after tests
const metrics = bridge.getPerformanceMetrics()
console.log('Slow renders:', metrics.renderTimes.filter(t => t > 100))
```

### FAQ

**Q: Can I use Nuxt BDD with existing Vitest tests?**
A: Yes! Nuxt BDD is fully compatible with existing Vitest tests. You can gradually migrate or run both test types together.

**Q: How do I test server-side functionality?**
A: Use Nuxt Test Utils alongside Nuxt BDD for full-stack testing scenarios.

**Q: Can I customize component stubs globally?**
A: Yes, configure default stubs when creating the BDD bridge:

```javascript
const bridge = new VitestCucumberBridge({
  mockDefaults: {
    GlobalComponent: { template: '<div><slot /></div>' }
  }
})
```

**Q: How do I debug failing step definitions?**
A: Use the step registry to inspect registered patterns:

```javascript
import { bddBridge } from 'nuxt-bdd'
console.log(bddBridge.getStepRegistry())
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT - see [LICENSE](./LICENSE) for details.

---

**Ready to get started?** Check out our [Examples](./examples/) directory for more comprehensive usage patterns!