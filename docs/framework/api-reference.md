# API Reference - BDD + Nuxt 4 Testing Micro-Framework

Complete API documentation for the testing micro-framework with examples and type definitions.

## Core API

### scenario(description)

Main entry point for creating BDD test scenarios.

```javascript
import { scenario } from 'tests/framework/core/index.js'

const testScenario = scenario('User login flow')
```

**Parameters:**
- `description` (string) - Human-readable scenario description

**Returns:** `ScenarioBuilder` instance with fluent interface

### ScenarioBuilder

Fluent interface for building BDD test scenarios.

#### Properties

##### .given
Access to precondition builders.

```javascript
scenario('Shopping cart')
  .given.user.isAuthenticated()
  .given.database.hasProducts(10)
```

##### .when  
Access to action builders.

```javascript
scenario('Add to cart')
  .when.user.clicksButton('Add to Cart')
  .when.api.postsData('/cart', productData)
```

##### .then / .and
Access to assertion builders.

```javascript
scenario('Verify results')
  .then.page.showsMessage('Item added')
  .and.api.respondedWith(201)
```

#### Methods

##### .addStep(type, description, implementation)

Add custom test steps.

```javascript
scenario('Custom validation')
  .addStep('given', 'user has premium account', async (context) => {
    context.user.accountType = 'premium'
  })
  .addStep('when', 'user accesses premium feature', async (context) => {
    context.response = await context.$fetch('/premium-endpoint')
  })
  .addStep('then', 'access is granted', async (context) => {
    expect(context.response.status).toBe(200)
  })
```

**Parameters:**
- `type` (string) - Step type: 'given', 'when', 'then'
- `description` (string) - Step description
- `implementation` (Function) - Step implementation function

##### .execute()

Execute the complete scenario.

```javascript
await scenario('Test flow')
  .given.user.isOnPage('/')
  .when.user.clicksLink('About')
  .then.page.hasUrl('/about')
  .execute()
```

**Returns:** Promise that resolves when all steps complete

## Component Testing API

### quickTest(name, component, options)

One-liner component testing with smart defaults.

```javascript
import { quickTest } from 'tests/framework/components/quick-test.js'
import MyButton from '~/components/MyButton.vue'

const testUtils = quickTest('MyButton Tests', MyButton, {
  shallow: false,
  props: { variant: 'primary' },
  slots: { default: 'Click me' },
  autoProps: true,
  events: ['click', 'hover'],
  a11y: true,
  mocks: {
    $router: mockRouter,
    $route: mockRoute
  }
})
```

**Parameters:**
- `name` (string) - Test suite name
- `component` (VueComponent) - Vue component to test
- `options` (QuickTestOptions) - Configuration options

**Options:**
```typescript
interface QuickTestOptions {
  shallow?: boolean          // Use shallowMount (default: false)
  props?: Object            // Props to pass to component
  slots?: Object            // Slots to render
  global?: Object           // Global mount configuration
  autoProps?: boolean       // Auto-generate props (default: true)
  events?: string[]         // Events to test automatically
  a11y?: boolean           // Run accessibility tests (default: true)
  mocks?: Object           // Nuxt composables to mock
}
```

**Returns:** Test utilities object:
```javascript
{
  wrapper,                    // Vue Test Utils wrapper
  mockNuxt,                  // Mock Nuxt context
  rerender(props),           // Re-render with new props
  emitEvent(name, payload),  // Emit component events
  getByTestId(id),          // Find element by test ID
  getAllByTestId(id)        // Find all elements by test ID
}
```

### batchTest(components)

Test multiple components with same configuration.

```javascript
import { batchTest } from 'tests/framework/components/quick-test.js'

batchTest([
  ['Header', HeaderComponent],
  ['Navigation', NavComponent, { props: { items: mockItems } }],
  ['Footer', FooterComponent, { shallow: true }]
])
```

**Parameters:**
- `components` (Array) - Array of [name, component, options] tuples

### propMatrix(name, component, propCombinations)

Test component with multiple prop combinations.

```javascript
import { propMatrix } from 'tests/framework/components/quick-test.js'

propMatrix('Button Variants', ButtonComponent, [
  { variant: 'primary', size: 'sm' },
  { variant: 'secondary', size: 'lg' },
  { variant: 'ghost', disabled: true }
])
```

**Parameters:**
- `name` (string) - Test suite name
- `component` (VueComponent) - Component to test
- `propCombinations` (Array) - Array of prop objects

### responsiveTest(name, component, breakpoints)

Test component responsiveness across breakpoints.

```javascript
import { responsiveTest } from 'tests/framework/components/quick-test.js'

responsiveTest('Responsive Layout', LayoutComponent, [320, 768, 1024, 1920])
```

**Parameters:**
- `name` (string) - Test name
- `component` (VueComponent) - Component to test  
- `breakpoints` (Array) - Screen widths to test (default: [320, 768, 1024, 1200])

## BDD Step Generators API

### generateStepDefinition(stepText, options)

Generate step definition code from step description.

```javascript
import { generateStepDefinition } from 'tests/framework/bdd/step-generators.js'

const stepCode = generateStepDefinition(
  'user clicks the login button',
  { framework: 'cucumber', testRunner: 'vitest' }
)
// Generates: When('user clicks the login button', async function() { ... })
```

**Parameters:**
- `stepText` (string) - Step text to generate definition for
- `options` (Object) - Generation options

**Options:**
```typescript
interface StepGenOptions {
  framework?: 'cucumber' | 'playwright' | 'vitest'  // Default: 'cucumber'
  testRunner?: 'vitest' | 'jest'                     // Default: 'vitest'
}
```

### generateFeatureSteps(featureContent, options)

Generate all step definitions for a feature file.

```javascript
import { generateFeatureSteps } from 'tests/framework/bdd/step-generators.js'

const featureFile = `
Feature: User Authentication
  Scenario: Successful login
    Given user is on login page
    When user enters valid credentials
    Then user is redirected to dashboard
`

const generatedSteps = generateFeatureSteps(featureFile)
```

**Returns:**
```typescript
interface GeneratedSteps {
  given: StepDefinition[]
  when: StepDefinition[]
  then: StepDefinition[]
  imports: Set<string>
  helpers: Set<string>
}
```

### registerStepGenerator(key, config)

Register custom step generator.

```javascript
import { registerStepGenerator } from 'tests/framework/bdd/step-generators.js'

registerStepGenerator('custom-action', {
  pattern: 'user performs (.*) action',
  type: 'When',
  generator: (match, options) => {
    const action = match[1]
    return `await performUserAction('${action}')`
  },
  tags: ['user', 'action'],
  metadata: { description: 'Custom user action handler' }
})
```

## Action Builders API

### User Actions

Available through `scenario().given.user`, `.when.user`, `.then.user`:

```javascript
// Given (setup)
.given.user.isAuthenticated()
.given.user.hasRole('admin')
.given.user.isOnPage('/dashboard')

// When (actions)
.when.user.clicksButton('Submit')
.when.user.clicksLink('Profile')
.when.user.fillsForm({ name: 'John', email: 'john@example.com' })
.when.user.uploadsFile('avatar.jpg')
.when.user.navigatesTo('/settings')

// Then (assertions)
.then.user.seesMessage('Success!')
.then.user.isRedirectedTo('/dashboard')
.then.user.hasAccess('/admin')
```

### Page Actions

Available through `scenario().given.page`, `.when.page`, `.then.page`:

```javascript
// Given (setup)
.given.page.isReady()
.given.page.hasTitle('Welcome')
.given.page.containsElement('nav')

// When (actions)  
.when.page.loads()
.when.page.scrollsTo('#section')
.when.page.refreshes()

// Then (assertions)
.then.page.showsContent('Hello World')
.then.page.hasUrl('/expected-path')
.then.page.hasStatusCode(200)
.then.page.containsText('Expected content')
```

### API Actions

Available through `scenario().given.api`, `.when.api`, `.then.api`:

```javascript
// Given (setup)
.given.api.isAvailable()
.given.api.hasEndpoint('/users')
.given.api.returnsData(mockData)

// When (actions)
.when.api.fetchesData('/api/users')
.when.api.postsData('/api/users', userData)
.when.api.deletesResource('/api/users/1')

// Then (assertions)
.then.api.respondedWith(200)
.then.api.returnedData(expectedData)
.then.api.hasHeaders({ 'content-type': 'application/json' })
```

### Database Actions

Available through `scenario().given.database`:

```javascript
.given.database.hasUsers(5)
.given.database.hasTable('products')
.given.database.isEmpty()
.given.database.hasRecord('users', { id: 1, name: 'John' })
```

## Performance Testing API

### Performance Utilities

```javascript
import { 
  measureRenderTime,
  measureMemoryUsage,
  measureBundleSize,
  createPerformanceTest
} from 'tests/framework/performance/perf-assertions.js'

// Measure render performance
const renderTime = await measureRenderTime(MyComponent, { props: testProps })
expect(renderTime).toBeLessThan(100) // ms

// Memory usage testing
const memoryUsage = measureMemoryUsage(() => {
  // Code to measure
  const instances = Array.from({ length: 1000 }, () => new MyClass())
})
expect(memoryUsage).toBeLessThan(10) // MB

// Bundle size analysis
const bundleSize = await measureBundleSize('~/components/HeavyComponent.vue')
expect(bundleSize).toBeLessThan(50) // KB
```

## Utilities API

### Core Utils

```javascript
import {
  waitForElement,
  waitForCondition, 
  createMockData,
  setupTestDatabase,
  cleanupTestData
} from 'tests/framework/core-utils.js'

// Wait for element
await waitForElement('[data-testid="loading"]', { timeout: 5000 })

// Wait for condition
await waitForCondition(() => store.isLoaded, { timeout: 10000 })

// Mock data generation
const mockUsers = createMockData('users', 10, {
  name: 'John Doe',
  email: 'john@example.com'
})
```

### Auto Mocks

```javascript
import { 
  mockNuxtComposables,
  mockApiEndpoints,
  mockRouterMethods
} from 'tests/framework/auto-mocks.js'

// Auto-mock Nuxt composables
const mocks = mockNuxtComposables([
  'useRouter', 'useRoute', 'useFetch', 'useRuntimeConfig'
])

// Mock API endpoints
mockApiEndpoints({
  '/api/users': { data: mockUsers },
  '/api/products': { data: mockProducts, status: 200 }
})
```

## Configuration API

### Framework Config

```javascript
import { config, usePlugin } from 'tests/framework/core/index.js'

// Global configuration
config.timeout = 30000
config.retries = 3
config.parallel = true

// Plugin system
usePlugin({
  name: 'custom-plugin',
  install(config) {
    // Plugin installation logic
  },
  beforeEach(context) {
    // Run before each test
  },
  afterEach(context) {
    // Run after each test
  }
})
```

## Type Definitions

### ScenarioContext

```typescript
interface ScenarioContext {
  nuxt: NuxtApp           // Nuxt application instance
  router: Router          // Vue Router instance  
  $fetch: $Fetch          // Nuxt fetch function
  user: UserContext       // User session data
  data: TestData          // Shared test data
  [key: string]: any      // Custom context properties
}
```

### StepImplementation

```typescript
type StepImplementation = (context: ScenarioContext) => Promise<void> | void
```

### TestStep

```typescript
interface TestStep {
  type: 'given' | 'when' | 'then'
  description: string
  implementation: StepImplementation
  timestamp: number
}
```

## Error Handling

The framework provides detailed error messages:

```javascript
// Step failures include context
throw new Error(`Step failed: ${step.description}\nError: ${error.message}`)

// Component test failures show component state
expect(wrapper.exists()).toBe(true) // Includes component HTML in failure

// API test failures show request/response details
expect(response.status).toBe(200) // Shows actual response data
```

## Examples

See the [examples directory](./examples/) for complete working examples of all API features.

---

**Next:** [Recipes](./recipes.md) - Common testing patterns and solutions