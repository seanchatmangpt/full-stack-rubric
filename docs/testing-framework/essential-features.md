# Essential Features Guide (20% for 80% of Use Cases)

## Overview

This guide covers the essential 20% of features that handle 80% of testing scenarios in the micro-framework. Master these core patterns to achieve maximum productivity with minimal complexity.

## Core Features (The Essential 20%)

### 1. `quickTest()` - One-Line Component Testing

**What it does:** Replaces 50+ lines of manual component setup with one line
**When to use:** Any Vue component testing
**Coverage:** ~60% of all component tests

```javascript
import { quickTest } from '@/tests/framework'
import MyComponent from '@/components/MyComponent.vue'

// Replaces 50+ lines of manual setup
quickTest('MyComponent', MyComponent, {
  props: { title: 'Test' },
  a11y: true
})
```

**Key Options:**
- `props: {}` - Component props (auto-generates others)
- `a11y: true` - Accessibility testing
- `events: []` - Events to test automatically
- `mocks: {}` - Nuxt composables to mock

### 2. Fluent BDD Scenarios - Natural Language Testing

**What it does:** Write tests in natural language that execute as code
**When to use:** User workflow testing, feature validation
**Coverage:** ~40% of all integration tests

```javascript
import { scenario } from '@/tests/framework'

await scenario('User Login Flow')
  .given.user.isLoggedOut()
  .when.user.submitsLogin({ email: 'test@example.com' })
  .then.user.shouldBeRedirected('/dashboard')
  .execute()
```

**Common Patterns:**
- `.given.user.*` - User state setup
- `.given.page.*` - Page state setup  
- `.when.user.*` - User actions
- `.when.form.*` - Form interactions
- `.then.page.*` - Page state assertions
- `.then.user.*` - User state assertions

### 3. `createTestContext()` - Test State Management

**What it does:** Provides shared state and utilities across test steps
**When to use:** Complex scenarios, step definitions, shared setup
**Coverage:** ~25% of all tests

```javascript
import { createTestContext } from '@/tests/framework'

const context = createTestContext()

// Setup component
await context.setupComponent(MyComponent, { props: {} })

// Access wrapper
const wrapper = context.wrapper()

// Execute steps
await context.executeStep('I click the button')

// Cleanup
context.cleanupComponent()
```

### 4. Smart API Mocking - Zero-Config API Testing

**What it does:** Automatically mock API responses with intelligent defaults
**When to use:** Testing components that make API calls
**Coverage:** ~30% of all API-related tests

```javascript
import { createSmartMocks } from '@/tests/framework'

const mocks = createSmartMocks()

// Simple mock
mocks.mock('GET', '/api/users', {
  status: 200,
  data: [{ id: 1, name: 'Test User' }]
})

// Scenario-based mocking
mocks.setScenario('error')
mocks.mock('POST', '/api/login', {
  status: 401,
  data: { error: 'Invalid credentials' }
})
```

### 5. Step Definition Registration - Reusable Test Logic

**What it does:** Create reusable step definitions for common actions
**When to use:** Repeated test patterns, shared functionality
**Coverage:** ~20% of all BDD tests

```javascript
import { Given, When, Then } from '@/tests/framework'

Given('I am on the {string} page', async function(pageName) {
  await this.visit(`/${pageName}`)
})

When('I type {string}', async function(text) {
  await this.simulateTyping(text)
})

Then('I should see {string}', function(text) {
  expect(this.wrapper().text()).toContain(text)
})
```

## Framework Setup Patterns

### Pattern 1: Zero-Config Setup (Recommended)

**Use for:** 95% of projects - automatic configuration

```javascript
import { setup } from '@/tests/framework'

const { scenario, quickTest, helpers } = await setup()
// Framework auto-detects project structure and configures itself
```

### Pattern 2: Nuxt-Optimized Setup

**Use for:** Nuxt projects needing component testing + basic BDD

```javascript
import { setupNuxtBDD } from '@/tests/framework'

const framework = await setupNuxtBDD({
  autoConfig: true,
  nuxtIntegration: true
})
```

### Pattern 3: Minimal Setup

**Use for:** Custom configurations or when you need full control

```javascript
import { setupMinimal } from '@/tests/framework'

const framework = await setupMinimal({
  autoConfig: false,
  customConfig: { /* your config */ }
})
```

## Essential Testing Patterns

### Pattern 1: Component Feature Testing

**Covers:** Basic component functionality, props, events, rendering

```javascript
import { quickTest } from '@/tests/framework'

// Test component with multiple variants
quickTest('Button Component', Button, {
  props: { variant: 'primary' }
})

quickTest('Button Secondary', Button, {
  props: { variant: 'secondary' },
  events: ['click']
})
```

### Pattern 2: User Workflow Testing

**Covers:** Complete user journeys, multi-step interactions

```javascript
import { scenario } from '@/tests/framework'

describe('Typing Tutor Workflow', () => {
  it('should complete typing exercise', async () => {
    await scenario('Complete typing exercise')
      .given.user.isOnTypingPage()
      .when.user.startsTyping('const hello = "world"')
      .then.stats.shouldUpdate()
      .and.progress.shouldShow(100)
      .execute()
  })
})
```

### Pattern 3: API Integration Testing

**Covers:** Components that interact with APIs, data fetching

```javascript
import { scenario, createSmartMocks } from '@/tests/framework'

describe('User Dashboard', () => {
  it('should load user data', async () => {
    const mocks = createSmartMocks()
    mocks.mock('GET', '/api/user', {
      data: { name: 'John', email: 'john@example.com' }
    })
    
    await scenario('Load user dashboard')
      .given.user.isAuthenticated()
      .when.page.loads()
      .then.page.shouldDisplay('Welcome, John')
      .execute()
  })
})
```

## Essential Configuration Options

### QuickTest Essential Options

```javascript
quickTest('Component', Component, {
  props: {},           // Component props (others auto-generated)
  a11y: true,         // Accessibility testing
  events: ['click'],  // Events to test
  shallow: false      // Shallow vs deep mounting
})
```

### Scenario Essential Options

```javascript
scenario('Test name')
  .debug()           // Enable step debugging
  .timeout(5000)     // Custom timeout
  .skip()           // Skip scenario
  .execute()        // Run scenario
```

### Mock Essential Options

```javascript
mocks.mock('METHOD', '/path', {
  status: 200,        // HTTP status
  data: {},          // Response data  
  delay: 100         // Response delay
})
```

## Essential Utilities

### Test Context Utilities

```javascript
const context = createTestContext()

// Component interaction
await context.setupComponent(Component)
const wrapper = context.wrapper()
await context.executeStep('step text')
context.cleanupComponent()

// State management
context.state.customData = 'value'
expect(context.state.started).toBe(true)
```

### Built-in Assertions

```javascript
// Framework provides enhanced assertions
expect(wrapper.text()).toContain('expected text')
expect(wrapper.emitted('click')).toHaveLength(1)
expect(wrapper.props('disabled')).toBe(false)
expect(wrapper.classes()).toContain('active')
```

## Common Usage Combinations

### Combination 1: Component + Props Testing

```javascript
import { quickTest, batchTest } from '@/tests/framework'

// Test multiple prop combinations
batchTest([
  ['Button Primary', Button, { props: { variant: 'primary' } }],
  ['Button Secondary', Button, { props: { variant: 'secondary' } }],
  ['Button Disabled', Button, { props: { disabled: true } }]
])
```

### Combination 2: BDD + API Mocking

```javascript
import { scenario, createSmartMocks } from '@/tests/framework'

const mocks = createSmartMocks()
mocks.mock('GET', '/api/data', { data: { items: [] } })

await scenario('Empty state')
  .given.api.returnsEmptyData()
  .when.page.loads()
  .then.page.shouldShowEmptyState()
  .execute()
```

### Combination 3: Context + Step Definitions

```javascript
import { Given, When, Then, createTestContext } from '@/tests/framework'

const context = createTestContext()

Given('setup is complete', async () => {
  await context.setupComponent(MyComponent)
})

When('user interacts', async () => {
  await context.wrapper().find('button').trigger('click')
})

Then('result is visible', () => {
  expect(context.wrapper().text()).toContain('Success')
})
```

## Performance Tips

### Tip 1: Use Shallow Mounting

```javascript
// Faster for testing component logic only
quickTest('Component', Component, { 
  shallow: true  // 3x faster mounting
})
```

### Tip 2: Batch Similar Tests

```javascript
// More efficient than individual tests
batchTest([
  ['Test 1', Component, { props: { a: 1 } }],
  ['Test 2', Component, { props: { a: 2 } }],
  ['Test 3', Component, { props: { a: 3 } }]
])
```

### Tip 3: Reuse Test Context

```javascript
describe('Feature Tests', () => {
  const context = createTestContext()
  
  beforeEach(() => context.setupComponent(Component))
  afterEach(() => context.cleanupComponent())
  
  // Tests reuse the same context
})
```

## Essential Debugging

### Debug Mode

```javascript
// Enable debugging for scenarios
await scenario('Debug test')
  .given.user.isOnPage('/')
  .debug() // Pauses execution, shows state
  .when.user.clicks('.button')
  .execute()
```

### Console Logging

```javascript
// Framework provides debug utilities
Given('debug step', function() {
  console.log('Wrapper:', this.wrapper())
  console.log('Props:', this.wrapper().props())
  console.log('State:', this.wrapper().vm)
})
```

## Migration Priority

When migrating to the framework, focus on these features in order:

1. **`quickTest()`** - Immediate 80% boilerplate reduction
2. **Basic scenarios** - Natural language workflows  
3. **Smart mocks** - API interaction testing
4. **Step definitions** - Reusable test logic
5. **Advanced features** - Performance optimization

## Essential Commands

```bash
# Run tests with framework
pnpm test

# Run specific test file  
pnpm test typing.test.js

# Run with debugging
pnpm test --reporter=verbose

# Run with coverage
pnpm test:coverage
```

These essential features provide the foundation for 80% of testing scenarios while maintaining simplicity and high productivity. Master these patterns first, then explore advanced features as needed.